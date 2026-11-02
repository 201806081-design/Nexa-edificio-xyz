// =====================================================================
//  Nómina: reglas puras (salarios, bonos, descuentos, anticipos).
//  Cálculo en centavos enteros; redondeo a 2 decimales una sola vez.
// =====================================================================
const { HttpError } = require('../../shared/errors');
const { aCentavos, deCentavos } = require('../financiero/utils/expensas.utils');

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const cent = (v) => aCentavos(String(v ?? 0));

function etiquetaPeriodo(anio, mes) { return `${MESES[mes - 1]} ${anio}`; }
function fechaCorta(d) {
  if (!d) return null;
  const x = new Date(d);
  return `${String(x.getUTCDate()).padStart(2, '0')}/${String(x.getUTCMonth() + 1).padStart(2, '0')}/${x.getUTCFullYear()}`;
}
function soloFecha(d) { return d ? new Date(d).toISOString().slice(0, 10) : null; }
function inicioDiaUTC(d = new Date()) { const x = new Date(d); return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate())); }

/** "Juan Mamani Choque -- Portero" */
function etiquetaEmpleado(e) { return e ? `${e.nombres} ${e.apellidos} -- ${e.cargo}` : null; }

function validarPeriodo(anio, mes) {
  const a = Number(anio); const m = Number(mes);
  if (!Number.isInteger(a) || a < 2000 || a > 2100) throw new HttpError(400, 'anio inválido (2000-2100)');
  if (!Number.isInteger(m) || m < 1 || m > 12) throw new HttpError(400, 'mes inválido (1-12)');
  return { anio: a, mes: m };
}

function idValido(raw, nombre = 'id') {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, `${nombre} debe ser un entero positivo`);
  return id;
}

function fechaValida(raw, nombre = 'fecha', porDefecto = new Date()) {
  if (raw === undefined || raw === null || raw === '') return inicioDiaUTC(porDefecto);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) throw new HttpError(400, `${nombre} inválida`);
  return inicioDiaUTC(d);
}

/** [{ concepto, monto }] con concepto no vacío (≤150) y monto > 0. */
function validarConceptos(lista, tipo) {
  if (lista === undefined || lista === null) return [];
  if (!Array.isArray(lista)) throw new HttpError(400, `${tipo} debe ser una lista`);
  return lista.map((c, i) => {
    const concepto = String(c?.concepto ?? '').trim();
    const monto = Number(c?.monto);
    if (!concepto || concepto.length > 150) throw new HttpError(400, `${tipo}[${i}].concepto inválido (1-150 caracteres)`);
    if (!Number.isFinite(monto) || monto <= 0) throw new HttpError(400, `${tipo}[${i}].monto inválido (número > 0)`);
    return { concepto, monto: deCentavos(cent(monto)) };
  });
}

/** Cuerpo de POST /nomina/anticipos */
function validarAnticipo(datos = {}) {
  const empleadoId = idValido(datos.empleadoId, 'empleadoId');
  const cuentaId = idValido(datos.cuentaId, 'cuentaId');
  const monto = Number(datos.monto);
  if (!Number.isFinite(monto) || monto <= 0) throw new HttpError(400, 'monto inválido (número > 0)');
  const observacion = datos.observacion ? String(datos.observacion).trim().slice(0, 255) : null;
  return { empleadoId, cuentaId, monto: deCentavos(cent(monto)), fecha: fechaValida(datos.fecha), observacion };
}

/**
 * Liquidación de una planilla.
 *  bruto = salarioBase + bonos − descuentos   (es el gasto de sueldos del mes)
 *  neto  = bruto − anticipos                   (lo que efectivamente se paga)
 */
