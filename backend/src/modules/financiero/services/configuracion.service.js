// Configuración de interés por mora (pantalla "Configurar interés"). Vigencias por fecha, sin borrar historial.
const { Prisma } = require('@prisma/client');
const prisma = require('../../../config/prisma');
const { configMoraAVista, vistaAConfigMora, inicioDiaUTC } = require('../utils/expensasVista.utils');

const D = (v) => new Prisma.Decimal(v);
const MS_DIA = 86400000;

/** Configuración de mora vigente en una fecha (la más reciente cuya vigencia la cubre). */
async function configMoraVigente(fecha = new Date()) {
  return prisma.configuracionMora.findFirst({
    where: {
      vigenteDesde: { lte: fecha },
      OR: [{ vigenteHasta: null }, { vigenteHasta: { gte: fecha } }],
    },
    orderBy: { vigenteDesde: 'desc' },
  });
}

/** Vigente hoy, en la forma del formulario (null si nunca se configuró). */
async function actual(fecha = new Date()) {
  return configMoraAVista(await configMoraVigente(fecha));
}

/** Historial completo de configuraciones, la más reciente primero. */
async function historial() {
  const filas = await prisma.configuracionMora.findMany({ orderBy: { vigenteDesde: 'desc' } });
  return filas.map(configMoraAVista);
}

/**
 * Guarda una nueva configuración vigente desde hoy. La anterior queda cerrada ayer
 * (si la anterior empezó hoy mismo, se reemplaza en su lugar).
 */
async function actualizar(datos, usuarioId = null, hoy = new Date()) {
  const cfg = vistaAConfigMora(datos);
  const desde = inicioDiaUTC(hoy);
  const data = { tasaMensual: D(cfg.tasaMensual), diasGracia: cfg.diasGracia, diaVencimiento: cfg.diaVencimiento, metodo: cfg.metodo, creadoPorId: usuarioId };

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
  return configMoraAVista(guardada);
}

module.exports = { configMoraVigente, actual, historial, actualizar };
