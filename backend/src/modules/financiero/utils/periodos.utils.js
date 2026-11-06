// Reglas puras para la generación automática de expensas mensuales (requisito 2).
// Sprint 2 (pizarra 22-oct): montos por CATEGORÍA de departamento (A/B/C) y generación EN BLOQUES.
const { HttpError } = require('../../../shared/errors');
const { aCentavos, deCentavos } = require('./expensas.utils');

const MODOS = Object.freeze({ FIJO: 'FIJO', COEFICIENTE: 'COEFICIENTE' });

function normalizarMontos(obj, nombre) {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    if (!Number.isFinite(Number(v)) || Number(v) < 0) throw new HttpError(400, `${nombre}.${k} inválido`);
    out[String(k).trim().toUpperCase()] = Number(v);
  }
  return out;
}

/**
 * Valida y normaliza el cuerpo de POST /periodos y /periodos/vista-previa.
 *  modo FIJO:        montosPorCategoria (A/B/C) > montosPorTipo (DEPARTAMENTO/PARQUEO/BAULERA) > montoBase
 *  modo COEFICIENTE: presupuestoTotal prorrateado por la alícuota de cada unidad
 *  categorias:       opcional; limita la generación a un bloque, p. ej. ['A']
 */
function validarDatosPeriodo(datos = {}) {
  const anio = Number(datos.anio);
  const mes = Number(datos.mes);
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) throw new HttpError(400, 'anio inválido (2000-2100)');
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) throw new HttpError(400, 'mes inválido (1-12)');

  const modo = String(datos.modo || MODOS.FIJO).toUpperCase();
  if (!Object.values(MODOS).includes(modo)) throw new HttpError(400, `modo inválido: use ${Object.values(MODOS).join(' | ')}`);

  const montosPorTipo = normalizarMontos(datos.montosPorTipo, 'montosPorTipo');
  const montosPorCategoria = normalizarMontos(datos.montosPorCategoria, 'montosPorCategoria');

  const montoBase = datos.montoBase !== undefined ? Number(datos.montoBase) : undefined;
  if (montoBase !== undefined && (!Number.isFinite(montoBase) || montoBase < 0)) throw new HttpError(400, 'montoBase inválido');

  const presupuestoTotal = datos.presupuestoTotal !== undefined ? Number(datos.presupuestoTotal) : undefined;
  if (presupuestoTotal !== undefined && (!Number.isFinite(presupuestoTotal) || presupuestoTotal <= 0)) throw new HttpError(400, 'presupuestoTotal inválido');

  if (modo === MODOS.FIJO && montoBase === undefined && Object.keys(montosPorTipo).length === 0 && Object.keys(montosPorCategoria).length === 0) {
    throw new HttpError(400, 'En modo FIJO se requiere montoBase, montosPorTipo o montosPorCategoria');
  }
  if (modo === MODOS.COEFICIENTE && presupuestoTotal === undefined) {
    throw new HttpError(400, 'En modo COEFICIENTE se requiere presupuestoTotal');
  }

  let categorias = null;
  if (datos.categorias !== undefined && datos.categorias !== null) {
    const lista = Array.isArray(datos.categorias) ? datos.categorias : [datos.categorias];
    categorias = [...new Set(lista.map((c) => String(c).trim().toUpperCase()).filter(Boolean))];
    if (categorias.length === 0) throw new HttpError(400, 'categorias no puede estar vacío');
  }

  const diaVencimiento = datos.diaVencimiento !== undefined ? Number(datos.diaVencimiento) : undefined;
  if (diaVencimiento !== undefined && (!Number.isInteger(diaVencimiento) || diaVencimiento < 1 || diaVencimiento > 28)) {
    throw new HttpError(400, 'diaVencimiento inválido (1-28)');
  }

  return { anio, mes, modo, montoBase, montosPorTipo, montosPorCategoria, presupuestoTotal, categorias, diaVencimiento };
}

/** Fechas del periodo: emisión el día 1 y vencimiento el día indicado (en UTC, sin horas). */
function calcularFechasPeriodo({ anio, mes, diaVencimiento = 10 }) {
  const fechaEmision = new Date(Date.UTC(anio, mes - 1, 1));
  const fechaVencimiento = new Date(Date.UTC(anio, mes - 1, diaVencimiento));
  return { fechaEmision, fechaVencimiento };
}

/** Monto que corresponde a una unidad según el modo elegido. Devuelve número con 2 decimales. */
function montoParaUnidad(unidad, { modo = MODOS.FIJO, montoBase, montosPorTipo = {}, montosPorCategoria = {}, presupuestoTotal }) {
  if (modo === MODOS.COEFICIENTE) {
    const coef = Number(unidad.coeficiente ?? 0);
    if (!Number.isFinite(coef) || coef <= 0) return 0;
    return deCentavos(Math.round(aCentavos(presupuestoTotal) * coef));
  }
  const cat = unidad.categoria ? String(unidad.categoria).toUpperCase() : null;
  let monto;
  if (cat && montosPorCategoria[cat] !== undefined) monto = Number(montosPorCategoria[cat]);
  else if (montosPorTipo[unidad.tipo] !== undefined) monto = Number(montosPorTipo[unidad.tipo]);
  else monto = Number(montoBase ?? 0);
  return deCentavos(aCentavos(monto));
}

/** ¿La unidad pertenece al bloque pedido? (sin bloque → todas) */
function perteneceAlBloque(unidad, categorias) {
  if (!categorias) return true;
  const cat = unidad.categoria ? String(unidad.categoria).toUpperCase() : null;
  return cat !== null && categorias.includes(cat);
}

