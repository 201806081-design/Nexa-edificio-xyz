// =====================================================================
//  Presentación del motor de expensas para el frontend (funciones puras).
//  Convierte filas de BD en la forma que usan las pantallas de Finanzas
//  (expensasMock, moraMock, CONFIG_INTERES) y valida la configuración de mora.
// =====================================================================
const { HttpError } = require('../../../shared/errors');
const { aCentavos, deCentavos, calcularMora, determinarEstadoExpensa } = require('./expensas.utils');

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const ESTADO_UI = { PENDIENTE: 'Pendiente', PARCIAL: 'Parcial', PAGADA: 'Pagado', VENCIDA: 'Vencido' };
const FILTRO_UI = { PENDIENTE: ['PENDIENTE', 'PARCIAL'], PARCIAL: ['PARCIAL'], PAGADO: ['PAGADA'], PAGADA: ['PAGADA'], VENCIDO: ['VENCIDA'], VENCIDA: ['VENCIDA'], TODOS: null };
const TIPO_INTERES = 'Porcentaje mensual';

const cent = (v) => aCentavos(String(v ?? 0));

/** 'Octubre 2026' */
function etiquetaPeriodo(anio, mes) { return `${MESES[mes - 1]} ${anio}`; }

/** 'DEP-301' → 'Depto. 301' · 'PARQ-08' → 'Parqueo P-08' · 'BAUL-06' → 'Baulera B-06' */
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

/** 'YYYY-MM-DD' en UTC */
function soloFecha(d) { return d ? new Date(d).toISOString().slice(0, 10) : null; }

/** 'DD/MM/YYYY' como lo muestran las pantallas */
function fechaCorta(d) {
  if (!d) return null;
  const x = new Date(d);
  return `${String(x.getUTCDate()).padStart(2, '0')}/${String(x.getUTCMonth() + 1).padStart(2, '0')}/${x.getUTCFullYear()}`;
}

/** Inicio del día (UTC) de una fecha: para comparar con columnas @db.Date. */
function inicioDiaUTC(d = new Date()) {
  const x = new Date(d);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
}

/** Traduce el filtro de estado que manda la pantalla ('Pendiente', 'Pagado', 'Vencido', 'Todos' o el código) a códigos de BD. */
function estadosDesdeFiltro(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  const clave = String(valor).trim().toUpperCase();
  if (!(clave in FILTRO_UI)) throw new HttpError(400, 'estado inválido: use Pendiente | Parcial | Pagado | Vencido | Todos');
  return FILTRO_UI[clave];
}

/** Estado real de una expensa a la fecha (por saldo y vencimiento), sin fiarse del campo guardado. */
function estadoVigente(expensa, hoy = new Date()) {
  return determinarEstadoExpensa({
    saldoPendiente: String(expensa.saldoPendiente ?? 0),
    monto: String(expensa.monto ?? 0),
    fechaVencimiento: expensa.fechaVencimiento,
    fechaCalculo: hoy,
  });
}

/**
 * Fila de expensa para las pantallas: conserva los campos de BD y agrega
 * departamento, periodo (etiqueta), estado real, estadoUI, pagado, diasAtraso, moraEstimada y totalPendiente.
 */
function enriquecerExpensa(e, { configMora = null, hoy = new Date() } = {}) {
  const estado = estadoVigente(e, hoy);
  const montoC = cent(e.monto);
  const saldoC = cent(e.saldoPendiente);
  let diasAtraso = 0;
  let mora = 0;
  if (estado === 'VENCIDA' && configMora) {
    ({ diasAtraso, mora } = calcularMora({
      saldoPendiente: deCentavos(saldoC),
      tasaMensual: Number(configMora.tasaMensual ?? 0),
      montoFijo: Number(configMora.montoFijo ?? 0),
      diasGracia: Number(configMora.diasGracia ?? 0),
      fechaVencimiento: e.fechaVencimiento,
      fechaCalculo: hoy,
      metodo: configMora.metodo || 'SIMPLE',
    }));
  }
  const tienePeriodo = e.periodo && typeof e.periodo === 'object' && e.periodo.anio;
  return {
    ...e,
    estado,
    estadoUI: ESTADO_UI[estado],
    departamento: etiquetaUnidad(e.unidad || {}),
    periodo: tienePeriodo ? etiquetaPeriodo(e.periodo.anio, e.periodo.mes) : (e.periodo ?? null),
    periodoDetalle: tienePeriodo ? { anio: e.periodo.anio, mes: e.periodo.mes } : null,
    monto: deCentavos(montoC),
    montoAgua: deCentavos(cent(e.montoAgua)),
    montoExtras: deCentavos(cent(e.montoExtras)),
    montoFijo: deCentavos(montoC - cent(e.montoAgua) - cent(e.montoExtras)),
    consumoM3: e.consumoM3 !== null && e.consumoM3 !== undefined ? Number(e.consumoM3) : null,
    extras: Array.isArray(e.extras) ? e.extras.map((x) => ({ id: x.id, descripcion: x.descripcion, monto: deCentavos(cent(x.monto)) })) : [],
    pagado: deCentavos(montoC - saldoC),
    saldo: deCentavos(saldoC),
    saldoPendiente: deCentavos(saldoC),
    moraAcumulada: deCentavos(cent(e.moraAcumulada)),
    fechaVencimiento: soloFecha(e.fechaVencimiento),
    diasAtraso,
    moraEstimada: mora,
    totalPendiente: deCentavos(saldoC + aCentavos(mora)),
  };
}

