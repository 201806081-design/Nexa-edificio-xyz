// =====================================================================
//  Reportes financieros base (HU-RE-01 · SCRUM-106): funciones puras.
//  8.1 Estado financiero · 8.2 Balance mensual · 8.3 Flujo de caja
//  8.5 Ingresos y gastos · exportación CSV. Cálculo en centavos.
// =====================================================================
const { HttpError } = require('../../../shared/errors');
const { aCentavos, deCentavos } = require('./expensas.utils');

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_ABREV = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
// signo: +1 si la cuenta aumenta con el Debe, -1 si aumenta con el Haber
const cent = (v) => { const n = Number(v ?? 0); return Math.round((Number.isFinite(n) ? n : 0) * 100); };
const bs = (c) => deCentavos(c);

function etiquetaPeriodo(anio, mes) { return `${MESES[mes - 1]} ${anio}`; }

/** Valida ?anio&mes. mes es opcional (reporte anual) salvo que se exija. */
function validarPeriodo({ anio, mes }, { hoy = new Date(), mesObligatorio = false } = {}) {
  const a = anio === undefined || anio === '' ? hoy.getUTCFullYear() : Number(anio);
  if (!Number.isInteger(a) || a < 2000 || a > 2100) throw new HttpError(400, 'anio inválido (2000-2100)');
  let m = null;
  if (mes !== undefined && mes !== '') {
    m = Number(mes);
    if (!Number.isInteger(m) || m < 1 || m > 12) throw new HttpError(400, 'mes inválido (1-12)');
  } else if (mesObligatorio) {
    m = hoy.getUTCMonth() + 1;
  }
  return { anio: a, mes: m };
}

/** Rango [desde, hasta) en UTC de un mes o de todo el año. */
function rangoPeriodo(anio, mes = null) {
  if (mes) return { desde: new Date(Date.UTC(anio, mes - 1, 1)), hasta: new Date(Date.UTC(anio, mes, 1)), etiqueta: etiquetaPeriodo(anio, mes), tipo: 'MENSUAL' };
  return { desde: new Date(Date.UTC(anio, 0, 1)), hasta: new Date(Date.UTC(anio + 1, 0, 1)), etiqueta: `Año ${anio}`, tipo: 'ANUAL' };
}

/**
 * Suma debe/haber por cuenta contable.
 * @param lineas [{ codigo, nombre, tipo, debe, haber }]
 * @returns Map codigo → { codigo, nombre, tipo, debe, haber } (en centavos)
 */
function sumarPorCuenta(lineas = []) {
  const m = new Map();
  for (const l of lineas) {
    if (!m.has(l.codigo)) m.set(l.codigo, { codigo: l.codigo, nombre: l.nombre, tipo: l.tipo, debe: 0, haber: 0 });
    const c = m.get(l.codigo); c.debe += cent(l.debe); c.haber += cent(l.haber);
  }
  return m;
}

/** Estado de resultados del período: ingresos (Haber − Debe), gastos (Debe − Haber) y resultado. */
function estadoResultados(lineas = []) {
  const cuentas = [...sumarPorCuenta(lineas).values()].sort((a, b) => a.codigo.localeCompare(b.codigo));
  const ingresos = cuentas.filter((c) => c.tipo === 'INGRESO').map((c) => ({ codigo: c.codigo, cuenta: c.nombre, monto: bs(c.haber - c.debe) })).filter((x) => x.monto !== 0);
  const gastos = cuentas.filter((c) => c.tipo === 'GASTO').map((c) => ({ codigo: c.codigo, cuenta: c.nombre, monto: bs(c.debe - c.haber) })).filter((x) => x.monto !== 0);
  const ti = ingresos.reduce((a, x) => a + cent(x.monto), 0);
  const tg = gastos.reduce((a, x) => a + cent(x.monto), 0);
  return { ingresos, totalIngresos: bs(ti), gastos, totalGastos: bs(tg), resultado: bs(ti - tg), superavit: ti - tg >= 0 };
}

/**
 * Balance general a una fecha: activos (Debe − Haber), pasivos y patrimonio (Haber − Debe),
 * más el resultado acumulado (ingresos − gastos). Debe cumplirse Activo = Pasivo + Patrimonio + Resultado.
 */
function balanceGeneral(lineas = []) {
  const cuentas = [...sumarPorCuenta(lineas).values()].sort((a, b) => a.codigo.localeCompare(b.codigo));
  const grupo = (tipo, signo) => cuentas.filter((c) => c.tipo === tipo).map((c) => ({ codigo: c.codigo, cuenta: c.nombre, saldo: bs(signo * (c.debe - c.haber)) })).filter((x) => x.saldo !== 0);
  const activos = grupo('ACTIVO', 1);
  const pasivos = grupo('PASIVO', -1);
  const patrimonio = grupo('PATRIMONIO', -1);
  const er = estadoResultados(lineas);
  const ta = activos.reduce((a, x) => a + cent(x.saldo), 0);
  const tp = pasivos.reduce((a, x) => a + cent(x.saldo), 0);
  const tpat = patrimonio.reduce((a, x) => a + cent(x.saldo), 0);
  const res = cent(er.resultado);
  return {
    activos, totalActivos: bs(ta),
    pasivos, totalPasivos: bs(tp),
    patrimonio, totalPatrimonio: bs(tpat),
    resultadoAcumulado: bs(res),
    totalPasivoPatrimonio: bs(tp + tpat + res),
    cuadra: ta === tp + tpat + res,
  };
}

