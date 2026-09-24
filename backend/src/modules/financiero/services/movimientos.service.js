// Libro de caja y bancos: todo ingreso/egreso de dinero pasa por aquí (una sola función).
const { Prisma } = require('@prisma/client');
const { HttpError } = require('../../../shared/errors');

const D = (v) => new Prisma.Decimal(typeof v === 'number' ? v.toFixed(2) : String(v));

/**
 * Registra un movimiento en una cuenta de caja/banco y actualiza su saldo.
 * Debe llamarse dentro de una transacción (tx) y con la fila de la cuenta bloqueada.
 */
async function registrarMovimiento(tx, { cuentaId, tipo, monto, origenTipo, descripcion, usuarioId, fecha }) {
  const cuenta = await tx.cuenta.findUnique({ where: { id: cuentaId }, include: { cuentaContable: true } });
  if (!cuenta) throw new HttpError(404, `Cuenta ${cuentaId} no encontrada`);
  if (!cuenta.activa) throw new HttpError(422, `La cuenta ${cuenta.nombre} está inactiva`);

  const montoD = D(monto);
  const saldoResultante = tipo === 'INGRESO' ? cuenta.saldoActual.plus(montoD) : cuenta.saldoActual.minus(montoD);
  if (saldoResultante.isNegative()) {
    throw new HttpError(422, `Saldo insuficiente en ${cuenta.nombre}: disponible Bs ${cuenta.saldoActual.toFixed(2)}, requerido Bs ${montoD.toFixed(2)}`);
  }

  const movimiento = await tx.movimiento.create({
    data: { cuentaId, tipo, monto: montoD, saldoResultante, origenTipo, descripcion, usuarioId, ...(fecha && { fecha }) },
  });
  await tx.cuenta.update({ where: { id: cuentaId }, data: { saldoActual: saldoResultante } });
  return { movimiento, cuenta };
}

/** Bloquea la fila de la cuenta para evitar dos cobros concurrentes sobre el mismo saldo (Riesgo 1). */
async function bloquearCuenta(tx, cuentaId) {
  await tx.$queryRaw`SELECT id FROM "cuenta" WHERE id = ${cuentaId} FOR UPDATE`;
}

module.exports = { registrarMovimiento, bloquearCuenta, D };