/** Tarjetas superiores de la lista de expensas. */
function resumirExpensas(filas = []) {
  const r = {
    cantidad: filas.length, totalGenerado: 0, pendiente: 0, pagado: 0, vencido: 0, interesEstimado: 0,
    porEstado: { pendientes: 0, parciales: 0, pagadas: 0, vencidas: 0 },
  };
  let tg = 0; let pe = 0; let pa = 0; let ve = 0; let ie = 0;
  for (const f of filas) {
    tg += cent(f.monto); pe += cent(f.saldo); pa += cent(f.pagado);
    if (f.estado === 'VENCIDA') { ve += cent(f.saldo); ie += cent(f.moraEstimada); r.porEstado.vencidas += 1; }
    else if (f.estado === 'PAGADA') r.porEstado.pagadas += 1;
    else if (f.estado === 'PARCIAL') r.porEstado.parciales += 1;
    else r.porEstado.pendientes += 1;
  }
  r.totalGenerado = deCentavos(tg); r.pendiente = deCentavos(pe); r.pagado = deCentavos(pa);
  r.vencido = deCentavos(ve); r.interesEstimado = deCentavos(ie);
  return r;
}

/** Tabla "Saldos vencidos" de la pantalla Mora. */
function filasSaldosVencidos(filas = []) {
  return filas.filter((f) => f.estado === 'VENCIDA').map((f) => ({
    id: f.id,
    unidadId: f.unidadId,
    departamento: f.departamento,
    periodo: f.periodo,
    fechaVencimiento: f.fechaVencimiento,
    diasAtraso: f.diasAtraso,
    capital: f.saldo,
    interes: f.moraEstimada,
    totalPendiente: f.totalPendiente,
    estado: 'Vencido',
  }));
}

/** Código legible de un anticipo: ANT-2026-10-302-0001 */
function codigoAnticipo(a) {
  const d = new Date(a.creadoEn || Date.now());
  const codigo = String(a.unidad?.codigo ?? '');
  const num = codigo.includes('-') ? codigo.slice(codigo.indexOf('-') + 1) : (codigo || a.unidadId || '');
  return `ANT-${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${num}-${String(a.id).padStart(4, '0')}`;
}

/** Fila "Pagos anticipados" de la pantalla Mora. */
function filaAnticipo(a) {
  return {
    id: a.id,
    codigo: codigoAnticipo(a),
    unidadId: a.unidadId,
    fecha: fechaCorta(a.pago?.fecha || a.creadoEn),
    departamento: etiquetaUnidad(a.unidad || {}),
    capital: deCentavos(cent(a.monto)),
    saldoAFavor: deCentavos(cent(a.saldoDisponible)),
    aplicado: deCentavos(cent(a.monto) - cent(a.saldoDisponible)),
    estado: a.estado === 'DISPONIBLE' ? 'Anticipado' : 'Aplicado',
    pagoId: a.pagoId,
  };
}

/**
 * Períodos que un saldo a favor cubriría, desde el siguiente al último emitido
 * (estimación con la expensa mensual de la unidad). Devuelve [{ periodo, monto, estado }].
 */
function proyectarAplicacionAnticipo({ saldoAFavor, expensaMensual, ultimoPeriodo, maxPeriodos = 12 }) {
  const mensualC = cent(expensaMensual);
  let restoC = cent(saldoAFavor);
  if (mensualC <= 0 || restoC <= 0 || !ultimoPeriodo) return [];
  const out = [];
  let { anio, mes } = ultimoPeriodo;
  while (restoC > 0 && out.length < maxPeriodos) {
    mes += 1; if (mes > 12) { mes = 1; anio += 1; }
    const aplica = Math.min(mensualC, restoC);
    out.push({
      periodo: etiquetaPeriodo(anio, mes),
      monto: deCentavos(aplica),
      estado: aplica === mensualC ? 'Cubierta anticipadamente' : 'Cubierta parcialmente',
    });
    restoC -= aplica;
  }
  return out;
}

const TIPO_FIJO = 'Monto fijo';

/** Próxima fecha (UTC) en que cae el día `dia` a partir de `desde`, en este mes o el siguiente. */
function proximaFecha(dia, desde = new Date()) {
  const d = new Date(desde);
  const y = d.getUTCFullYear(); const m = d.getUTCMonth();
  const esteMes = new Date(Date.UTC(y, m, Math.min(dia, 28)));
  if (esteMes >= inicioDiaUTC(d)) return esteMes;
  return new Date(Date.UTC(y, m + 1, Math.min(dia, 28)));
}

