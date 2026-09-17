const prisma = require('../../../config/prisma');

async function listar({ unidadId, estado, anio, mes } = {}) {
  const where = {};
  if (unidadId) where.unidadId = Number(unidadId);
  if (estado) where.estado = String(estado).toUpperCase();
  if (anio || mes) {
    where.periodo = {};
    if (anio) where.periodo.anio = Number(anio);
    if (mes) where.periodo.mes = Number(mes);
  }
  return prisma.expensa.findMany({
    where,
    include: {
      unidad: { select: { codigo: true, tipo: true } },
      periodo: { select: { anio: true, mes: true } },
    },
    orderBy: [{ periodoId: 'desc' }, { unidadId: 'asc' }],
  });
}

async function resumen() {
  const porEstado = await prisma.expensa.groupBy({
    by: ['estado'],
    _count: { _all: true },
    _sum: { monto: true, saldoPendiente: true },
  });
  const totales = await prisma.expensa.aggregate({ _count: { _all: true }, _sum: { monto: true, saldoPendiente: true } });
  return {
    totalExpensas: totales._count._all,
    montoEmitido: totales._sum.monto,
    saldoPorCobrar: totales._sum.saldoPendiente,
    porEstado: porEstado.map((e) => ({
      estado: e.estado,
      cantidad: e._count._all,
      monto: e._sum.monto,
      saldoPendiente: e._sum.saldoPendiente,
    })),
  };
}

async function obtenerPorId(id) {
  return prisma.expensa.findUnique({
    where: { id },
    include: {
      unidad: true,
      periodo: true,
      detalles: { include: { pago: { select: { id: true, fecha: true, metodo: true, referencia: true, monto: true } } } },
    },
  });
}

module.exports = { listar, resumen, obtenerPorId };
