// Cálculo puro de indicadores del dashboard y lista de morosos (req. 5: control de morosidad).
// Sin acceso a BD: recibe filas ya consultadas y devuelve el JSON que consume el frontend.
const { calcularMora, aCentavos, deCentavos } = require('./expensas.utils');

const MS_DIA = 86_400_000;
const CONFIG_MORA_DEFAULT = { tasaMensual: 0, diasGracia: 0, metodo: 'SIMPLE' };

/** Medianoche UTC del día indicado (las fechas @db.Date llegan de Prisma como medianoche UTC). */
function inicioDiaUTC(fecha = new Date()) {
  const d = new Date(fecha);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Primer día del mes de `fecha` y primer día del mes siguiente, en UTC (rango [inicio, fin)). */
function rangoMes(fecha = new Date()) {
  const d = new Date(fecha);
  return {
    inicioMes: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)),
    finMes: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)),
  };
}

/** 'YYYY-MM-DD' a partir de Date o string. */
function soloFecha(fecha) {
  return fecha ? new Date(fecha).toISOString().slice(0, 10) : null;
}

/** Días transcurridos desde la fecha de vencimiento hasta hoy (0 si aún no vence). Sin días de gracia. */
function diasVencida(fechaVencimiento, hoy = new Date()) {
  const dias = Math.floor((inicioDiaUTC(hoy) - inicioDiaUTC(fechaVencimiento)) / MS_DIA);
  return Math.max(0, dias);
}