/** Configuración de mora de BD → formulario "Configurar interés" (critico 3.1). */
function configMoraAVista(c, hoy = new Date()) {
  if (!c) return null;
  const tasa = Number(c.tasaMensual ?? 0);
  const fijo = Number(c.montoFijo ?? 0);
  const esFijo = c.metodo === 'FIJO';
  const diaVenc = c.diaVencimiento ?? 10;
  const diaGen = c.diaGeneracion ?? 1;
  return {
    id: c.id,
    activo: esFijo ? fijo > 0 : tasa > 0,
    tipoInteres: esFijo ? TIPO_FIJO : TIPO_INTERES,
    porcentaje: esFijo ? null : tasa,
    montoFijo: esFijo ? fijo : null,
    diasGracia: c.diasGracia ?? 0,
    diaVencimiento: diaVenc,
    diaGeneracion: diaGen,
    metodo: c.metodo || 'SIMPLE',
    aplicarDesde: (c.diasGracia ?? 0) > 0 ? 'Periodo vencido' : 'Fecha de vencimiento',
    proximaGeneracion: soloFecha(proximaFecha(diaGen, hoy)),
    proximoVencimiento: soloFecha(proximaFecha(diaVenc, hoy)),
    descripcion: esFijo
      ? `Mora de Bs ${fijo} por expensa vencida, después de ${c.diasGracia ?? 0} días de gracia`
      : `${tasa} % mensual sobre el saldo vencido (${c.metodo === 'COMPUESTO' ? 'compuesto' : 'simple'}), después de ${c.diasGracia ?? 0} días de gracia`,
    vigenteDesde: soloFecha(c.vigenteDesde),
    vigenteHasta: soloFecha(c.vigenteHasta),
  };
}

/** Formulario "Configurar interés" → datos validados para BD (400 si algo no sirve). */
function vistaAConfigMora(datos = {}) {
  const tipo = String(datos.tipoInteres ?? (datos.montoFijo !== undefined && datos.porcentaje === undefined ? TIPO_FIJO : TIPO_INTERES));
  const esFijo = tipo.trim().toLowerCase() === TIPO_FIJO.toLowerCase();
  if (!esFijo && tipo !== TIPO_INTERES) throw new HttpError(400, `tipoInteres inválido: use "${TIPO_INTERES}" o "${TIPO_FIJO}"`);

  const activo = datos.activo === undefined ? true : Boolean(datos.activo);
  let tasa = 0; let montoFijo = null;
  if (esFijo) {
    montoFijo = activo ? Number(datos.montoFijo ?? datos.monto) : 0;
    if (!Number.isFinite(montoFijo) || montoFijo < 0 || montoFijo > 100000) throw new HttpError(400, 'montoFijo inválido (0-100000)');
    montoFijo = Math.round(montoFijo * 100) / 100;
  } else {
    tasa = activo ? Number(datos.porcentaje ?? datos.tasaMensual) : 0;
    if (!Number.isFinite(tasa) || tasa < 0 || tasa > 100) throw new HttpError(400, 'porcentaje inválido (0-100)');
    tasa = Math.round(tasa * 100) / 100;
  }

  const diasGracia = datos.diasGracia === undefined ? 0 : Number(datos.diasGracia);
  if (!Number.isInteger(diasGracia) || diasGracia < 0 || diasGracia > 30) throw new HttpError(400, 'diasGracia inválido (0-30)');

  const diaVencimiento = datos.diaVencimiento === undefined ? 10 : Number(datos.diaVencimiento);
  if (!Number.isInteger(diaVencimiento) || diaVencimiento < 1 || diaVencimiento > 28) throw new HttpError(400, 'diaVencimiento inválido (1-28)');

  const diaGeneracion = datos.diaGeneracion === undefined ? 1 : Number(datos.diaGeneracion);
  if (!Number.isInteger(diaGeneracion) || diaGeneracion < 1 || diaGeneracion > 28) throw new HttpError(400, 'diaGeneracion inválido (1-28)');

  let metodo = 'FIJO';
  if (!esFijo) {
    metodo = String(datos.metodo || 'SIMPLE').toUpperCase();
    if (!['SIMPLE', 'COMPUESTO'].includes(metodo)) throw new HttpError(400, 'metodo inválido: SIMPLE | COMPUESTO');
  }
  return { tasaMensual: tasa, montoFijo, diasGracia, diaVencimiento, diaGeneracion, metodo };
}

module.exports = {
  MESES, ESTADO_UI, TIPO_INTERES, TIPO_FIJO, proximaFecha,
  etiquetaPeriodo, etiquetaUnidad, soloFecha, fechaCorta, inicioDiaUTC,
  estadosDesdeFiltro, estadoVigente, enriquecerExpensa, resumirExpensas,
  filasSaldosVencidos, codigoAnticipo, filaAnticipo, proyectarAplicacionAnticipo,
  configMoraAVista, vistaAConfigMora,
};
