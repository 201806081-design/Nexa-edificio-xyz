import { z } from 'zod';

export const registrarOcupacionSchema = z.object({
  personaId: z.string().trim().min(1),
  fechaInicio: z.string().datetime({ offset: true }).optional(),
}).strict();
