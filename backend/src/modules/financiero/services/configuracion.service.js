// Configuración de interés por mora (critico 3.1): porcentaje mensual o monto fijo, días de gracia,
// día de vencimiento y día de generación, con vigencias por fecha. Y "fecha actual" del sistema simulable (critico 4).
const { Prisma } = require('@prisma/client');
const prisma = require('../../../config/prisma');
const { configMoraAVista, vistaAConfigMora, inicioDiaUTC } = require('../utils/expensasVista.utils');
const { fechaActual, estadoFechaSistema, establecerFechaSistema, limpiarFechaSistema } = require('../../../shared/fechaSistema');

const D = (v) => new Prisma.Decimal(typeof v === 'number' ? v.toFixed(2) : String(v));
const MS_DIA = 86400000;

/** Configuración de mora vigente en una fecha (la más reciente cuya vigencia la cubre). */
async function configMoraVigente(fecha = null) {
  const f = fecha || await fechaActual();
  return prisma.configuracionMora.findFirst({
    where: {
      vigenteDesde: { lte: f },
      OR: [{ vigenteHasta: null }, { vigenteHasta: { gte: f } }],
    },
    orderBy: { vigenteDesde: 'desc' },
  });
}

/** Vigente hoy, en la forma del formulario (null si nunca se configuró). */
async function actual(fecha = null) {
  const hoy = fecha || await fechaActual();
  return configMoraAVista(await configMoraVigente(hoy), hoy);
}

/** Historial completo de configuraciones, la más reciente primero. */
async function historial() {
  const hoy = await fechaActual();
  const filas = await prisma.configuracionMora.findMany({ orderBy: { vigenteDesde: 'desc' } });
  return filas.map((c) => configMoraAVista(c, hoy));
}

/**
 * Guarda una nueva configuración vigente desde hoy (fecha del sistema). La anterior queda cerrada ayer
 * (si la anterior empezó hoy mismo, se reemplaza en su lugar).
 */
async function actualizar(datos, usuarioId = null, hoy = null) {
  const cfg = vistaAConfigMora(datos);
  const ahora = hoy || await fechaActual();
  const desde = inicioDiaUTC(ahora);
  const data = {
    tasaMensual: D(cfg.tasaMensual), montoFijo: cfg.montoFijo === null ? null : D(cfg.montoFijo),
    diasGracia: cfg.diasGracia, diaVencimiento: cfg.diaVencimiento, diaGeneracion: cfg.diaGeneracion, metodo: cfg.metodo, creadoPorId: usuarioId,
  };
  const guardada = await prisma.$transaction(async (tx) => {
    const vigente = await tx.configuracionMora.findFirst({ where: { vigenteHasta: null }, orderBy: { vigenteDesde: 'desc' } });
    if (vigente && vigente.vigenteDesde.getTime() >= desde.getTime()) {
      return tx.configuracionMora.update({ where: { id: vigente.id }, data });
    }
    if (vigente) {
      await tx.configuracionMora.update({ where: { id: vigente.id }, data: { vigenteHasta: new Date(desde.getTime() - MS_DIA) } });
    }
    return tx.configuracionMora.create({ data: { ...data, vigenteDesde: desde } });
  });
  return configMoraAVista(guardada, ahora);
}

module.exports = { configMoraVigente, actual, historial, actualizar, estadoFechaSistema, establecerFechaSistema, limpiarFechaSistema };
