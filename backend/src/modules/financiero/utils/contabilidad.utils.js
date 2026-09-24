// Reglas puras de contabilidad (partida doble). Sin acceso a BD → testeables.
const { HttpError } = require('../../../shared/errors');
const { aCentavos, deCentavos } = require('./expensas.utils');

/** Códigos del plan de cuentas que usa el sistema. El seed los crea; los servicios los buscan por código. */
const CUENTAS = Object.freeze({
  CAJA: '1.1.01',
  BANCOS: '1.1.02',
  CUENTAS_POR_COBRAR: '1.1.03',
  MORA_POR_COBRAR: '1.1.04',
  ANTICIPOS_COPROPIETARIOS: '2.1.01',
  SUELDOS_POR_PAGAR: '2.1.02',
  FONDO_COMUN: '3.1.01',
  INGRESOS_EXPENSAS: '4.1.01',
  INGRESOS_MORA: '4.1.02',
  OTROS_INGRESOS: '4.2.09',
  OTROS_GASTOS: '5.1.09',
});

/**
 * Valida y normaliza un asiento antes de persistirlo.
 * lineas: [{ cuenta: '1.1.01', debe: 350 }, { cuenta: '4.1.01', haber: 350 }]
 * Reglas: ≥ 2 líneas; cada línea tiene debe XOR haber > 0; suma debe = suma haber (en centavos).
 */
function construirAsiento({ fecha, glosa, origenTipo, origenId = null, lineas }) {
  if (!glosa || !String(glosa).trim()) throw new HttpError(422, 'El asiento requiere una glosa');
  if (!Array.isArray(lineas) || lineas.length < 2) throw new HttpError(422, 'Un asiento requiere al menos dos líneas');

  let totalDebe = 0;
  let totalHaber = 0;
  const normalizadas = lineas
    .map((l) => {
      const debe = l.debe !== undefined && l.debe !== null ? aCentavos(l.debe) : 0;
      const haber = l.haber !== undefined && l.haber !== null ? aCentavos(l.haber) : 0;
      if (!l.cuenta) throw new HttpError(422, 'Cada línea del asiento requiere el código de cuenta');
      if (debe > 0 && haber > 0) throw new HttpError(422, `La cuenta ${l.cuenta} no puede tener debe y haber en la misma línea`);
      totalDebe += debe;
      totalHaber += haber;
      return { cuenta: String(l.cuenta), debe: deCentavos(debe), haber: deCentavos(haber), descripcion: l.descripcion ?? null };
    })
    .filter((l) => l.debe > 0 || l.haber > 0); // descarta líneas en cero (p. ej. sobrante 0)

  if (normalizadas.length < 2) throw new HttpError(422, 'Un asiento requiere al menos dos líneas con importe');
  if (totalDebe !== totalHaber) {
    throw new HttpError(422, `Asiento descuadrado: debe ${deCentavos(totalDebe)} ≠ haber ${deCentavos(totalHaber)}`);
  }
  if (totalDebe === 0) throw new HttpError(422, 'El asiento no puede ser de importe cero');

  return {
    fecha: fecha ? new Date(fecha) : new Date(),
    glosa: String(glosa).trim(),
    origenTipo,
    origenId,
    totalDebe: deCentavos(totalDebe),
    totalHaber: deCentavos(totalHaber),
    lineas: normalizadas,
  };
}

/** Saldo de una cuenta según su naturaleza: deudora = debe − haber; acreedora = haber − debe. */
function saldoPorNaturaleza({ naturaleza, debe, haber }) {
  const d = aCentavos(debe ?? 0);
  const h = aCentavos(haber ?? 0);
  return deCentavos(naturaleza === 'ACREEDORA' ? h - d : d - h);
}

/** Cuenta contable de caja o banco según el tipo de la cuenta operativa (si no tiene una asignada). */
function codigoCuentaOperativa(cuenta) {
  if (cuenta.cuentaContable?.codigo) return cuenta.cuentaContable.codigo;
  return cuenta.tipo === 'BANCO' ? CUENTAS.BANCOS : CUENTAS.CAJA;
}

module.exports = { CUENTAS, construirAsiento, saldoPorNaturaleza, codigoCuentaOperativa };
