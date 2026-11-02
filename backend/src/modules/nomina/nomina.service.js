// Nómina (HU-AP-01 · SCRUM-107): anticipos a empleados, planillas mensuales con bonos y descuentos,
// pago desde caja/banco con asiento contable, e historial de pagos por empleado.
// Reutiliza el libro de caja (registrarMovimiento) y la contabilidad (asentar) del módulo financiero.
const { Prisma } = require('@prisma/client');
const prisma = require('../../config/prisma');
const { HttpError } = require('../../shared/errors');
const { registrarMovimiento, bloquearCuenta } = require('../financiero/services/movimientos.service');
const { asentar } = require('../financiero/services/contabilidad.service');
const { CUENTAS } = require('../financiero/utils/contabilidad.utils');
const {
  etiquetaPeriodo, etiquetaEmpleado, fechaCorta, soloFecha, inicioDiaUTC,
  validarPeriodo, idValido, fechaValida, validarConceptos, validarAnticipo,
  calcularPlanilla, lineasAsientoPlanilla, filaPlanilla, resumirPlanillas,
} = require('./nomina.utils');

const D = (v) => new Prisma.Decimal(typeof v === 'number' ? v.toFixed(2) : String(v));
const CTA_ANTICIPOS_EMPLEADOS = { codigo: '1.1.05', nombre: 'Anticipos a Empleados', padre: '1.1' };
const INCLUDE_PLANILLA = {
  empleado: { select: { id: true, nombres: true, apellidos: true, cargo: true, ci: true } },
  cuenta: { select: { id: true, nombre: true, tipo: true } },
  detalles: { orderBy: [{ tipo: 'asc' }, { id: 'asc' }] },
};
const mmaaaa = (p) => `${String(p.mes).padStart(2, '0')}/${p.anio}`;

/** Código de la cuenta contable de una cuenta de caja/banco. */
function codigoCuentaOperativa(cuenta) {
  return cuenta.cuentaContable?.codigo ?? (cuenta.tipo === 'CAJA' ? CUENTAS.CAJA : CUENTAS.BANCOS);
}

/** La cuenta contable 1.1.05 "Anticipos a Empleados" se crea la primera vez que hace falta. */
async function asegurarCuentaAnticipos(tx) {
  const existente = await tx.cuentaContable.findFirst({ where: { codigo: CTA_ANTICIPOS_EMPLEADOS.codigo } });
  if (existente) return existente.codigo;
  const padre = await tx.cuentaContable.findFirst({ where: { codigo: CTA_ANTICIPOS_EMPLEADOS.padre } });
  await tx.cuentaContable.create({
    data: { codigo: CTA_ANTICIPOS_EMPLEADOS.codigo, nombre: CTA_ANTICIPOS_EMPLEADOS.nombre, tipo: 'ACTIVO', naturaleza: 'DEUDORA', imputable: true, nivel: 3, padreId: padre?.id ?? null },
  });
  return CTA_ANTICIPOS_EMPLEADOS.codigo;
}

// ---------------------------------------------------------------------------
// Empleados (solo lectura: el CRUD es del módulo personal)
// ---------------------------------------------------------------------------

async function listarEmpleados({ activos } = {}) {
  const where = activos === undefined ? {} : { activo: String(activos) !== 'false' };
  const empleados = await prisma.empleado.findMany({
    where,
    include: {
      anticipos: { where: { descontado: false }, select: { id: true, monto: true, fecha: true } },
      planillas: { orderBy: [{ anio: 'desc' }, { mes: 'desc' }], take: 1, select: { anio: true, mes: true, estado: true, neto: true, fechaPago: true } },
    },
    orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
  });
  return empleados.map((e) => {
    const u = e.planillas[0];
    return {
      id: e.id,
      nombre: `${e.nombres} ${e.apellidos}`,
      etiqueta: etiquetaEmpleado(e),
      ci: e.ci,
      cargo: e.cargo,
      salarioBase: Number(e.salarioBase),
      fechaIngreso: soloFecha(e.fechaIngreso),
      fechaSalida: soloFecha(e.fechaSalida),
      activo: e.activo,
      anticiposPendientes: e.anticipos.length,
      montoAnticiposPendientes: e.anticipos.reduce((a, x) => a + Number(x.monto), 0),
      ultimaPlanilla: u ? { periodo: etiquetaPeriodo(u.anio, u.mes), estado: u.estado, neto: Number(u.neto), fechaPago: fechaCorta(u.fechaPago) } : null,
    };
  });
}

