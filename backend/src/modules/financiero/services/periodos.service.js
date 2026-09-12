// Generación automática de expensas mensuales (requisito 2 · HU-FI-01)
const { Prisma } = require('@prisma/client');
const prisma = require('../../../config/prisma');
const { HttpError } = require('../../../shared/errors');
const { configMoraVigente } = require('./configuracion.service');
const { validarDatosPeriodo, calcularFechasPeriodo, generarExpensasParaUnidades } = require('../utils/periodos.utils');

const D = (v) => new Prisma.Decimal(v);

async function listar() {
  const periodos = await prisma.periodo.findMany({
    include: { _count: { select: { expensas: true } } },
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
  });
  const sumas = await prisma.expensa.groupBy({ by: ['periodoId'], _sum: { monto: true, saldoPendiente: true } });
  const porPeriodo = new Map(sumas.map((s) => [s.periodoId, s._sum]));
  return periodos.map((p) => ({
    ...p,
    cantidadExpensas: p._count.expensas,
    totalEmitido: porPeriodo.get(p.id)?.monto ?? 0,
    saldoPendiente: porPeriodo.get(p.id)?.saldoPendiente ?? 0,
    _count: undefined,
  }));
}

/**
 * Crea el periodo del mes y genera una expensa por cada unidad activa, todo en una transacción.
 * Si el periodo ya existe responde 409 (restricción única anio+mes).
 */
async function crear(datos) {
  const cfg = validarDatosPeriodo(datos);

  const { fechaEmision } = calcularFechasPeriodo({ anio: cfg.anio, mes: cfg.mes });
  const configMora = await configMoraVigente(fechaEmision);
  const diaVencimiento = cfg.diaVencimiento ?? configMora?.diaVencimiento ?? 10;
  const { fechaVencimiento } = calcularFechasPeriodo({ anio: cfg.anio, mes: cfg.mes, diaVencimiento });

  const existente = await prisma.periodo.findUnique({ where: { anio_mes: { anio: cfg.anio, mes: cfg.mes } } });
  if (existente) throw new HttpError(409, `El periodo ${cfg.mes}/${cfg.anio} ya fue generado`);

  const unidades = await prisma.unidad.findMany({ where: { activo: true }, orderBy: { codigo: 'asc' } });
  if (unidades.length === 0) throw new HttpError(422, 'No hay unidades activas para generar expensas');

  return prisma.$transaction(async (tx) => {
    const periodo = await tx.periodo.create({
      data: {
        anio: cfg.anio,
        mes: cfg.mes,
        montoBase: D(cfg.montoBase ?? cfg.presupuestoTotal ?? 0),
        fechaEmision,
        fechaVencimiento,
      },
    });

    const { filas, totalEmitido } = generarExpensasParaUnidades(unidades, cfg, { periodoId: periodo.id, fechaVencimiento });
    if (filas.length === 0) throw new HttpError(422, 'Ningún monto resultó mayor a cero; revisa montoBase/montosPorTipo/coeficientes');

    await tx.expensa.createMany({
      data: filas.map((f) => ({ ...f, monto: D(f.monto), saldoPendiente: D(f.saldoPendiente) })),
    });

    return { periodo, expensasGeneradas: filas.length, totalEmitido, modo: cfg.modo };
  });
}

module.exports = { listar, crear };
