import {
  actualizarPersonaSchema,
  crearPersonaSchema
} from './persona.validation.js';
import {
  actualizarPersona,
  crearPersona,
  listarPersonas,
  obtenerPersona
} from './persona.service.js';

export async function registrarPersona(req, res, next) {
  const resultado = crearPersonaSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      error: 'Los datos personales y de contacto son inválidos.',
      detalles: resultado.error.flatten().fieldErrors
    });
  }

  try {
    return res.status(201).json(await crearPersona(resultado.data));
  } catch (error) {
    return next(error);
  }
}

export async function obtenerPersonas(_req, res, next) {
  try {
    return res.status(200).json(await listarPersonas());
  } catch (error) {
    return next(error);
  }
}

export async function obtenerPersonaPorId(req, res, next) {
  try {
    return res.status(200).json(await obtenerPersona(req.params.id));
  } catch (error) {
    return next(error);
  }
}

export async function editarPersona(req, res, next) {
  const resultado = actualizarPersonaSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      error: 'Los datos para actualizar son inválidos.',
      detalles: resultado.error.flatten().fieldErrors
    });
  }

  try {
    return res.status(200).json(
      await actualizarPersona(req.params.id, resultado.data)
    );
  } catch (error) {
    return next(error);
  }
}
