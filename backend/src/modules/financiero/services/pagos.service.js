// Registro de pagos de expensas (req. 2 · criticos 4.1-4.3 del docente): aplica a expensas, caja/bancos, anticipos y asiento.
// La mora se cobra según la política vigente y la FECHA DEL SISTEMA (real o simulada), salvo que se indique cobrarMora:false.
const prisma = require('../../../config/prisma');
const { HttpError } = require('../../../shared/errors');
const { calcularMora, parametrosMora } = require('../utils/expensas.utils');
const { validarDatosPago, aplicarPagoAExpensas, lineasAsientoPago, estadoTrasPago } = require('../utils/pagos.utils');
const { codigoCuentaOperativa } = require('../utils/contabilidad.utils');
const { registrarMovimiento, bloquearCuenta, D } = require('./movimientos.service');
const { asentar } = require('./contabilidad.service');
const { configMoraVigente } = require('./configuracion.service');
const { configMoraAVista } = require('../utils/expensasVista.utils');
const { fechaActual } = require('../../../shared/fechaSistema');

const soloFecha = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

async function listar({ unidadId, desde, hasta } = {}) {
  const where = { anulado: false };
  if (unidadId) where.unidadId = Number(unidadId);
  if (desde || hasta) where.fecha = { ...(desde && { gte: new Date(desde) }), ...(hasta && { lte: new Date(hasta) }) };
  return prisma.pago.findMany({
    where,
    include: {
      unidad: { select: { codigo: true } },
      copropietario: { select: { nombres: true, apellidos: true } },
      cuenta: { select: { nombre: true, tipo: true } },
      detalles: { select: { expensaId: true, montoAplicado: true, aplicadoA: true } },
      anticipos: { select: { monto: true, saldoDisponible: true, estado: true } },
    },
    orderBy: { fecha: 'desc' },
  });
}

async function obtenerPorId(id) {
  return prisma.pago.findUnique({
    where: { id },
    include: {
      unidad: true,
      copropietario: true,
      cuenta: { select: { nombre: true, tipo: true } },
      movimiento: true,
      detalles: { include: { expensa: { include: { periodo: { select: { anio: true, mes: true } } } } } },
      anticipos: true,
    },
  });
}

/**
 * Simulación previa de un pago (critico 4): qué expensas cubriría y cuánta mora corresponde
 * a la fecha indicada (o a la fecha del sistema). No escribe nada.
 */
async function simular({ unidadId, monto, fecha, cobrarMora } = {}) {
  const uid = Number(unidadId);
  if (!Number.isInteger(uid) || uid <= 0) throw new HttpError(400, 'unidadId es obligatorio');
  const fechaPago = fecha ? new Date(fecha) : await fechaActual();
  if (Number.isNaN(fechaPago.getTime())) throw new HttpError(400, 'fecha inválida');
  const cobrar = cobrarMora === undefined ? true : String(cobrarMora) !== 'false';
  const config = cobrar ? await configMoraVigente(fechaPago) : null;
  const pm = parametrosMora(config);
  const expensas = await prisma.expensa.findMany({
    where: { unidadId: uid, saldoPendiente: { gt: 0 } },
    include: { periodo: { select: { anio: true, mes: true } } },
    orderBy: [{ fechaVencimiento: 'asc' }, { id: 'asc' }],
  });
  const conMora = expensas.map((e) => {
    const r = pm ? calcularMora({ saldoPendiente: Number(e.saldoPendiente), ...pm, fechaVencimiento: e.fechaVencimiento, fechaCalculo: fechaPago }) : { diasAtraso: 0, mora: 0 };
    return { ...e, mora: r.mora, diasAtraso: r.diasAtraso };
  });
  const totalCapital = conMora.reduce((a, e) => a + Number(e.saldoPendiente), 0);
  const totalMora = conMora.reduce((a, e) => a + e.mora, 0);
  const aplicacion = monto ? aplicarPagoAExpensas(Number(monto), conMora, { moraPrimero: true }) : null;
  return {
    unidadId: uid,
    fechaPago: soloFecha(fechaPago),
    politica: configMoraAVista(config, fechaPago),
    cobrarMora: cobrar,
    expensas: conMora.map((e) => ({
      id: e.id, periodo: `${String(e.periodo.mes).padStart(2, '0')}/${e.periodo.anio}`, fechaVencimiento: soloFecha(e.fechaVencimiento),
      saldoPendiente: Number(e.saldoPendiente), diasAtraso: e.diasAtraso, mora: e.mora, totalConMora: Math.round((Number(e.saldoPendiente) + e.mora) * 100) / 100,
      situacion: e.diasAtraso > 0 ? 'Después del vencimiento (con mora)' : (soloFecha(fechaPago) === soloFecha(e.fechaVencimiento) ? 'El día del vencimiento (sin mora)' : (fechaPago < e.fechaVencimiento ? 'Antes del vencimiento (sin mora)' : 'Vencida dentro de los días de gracia (sin mora)')),
    })),
    totales: { capital: Math.round(totalCapital * 100) / 100, mora: Math.round(totalMora * 100) / 100, totalAdeudado: Math.round((totalCapital + totalMora) * 100) / 100 },
    aplicacion,
  };
}

