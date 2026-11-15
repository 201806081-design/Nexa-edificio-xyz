// Asiento de apertura: registra en la contabilidad los saldos iniciales de caja y bancos (una sola vez).
// Sin él, el balance general (reporte 8.1) muestra solo la variación de efectivo y no el efectivo real.
const prisma = require('../../../config/prisma');
const { HttpError } = require('../../../shared/errors');
const { asentar } = require('./contabilidad.service');
const { CUENTAS, codigoCuentaOperativa } = require('../utils/contabilidad.utils');
const { lineasApertura } = require('../utils/reportes.utils');

const GLOSA = 'Asiento de apertura: saldos iniciales de caja y bancos';
const MS_DIA = 86400000;

function buscar(db) {
  return db.asiento.findFirst({ where: { origenTipo: 'MANUAL', glosa: { startsWith: 'Asiento de apertura' } } });
}

async function cuentasConCodigo(db) {
  const cuentas = await db.cuenta.findMany({ include: { cuentaContable: true }, orderBy: { id: 'asc' } });
  return cuentas.map((c) => ({ id: c.id, nombre: c.nombre, tipo: c.tipo, codigo: codigoCuentaOperativa(c), saldoInicial: Number(c.saldoInicial) }));
}

/** ¿Ya está registrada la apertura? Con los saldos iniciales que cubriría. */
async function estado() {
  const [asiento, cuentas] = await Promise.all([buscar(prisma), cuentasConCodigo(prisma)]);
  const { total } = lineasApertura(cuentas, CUENTAS.FONDO_COMUN);
  return {
    registrada: Boolean(asiento),
    asientoId: asiento?.id ?? null,
    fecha: asiento ? new Date(asiento.fecha).toISOString().slice(0, 10) : null,
    totalSaldosIniciales: total,
    cuentas: cuentas.map((c) => ({ cuenta: c.nombre, cuentaContable: c.codigo, saldoInicial: c.saldoInicial })),
  };
}

/** Crea el asiento de apertura con fecha del día anterior al primer asiento. 409 si ya existe. */
async function registrar(usuarioId = null) {
  return prisma.$transaction(async (tx) => {
    const existente = await buscar(tx);
    if (existente) throw new HttpError(409, `El asiento de apertura ya existe (asiento ${existente.id})`);
    const cuentas = await cuentasConCodigo(tx);
    const { lineas, total } = lineasApertura(cuentas, CUENTAS.FONDO_COMUN);
    if (total <= 0) throw new HttpError(422, 'No hay saldos iniciales de caja o bancos que registrar');
    const primero = await tx.asiento.findFirst({ orderBy: { fecha: 'asc' }, select: { fecha: true } });
    const base = primero ? new Date(primero.fecha) : new Date();
    const fecha = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()) - (primero ? MS_DIA : 0));
    const asiento = await asentar(tx, { fecha, glosa: GLOSA, origenTipo: 'MANUAL', lineas }, usuarioId);
    return { asientoId: asiento.id, fecha: fecha.toISOString().slice(0, 10), total, lineas };
  });
}

module.exports = { estado, registrar };
