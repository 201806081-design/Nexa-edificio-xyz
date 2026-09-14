import { prisma } from '../../config/prisma.js';

const incluirOcupacion = {
  persona: {
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      documentoIdentidad: true,
      telefono: true,
      correoElectronico: true
    }
  }
};

export async function registrarOcupacion(unidadId, datos) {
  const fechaInicio = datos.fechaInicio ? new Date(datos.fechaInicio) : new Date();

  const unidad = await prisma.unidad.findUnique({
    where: { id: unidadId },
    include: { historialOcupantes: { orderBy: { fechaInicio: 'desc' }, take: 1 } }
  });

  if (!unidad) {
    const error = new Error('El departamento indicado no existe.');
    error.statusCode = 404;
    throw error;
  }

  if (unidad.tipo !== 'DEPARTAMENTO') {
    const error = new Error('El historial de ocupantes solo aplica a departamentos.');
    error.statusCode = 400;
    throw error;
  }

  const persona = await prisma.persona.findUnique({ where: { id: datos.personaId } });
  if (!persona) {
    const error = new Error('El ocupante indicado no existe.');
    error.statusCode = 400;
    throw error;
  }

  const ocupanteActual = await prisma.ocupacion.findFirst({
    where: { unidadId, fechaFin: null },
    orderBy: { fechaInicio: 'desc' }
  });

  if (ocupanteActual && fechaInicio < ocupanteActual.fechaInicio) {
    const error = new Error('La fecha de inicio no puede ser anterior a la ocupación actual.');
    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    if (ocupanteActual) {
      await tx.ocupacion.update({
        where: { id: ocupanteActual.id },
        data: { fechaFin: fechaInicio }
      });
    }

    const ocupacion = await tx.ocupacion.create({
      data: { unidadId, personaId: datos.personaId, fechaInicio },
      include: incluirOcupacion
    });

    await tx.unidad.update({
      where: { id: unidadId },
      data: { inquilinoId: datos.personaId }
    });

    return ocupacion;
  });
}

export async function obtenerHistorialOcupantes(unidadId) {
  const unidad = await prisma.unidad.findUnique({
    where: { id: unidadId },
    select: { id: true, tipo: true, codigo: true }
  });

  if (!unidad) {
    const error = new Error('El departamento indicado no existe.');
    error.statusCode = 404;
    throw error;
  }

  if (unidad.tipo !== 'DEPARTAMENTO') {
    const error = new Error('El historial de ocupantes solo aplica a departamentos.');
    error.statusCode = 400;
    throw error;
  }

  const ocupaciones = await prisma.ocupacion.findMany({
    where: { unidadId },
    orderBy: { fechaInicio: 'desc' },
    include: incluirOcupacion
  });

  return {
    unidad,
    ocupanteActual: ocupaciones.find((ocupacion) => ocupacion.fechaFin === null) ?? null,
    ocupantesAnteriores: ocupaciones.filter((ocupacion) => ocupacion.fechaFin !== null),
    historial: ocupaciones
  };
}
