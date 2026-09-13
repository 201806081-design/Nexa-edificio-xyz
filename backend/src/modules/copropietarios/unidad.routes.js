import { Router } from 'express';
import { obtenerUnidades, registrarUnidad } from './unidad.controller.js';

export const unidadRouter = Router();

unidadRouter.post('/', registrarUnidad);
unidadRouter.get('/', obtenerUnidades);
