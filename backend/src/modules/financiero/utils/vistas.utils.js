// Presentadores puros para las pantallas "Estado de cuenta" y "Ingresos y gastos" (semana 8: US2.2 / US2.3).
const { aCentavos, deCentavos } = require('./expensas.utils');
const { etiquetaPeriodo, fechaCorta, soloFecha } = require('./expensasVista.utils');

const cent = (v) => aCentavos(String(v ?? 0));

/** "María Fernández Quiroga -- Propietario" */
function etiquetaResponsable(c) {
  if (!c) return null;
  return `${c.nombres} ${c.apellidos} -- ${c.tipo === 'INQUILINO' ? 'Inquilino' : 'Propietario'}`;
}

/** Tarjetas del estado de cuenta a partir de las expensas enriquecidas (enriquecerExpensa). */
function resumirEstadoCuenta(filas = [], saldoAFavor = 0) {
  let g = 0; let p = 0; let s = 0; let i = 0; let agua = 0;
  for (const f of filas) {
    g += cent(f.monto); p += cent(f.pagado); s += cent(f.saldo); i += cent(f.moraEstimada); agua += cent(f.montoAgua);
  }
  return {
    totalGenerado: deCentavos(g),
    totalPagado: deCentavos(p),
    saldoPendiente: deCentavos(s),
    interesEstimado: deCentavos(i),
    totalConInteres: deCentavos(s + i),
    totalAgua: deCentavos(agua),
    saldoAFavor: deCentavos(cent(saldoAFavor)),
    expensas: filas.length,
    vencidas: filas.filter((f) => f.estado === 'VENCIDA').length,
  };
}

/** Fila de expensa para la tabla del estado de cuenta. */
function filaExpensaCuenta(f) {
  return {
    id: f.id,
    periodo: f.periodo,
    periodoDetalle: f.periodoDetalle,
    montoFijo: f.montoFijo ?? f.monto,
    montoAgua: f.montoAgua ?? 0,
    monto: f.monto,
    pagado: f.pagado,
    saldo: f.saldo,
    moraEstimada: f.moraEstimada,
    totalPendiente: f.totalPendiente,
    estado: f.estadoUI,
    fechaVencimiento: f.fechaVencimiento,
    diasAtraso: f.diasAtraso,
  };
}

/**
 * Historial de pagos con "saldo restante" de la expensa principal después de cada pago
 * (se recorre en orden cronológico acumulando el capital aplicado a cada expensa).
 * @param pagos    [{ id, fecha, monto, metodo, referencia, detalles: [{ expensaId, montoAplicado, aplicadoA }] }]
 * @param expensas Map expensaId → { monto, periodo: 'Octubre 2026' }
 */
function filasPagosCuenta(pagos = [], expensas = new Map()) {
  const acumulado = new Map(); // expensaId → capital aplicado acumulado (centavos)
  const orden = [...pagos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha) || a.id - b.id);
  const salida = orden.map((p) => {
    let capital = 0; let mora = 0;
    const porExpensa = new Map();
    for (const d of p.detalles || []) {
      const m = cent(d.montoAplicado);
      if (d.aplicadoA === 'MORA') mora += m; else { capital += m; porExpensa.set(d.expensaId, (porExpensa.get(d.expensaId) || 0) + m); }
    }
    let principal = null; let max = -1;
    for (const [id, m] of porExpensa) {
      acumulado.set(id, (acumulado.get(id) || 0) + m);
      if (m > max) { max = m; principal = id; }
    }
    const exp = principal !== null ? expensas.get(principal) : null;
    const saldoRestante = exp ? deCentavos(Math.max(0, cent(exp.monto) - (acumulado.get(principal) || 0))) : null;
    const montoC = cent(p.monto);
    return {
      id: p.id,
      fecha: fechaCorta(p.fecha),
      fechaISO: soloFecha(p.fecha),
      periodo: exp ? exp.periodo : (porExpensa.size === 0 ? 'Anticipo' : 'Varios'),
      periodos: [...porExpensa.keys()].map((id) => expensas.get(id)?.periodo).filter(Boolean),
      montoPagado: deCentavos(montoC),
      capital: deCentavos(capital),
      mora: deCentavos(mora),
      anticipo: deCentavos(Math.max(0, montoC - capital - mora)),
      metodo: p.metodo,
      referencia: p.referencia ?? null,
      cuenta: p.cuenta?.nombre ?? null,
      saldoRestante,
    };
  });
  return salida.reverse(); // más reciente primero
}

/** Movimiento (Ingreso/Egreso) en la forma de la pantalla "Ingresos y gastos". */
function filaMovimiento(m, origen) {
  const d = new Date(m.fecha);
  const esIngreso = origen === 'INGRESO';
  return {
    id: `${esIngreso ? 'I' : 'E'}-${m.id}`,
    idNum: m.id,
    origen,
    codigo: `MOV-${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(m.id).padStart(3, '0')}`,
    fecha: fechaCorta(m.fecha),
    fechaISO: soloFecha(m.fecha),
    tipo: esIngreso ? 'Ingreso' : 'Gasto',
    categoria: m.categoria?.nombre ?? null,
    categoriaId: m.categoriaId ?? null,
    descripcion: m.descripcion,
    monto: deCentavos(cent(m.monto)),
    comprobante: m.comprobanteUrl ?? null,
    proveedor: m.proveedor ?? null,
    nroFactura: m.nroFactura ?? null,
    cuenta: m.cuenta?.nombre ?? null,
    cuentaId: m.cuentaId ?? null,
  };
}

/** Totales operativos del periodo (sin expensas ni anticipos). */
function resumirMovimientos(filas = []) {
  let i = 0; let g = 0;
  for (const f of filas) { if (f.tipo === 'Ingreso') i += cent(f.monto); else g += cent(f.monto); }
  return { totalIngresos: deCentavos(i), totalGastos: deCentavos(g), balance: deCentavos(i - g), cantidad: filas.length };
}

/** Rango [inicio, fin) de un mes en UTC; null si no se pidió mes. */
function rangoPeriodo(anio, mes) {
  if (!anio || !mes) return null;
  const a = Number(anio); const m = Number(mes);
  return { inicio: new Date(Date.UTC(a, m - 1, 1)), fin: new Date(Date.UTC(a, m, 1)), etiqueta: etiquetaPeriodo(a, m) };
}

module.exports = { etiquetaResponsable, resumirEstadoCuenta, filaExpensaCuenta, filasPagosCuenta, filaMovimiento, resumirMovimientos, rangoPeriodo };
