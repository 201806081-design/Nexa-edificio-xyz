import { Router } from 'express';
import { personaRouter } from '../modules/copropietarios/persona.routes.js';
import { unidadRouter } from '../modules/copropietarios/unidad.routes.js';

export const apiRouter = Router();

apiRouter.use('/unidades', unidadRouter);
apiRouter.use('/personas', personaRouter);
