// Registro de pagos de expensas (req. 2): aplica a expensas, caja/bancos, anticipos y asiento contable.
const prisma = require('../../../config/prisma');
const { HttpError } = require('../../../shared/errors');
const { calcularMora } = require('../utils/expensas.utils');
const { validarDatosPago, aplicarPagoAExpensas, lineasAsientoPago, estadoTrasPago } = require('../utils/pagos.utils');
const { codigoCuentaOperativa } = require('../utils/contabilidad.utils');
const { registrarMovimiento, bloquearCuenta, D } = require('./movimientos.service');
const { asentar } = require('./contabilidad.service');
const { configMoraVigente } = require('./configuracion.service');

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
 * Registra un pago. Todo ocurre en UNA transacción con bloqueo de fila sobre la cuenta y las expensas:
 *  1. Determina las expensas a cobrar (las indicadas o las pendientes más antiguas de la unidad).
 *  2. Calcula la mora de cada una (si cobrarMora) con la configuración vigente.
 *  3. Distribuye el monto: mora → capital → sobrante como anticipo.
 *  4. Registra el movimiento en caja/banco y actualiza el saldo.
 *  5. Crea el pago con su detalle, actualiza saldos y estados de las expensas, crea el anticipo.
 *  6. Registra el asiento contable (Debe caja · Haber cuentas por cobrar / ingresos por mora / anticipos).
 */
async function registrar(datos, usuarioId) {
  const p = validarDatosPago(datos);

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

    // Mora por expensa (0 si no se cobra)
    const config = p.cobrarMora ? await configMoraVigente(p.fecha) : null;
    const conMora = expensas.map((e) => ({
      ...e,
      mora: config
        ? calcularMora({
            saldoPendiente: Number(e.saldoPendiente), tasaMensual: Number(config.tasaMensual), diasGracia: config.diasGracia,
            metodo: config.metodo, fechaVencimiento: e.fechaVencimiento, fechaCalculo: p.fecha,
          }).mora
        : 0,
    }));

    const aplicacion = aplicarPagoAExpensas(p.monto, conMora, { moraPrimero: true });
    if (aplicacion.aplicaciones.length === 0 && expensas.length > 0) {
      throw new HttpError(422, 'No se pudo aplicar el pago a ninguna expensa');
    }

    const copropietarioId = p.copropietarioId
      ?? unidad.ocupaciones.find((o) => o.esResponsablePago)?.copropietarioId
      ?? unidad.ocupaciones[0]?.copropietarioId
      ?? null;

    const glosa = `Pago expensas ${unidad.codigo}${p.referencia ? ` · ${p.referencia}` : ''}`;
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

    // Actualizar expensas
    const expensasActualizadas = [];
    for (const a of aplicacion.aplicaciones) {
      const e = conMora.find((x) => x.id === a.expensaId);
      const { saldo, estado } = estadoTrasPago({ monto: e.monto, saldoAnterior: e.saldoPendiente, capitalAplicado: a.capital, estadoActual: e.estado });
      const actualizada = await tx.expensa.update({
        where: { id: e.id },
        data: { saldoPendiente: D(saldo), estado, moraAcumulada: e.moraAcumulada.plus(D(a.mora)) },
      });
      expensasActualizadas.push({ id: e.id, periodo: `${e.periodo.mes}/${e.periodo.anio}`, capital: a.capital, mora: a.mora, saldoPendiente: Number(actualizada.saldoPendiente), estado });
    }

    // Anticipo por el sobrante
    let anticipo = null;
    if (aplicacion.sobrante > 0) {
      anticipo = await tx.anticipo.create({
        data: { unidadId: p.unidadId, pagoId: pago.id, monto: D(aplicacion.sobrante), saldoDisponible: D(aplicacion.sobrante) },
      });
    }

    // Asiento contable
    const asiento = await asentar(tx, {
      fecha: p.fecha, glosa, origenTipo: 'PAGO', origenId: pago.id,
      lineas: lineasAsientoPago({
        cuentaOperativa: codigoCuentaOperativa(cuenta),
        totalCapital: aplicacion.totalCapital, totalMora: aplicacion.totalMora, sobrante: aplicacion.sobrante, codigoUnidad: unidad.codigo,
      }),
    }, usuarioId);

    return {
      pago: { id: pago.id, fecha: pago.fecha, monto: Number(pago.monto), metodo: pago.metodo, referencia: pago.referencia, unidad: unidad.codigo },
      aplicaciones: expensasActualizadas,
      totales: { capital: aplicacion.totalCapital, mora: aplicacion.totalMora, anticipo: aplicacion.sobrante },
      anticipo: anticipo ? { id: anticipo.id, monto: Number(anticipo.monto) } : null,
      movimiento: { id: movimiento.id, cuenta: cuenta.nombre, saldoResultante: Number(movimiento.saldoResultante) },
      asiento: { id: asiento.id, totalDebe: Number(asiento.totalDebe), totalHaber: Number(asiento.totalHaber), lineas: asiento.detalles.map((d) => ({ cuenta: `${d.cuentaContable.codigo} ${d.cuentaContable.nombre}`, debe: Number(d.debe), haber: Number(d.haber) })) },
    };
  });
}

module.exports = { listar, obtenerPorId, registrar };
