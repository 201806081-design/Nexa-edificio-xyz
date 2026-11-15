// Reportes financieros base (HU-RE-01 · SCRUM-106 · sección 8 de la lista del docente).
//  8.1 Estado financiero · 8.2 Balance mensual · 8.3 Flujo de caja · 8.4 Lista de morosos (C)
//  8.5 Ingresos y gastos · 8.6 Historial de pagos por departamento (C)
// Solo lectura. Trabajan con la fecha del sistema (real o simulada).
const prisma = require('../../../config/prisma');
const { HttpError } = require('../../../shared/errors');
const { fechaActual } = require('../../../shared/fechaSistema');
const { morosos } = require('./dashboard.service');
const { estadoCuenta } = require('./vistas.service');
const { etiquetaUnidad, fechaCorta, soloFecha } = require('../utils/expensasVista.utils');
const {
  validarPeriodo, rangoPeriodo, estadoResultados, balanceGeneral, flujoCaja, mesesDelRango, agruparMontos, etiquetaPeriodo,
} = require('../utils/reportes.utils');

const num = (v) => Number(v ?? 0);
const r2 = (n) => Math.round(n * 100) / 100;

/** Líneas contables (asientos no anulados) en un rango de fechas: [{ codigo, nombre, tipo, debe, haber }]. */
async function lineasContables({ desde = null, hasta }) {
  const asientos = await prisma.asiento.findMany({
    where: { fecha: { ...(desde && { gte: desde }), lt: hasta } },
    include: { detalles: { include: { cuentaContable: { select: { codigo: true, nombre: true, tipo: true } } } } },
  });
  const lineas = [];
  for (const a of asientos) {
    if (a.estado === 'ANULADO') continue;
    for (const d of a.detalles) lineas.push({ codigo: d.cuentaContable.codigo, nombre: d.cuentaContable.nombre, tipo: d.cuentaContable.tipo, debe: num(d.debe), haber: num(d.haber) });
  }
  return { lineas, asientos: asientos.filter((a) => a.estado !== 'ANULADO').length };
}

/** Saldo conjunto de caja y bancos al inicio de una fecha (saldos iniciales + movimientos anteriores). */
async function saldoCajaBancosAl(fecha) {
  const [cuentas, previos] = await Promise.all([
    prisma.cuenta.findMany({ select: { id: true, nombre: true, tipo: true, saldoInicial: true, saldoActual: true, activa: true } }),
    prisma.movimiento.groupBy({ by: ['cuentaId', 'tipo'], where: { fecha: { lt: fecha } }, _sum: { monto: true } }),
  ]);
  const neto = new Map();
  for (const g of previos) neto.set(g.cuentaId, (neto.get(g.cuentaId) || 0) + (g.tipo === 'INGRESO' ? 1 : -1) * num(g._sum.monto));
  const detalle = cuentas.map((c) => ({ id: c.id, nombre: c.nombre, tipo: c.tipo, saldo: r2(num(c.saldoInicial) + (neto.get(c.id) || 0)) }));
  return { total: r2(detalle.reduce((a, c) => a + c.saldo, 0)), detalle };
}

