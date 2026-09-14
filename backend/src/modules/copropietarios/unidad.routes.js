import { Router } from 'express';
import {
  consultarHistorialOcupantes,
  registrarOcupante
} from './ocupacion.controller.js';
import { obtenerUnidades, registrarUnidad } from './unidad.controller.js';

export const unidadRouter = Router();

unidadRouter.post('/', registrarUnidad);
unidadRouter.get('/', obtenerUnidades);
unidadRouter.post('/:id/ocupantes', registrarOcupante);
unidadRouter.get('/:id/historial-ocupantes', consultarHistorialOcupantes);