/**
 * Registra un pago. Todo ocurre en UNA transacción con bloqueo de fila sobre la cuenta y las expensas:
 *  1. Fecha del pago: la indicada o la FECHA DEL SISTEMA (permite simular antes / en / después del vencimiento).
 *  2. Determina las expensas a cobrar (las indicadas o las pendientes más antiguas de la unidad).
 *  3. Calcula la mora de cada una con la política vigente (porcentaje o monto fijo), salvo cobrarMora:false.
 *  4. Distribuye el monto: mora → capital → sobrante como anticipo (saldo a favor).
 *  5. Registra el movimiento en caja/banco, el pago con su detalle, actualiza expensas, crea el anticipo.
 *  6. Registra el asiento contable (Debe caja · Haber cuentas por cobrar / ingresos por mora / anticipos).
 */
async function registrar(datos, usuarioId) {
  const p = validarDatosPago(datos);
  if (!datos.fecha) p.fecha = await fechaActual();
  const cobrarMora = datos.cobrarMora === undefined ? true : p.cobrarMora;

  return prisma.$transaction(async (tx) => {
    const unidad = await tx.unidad.findUnique({
      where: { id: p.unidadId },
      include: { ocupaciones: { where: { fechaFin: null }, orderBy: { fechaInicio: 'desc' } } },
    });
    if (!unidad) throw new HttpError(404, 'Unidad no encontrada');

    await bloquearCuenta(tx, p.cuentaId);
    await tx.$queryRaw`SELECT id FROM "expensa" WHERE unidad_id = ${p.unidadId} AND saldo_pendiente > 0 FOR UPDATE`;

    const expensas = await tx.expensa.findMany({
      where: {
        unidadId: p.unidadId,
        saldoPendiente: { gt: 0 },
        ...(p.expensaIds && { id: { in: p.expensaIds } }),
      },
      include: { periodo: { select: { anio: true, mes: true } } },
      orderBy: [{ fechaVencimiento: 'asc' }, { id: 'asc' }],
    });
    if (p.expensaIds && expensas.length !== p.expensaIds.length) {
      throw new HttpError(422, 'Alguna de las expensas indicadas no existe, no pertenece a la unidad o ya está pagada');
    }

    // Mora por expensa según la política vigente a la fecha del pago (0 si no se cobra)
    const config = cobrarMora ? await configMoraVigente(p.fecha) : null;
    const pm = parametrosMora(config);
    const conMora = expensas.map((e) => {
      const r = pm ? calcularMora({ saldoPendiente: Number(e.saldoPendiente), ...pm, fechaVencimiento: e.fechaVencimiento, fechaCalculo: p.fecha }) : { diasAtraso: 0, mora: 0 };
      return { ...e, mora: r.mora, diasAtraso: r.diasAtraso };
    });

    const aplicacion = aplicarPagoAExpensas(p.monto, conMora, { moraPrimero: true });
    if (aplicacion.aplicaciones.length === 0 && expensas.length > 0) {
      throw new HttpError(422, 'No se pudo aplicar el pago a ninguna expensa');
    }

    const copropietarioId = p.copropietarioId
      ?? unidad.ocupaciones.find((o) => o.esResponsablePago)?.copropietarioId
      ?? unidad.ocupaciones[0]?.copropietarioId
      ?? null;

    const glosa = `Pago expensas ${unidad.codigo}${p.metodo === 'QR' ? ' (QR)' : ''}${p.referencia ? ` · ${p.referencia}` : ''}`;
    const { movimiento, cuenta } = await registrarMovimiento(tx, {
      cuentaId: p.cuentaId, tipo: 'INGRESO', monto: p.monto, origenTipo: 'PAGO', descripcion: glosa, usuarioId, fecha: p.fecha,
    });

    const detalles = [];
    for (const a of aplicacion.aplicaciones) {
      if (a.capital > 0) detalles.push({ expensaId: a.expensaId, montoAplicado: D(a.capital), aplicadoA: 'CAPITAL' });
      if (a.mora > 0) detalles.push({ expensaId: a.expensaId, montoAplicado: D(a.mora), aplicadoA: 'MORA' });
    }

    const pago = await tx.pago.create({
      data: {
        unidadId: p.unidadId, copropietarioId, cuentaId: p.cuentaId, movimientoId: movimiento.id,
        fecha: p.fecha, monto: D(p.monto), metodo: p.metodo, referencia: p.referencia, observacion: p.observacion, usuarioId,
        detalles: { create: detalles },
      },
    });

    const expensasActualizadas = [];
    for (const a of aplicacion.aplicaciones) {
      const e = conMora.find((x) => x.id === a.expensaId);
      const { saldo, estado } = estadoTrasPago({ monto: e.monto, saldoAnterior: e.saldoPendiente, capitalAplicado: a.capital, estadoActual: e.estado });
      const actualizada = await tx.expensa.update({
        where: { id: e.id },
        data: { saldoPendiente: D(saldo), estado, moraAcumulada: e.moraAcumulada.plus(D(a.mora)) },
      });
      expensasActualizadas.push({
        id: e.id, periodo: `${e.periodo.mes}/${e.periodo.anio}`, fechaVencimiento: soloFecha(e.fechaVencimiento), diasAtraso: e.diasAtraso,
        moraCalculada: e.mora, capital: a.capital, mora: a.mora, saldoPendiente: Number(actualizada.saldoPendiente), estado,
      });
    }

    let anticipo = null;
    if (aplicacion.sobrante > 0) {
      anticipo = await tx.anticipo.create({
        data: { unidadId: p.unidadId, pagoId: pago.id, monto: D(aplicacion.sobrante), saldoDisponible: D(aplicacion.sobrante) },
      });
    }

    const asiento = await asentar(tx, {
      fecha: p.fecha, glosa, origenTipo: 'PAGO', origenId: pago.id,
      lineas: lineasAsientoPago({
        cuentaOperativa: codigoCuentaOperativa(cuenta),
        totalCapital: aplicacion.totalCapital, totalMora: aplicacion.totalMora, sobrante: aplicacion.sobrante, codigoUnidad: unidad.codigo,
      }),
    }, usuarioId);

    const conAtraso = expensasActualizadas.some((e) => e.diasAtraso > 0);
    return {
      pago: { id: pago.id, fecha: pago.fecha, monto: Number(pago.monto), metodo: pago.metodo, referencia: pago.referencia, unidad: unidad.codigo },
      fechaConsiderada: soloFecha(p.fecha),
      politica: configMoraAVista(config, p.fecha),
      situacion: !cobrarMora ? 'Mora no cobrada (cobrarMora:false)' : (conAtraso ? 'Pago después del vencimiento: con mora' : 'Pago en fecha o antes del vencimiento: sin mora'),
      aplicaciones: expensasActualizadas,
      totales: { capital: aplicacion.totalCapital, mora: aplicacion.totalMora, anticipo: aplicacion.sobrante },
      anticipo: anticipo ? { id: anticipo.id, monto: Number(anticipo.monto) } : null,
      movimiento: { id: movimiento.id, cuenta: cuenta.nombre, saldoResultante: Number(movimiento.saldoResultante) },
      asiento: { id: asiento.id, totalDebe: Number(asiento.totalDebe), totalHaber: Number(asiento.totalHaber), lineas: asiento.detalles.map((d) => ({ cuenta: `${d.cuentaContable.codigo} ${d.cuentaContable.nombre}`, debe: Number(d.debe), haber: Number(d.haber) })) },
    };
  });
}

module.exports = { listar, obtenerPorId, registrar, simular };
