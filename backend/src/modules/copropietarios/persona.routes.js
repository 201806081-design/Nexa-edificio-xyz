import { Router } from 'express';
import {
  editarPersona,
  obtenerPersonaPorId,
  obtenerPersonas,
  registrarPersona
} from './persona.controller.js';

export const personaRouter = Router();

personaRouter.post('/', registrarPersona);
personaRouter.get('/', obtenerPersonas);
personaRouter.get('/:id', obtenerPersonaPorId);
personaRouter.put('/:id', editarPersona);