/**
 * Arma las filas de expensas para las unidades activas del bloque, saltando las que ya tienen expensa
 * en el periodo (excluirUnidadIds). Devuelve también las omitidas y por qué.
 */
function generarExpensasParaUnidades(unidades, config, { periodoId, fechaVencimiento, excluirUnidadIds = new Set() }) {
  const filas = [];
  const omitidas = [];
  let totalCentavos = 0;
  for (const u of unidades) {
    if (u.activo === false) { omitidas.push({ unidadId: u.id, motivo: 'INACTIVA' }); continue; }
    if (!perteneceAlBloque(u, config.categorias)) { omitidas.push({ unidadId: u.id, motivo: 'FUERA_DEL_BLOQUE' }); continue; }
    if (excluirUnidadIds.has(u.id)) { omitidas.push({ unidadId: u.id, motivo: 'YA_GENERADA' }); continue; }
    const monto = montoParaUnidad(u, config);
    if (monto <= 0) { omitidas.push({ unidadId: u.id, motivo: 'MONTO_CERO' }); continue; }
    totalCentavos += aCentavos(monto);
    filas.push({ unidadId: u.id, periodoId, monto, saldoPendiente: monto, fechaVencimiento });
  }
  return { filas, omitidas, totalEmitido: deCentavos(totalCentavos) };
}

/**
 * Ajuste del monto de agua de una expensa (pizarra 22-oct: "registrar montos de agua uno por uno").
 * La expensa guarda monto TOTAL (fijo + agua); el agua se reemplaza, no se suma.
 * Devuelve los nuevos valores y el delta a asentar en contabilidad.
 */
function calcularAjusteAgua({ montoActual, montoAguaActual, saldoActual, montoAguaNuevo }) {
  const nuevoC = aCentavos(montoAguaNuevo);
  const actualC = aCentavos(montoAguaActual ?? 0);
  const deltaC = nuevoC - actualC;
  const montoC = aCentavos(montoActual) + deltaC;
  const saldoC = aCentavos(saldoActual) + deltaC;
  if (saldoC < 0) throw new HttpError(422, 'El agua no puede reducirse por debajo de lo ya pagado en esta expensa');
  return {
    montoAgua: deCentavos(nuevoC),
    montoFijo: deCentavos(montoC - nuevoC),
    monto: deCentavos(montoC),
    saldoPendiente: deCentavos(saldoC),
    delta: deCentavos(deltaC),
  };
}

/**
 * Alta o baja de un cargo adicional con descripción (critico 2.2: "Agua y otros").
 * delta > 0 agrega (p. ej. "Extra pintura edificio: 250"); delta < 0 lo quita.
 */
function aplicarDeltaCargo({ montoActual, montoExtrasActual, saldoActual, delta }) {
  const deltaC = Math.round(Number(delta) * 100);
  if (!Number.isFinite(deltaC) || deltaC === 0) throw new HttpError(400, 'El monto del cargo debe ser distinto de cero');
  const montoC = aCentavos(montoActual) + deltaC;
  const extrasC = aCentavos(montoExtrasActual ?? 0) + deltaC;
  const saldoC = aCentavos(saldoActual) + deltaC;
  if (extrasC < 0) throw new HttpError(422, 'Los extras no pueden quedar negativos');
  if (saldoC < 0) throw new HttpError(422, 'El cargo no puede reducirse por debajo de lo ya pagado en esta expensa');
  return { monto: deCentavos(montoC), montoExtras: deCentavos(extrasC), saldoPendiente: deCentavos(saldoC), delta: deCentavos(deltaC) };
}

/**
 * Listado por tipo de departamento (critico 2.3): agrupa filas de cargos por categoría
 * y calcula subtotales por grupo y totales generales.
 * @param filas [{ categoria, expensa, agua, totalExtras, total, pagado, saldo }]
 */
function agruparCargosPorTipo(filas = []) {
  const grupos = new Map();
  const tot = { unidades: 0, expensa: 0, agua: 0, extras: 0, total: 0, pagado: 0, saldo: 0 };
  const suma = (acc, f) => {
    acc.unidades += 1;
    acc.expensa += aCentavos(f.expensa); acc.agua += aCentavos(f.agua); acc.extras += aCentavos(f.totalExtras);
    acc.total += aCentavos(f.total); acc.pagado += aCentavos(f.pagado); acc.saldo += aCentavos(f.saldo);
  };
  for (const f of filas) {
    const clave = f.categoria ? `Tipo ${f.categoria}` : (f.tipo === 'DEPARTAMENTO' ? 'Sin tipo' : (f.tipo === 'PARQUEO' ? 'Parqueos' : f.tipo === 'BAULERA' ? 'Bauleras' : 'Otros'));
    if (!grupos.has(clave)) grupos.set(clave, { grupo: clave, categoria: f.categoria ?? null, unidades: 0, expensa: 0, agua: 0, extras: 0, total: 0, pagado: 0, saldo: 0, filas: [] });
    const g = grupos.get(clave);
    suma(g, f); suma(tot, f);
    g.filas.push(f);
  }
  const aBs = (o) => ({ ...o, expensa: deCentavos(o.expensa), agua: deCentavos(o.agua), extras: deCentavos(o.extras), total: deCentavos(o.total), pagado: deCentavos(o.pagado), saldo: deCentavos(o.saldo) });
  return { grupos: [...grupos.values()].map(aBs), totales: aBs(tot) };
}

module.exports = {
  aplicarDeltaCargo, agruparCargosPorTipo,
  MODOS, validarDatosPeriodo, calcularFechasPeriodo, montoParaUnidad, perteneceAlBloque,
  generarExpensasParaUnidades, calcularAjusteAgua,
};