/** Clasifica un movimiento de caja/banco para los reportes. */
function conceptoMovimiento(m) {
  const mapa = { PAGO: 'Cobro de expensas', INGRESO: 'Ingresos extraordinarios', EGRESO: 'Gastos operativos', NOMINA: 'Sueldos y anticipos al personal', AJUSTE: 'Ajustes' };
  return mapa[m.origenTipo] || 'Otros';
}

/**
 * Flujo de caja por mes: saldo inicial, ingresos y egresos por concepto, flujo neto y saldo final.
 * @param movimientos [{ fecha, tipo:'INGRESO'|'EGRESO', monto, origenTipo }] del rango
 * @param saldoInicial saldo de caja+bancos al inicio del rango
 * @param meses [{ anio, mes }] en orden
 */
function flujoCaja(movimientos = [], saldoInicial = 0, meses = []) {
  const porMes = new Map(meses.map((m) => [`${m.anio}-${m.mes}`, { ingresos: new Map(), egresos: new Map(), ti: 0, te: 0 }]));
  for (const mv of movimientos) {
    const d = new Date(mv.fecha);
    const b = porMes.get(`${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`);
    if (!b) continue;
    const c = cent(mv.monto); const concepto = conceptoMovimiento(mv);
    if (mv.tipo === 'INGRESO') { b.ingresos.set(concepto, (b.ingresos.get(concepto) || 0) + c); b.ti += c; }
    else { b.egresos.set(concepto, (b.egresos.get(concepto) || 0) + c); b.te += c; }
  }
  let saldo = cent(saldoInicial);
  const filas = meses.map((m) => {
    const b = porMes.get(`${m.anio}-${m.mes}`);
    const inicial = saldo; saldo = saldo + b.ti - b.te;
    const lista = (mp) => [...mp.entries()].map(([concepto, c]) => ({ concepto, monto: bs(c) })).sort((x, y) => y.monto - x.monto);
    return {
      anio: m.anio, mes: m.mes, periodo: etiquetaPeriodo(m.anio, m.mes), etiqueta: MESES_ABREV[m.mes - 1],
      saldoInicial: bs(inicial), ingresos: bs(b.ti), egresos: bs(b.te), flujoNeto: bs(b.ti - b.te), saldoFinal: bs(saldo),
      detalleIngresos: lista(b.ingresos), detalleEgresos: lista(b.egresos),
    };
  });
  const ti = filas.reduce((a, f) => a + cent(f.ingresos), 0); const te = filas.reduce((a, f) => a + cent(f.egresos), 0);
  return { saldoInicial: bs(cent(saldoInicial)), totalIngresos: bs(ti), totalEgresos: bs(te), flujoNeto: bs(ti - te), saldoFinal: bs(saldo), meses: filas };
}

/** Meses [{anio, mes}] cubiertos por un rango [desde, hasta). */
function mesesDelRango(desde, hasta) {
  const out = []; const d = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth(), 1));
  while (d < hasta) { out.push({ anio: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 }); d.setUTCMonth(d.getUTCMonth() + 1); }
  return out;
}

/** Agrupa montos por una clave (categoría, concepto…) con total y porcentaje. */
function agruparMontos(items = [], clave = 'categoria') {
  const m = new Map(); let total = 0;
  for (const it of items) { const k = it[clave] ?? 'Sin clasificar'; const c = cent(it.monto); m.set(k, { monto: (m.get(k)?.monto || 0) + c, cantidad: (m.get(k)?.cantidad || 0) + 1 }); total += c; }
  const filas = [...m.entries()].map(([k, v]) => ({ [clave]: k, monto: bs(v.monto), cantidad: v.cantidad, porcentaje: total ? Math.round((v.monto * 1000) / total) / 10 : 0 })).sort((a, b) => b.monto - a.monto);
  return { filas, total: bs(total) };
}

/** Texto CSV (separador coma, comillas dobles, fin de línea CRLF, BOM para Excel). */
function aCSV(columnas = [], filas = []) {
  const esc = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lineas = [columnas.map((c) => esc(c.titulo)).join(',')];
  for (const f of filas) lineas.push(columnas.map((c) => esc(typeof c.valor === 'function' ? c.valor(f) : f[c.campo])).join(','));
  return `\uFEFF${lineas.join('\r\n')}\r\n`;
}

/**
 * Líneas del asiento de apertura: los saldos iniciales de caja y bancos entran al Debe de su cuenta contable
 * y el total va al Haber del patrimonio (Fondo Común). Sin esto, el balance general no refleja el efectivo real.
 * @param cuentas [{ nombre, codigo, saldoInicial }]
 */
function lineasApertura(cuentas = [], cuentaPatrimonio) {
  const lineas = [];
  let total = 0;
  for (const c of cuentas) {
    const m = cent(c.saldoInicial);
    if (m <= 0) continue;
    lineas.push({ cuenta: c.codigo, debe: bs(m), descripcion: `Saldo inicial ${c.nombre}` });
    total += m;
  }
  if (total > 0) lineas.push({ cuenta: cuentaPatrimonio, haber: bs(total), descripcion: 'Fondo común del edificio al inicio de operaciones' });
  return { lineas, total: bs(total) };
}

module.exports = {
  lineasApertura,
  MESES, MESES_ABREV, etiquetaPeriodo, validarPeriodo, rangoPeriodo, sumarPorCuenta,
  estadoResultados, balanceGeneral, conceptoMovimiento, flujoCaja, mesesDelRango, agruparMontos, aCSV,
};
