// Reglas puras del registro de pagos de expensas (req. 2). Sin acceso a BD → testeables.
const { HttpError } = require('../../../shared/errors');
const { aCentavos, deCentavos } = require('./expensas.utils');
const { CUENTAS } = require('./contabilidad.utils');

const METODOS = ['EFECTIVO', 'TRANSFERENCIA', 'QR'];

function validarDatosPago(datos = {}) {
  const unidadId = Number(datos.unidadId);
  if (!Number.isInteger(unidadId) || unidadId <= 0) throw new HttpError(400, 'unidadId es obligatorio');
  const cuentaId = Number(datos.cuentaId);
  if (!Number.isInteger(cuentaId) || cuentaId <= 0) throw new HttpError(400, 'cuentaId (caja o banco) es obligatorio');
  const monto = Number(datos.monto);
  if (!Number.isFinite(monto) || monto <= 0) throw new HttpError(400, 'monto debe ser mayor a cero');
  const metodo = String(datos.metodo || '').toUpperCase();
  if (!METODOS.includes(metodo)) throw new HttpError(400, `metodo inválido: use ${METODOS.join(' | ')}`);
  if (metodo !== 'EFECTIVO' && !datos.referencia) throw new HttpError(400, 'referencia es obligatoria para transferencias y QR');

  let expensaIds;
  if (datos.expensaIds !== undefined) {
    if (!Array.isArray(datos.expensaIds) || datos.expensaIds.some((id) => !Number.isInteger(Number(id)) || Number(id) <= 0)) {
      throw new HttpError(400, 'expensaIds debe ser una lista de ids enteros');
    }
    expensaIds = datos.expensaIds.map(Number);
  }
  const fecha = datos.fecha ? new Date(datos.fecha) : new Date();
  if (Number.isNaN(fecha.getTime())) throw new HttpError(400, 'fecha inválida');

  return {
    unidadId,
    cuentaId,
    monto: deCentavos(aCentavos(monto)),
    metodo,
    referencia: datos.referencia ? String(datos.referencia).trim() : null,
    copropietarioId: datos.copropietarioId ? Number(datos.copropietarioId) : null,
    expensaIds,
    cobrarMora: Boolean(datos.cobrarMora),
    observacion: datos.observacion ? String(datos.observacion).trim() : null,
    fecha,
  };
}

/**
 * Distribuye un pago entre expensas pendientes, de la más antigua a la más reciente.
 * Por cada expensa cobra primero la mora (si se pide) y luego el capital. Lo que sobra es anticipo.
 *
 * @param monto        número (Bs)
 * @param expensas     [{ id, saldoPendiente, mora }] ya ordenadas por antigüedad
 * @returns { aplicaciones: [{ expensaId, mora, capital }], sobrante, totalMora, totalCapital }
 */
function aplicarPagoAExpensas(monto, expensas, { moraPrimero = true } = {}) {
  let restante = aCentavos(monto);
  if (restante <= 0) throw new HttpError(400, 'El monto del pago debe ser mayor a cero');

  const aplicaciones = [];
  let totalMora = 0;
  let totalCapital = 0;

  for (const e of expensas) {
    if (restante === 0) break;
    const saldoCent = aCentavos(String(e.saldoPendiente ?? 0));
    const moraCent = aCentavos(String(e.mora ?? 0));
    if (saldoCent <= 0 && moraCent <= 0) continue;

    let mora = 0;
    let capital = 0;
    if (moraPrimero && moraCent > 0) {
      mora = Math.min(moraCent, restante);
      restante -= mora;
    }
    if (restante > 0 && saldoCent > 0) {
      capital = Math.min(saldoCent, restante);
      restante -= capital;
    }
    if (!moraPrimero && restante > 0 && moraCent > 0) {
      mora = Math.min(moraCent, restante);
      restante -= mora;
    }
    if (mora > 0 || capital > 0) {
      aplicaciones.push({ expensaId: e.id, mora: deCentavos(mora), capital: deCentavos(capital) });
      totalMora += mora;
      totalCapital += capital;
    }
  }

  return { aplicaciones, sobrante: deCentavos(restante), totalMora: deCentavos(totalMora), totalCapital: deCentavos(totalCapital) };
}

/** Líneas del asiento de un pago: Debe caja/banco · Haber cuentas por cobrar, ingresos por mora y anticipos. */
function lineasAsientoPago({ cuentaOperativa, totalCapital, totalMora, sobrante, codigoUnidad }) {
  const total = deCentavos(aCentavos(totalCapital) + aCentavos(totalMora) + aCentavos(sobrante));
  return [
    { cuenta: cuentaOperativa, debe: total, descripcion: `Cobro expensas ${codigoUnidad}` },
    { cuenta: CUENTAS.CUENTAS_POR_COBRAR, haber: totalCapital, descripcion: 'Aplicación a expensas' },
    { cuenta: CUENTAS.INGRESOS_MORA, haber: totalMora, descripcion: 'Intereses por mora cobrados' },
    { cuenta: CUENTAS.ANTICIPOS_COPROPIETARIOS, haber: sobrante, descripcion: 'Pago anticipado (saldo a favor)' },
  ];
}

/** Nuevo estado de una expensa tras aplicar un pago de capital. */
function estadoTrasPago({ monto, saldoAnterior, capitalAplicado, estadoActual }) {
  const nuevoSaldo = aCentavos(String(saldoAnterior)) - aCentavos(capitalAplicado);
  if (nuevoSaldo < 0) throw new HttpError(422, 'El capital aplicado supera el saldo de la expensa');
  if (nuevoSaldo === 0) return { saldo: 0, estado: 'PAGADA' };
  if (nuevoSaldo < aCentavos(String(monto))) return { saldo: deCentavos(nuevoSaldo), estado: 'PARCIAL' };
  return { saldo: deCentavos(nuevoSaldo), estado: estadoActual };
}

module.exports = { METODOS, validarDatosPago, aplicarPagoAExpensas, lineasAsientoPago, estadoTrasPago };
