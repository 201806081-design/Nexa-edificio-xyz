// Reglas puras para la generación automática de expensas mensuales (requisito 2)
const { HttpError } = require('../../../shared/errors');
const { aCentavos, deCentavos } = require('./expensas.utils');

const MODOS = Object.freeze({ FIJO: 'FIJO', COEFICIENTE: 'COEFICIENTE' });

/**
 * Valida y normaliza el cuerpo de POST /periodos.
 *  modo FIJO:        monto por tipo de unidad (montosPorTipo) o montoBase para todas
 *  modo COEFICIENTE: presupuestoTotal prorrateado por la alícuota (coeficiente) de cada unidad
 */
function validarDatosPeriodo(datos = {}) {
  const anio = Number(datos.anio);
  const mes = Number(datos.mes);
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) throw new HttpError(400, 'anio inválido (2000-2100)');
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) throw new HttpError(400, 'mes inválido (1-12)');

  const modo = String(datos.modo || MODOS.FIJO).toUpperCase();
  if (!Object.values(MODOS).includes(modo)) throw new HttpError(400, `modo inválido: use ${Object.values(MODOS).join(' | ')}`);

  const montosPorTipo = datos.montosPorTipo && typeof datos.montosPorTipo === 'object' ? datos.montosPorTipo : {};
  for (const [tipo, v] of Object.entries(montosPorTipo)) {
    if (!Number.isFinite(Number(v)) || Number(v) < 0) throw new HttpError(400, `montosPorTipo.${tipo} inválido`);
  }

  const montoBase = datos.montoBase !== undefined ? Number(datos.montoBase) : undefined;
  if (montoBase !== undefined && (!Number.isFinite(montoBase) || montoBase < 0)) throw new HttpError(400, 'montoBase inválido');

  const presupuestoTotal = datos.presupuestoTotal !== undefined ? Number(datos.presupuestoTotal) : undefined;
  if (presupuestoTotal !== undefined && (!Number.isFinite(presupuestoTotal) || presupuestoTotal <= 0)) throw new HttpError(400, 'presupuestoTotal inválido');

  if (modo === MODOS.FIJO && montoBase === undefined && Object.keys(montosPorTipo).length === 0) {
    throw new HttpError(400, 'En modo FIJO se requiere montoBase o montosPorTipo');
  }
  if (modo === MODOS.COEFICIENTE && presupuestoTotal === undefined) {
    throw new HttpError(400, 'En modo COEFICIENTE se requiere presupuestoTotal');
  }

  const diaVencimiento = datos.diaVencimiento !== undefined ? Number(datos.diaVencimiento) : undefined;
  if (diaVencimiento !== undefined && (!Number.isInteger(diaVencimiento) || diaVencimiento < 1 || diaVencimiento > 28)) {
    throw new HttpError(400, 'diaVencimiento inválido (1-28)');
  }

  return { anio, mes, modo, montoBase, montosPorTipo, presupuestoTotal, diaVencimiento };
}

/** Fechas del periodo: emisión el día 1 y vencimiento el día indicado (en UTC, sin horas). */
function calcularFechasPeriodo({ anio, mes, diaVencimiento = 10 }) {
  const fechaEmision = new Date(Date.UTC(anio, mes - 1, 1));
  const fechaVencimiento = new Date(Date.UTC(anio, mes - 1, diaVencimiento));
  return { fechaEmision, fechaVencimiento };
}

/** Monto que corresponde a una unidad según el modo elegido. Devuelve número con 2 decimales. */
function montoParaUnidad(unidad, { modo = MODOS.FIJO, montoBase, montosPorTipo = {}, presupuestoTotal }) {
  if (modo === MODOS.COEFICIENTE) {
    const coef = Number(unidad.coeficiente ?? 0);
    if (!Number.isFinite(coef) || coef <= 0) return 0;
    // presupuesto × alícuota, redondeado a centavos una sola vez
    return deCentavos(Math.round(aCentavos(presupuestoTotal) * coef));
  }
  const especifico = montosPorTipo[unidad.tipo];
  const monto = especifico !== undefined ? Number(especifico) : Number(montoBase ?? 0);
  return deCentavos(aCentavos(monto));
}

/** Arma las filas de expensas para todas las unidades activas y el total emitido. */
function generarExpensasParaUnidades(unidades, config, { periodoId, fechaVencimiento }) {
  const filas = [];
  let totalCentavos = 0;
  for (const u of unidades) {
    if (u.activo === false) continue;
    const monto = montoParaUnidad(u, config);
    if (monto <= 0) continue;
    totalCentavos += aCentavos(monto);
    filas.push({ unidadId: u.id, periodoId, monto, saldoPendiente: monto, fechaVencimiento });
  }
  return { filas, totalEmitido: deCentavos(totalCentavos) };
}

module.exports = { MODOS, validarDatosPeriodo, calcularFechasPeriodo, montoParaUnidad, generarExpensasParaUnidades };
