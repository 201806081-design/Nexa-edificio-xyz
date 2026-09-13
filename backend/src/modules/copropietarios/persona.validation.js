import { z } from 'zod';

const camposPersona = {
  nombres: z.string().trim().min(1).max(80),
  apellidos: z.string().trim().min(1).max(80),
  documentoIdentidad: z.string().trim().min(1).max(30),
  telefono: z.string().trim().min(7).max(30),
  correoElectronico: z.string().trim().email().max(120)
};

export const crearPersonaSchema = z.object(camposPersona).strict();

export const actualizarPersonaSchema = z.object(camposPersona)
  .partial()
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'Debe enviar al menos un dato para actualizar.'
  });