async function empleadoActivo(db, id) {
  const e = await db.empleado.findUnique({ where: { id } });
  if (!e) throw new HttpError(404, 'Empleado no encontrado');
  if (!e.activo) throw new HttpError(422, `El empleado ${e.nombres} ${e.apellidos} no está activo`);
  return e;
}

// ---------------------------------------------------------------------------
// Anticipos a empleados
// ---------------------------------------------------------------------------

function filaAnticipo(a) {
  return {
    id: a.id,
    empleadoId: a.empleadoId,
    empleado: etiquetaEmpleado(a.empleado),
    fecha: fechaCorta(a.fecha),
    fechaISO: soloFecha(a.fecha),
    monto: Number(a.monto),
    descontado: a.descontado,
    estado: a.descontado ? 'Descontado' : (a.planillaId ? 'En planilla' : 'Pendiente'),
    planillaId: a.planillaId ?? null,
    planilla: a.planilla ? etiquetaPeriodo(a.planilla.anio, a.planilla.mes) : null,
    observacion: a.observacion ?? null,
  };
}

/** Entrega de dinero a cuenta del sueldo: sale de caja/banco y queda por descontar en la próxima planilla. */
async function registrarAnticipo(datos, usuarioId = null) {
  const d = validarAnticipo(datos);
  return prisma.$transaction(async (tx) => {
    const empleado = await empleadoActivo(tx, d.empleadoId);
    await bloquearCuenta(tx, d.cuentaId);
    const descripcion = `Anticipo de sueldo a ${empleado.nombres} ${empleado.apellidos}${d.observacion ? ` (${d.observacion})` : ''}`;
    const { movimiento, cuenta } = await registrarMovimiento(tx, { cuentaId: d.cuentaId, tipo: 'EGRESO', monto: d.monto, origenTipo: 'NOMINA', descripcion, usuarioId, fecha: d.fecha });
    const anticipo = await tx.anticipoEmpleado.create({
      data: { empleadoId: d.empleadoId, fecha: d.fecha, monto: D(d.monto), observacion: d.observacion },
      include: { empleado: { select: { nombres: true, apellidos: true, cargo: true } } },
    });
    const ctaAnticipos = await asegurarCuentaAnticipos(tx);
    const asiento = await asentar(tx, {
      fecha: d.fecha, glosa: descripcion, origenTipo: 'NOMINA', origenId: anticipo.id,
      lineas: [
        { cuenta: ctaAnticipos, debe: d.monto, descripcion: 'Anticipo por descontar' },
        { cuenta: codigoCuentaOperativa(cuenta), haber: d.monto, descripcion: 'Salida de caja/banco' },
      ],
    }, usuarioId);
    return { ...filaAnticipo(anticipo), movimientoId: movimiento.id, asientoId: asiento.id, saldoCuenta: Number(movimiento.saldoResultante) };
  });
}

async function listarAnticipos({ empleadoId, pendientes } = {}) {
  const where = {};
  if (empleadoId) where.empleadoId = idValido(empleadoId, 'empleadoId');
  if (pendientes !== undefined) where.descontado = String(pendientes) === 'true' ? false : true;
  const filas = await prisma.anticipoEmpleado.findMany({
    where,
    include: { empleado: { select: { nombres: true, apellidos: true, cargo: true } }, planilla: { select: { anio: true, mes: true } } },
    orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
  });
  return filas.map(filaAnticipo);
}

// ---------------------------------------------------------------------------
// Planillas
// ---------------------------------------------------------------------------

/** Anticipos del empleado aún no descontados ni reservados por otra planilla. */
async function anticiposDisponibles(db, empleadoId) {
  return db.anticipoEmpleado.findMany({ where: { empleadoId, descontado: false, planillaId: null }, orderBy: { fecha: 'asc' } });
}

