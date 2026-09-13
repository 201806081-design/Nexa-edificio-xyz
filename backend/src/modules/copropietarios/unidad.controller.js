import { crearUnidadSchema } from './unidad.validation.js';
import { crearUnidad, listarUnidades } from './unidad.service.js';

export async function registrarUnidad(req, res, next) {
  const resultado = crearUnidadSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      error: 'Los datos de la unidad son inválidos.',
      detalles: resultado.error.flatten().fieldErrors
    });
  }

  try {
    const unidad = await crearUnidad(resultado.data);
    return res.status(201).json(unidad);
  } catch (error) {
    return next(error);
  }
}

export async function obtenerUnidades(_req, res, next) {
  try {
    const unidades = await listarUnidades();
    return res.status(200).json(unidades);
  } catch (error) {
    return next(error);
  }
}
