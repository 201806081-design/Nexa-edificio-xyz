import { prisma } from '../../config/prisma.js';

const incluirUnidades = {
  unidadesComoPropietario: true,
  unidadesComoInquilino: true
};

export function crearPersona(datos) {
  return prisma.persona.create({
    data: datos,
    include: incluirUnidades
  });
}

export function listarPersonas() {
  return prisma.persona.findMany({
    orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
    include: incluirUnidades
  });
}

export async function obtenerPersona(id) {
  const persona = await prisma.persona.findUnique({
    where: { id },
    include: incluirUnidades
  });

  if (!persona) {
    const error = new Error('La persona indicada no existe.');
    error.statusCode = 404;
    throw error;
  }

  return persona;
}

export async function actualizarPersona(id, datos) {
  await obtenerPersona(id);

  return prisma.persona.update({
    where: { id },
    data: datos,
    include: incluirUnidades
  });
}
