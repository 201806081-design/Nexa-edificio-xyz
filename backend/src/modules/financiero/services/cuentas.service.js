const prisma = require('../../../config/prisma');

async function listar() {
  return prisma.cuenta.findMany({
    include: { _count: { select: { movimientos: true } } },
    orderBy: { id: 'asc' },
  });
}

async function movimientos(cuentaId) {
  const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId } });
  if (!cuenta) return null;
  const lista = await prisma.movimiento.findMany({ where: { cuentaId }, orderBy: { fecha: 'desc' } });
  return { cuenta, movimientos: lista };
}

module.exports = { listar, movimientos };
