import { prisma } from '../../config/prisma.js';

export async function crearUnidad(datos) {
  const personas = [datos.propietarioId, datos.inquilinoId].filter(Boolean);
  const personasEncontradas = await prisma.persona.findMany({
    where: { id: { in: personas } },
    select: { id: true }
  });

  if (personasEncontradas.length !== personas.length) {
    const error = new Error('El propietario o inquilino indicado no existe.');
    error.statusCode = 400;
    throw error;
  }

  return prisma.unidad.create({
    data: datos,
    include: {
      propietario: true,
      inquilino: true
    }
  });
}

export function listarUnidades() {
  return prisma.unidad.findMany({
    orderBy: [{ tipo: 'asc' }, { codigo: 'asc' }],
    include: {
      propietario: true,
      inquilino: true
    }
  });
}
