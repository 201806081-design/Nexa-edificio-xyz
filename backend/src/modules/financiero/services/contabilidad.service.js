// Plan de cuentas, libro diario y balance de comprobación (req. 4 y 5)
const { Prisma } = require('@prisma/client');
const prisma = require('../../../config/prisma');
const { HttpError } = require('../../../shared/errors');
const { construirAsiento, saldoPorNaturaleza } = require('../utils/contabilidad.utils');

const D = (v) => new Prisma.Decimal(typeof v === 'number' ? v.toFixed(2) : String(v));

/**
 * Persiste un asiento ya validado por construirAsiento(). Se ejecuta dentro de la misma
 * transacción que la operación que lo origina: si algo falla, no queda asiento sin pago ni pago sin asiento.
 */
async function registrarAsiento(tx, asiento, usuarioId = null) {
  const codigos = [...new Set(asiento.lineas.map((l) => l.cuenta))];
  const cuentas = await tx.cuentaContable.findMany({ where: { codigo: { in: codigos } } });
  const porCodigo = new Map(cuentas.map((c) => [c.codigo, c]));
  for (const codigo of codigos) {
    const c = porCodigo.get(codigo);
    if (!c) throw new HttpError(422, `La cuenta contable ${codigo} no existe en el plan de cuentas`);
    if (!c.imputable || !c.activa) throw new HttpError(422, `La cuenta contable ${codigo} · ${c.nombre} no admite movimientos`);
  }

  return tx.asiento.create({
    data: {
      fecha: asiento.fecha,
      glosa: asiento.glosa,
      origenTipo: asiento.origenTipo,
      origenId: asiento.origenId,
      totalDebe: D(asiento.totalDebe),
      totalHaber: D(asiento.totalHaber),
      usuarioId,
      detalles: {
        create: asiento.lineas.map((l) => ({
          cuentaContableId: porCodigo.get(l.cuenta).id,
          debe: D(l.debe),
          haber: D(l.haber),
          descripcion: l.descripcion,
        })),
      },
    },
    include: { detalles: { include: { cuentaContable: { select: { codigo: true, nombre: true } } } } },
  });
}

/** Atajo: valida y registra en un solo paso. */
async function asentar(tx, datosAsiento, usuarioId) {
  return registrarAsiento(tx, construirAsiento(datosAsiento), usuarioId);
}

async function planCuentas({ soloImputables = false } = {}) {
  return prisma.cuentaContable.findMany({
    where: soloImputables ? { imputable: true, activa: true } : {},
    orderBy: { codigo: 'asc' },
    select: { id: true, codigo: true, nombre: true, tipo: true, naturaleza: true, nivel: true, imputable: true, activa: true, padreId: true },
  });
}

function rangoFechas(desde, hasta) {
  const where = {};
  if (desde) where.gte = new Date(desde);
  if (hasta) where.lte = new Date(hasta);
  return Object.keys(where).length ? where : undefined;
}

async function listarAsientos({ desde, hasta, origenTipo, limite = 50 } = {}) {
  return prisma.asiento.findMany({
    where: {
      ...(rangoFechas(desde, hasta) && { fecha: rangoFechas(desde, hasta) }),
      ...(origenTipo && { origenTipo: String(origenTipo).toUpperCase() }),
    },
    include: { detalles: { include: { cuentaContable: { select: { codigo: true, nombre: true } } }, orderBy: { id: 'asc' } } },
    orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
    take: Math.min(Number(limite) || 50, 500),
  });
}

async function asientoPorId(id) {
  return prisma.asiento.findUnique({
    where: { id },
    include: {
      detalles: { include: { cuentaContable: { select: { codigo: true, nombre: true, tipo: true } } }, orderBy: { id: 'asc' } },
      usuario: { select: { username: true, nombre: true } },
    },
  });
}

/** Balance de comprobación: suma de debe y haber por cuenta, con saldo según naturaleza. */
async function balanceComprobacion({ desde, hasta } = {}) {
  const rango = rangoFechas(desde, hasta);
  const sumas = await prisma.asientoDetalle.groupBy({
    by: ['cuentaContableId'],
    where: { asiento: { estado: 'REGISTRADO', ...(rango && { fecha: rango }) } },
    _sum: { debe: true, haber: true },
  });
  const cuentas = await prisma.cuentaContable.findMany({ where: { id: { in: sumas.map((s) => s.cuentaContableId) } } });
  const porId = new Map(cuentas.map((c) => [c.id, c]));

  let totalDebe = 0;
  let totalHaber = 0;
  const filas = sumas
    .map((s) => {
      const c = porId.get(s.cuentaContableId);
      const debe = Number(s._sum.debe ?? 0);
      const haber = Number(s._sum.haber ?? 0);
      totalDebe += Math.round(debe * 100);
      totalHaber += Math.round(haber * 100);
      return { codigo: c.codigo, nombre: c.nombre, tipo: c.tipo, naturaleza: c.naturaleza, debe, haber, saldo: saldoPorNaturaleza({ naturaleza: c.naturaleza, debe, haber }) };
    })
    .sort((a, b) => a.codigo.localeCompare(b.codigo));

  return {
    periodo: { desde: desde ?? null, hasta: hasta ?? null },
    cuentas: filas,
    totales: { debe: totalDebe / 100, haber: totalHaber / 100, cuadra: totalDebe === totalHaber },
  };
}

module.exports = { registrarAsiento, asentar, planCuentas, listarAsientos, asientoPorId, balanceComprobacion };