// ---------------------------------------------------------------------------
// 8.1 Estado financiero: estado de resultados del período + balance general a la fecha de corte
// ---------------------------------------------------------------------------
async function estadoFinanciero(query = {}) {
  const hoy = await fechaActual();
  const { anio, mes } = validarPeriodo(query, { hoy });
  const rango = rangoPeriodo(anio, mes);
  // Las dos mitades usan el mismo corte (fin del período pedido): así el resultado del período, el balance
  // y el flujo de caja del mismo período hablan de los mismos asientos.
  const [periodo, acumulado, apertura, posteriores] = await Promise.all([
    lineasContables({ desde: rango.desde, hasta: rango.hasta }),
    lineasContables({ hasta: rango.hasta }),
    prisma.asiento.findFirst({ where: { origenTipo: 'MANUAL', glosa: { startsWith: 'Asiento de apertura' } }, select: { id: true } }),
    prisma.asiento.count({ where: { fecha: { gt: hoy, lt: rango.hasta } } }),
  ]);
  return {
    reporte: 'Estado financiero',
    periodo: rango.etiqueta,
    tipo: rango.tipo,
    fechaCorte: soloFecha(new Date(rango.hasta.getTime() - 1000)),
    fechaSistema: soloFecha(hoy),
    estadoResultados: estadoResultados(periodo.lineas),
    balanceGeneral: balanceGeneral(acumulado.lineas),
    asientosDelPeriodo: periodo.asientos,
    aperturaRegistrada: Boolean(apertura),
    asientosPosterioresALaFechaDelSistema: posteriores,
    notas: [
      ...(apertura ? [] : ['Falta el asiento de apertura: los saldos iniciales de caja y bancos no están en la contabilidad (POST /financiero/contabilidad/apertura).']),
      ...(posteriores ? [`El período incluye ${posteriores} asiento(s) con fecha posterior a la fecha del sistema (${soloFecha(hoy)}).`] : []),
    ],
    generadoEn: hoy.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 8.2 Balance mensual: lo emitido, lo cobrado, lo gastado y la posición de caja del mes, comparado con el anterior
// ---------------------------------------------------------------------------
async function resumenMes(anio, mes) {
  const rango = rangoPeriodo(anio, mes);
  const [periodo, expensas, movs, saldoIni] = await Promise.all([
    prisma.periodo.findUnique({ where: { anio_mes: { anio, mes } } }),
    prisma.expensa.findMany({ where: { periodo: { anio, mes } }, select: { monto: true, saldoPendiente: true, montoAgua: true, montoExtras: true } }),
    prisma.movimiento.findMany({ where: { fecha: { gte: rango.desde, lt: rango.hasta } }, select: { fecha: true, tipo: true, monto: true, origenTipo: true } }),
    saldoCajaBancosAl(rango.desde),
  ]);
  const emitido = expensas.reduce((a, e) => a + num(e.monto), 0);
  const pendiente = expensas.reduce((a, e) => a + num(e.saldoPendiente), 0);
  const fc = flujoCaja(movs, saldoIni.total, [{ anio, mes }]).meses[0];
  const por = (lista, concepto) => lista.find((x) => x.concepto === concepto)?.monto ?? 0;
  return {
    anio, mes, periodo: etiquetaPeriodo(anio, mes),
    expensas: {
      generado: Boolean(periodo), unidades: expensas.length,
      emitido: r2(emitido), agua: r2(expensas.reduce((a, e) => a + num(e.montoAgua), 0)), extras: r2(expensas.reduce((a, e) => a + num(e.montoExtras), 0)),
      cobrado: r2(emitido - pendiente), pendiente: r2(pendiente), porcentajeCobrado: emitido ? Math.round(((emitido - pendiente) * 1000) / emitido) / 10 : 0,
    },
    caja: {
      saldoInicial: fc.saldoInicial, ingresos: fc.ingresos, egresos: fc.egresos, resultado: fc.flujoNeto, saldoFinal: fc.saldoFinal,
      cobroExpensas: por(fc.detalleIngresos, 'Cobro de expensas'), ingresosExtraordinarios: por(fc.detalleIngresos, 'Ingresos extraordinarios'),
      gastosOperativos: por(fc.detalleEgresos, 'Gastos operativos'), personal: por(fc.detalleEgresos, 'Sueldos y anticipos al personal'),
    },
  };
}

async function balanceMensual(query = {}) {
  const hoy = await fechaActual();
  const { anio, mes } = validarPeriodo(query, { hoy, mesObligatorio: true });
  const ant = mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
  const [actual, anterior] = await Promise.all([resumenMes(anio, mes), resumenMes(ant.anio, ant.mes)]);
  const var_ = (a, b) => ({ diferencia: r2(a - b), porcentaje: b ? Math.round(((a - b) * 1000) / Math.abs(b)) / 10 : null });
  return {
    reporte: 'Balance mensual',
    periodo: actual.periodo,
    actual,
    anterior,
    variacion: {
      ingresos: var_(actual.caja.ingresos, anterior.caja.ingresos),
      egresos: var_(actual.caja.egresos, anterior.caja.egresos),
      resultado: var_(actual.caja.resultado, anterior.caja.resultado),
      cobrado: var_(actual.expensas.cobrado, anterior.expensas.cobrado),
    },
    generadoEn: hoy.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 8.3 Flujo de caja: por mes, saldo inicial + ingresos − egresos = saldo final, con detalle por concepto
// ---------------------------------------------------------------------------
async function reporteFlujoCaja(query = {}) {
  const hoy = await fechaActual();
  const { anio, mes } = validarPeriodo(query, { hoy });
  const rango = rangoPeriodo(anio, mes);
  const [movs, saldoIni] = await Promise.all([
    prisma.movimiento.findMany({ where: { fecha: { gte: rango.desde, lt: rango.hasta } }, select: { fecha: true, tipo: true, monto: true, origenTipo: true } }),
    saldoCajaBancosAl(rango.desde),
  ]);
  const cuentas = await prisma.cuenta.findMany({ select: { nombre: true, tipo: true, saldoActual: true } });
  return {
    reporte: 'Flujo de caja',
    periodo: rango.etiqueta,
    tipo: rango.tipo,
    ...flujoCaja(movs, saldoIni.total, mesesDelRango(rango.desde, rango.hasta)),
    cuentasAlInicio: saldoIni.detalle,
    saldosActuales: cuentas.map((c) => ({ cuenta: c.nombre, tipo: c.tipo, saldo: num(c.saldoActual) })),
    generadoEn: hoy.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 8.5 Reporte de ingresos y gastos (mensual o anual), por categoría, con el detalle
// ---------------------------------------------------------------------------
async function ingresosGastos(query = {}) {
  const hoy = await fechaActual();
  const { anio, mes } = validarPeriodo(query, { hoy });
  const rango = rangoPeriodo(anio, mes);
  const where = { fecha: { gte: rango.desde, lt: rango.hasta } };
  const INC = { categoria: { select: { nombre: true } }, cuenta: { select: { nombre: true } } };
  const [ingresos, egresos, pagos, planillas, anticiposEmp] = await Promise.all([
    prisma.ingreso.findMany({ where, include: INC, orderBy: { fecha: 'asc' } }),
    prisma.egreso.findMany({ where, include: INC, orderBy: { fecha: 'asc' } }),
    prisma.pago.findMany({ where: { ...where, anulado: false }, select: { monto: true, detalles: { select: { montoAplicado: true, aplicadoA: true } } } }),
    prisma.planilla.findMany({ where: { estado: 'PAGADA', fechaPago: { gte: rango.desde, lt: rango.hasta } }, select: { neto: true } }),
    prisma.anticipoEmpleado.findMany({ where, select: { monto: true } }),
  ]);
  const fila = (m, tipo) => ({ fecha: fechaCorta(m.fecha), fechaISO: soloFecha(m.fecha), tipo, categoria: m.categoria?.nombre ?? 'Sin categoría', descripcion: m.descripcion, monto: num(m.monto), cuenta: m.cuenta?.nombre ?? null, comprobante: m.comprobanteUrl ?? null, proveedor: m.proveedor ?? null });
  const fi = ingresos.map((m) => fila(m, 'Ingreso'));
  const fg = egresos.map((m) => fila(m, 'Gasto'));
  const gi = agruparMontos(fi, 'categoria');
  const gg = agruparMontos(fg, 'categoria');
  const capital = pagos.reduce((a, p) => a + p.detalles.filter((d) => d.aplicadoA === 'CAPITAL').reduce((b, d) => b + num(d.montoAplicado), 0), 0);
  const mora = pagos.reduce((a, p) => a + p.detalles.filter((d) => d.aplicadoA === 'MORA').reduce((b, d) => b + num(d.montoAplicado), 0), 0);
  const cobrado = pagos.reduce((a, p) => a + num(p.monto), 0);
  const personal = planillas.reduce((a, p) => a + num(p.neto), 0) + anticiposEmp.reduce((a, x) => a + num(x.monto), 0);
  const totalIngresos = r2(gi.total + cobrado);
  const totalGastos = r2(gg.total + personal);
  return {
    reporte: 'Ingresos y gastos',
    periodo: rango.etiqueta,
    tipo: rango.tipo,
    resumen: { totalIngresos, totalGastos, resultado: r2(totalIngresos - totalGastos) },
    ingresos: {
      cobroExpensas: { total: r2(cobrado), capital: r2(capital), mora: r2(mora), anticipos: r2(cobrado - capital - mora), pagos: pagos.length },
      extraordinarios: { total: gi.total, porCategoria: gi.filas },
    },
    gastos: {
      operativos: { total: gg.total, porCategoria: gg.filas },
      personal: { total: r2(personal), planillasPagadas: planillas.length, anticipos: anticiposEmp.length },
    },
    detalle: [...fi, ...fg].sort((a, b) => (a.fechaISO < b.fechaISO ? -1 : 1)),
    generadoEn: hoy.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 8.4 Lista de morosos (crítico) en forma de reporte, con tipo de departamento
// ---------------------------------------------------------------------------
async function listaMorosos({ minDias } = {}) {
  const hoy = await fechaActual();
  const base = await morosos({ minDias: minDias ? Number(minDias) : 1, hoy });
  const cats = new Map((await prisma.unidad.findMany({ select: { id: true, categoria: true } })).map((u) => [u.id, u.categoria]));
  const filas = base.items.map((i) => ({
    tipoDpto: cats.get(i.unidad.id) ?? '-',
    dpto: etiquetaUnidad(i.unidad),
    unidadId: i.unidad.id,
    responsable: i.responsable?.nombre ?? null,
    telefono: i.responsable?.telefono ?? null,
    email: i.responsable?.email ?? null,
    expensasVencidas: i.expensasVencidas,
    diasMora: i.diasMoraMax,
    capital: i.capital,
    mora: i.mora,
    totalAdeudado: i.saldoTotal,
    periodos: i.expensas.map((e) => e.periodo).join(', '),
  }));
  return {
    reporte: 'Lista de morosos',
    fecha: soloFecha(hoy),
    resumen: { unidades: filas.length, capital: r2(filas.reduce((a, f) => a + f.capital, 0)), mora: r2(filas.reduce((a, f) => a + f.mora, 0)), total: r2(filas.reduce((a, f) => a + f.totalAdeudado, 0)) },
    filas,
    generadoEn: hoy.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 8.6 Historial de pagos por departamento (crítico)
// ---------------------------------------------------------------------------
async function historialPagos(unidadId, query = {}) {
  const ec = await estadoCuenta(unidadId, { anio: query.anio, mes: query.mes });
  if (!ec) throw new HttpError(404, 'Unidad no encontrada');
  return {
    reporte: 'Historial de pagos por departamento',
    departamento: ec.departamento,
    tipoDpto: ec.unidad.categoria ?? '-',
    responsable: ec.responsable,
    periodoConsultado: ec.periodoConsultado,
    resumen: { ...ec.resumen, pagos: ec.pagos.length, totalPagadoEnPagos: r2(ec.pagos.reduce((a, p) => a + p.montoPagado, 0)) },
    pagos: ec.pagos,
    expensas: ec.expensas,
    generadoEn: ec.generadoEn,
  };
}

/** Índice de reportes disponibles. */
function indice() {
  return [
    { codigo: '8.1', nombre: 'Estado financiero', ruta: '/reportes/estado-financiero', parametros: 'anio, mes (opcional), formato=csv', critico: false },
    { codigo: '8.2', nombre: 'Balance mensual', ruta: '/reportes/balance-mensual', parametros: 'anio, mes', critico: false },
    { codigo: '8.3', nombre: 'Flujo de caja', ruta: '/reportes/flujo-caja', parametros: 'anio, mes (opcional), formato=csv', critico: false },
    { codigo: '8.4', nombre: 'Lista de morosos', ruta: '/reportes/morosos', parametros: 'minDias, formato=csv', critico: true },
    { codigo: '8.5', nombre: 'Ingresos y gastos', ruta: '/reportes/ingresos-gastos', parametros: 'anio, mes (opcional), formato=csv', critico: false },
    { codigo: '8.6', nombre: 'Historial de pagos por departamento', ruta: '/reportes/historial-pagos/:unidadId', parametros: 'anio, mes, formato=csv', critico: true },
  ];
}

module.exports = { estadoFinanciero, balanceMensual, reporteFlujoCaja, ingresosGastos, listaMorosos, historialPagos, indice };
