const prisma = require('../../../config/prisma');

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

module.exports = { configMoraVigente };