/** Copropietario responsable de pago de la unidad: el marcado como responsable o, si no hay, el primero vigente. */
function responsableDe(ocupaciones = []) {
  const oc = ocupaciones.find((o) => o.esResponsablePago) || ocupaciones[0];
  const c = oc?.copropietario;
  if (!c) return null;
  return {
    id: c.id,
    nombre: `${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim(),
    telefono: c.telefono ?? null,
    email: c.email ?? null,
  };
}

/**
 * Agrupa por unidad las expensas con saldo pendiente y vencidas, y estima la mora a la fecha.
 * Una unidad es morosa si tiene al menos una expensa con saldo > 0 y `diasVencida >= minDias`.
 *
 * @param expensas  [{ id, saldoPendiente, moraAcumulada, fechaVencimiento, estado,
 *                     periodo:{anio,mes}, unidad:{ id, codigo, tipo, piso, ocupaciones:[{ esResponsablePago, copropietario }] } }]
 * @param configMora { tasaMensual, diasGracia, metodo } (null → mora 0)
 * @param hoy Date
 * @param minDias número mínimo de días vencida para contar (default 1)
 */
function agruparMorosos({ expensas = [], configMora = CONFIG_MORA_DEFAULT, hoy = new Date(), minDias = 1 } = {}) {
  const cfg = configMora || CONFIG_MORA_DEFAULT;
  const porUnidad = new Map();

  for (const e of expensas) {
    const saldoCent = aCentavos(String(e.saldoPendiente ?? 0));
    if (saldoCent <= 0) continue;

    const dias = diasVencida(e.fechaVencimiento, hoy);
    if (dias < minDias) continue;

    const { mora } = calcularMora({
      saldoPendiente: deCentavos(saldoCent),
      tasaMensual: Number(cfg.tasaMensual ?? 0),
      diasGracia: Number(cfg.diasGracia ?? 0),
      metodo: cfg.metodo || 'SIMPLE',
      fechaVencimiento: e.fechaVencimiento,
      fechaCalculo: hoy,
    });
    const moraCent = aCentavos(mora);

    const u = e.unidad || { id: e.unidadId };
    let item = porUnidad.get(u.id);
    if (!item) {
      item = {
        unidad: { id: u.id, codigo: u.codigo ?? null, tipo: u.tipo ?? null, piso: u.piso ?? null },
        responsable: responsableDe(u.ocupaciones),
        expensasVencidas: 0,
        diasMoraMax: 0,
        capitalCent: 0,
        moraCent: 0,
        expensas: [],
      };
      porUnidad.set(u.id, item);
    }

    item.expensasVencidas += 1;
    item.diasMoraMax = Math.max(item.diasMoraMax, dias);
    item.capitalCent += saldoCent;
    item.moraCent += moraCent;
    item.expensas.push({
      id: e.id,
      periodo: e.periodo ? `${e.periodo.anio}-${String(e.periodo.mes).padStart(2, '0')}` : null,
      fechaVencimiento: soloFecha(e.fechaVencimiento),
      diasVencida: dias,
      saldoPendiente: deCentavos(saldoCent),
      moraEstimada: deCentavos(moraCent),
      moraCobrada: deCentavos(aCentavos(String(e.moraAcumulada ?? 0))),
      estado: e.estado,
    });
  }

  let totalCent = 0;
  const items = [...porUnidad.values()]
    .map(({ capitalCent, moraCent, ...i }) => {
      totalCent += capitalCent + moraCent;
      return { ...i, capital: deCentavos(capitalCent), mora: deCentavos(moraCent), saldoTotal: deCentavos(capitalCent + moraCent) };
    })
    .sort((a, b) => b.saldoTotal - a.saldoTotal || b.diasMoraMax - a.diasMoraMax);

  return { cantidad: items.length, montoTotal: deCentavos(totalCent), items };
}

/** Saldos de caja y bancos a partir de las cuentas activas [{ id, nombre, tipo, saldoActual }]. */
function resumirCuentas(cuentas = []) {
  let caja = 0;
  let bancos = 0;
  const detalle = cuentas.map((c) => {
    const saldo = aCentavos(String(c.saldoActual ?? 0));
    if (c.tipo === 'CAJA') caja += saldo; else bancos += saldo;
    return { id: c.id, nombre: c.nombre, tipo: c.tipo, saldoActual: deCentavos(saldo) };
  });
  return { caja: deCentavos(caja), bancos: deCentavos(bancos), total: deCentavos(caja + bancos), detalle };
}

/** Ingresos y egresos del período a partir de totales por tipo de movimiento [{ tipo, total }]. */
function resumirMovimientos(grupos = []) {
  let ingresos = 0;
  let egresos = 0;
  for (const g of grupos) {
    const c = aCentavos(String(g.total ?? 0));
    if (g.tipo === 'INGRESO') ingresos += c;
    else if (g.tipo === 'EGRESO') egresos += c;
  }
  return { ingresos: deCentavos(ingresos), egresos: deCentavos(egresos), resultado: deCentavos(ingresos - egresos) };
}

/** Conteo de expensas por estado a partir de [{ estado, cantidad }]. */
function contarExpensasPorEstado(grupos = []) {
  const r = { total: 0, pagadas: 0, parciales: 0, pendientes: 0, vencidas: 0 };
  const clave = { PAGADA: 'pagadas', PARCIAL: 'parciales', PENDIENTE: 'pendientes', VENCIDA: 'vencidas' };
  for (const g of grupos) {
    const n = Number(g.cantidad) || 0;
    r.total += n;
    if (clave[g.estado]) r[clave[g.estado]] += n;
  }
  return r;
}

// ---------------------------------------------------------------------------
// Forma "Finanzas" que consume el frontend (frontend/src/constants/finanzasMock.js)
// ---------------------------------------------------------------------------

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_ABREV = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const COLORES_ESTADO = { Pagadas: '#2E9D78', Pendientes: '#E8A33D', Vencidas: '#D64545' };

/** 'Octubre 2026' a partir de (anio, mes). */
function etiquetaPeriodo(anio, mes) {
  return `${MESES[mes - 1]} ${anio}`;
}

/** 'Oct' a partir del número de mes (1-12). */
function mesAbrev(mes) {
  return MESES_ABREV[mes - 1];
}

/** '2026-10' → { anio: 2026, mes: 10 }; null si el formato no es YYYY-MM válido. */
function parsePeriodo(texto) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(texto ?? '').trim());
  if (!m) return null;
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12) return null;
  return { anio, mes };
}

/** Los `n` meses que terminan en (anio, mes), en orden cronológico: [{ anio, mes }]. */
function ultimosMeses(anio, mes, n = 4) {
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(anio, mes - 1 - i, 1));
    out.push({ anio: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 });
  }
  return out;
}

/** 'DPTO-301' → 'Depto. 301' · 'PARQ-08' → 'Parqueo P-08' · 'BAUL-06' → 'Baulera B-06'. */
function etiquetaUnidad(unidad = {}) {
  const codigo = String(unidad.codigo ?? '');
  const num = codigo.includes('-') ? codigo.slice(codigo.indexOf('-') + 1) : codigo;
  switch (unidad.tipo) {
    case 'DEPARTAMENTO': return `Depto. ${num}`;
    case 'PARQUEO': return `Parqueo P-${num}`;
    case 'BAULERA': return `Baulera B-${num}`;
    default: return codigo || `Unidad ${unidad.id ?? ''}`.trim();
  }
}

/**
 * Serie mensual de ingresos vs. gastos para el gráfico de barras.
 * @param movimientos [{ fecha, tipo: 'INGRESO'|'EGRESO', monto }]
 * @param meses       [{ anio, mes }] en orden cronológico
 * @returns [{ mes: 'Jul', ingresos, gastos }]
 */
function serieIngresosGastos(movimientos = [], meses = []) {
  const acc = new Map(meses.map((m) => [`${m.anio}-${m.mes}`, { ingresos: 0, gastos: 0 }]));
  for (const mv of movimientos) {
    const d = new Date(mv.fecha);
    const clave = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
    const bucket = acc.get(clave);
    if (!bucket) continue;
    const c = aCentavos(String(mv.monto ?? 0));
    if (mv.tipo === 'INGRESO') bucket.ingresos += c;
    else if (mv.tipo === 'EGRESO') bucket.gastos += c;
  }
  return meses.map((m) => {
    const b = acc.get(`${m.anio}-${m.mes}`);
    return { mes: mesAbrev(m.mes), ingresos: deCentavos(b.ingresos), gastos: deCentavos(b.gastos) };
  });
}

/**
 * Clasifica las expensas de un período por su situación real a la fecha (no por el campo `estado` guardado):
 * pagadas = sin saldo · vencidas = con saldo y fecha de vencimiento anterior a hoy · pendientes = el resto.
 */
function clasificarExpensas(expensas = [], hoy = new Date()) {
  const r = { total: 0, pagadas: 0, pendientes: 0, vencidas: 0 };
  for (const e of expensas) {
    r.total += 1;
    const saldo = aCentavos(String(e.saldoPendiente ?? 0));
    if (saldo <= 0) r.pagadas += 1;
    else if (diasVencida(e.fechaVencimiento, hoy) > 0) r.vencidas += 1;
    else r.pendientes += 1;
  }
  return r;
}

/**
 * Porcentajes para el gráfico de dona. Pendientes incluye PARCIAL (tienen saldo y no vencieron).
 * Redondeo por mayor resto para que siempre sumen 100 (0 % todos si no hay expensas).
 * @param conteos salida de contarExpensasPorEstado
 * @returns [{ estado, valor, color }]
 */
function porcentajesEstadoExpensas(conteos = {}) {
  const grupos = [
    ['Pagadas', Number(conteos.pagadas) || 0],
    ['Pendientes', (Number(conteos.pendientes) || 0) + (Number(conteos.parciales) || 0)],
    ['Vencidas', Number(conteos.vencidas) || 0],
  ];
  const total = grupos.reduce((a, [, n]) => a + n, 0);
  if (total === 0) return grupos.map(([estado]) => ({ estado, valor: 0, color: COLORES_ESTADO[estado] }));

  const exactos = grupos.map(([, n]) => (n * 100) / total);
  const base = exactos.map(Math.floor);
  let faltan = 100 - base.reduce((a, b) => a + b, 0);
  const orden = exactos.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]);
  for (const [, i] of orden) { if (faltan <= 0) break; base[i] += 1; faltan -= 1; }

  return grupos.map(([estado], i) => ({ estado, valor: base[i], color: COLORES_ESTADO[estado] }));
}

/** Tabla "Departamentos con mora" a partir de agruparMorosos().items → [{ id, departamento, estado, monto }]. */
function tablaDepartamentosMora(items = []) {
  return items.map((i) => ({
    id: i.unidad.id,
    departamento: etiquetaUnidad(i.unidad),
    estado: 'Vencida',
    monto: i.saldoTotal,
    diasMora: i.diasMoraMax,
    responsable: i.responsable?.nombre ?? null,
  }));
}

/** "Últimos movimientos" → [{ id, tipo: 'ingreso'|'egreso', monto, descripcion, fecha: 'YYYY-MM-DD' }]. */
function tablaMovimientos(movimientos = []) {
  const desc = { PAGO: 'Cobro de expensas', INGRESO: 'Ingreso', EGRESO: 'Egreso', NOMINA: 'Pago de planilla', AJUSTE: 'Ajuste' };
  return movimientos.map((m) => ({
    id: m.id,
    tipo: m.tipo === 'INGRESO' ? 'ingreso' : 'egreso',
    monto: deCentavos(aCentavos(String(m.monto ?? 0))),
    descripcion: m.descripcion || desc[m.origenTipo] || 'Movimiento',
    fecha: soloFecha(m.fecha),
  }));
}

/** KPIs del período: ingresos, gastos, balance y saldo pendiente por cobrar. */
function resumenFinanzas({ ingresos = 0, gastos = 0, saldoPendiente = 0 } = {}) {
  const i = aCentavos(String(ingresos));
  const g = aCentavos(String(gastos));
  return { ingresos: deCentavos(i), gastos: deCentavos(g), balance: deCentavos(i - g), saldoPendiente: deCentavos(aCentavos(String(saldoPendiente))) };
}

module.exports = {
  clasificarExpensas,
  etiquetaPeriodo,
  mesAbrev,
  parsePeriodo,
  ultimosMeses,
  etiquetaUnidad,
  serieIngresosGastos,
  porcentajesEstadoExpensas,
  tablaDepartamentosMora,
  tablaMovimientos,
  resumenFinanzas,
  inicioDiaUTC,
  rangoMes,
  soloFecha,
  diasVencida,
  responsableDe,
  agruparMorosos,
  resumirCuentas,
  resumirMovimientos,
  contarExpensasPorEstado,
};
