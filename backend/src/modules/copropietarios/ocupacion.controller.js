import { registrarOcupacionSchema } from './ocupacion.validation.js';
import {
  obtenerHistorialOcupantes,
  registrarOcupacion
} from './ocupacion.service.js';

export async function registrarOcupante(req, res, next) {
  const resultado = registrarOcupacionSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      error: 'Los datos del ocupante son inválidos.',
      detalles: resultado.error.flatten().fieldErrors
    });
  }

  try {
    return res.status(201).json(
      await registrarOcupacion(req.params.id, {
        ...resultado.data,
        fechaInicio: resultado.data.fechaInicio
      })
    );
  } catch (error) {
    return next(error);
  }
}

export async function consultarHistorialOcupantes(req, res, next) {
  try {
    return res.status(200).json(await obtenerHistorialOcupantes(req.params.id));
  } catch (error) {
    return next(error);
  }
}