/** Crea una planilla en BORRADOR para un empleado y un mes. */
async function crearPlanillaEmpleado(tx, { empleado, anio, mes, bonos, descuentos, descontarAnticipos, usuarioId }) {
  const anticipos = descontarAnticipos ? await anticiposDisponibles(tx, empleado.id) : [];
  const calc = calcularPlanilla({ salarioBase: String(empleado.salarioBase), bonos, descuentos, anticipos: anticipos.map((a) => ({ monto: String(a.monto) })) });
  const planilla = await tx.planilla.create({
    data: {
      empleadoId: empleado.id, anio, mes,
      salarioBase: D(calc.salarioBase), totalBonos: D(calc.totalBonos), totalDescuentos: D(calc.totalDescuentos),
      totalAnticipos: D(calc.totalAnticipos), neto: D(calc.neto), estado: 'BORRADOR', usuarioId,
      detalles: {
        create: [
          ...bonos.map((b) => ({ tipo: 'BONO', concepto: b.concepto, monto: D(b.monto) })),
          ...descuentos.map((d) => ({ tipo: 'DESCUENTO', concepto: d.concepto, monto: D(d.monto) })),
          ...anticipos.map((a) => ({ tipo: 'ANTICIPO', concepto: `Anticipo del ${fechaCorta(a.fecha)}`, monto: D(String(a.monto)) })),
        ],
      },
    },
    include: INCLUDE_PLANILLA,
  });
  if (anticipos.length) {
    await tx.anticipoEmpleado.updateMany({ where: { id: { in: anticipos.map((a) => a.id) } }, data: { planillaId: planilla.id } });
  }
  return planilla;
}

/** Planilla individual con bonos/descuentos (POST /planillas). */
async function crearPlanilla(datos = {}, usuarioId = null) {
  const empleadoId = idValido(datos.empleadoId, 'empleadoId');
  const { anio, mes } = validarPeriodo(datos.anio, datos.mes);
  const bonos = validarConceptos(datos.bonos, 'bonos');
  const descuentos = validarConceptos(datos.descuentos, 'descuentos');
  const descontarAnticipos = datos.descontarAnticipos === undefined ? true : Boolean(datos.descontarAnticipos);
  return prisma.$transaction(async (tx) => {
    const empleado = await empleadoActivo(tx, empleadoId);
    const existente = await tx.planilla.findUnique({ where: { empleadoId_anio_mes: { empleadoId, anio, mes } } });
    if (existente) throw new HttpError(409, `${empleado.nombres} ${empleado.apellidos} ya tiene planilla de ${mmaaaa({ anio, mes })} (id ${existente.id}, ${existente.estado})`);
    const p = await crearPlanillaEmpleado(tx, { empleado, anio, mes, bonos, descuentos, descontarAnticipos, usuarioId });
    return filaPlanilla(p);
  });
}

/** Planillas del mes para todos los empleados activos que aún no la tienen (POST /planillas/generar). */
async function generarPlanillas(datos = {}, usuarioId = null) {
  const { anio, mes } = validarPeriodo(datos.anio, datos.mes);
  const descontarAnticipos = datos.descontarAnticipos === undefined ? true : Boolean(datos.descontarAnticipos);
  return prisma.$transaction(async (tx) => {
    const empleados = await tx.empleado.findMany({ where: { activo: true }, orderBy: [{ apellidos: 'asc' }] });
    if (empleados.length === 0) throw new HttpError(422, 'No hay empleados activos');
    const existentes = new Set((await tx.planilla.findMany({ where: { anio, mes }, select: { empleadoId: true } })).map((p) => p.empleadoId));
    const creadas = [];
    for (const e of empleados) {
      if (existentes.has(e.id)) continue;
      creadas.push(filaPlanilla(await crearPlanillaEmpleado(tx, { empleado: e, anio, mes, bonos: [], descuentos: [], descontarAnticipos, usuarioId })));
    }
    if (creadas.length === 0) throw new HttpError(409, `Todos los empleados activos ya tienen planilla de ${mmaaaa({ anio, mes })}`);
    return { periodo: etiquetaPeriodo(anio, mes), generadas: creadas.length, yaExistentes: existentes.size, empleadosActivos: empleados.length, resumen: resumirPlanillas(creadas), planillas: creadas };
  });
}

