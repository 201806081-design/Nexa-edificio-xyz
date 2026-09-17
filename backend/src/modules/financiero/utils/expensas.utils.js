// =====================================================================
//  Utilidades de negocio del módulo de expensas (funciones puras).
//  Los cálculos monetarios se hacen en CENTAVOS ENTEROS para evitar
//  errores de punto flotante; el resultado se redondea a 2 decimales
//  una sola vez. En la BD los montos se persisten como DECIMAL(12,2).
// =====================================================================

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function aCentavos(monto) {
  const n = Number(monto);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Monto inválido: ${monto}`);
  return Math.round(n * 100);
}

function deCentavos(centavos) {
  return centavos / 100;
}

/**
 * Días de atraso efectivos: días transcurridos desde el vencimiento
 * menos los días de gracia. Nunca negativo.
 */
function calcularDiasAtraso({ fechaVencimiento, fechaCalculo, diasGracia = 0 }) {
  const venc = new Date(fechaVencimiento);
  const calc = new Date(fechaCalculo);
  if (Number.isNaN(venc.getTime()) || Number.isNaN(calc.getTime())) {
    throw new Error('Fecha inválida');
  }
  const dias = Math.floor((calc - venc) / MS_POR_DIA) - diasGracia;
  return dias > 0 ? dias : 0;
}

/**
 * Cálculo configurable de interés por mora (req. 2 del pliego).
 *
 *  SIMPLE:    mora = saldo × (tasa/100) × (diasAtraso/30)
 *  COMPUESTO: mora = saldo × [ (1+t)^meses × (1 + t × diasResto/30) − 1 ]
 *
 * @returns {{ diasAtraso: number, mora: number }}
 */
function calcularMora({ saldoPendiente, tasaMensual, diasGracia = 0, fechaVencimiento, fechaCalculo, metodo = 'SIMPLE' }) {
  const saldoCent = aCentavos(saldoPendiente);
  const tasa = Number(tasaMensual);
  if (!Number.isFinite(tasa) || tasa < 0) throw new Error(`Tasa inválida: ${tasaMensual}`);

  const diasAtraso = calcularDiasAtraso({ fechaVencimiento, fechaCalculo, diasGracia });
  if (diasAtraso === 0 || saldoCent === 0) return { diasAtraso, mora: 0 };

  const t = tasa / 100;
  let factor;
  if (metodo === 'SIMPLE') {
    factor = (t * diasAtraso) / 30;
  } else if (metodo === 'COMPUESTO') {
    const meses = Math.floor(diasAtraso / 30);
    const diasResto = diasAtraso % 30;
    factor = Math.pow(1 + t, meses) * (1 + (t * diasResto) / 30) - 1;
  } else {
    throw new Error(`Método de mora desconocido: ${metodo}`);
  }

  const moraCent = Math.round(saldoCent * factor);
  return { diasAtraso, mora: deCentavos(moraCent) };
}

/**
 * Estado de una expensa según su saldo y la fecha.
 *  PAGADA    saldo = 0
 *  VENCIDA   saldo > 0 y ya pasó la fecha de vencimiento
 *  PARCIAL   0 < saldo < monto
 *  PENDIENTE saldo = monto, aún no vence
 */
function determinarEstadoExpensa({ saldoPendiente, monto, fechaVencimiento, fechaCalculo }) {
  const saldoCent = aCentavos(saldoPendiente);
  const montoCent = aCentavos(monto);
  if (saldoCent > montoCent) throw new Error('El saldo no puede superar el monto de la expensa');

  if (saldoCent === 0) return 'PAGADA';
  if (new Date(fechaCalculo) > new Date(fechaVencimiento)) return 'VENCIDA';
  if (saldoCent < montoCent) return 'PARCIAL';
  return 'PENDIENTE';
}

module.exports = { aCentavos, deCentavos, calcularDiasAtraso, calcularMora, determinarEstadoExpensa };
