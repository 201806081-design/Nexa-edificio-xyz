import { z } from 'zod';

export const tiposUnidad = ['DEPARTAMENTO', 'PARQUEO', 'BAULERA'];

export const crearUnidadSchema = z.object({
  tipo: z.enum(tiposUnidad),
  codigo: z.string().trim().min(1).max(30),
  piso: z.number().int().min(-5).max(200).optional(),
  superficieM2: z.number().positive().max(100000).optional(),
  propietarioId: z.string().trim().min(1).optional(),
  inquilinoId: z.string().trim().min(1).optional()
}).strict();