/** Cambia bonos/descuentos (y si descuenta anticipos) de una planilla en BORRADOR. */
async function actualizarPlanilla(id, datos = {}, usuarioId = null) {
  const bonos = datos.bonos !== undefined ? validarConceptos(datos.bonos, 'bonos') : null;
  const descuentos = datos.descuentos !== undefined ? validarConceptos(datos.descuentos, 'descuentos') : null;
  return prisma.$transaction(async (tx) => {
    const p = await tx.planilla.findUnique({ where: { id }, include: INCLUDE_PLANILLA });
    if (!p) throw new HttpError(404, 'Planilla no encontrada');
    if (p.estado !== 'BORRADOR') throw new HttpError(409, 'Solo se puede modificar una planilla en borrador');

    const nuevosBonos = bonos ?? p.detalles.filter((d) => d.tipo === 'BONO').map((d) => ({ concepto: d.concepto, monto: Number(d.monto) }));
    const nuevosDesc = descuentos ?? p.detalles.filter((d) => d.tipo === 'DESCUENTO').map((d) => ({ concepto: d.concepto, monto: Number(d.monto) }));

    let anticipos = await tx.anticipoEmpleado.findMany({ where: { planillaId: p.id, descontado: false } });
    if (datos.descontarAnticipos === false && anticipos.length) {
      await tx.anticipoEmpleado.updateMany({ where: { planillaId: p.id, descontado: false }, data: { planillaId: null } });
      anticipos = [];
    } else if (datos.descontarAnticipos === true) {
      const libres = await anticiposDisponibles(tx, p.empleadoId);
      if (libres.length) await tx.anticipoEmpleado.updateMany({ where: { id: { in: libres.map((a) => a.id) } }, data: { planillaId: p.id } });
      anticipos = [...anticipos, ...libres];
    }

    const calc = calcularPlanilla({ salarioBase: String(p.salarioBase), bonos: nuevosBonos, descuentos: nuevosDesc, anticipos: anticipos.map((a) => ({ monto: String(a.monto) })) });
    await tx.planillaDetalle.deleteMany({ where: { planillaId: p.id } });
    const actualizada = await tx.planilla.update({
      where: { id: p.id },
      data: {
        totalBonos: D(calc.totalBonos), totalDescuentos: D(calc.totalDescuentos), totalAnticipos: D(calc.totalAnticipos), neto: D(calc.neto), usuarioId,
        detalles: {
          create: [
            ...nuevosBonos.map((b) => ({ tipo: 'BONO', concepto: b.concepto, monto: D(b.monto) })),
            ...nuevosDesc.map((d) => ({ tipo: 'DESCUENTO', concepto: d.concepto, monto: D(d.monto) })),
            ...anticipos.map((a) => ({ tipo: 'ANTICIPO', concepto: `Anticipo del ${fechaCorta(a.fecha)}`, monto: D(String(a.monto)) })),
          ],
        },
      },
      include: INCLUDE_PLANILLA,
    });
    return filaPlanilla(actualizada);
  });
}

/**
 * Paga la planilla: sale el neto de caja/banco (movimiento NOMINA), los anticipos quedan descontados
 * y se asienta Debe Sueldos y Salarios (bruto) / Haber Anticipos a Empleados (descontados) / Haber Caja-Banco (neto).
 */
async function pagarPlanilla(id, datos = {}, usuarioId = null) {
  const cuentaId = idValido(datos.cuentaId, 'cuentaId');
  const fecha = fechaValida(datos.fecha, 'fecha');
  return prisma.$transaction(async (tx) => {
    const p = await tx.planilla.findUnique({ where: { id }, include: INCLUDE_PLANILLA });
    if (!p) throw new HttpError(404, 'Planilla no encontrada');
    if (p.estado === 'PAGADA') throw new HttpError(409, `La planilla ya fue pagada el ${fechaCorta(p.fechaPago)}`);

    const fila = filaPlanilla(p);
    await bloquearCuenta(tx, cuentaId);
    const cuenta = await tx.cuenta.findUnique({ where: { id: cuentaId }, include: { cuentaContable: true } });
    if (!cuenta) throw new HttpError(404, `Cuenta ${cuentaId} no encontrada`);

    let movimientoId = null; let saldoCuenta = Number(cuenta.saldoActual);
    const descripcion = `Pago de planilla ${mmaaaa(p)} a ${p.empleado.nombres} ${p.empleado.apellidos}`;
    if (fila.neto > 0) {
      const { movimiento } = await registrarMovimiento(tx, { cuentaId, tipo: 'EGRESO', monto: fila.neto, origenTipo: 'NOMINA', descripcion, usuarioId, fecha });
      movimientoId = movimiento.id; saldoCuenta = Number(movimiento.saldoResultante);
    }
    await tx.anticipoEmpleado.updateMany({ where: { planillaId: p.id, descontado: false }, data: { descontado: true } });
    const ctaAnticipos = fila.totalAnticipos > 0 ? await asegurarCuentaAnticipos(tx) : null;
    const asiento = await asentar(tx, {
      fecha, glosa: descripcion, origenTipo: 'NOMINA', origenId: p.id,
      lineas: lineasAsientoPlanilla({ bruto: fila.bruto, totalAnticipos: fila.totalAnticipos, neto: fila.neto, cuentaGasto: '5.1.04', cuentaAnticipos: ctaAnticipos, cuentaCajaBanco: codigoCuentaOperativa(cuenta) }),
    }, usuarioId);
    const pagada = await tx.planilla.update({
      where: { id: p.id },
      data: { estado: 'PAGADA', fechaPago: fecha, cuentaId, movimientoId, usuarioId },
      include: INCLUDE_PLANILLA,
    });
    return { ...filaPlanilla(pagada), asientoId: asiento.id, saldoCuenta };
  });
}