function calcularPlanilla({ salarioBase, bonos = [], descuentos = [], anticipos = [] }) {
  const base = cent(salarioBase);
  if (base <= 0) throw new HttpError(422, 'El salario base debe ser mayor a cero');
  const tb = bonos.reduce((a, b) => a + cent(b.monto), 0);
  const td = descuentos.reduce((a, d) => a + cent(d.monto), 0);
  const ta = anticipos.reduce((a, x) => a + cent(x.monto), 0);
  const bruto = base + tb - td;
  if (bruto < 0) throw new HttpError(422, 'Los descuentos superan el salario más bonos');
  const neto = bruto - ta;
  if (neto < 0) throw new HttpError(422, `Los anticipos pendientes (Bs ${deCentavos(ta)}) superan el líquido (Bs ${deCentavos(bruto)}); registre la planilla sin descontar anticipos o corrija los montos`);
  return {
    salarioBase: deCentavos(base),
    totalBonos: deCentavos(tb),
    totalDescuentos: deCentavos(td),
    totalAnticipos: deCentavos(ta),
    bruto: deCentavos(bruto),
    neto: deCentavos(neto),
  };
}

/** Líneas del asiento de pago de planilla (Debe gasto; Haber anticipos y caja/banco). */
function lineasAsientoPlanilla({ bruto, totalAnticipos, neto, cuentaGasto, cuentaAnticipos, cuentaCajaBanco }) {
  const lineas = [{ cuenta: cuentaGasto, debe: bruto, descripcion: 'Sueldos y salarios del mes' }];
  if (cent(totalAnticipos) > 0) lineas.push({ cuenta: cuentaAnticipos, haber: totalAnticipos, descripcion: 'Anticipos descontados' });
  if (cent(neto) > 0) lineas.push({ cuenta: cuentaCajaBanco, haber: neto, descripcion: 'Pago líquido' });
  return lineas;
}

/** Fila de planilla para listas y pantallas. */
function filaPlanilla(p) {
  const n = (v) => deCentavos(cent(v));
  return {
    id: p.id,
    empleadoId: p.empleadoId,
    empleado: etiquetaEmpleado(p.empleado),
    cargo: p.empleado?.cargo ?? null,
    anio: p.anio,
    mes: p.mes,
    periodo: etiquetaPeriodo(p.anio, p.mes),
    salarioBase: n(p.salarioBase),
    totalBonos: n(p.totalBonos),
    totalDescuentos: n(p.totalDescuentos),
    totalAnticipos: n(p.totalAnticipos),
    bruto: deCentavos(cent(p.salarioBase) + cent(p.totalBonos) - cent(p.totalDescuentos)),
    neto: n(p.neto),
    estado: p.estado,
    estadoUI: p.estado === 'PAGADA' ? 'Pagada' : 'Borrador',
    fechaPago: fechaCorta(p.fechaPago),
    fechaPagoISO: soloFecha(p.fechaPago),
    cuenta: p.cuenta?.nombre ?? null,
    cuentaId: p.cuentaId ?? null,
    movimientoId: p.movimientoId ?? null,
    detalles: (p.detalles || []).map((d) => ({ id: d.id, tipo: d.tipo, concepto: d.concepto, monto: n(d.monto) })),
  };
}

/** Totales de un conjunto de planillas (tarjetas de la pantalla). */
function resumirPlanillas(filas = []) {
  const r = { cantidad: filas.length, pagadas: 0, borradores: 0, totalBruto: 0, totalAnticipos: 0, totalNeto: 0, netoPagado: 0, netoPendiente: 0 };
  let tb = 0; let ta = 0; let tn = 0; let np = 0; let npend = 0;
  for (const f of filas) {
    tb += cent(f.bruto); ta += cent(f.totalAnticipos); tn += cent(f.neto);
    if (f.estado === 'PAGADA') { r.pagadas += 1; np += cent(f.neto); } else { r.borradores += 1; npend += cent(f.neto); }
  }
  r.totalBruto = deCentavos(tb); r.totalAnticipos = deCentavos(ta); r.totalNeto = deCentavos(tn);
  r.netoPagado = deCentavos(np); r.netoPendiente = deCentavos(npend);
  return r;
}

module.exports = {
  MESES, etiquetaPeriodo, fechaCorta, soloFecha, inicioDiaUTC, etiquetaEmpleado,
  validarPeriodo, idValido, fechaValida, validarConceptos, validarAnticipo,
  calcularPlanilla, lineasAsientoPlanilla, filaPlanilla, resumirPlanillas,
};
