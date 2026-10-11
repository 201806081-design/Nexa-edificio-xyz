// Expensas: lectura con estado real (vencimiento por fecha) y mora estimada por fila (HU-FI-01 / US2.1).
const prisma = require('../../../config/prisma');
const { configMoraVigente } = require('./configuracion.service');
const {
  inicioDiaUTC, estadosDesdeFiltro, enriquecerExpensa, resumirExpensas,
} = require('../utils/expensasVista.utils');

const INCLUDE_VISTA = {
  unidad: { select: { id: true, codigo: true, tipo: true, piso: true } },
  periodo: { select: { id: true, anio: true, mes: true, estado: true } },
};

/**
 * Marca como VENCIDA toda expensa con saldo cuya fecha de vencimiento ya pasó.
 * Es idempotente y barata (un UPDATE con WHERE); se ejecuta antes de cada lectura
 * y puede invocarse a mano con POST /expensas/sincronizar.
 */
async function sincronizarEstados({ hoy = new Date(), db = prisma } = {}) {
  const corte = inicioDiaUTC(hoy);
  const r = await db.expensa.updateMany({
    where: { estado: { in: ['PENDIENTE', 'PARCIAL'] }, saldoPendiente: { gt: 0 }, fechaVencimiento: { lt: corte } },
    data: { estado: 'VENCIDA' },
  });
  return { actualizadas: r.count, fecha: corte.toISOString().slice(0, 10) };
}

function armarWhere({ unidadId, estado, anio, mes, periodoId } = {}) {
  const where = {};
  if (unidadId) where.unidadId = Number(unidadId);
  if (periodoId) where.periodoId = Number(periodoId);
  const estados = estadosDesdeFiltro(estado);
  if (estados) where.estado = { in: estados };
  if (anio || mes) {
    where.periodo = {};
    if (anio) where.periodo.anio = Number(anio);
    if (mes) where.periodo.mes = Number(mes);
  }
  return where;
}

/** Listado para la pantalla "Expensas": filas enriquecidas + resumen del filtro aplicado. */
async function listar(filtros = {}, { hoy = new Date() } = {}) {
  await sincronizarEstados({ hoy });
  const [filas, configMora] = await Promise.all([
    prisma.expensa.findMany({
      where: armarWhere(filtros),
      include: INCLUDE_VISTA,
      orderBy: [{ periodoId: 'desc' }, { unidadId: 'asc' }],
    }),
    configMoraVigente(hoy),
  ]);
  const data = filas.map((e) => enriquecerExpensa(e, { configMora, hoy }));
  return { data, resumen: resumirExpensas(data) };
}

/** Tarjetas superiores (totalGenerado, pendiente, pagado, vencido) de un período o de todo. */
async function resumen({ anio, mes, periodoId } = {}, { hoy = new Date() } = {}) {
  await sincronizarEstados({ hoy });
  const [filas, configMora] = await Promise.all([
    prisma.expensa.findMany({ where: armarWhere({ anio, mes, periodoId }), include: INCLUDE_VISTA }),
    configMoraVigente(hoy),
  ]);
  const enriquecidas = filas.map((e) => enriquecerExpensa(e, { configMora, hoy }));
  const r = resumirExpensas(enriquecidas);
  return {
    ...r,
    // compatibilidad con la respuesta anterior
    totalExpensas: r.cantidad,
    montoEmitido: r.totalGenerado,
    saldoPorCobrar: r.pendiente,
    porEstado: [
      { estado: 'PENDIENTE', cantidad: r.porEstado.pendientes },
      { estado: 'PARCIAL', cantidad: r.porEstado.parciales },
      { estado: 'PAGADA', cantidad: r.porEstado.pagadas },
      { estado: 'VENCIDA', cantidad: r.porEstado.vencidas },
    ],
  };
}

async function obtenerPorId(id, { hoy = new Date() } = {}) {
  const e = await prisma.expensa.findUnique({
    where: { id },
    include: {
      unidad: true,
      periodo: true,
      detalles: { include: { pago: { select: { id: true, fecha: true, metodo: true, referencia: true, monto: true } } } },
    },
  });
  if (!e) return null;
  const configMora = await configMoraVigente(hoy);
  const vista = enriquecerExpensa(e, { configMora, hoy });
  // conservar los objetos completos de unidad y periodo en el detalle
  return { ...vista, unidad: e.unidad, periodoDetalle: e.periodo };
}

module.exports = { listar, resumen, obtenerPorId, sincronizarEstados };