async function listarPlanillas({ anio, mes, empleadoId, estado } = {}) {
  const where = {};
  if (anio) where.anio = Number(anio);
  if (mes) where.mes = Number(mes);
  if (empleadoId) where.empleadoId = idValido(empleadoId, 'empleadoId');
  if (estado) where.estado = String(estado).toUpperCase() === 'PAGADA' ? 'PAGADA' : 'BORRADOR';
  const filas = (await prisma.planilla.findMany({ where, include: INCLUDE_PLANILLA, orderBy: [{ anio: 'desc' }, { mes: 'desc' }, { empleadoId: 'asc' }] })).map(filaPlanilla);
  return { resumen: resumirPlanillas(filas), data: filas };
}

async function planillaPorId(id) {
  const p = await prisma.planilla.findUnique({ where: { id }, include: { ...INCLUDE_PLANILLA, movimiento: true, anticiposDescontados: true } });
  if (!p) return null;
  return { ...filaPlanilla(p), movimiento: p.movimiento ? { id: p.movimiento.id, fecha: soloFecha(p.movimiento.fecha), monto: Number(p.movimiento.monto), saldoResultante: Number(p.movimiento.saldoResultante) } : null, anticipos: p.anticiposDescontados.map(filaAnticipo) };
}

/** Borra una planilla en BORRADOR y libera sus anticipos reservados. */
async function eliminarPlanilla(id) {
  return prisma.$transaction(async (tx) => {
    const p = await tx.planilla.findUnique({ where: { id } });
    if (!p) throw new HttpError(404, 'Planilla no encontrada');
    if (p.estado !== 'BORRADOR') throw new HttpError(409, 'Solo se puede eliminar una planilla en borrador');
    await tx.anticipoEmpleado.updateMany({ where: { planillaId: id, descontado: false }, data: { planillaId: null } });
    await tx.planilla.delete({ where: { id } });
    return { id, eliminada: true };
  });
}

/** Historial de pagos de un empleado (pantalla de Oscar): planillas, anticipos y totales. */
async function historialEmpleado(empleadoId, { anio } = {}) {
  const e = await prisma.empleado.findUnique({ where: { id: empleadoId } });
  if (!e) return null;
  const whereAnio = anio ? { anio: Number(anio) } : {};
  const [planillas, anticipos] = await Promise.all([
    prisma.planilla.findMany({ where: { empleadoId, ...whereAnio }, include: INCLUDE_PLANILLA, orderBy: [{ anio: 'desc' }, { mes: 'desc' }] }),
    prisma.anticipoEmpleado.findMany({ where: { empleadoId }, include: { empleado: { select: { nombres: true, apellidos: true, cargo: true } }, planilla: { select: { anio: true, mes: true } } }, orderBy: [{ fecha: 'desc' }] }),
  ]);
  const filas = planillas.map(filaPlanilla);
  const resumen = resumirPlanillas(filas);
  const pendientes = anticipos.filter((a) => !a.descontado);
  return {
    empleado: { id: e.id, nombre: `${e.nombres} ${e.apellidos}`, etiqueta: etiquetaEmpleado(e), cargo: e.cargo, ci: e.ci, salarioBase: Number(e.salarioBase), fechaIngreso: soloFecha(e.fechaIngreso), activo: e.activo },
    periodoConsultado: anio ? `Año ${anio}` : 'Todo el historial',
    resumen: { ...resumen, anticiposPendientes: pendientes.length, montoAnticiposPendientes: pendientes.reduce((a, x) => a + Number(x.monto), 0) },
    planillas: filas,
    anticipos: anticipos.map(filaAnticipo),
    generadoEn: new Date().toISOString(),
  };
}

module.exports = {
  listarEmpleados, registrarAnticipo, listarAnticipos,
  crearPlanilla, generarPlanillas, actualizarPlanilla, pagarPlanilla, listarPlanillas, planillaPorId, eliminarPlanilla,
  historialEmpleado,
};
