import api from './api';

// Envio del usuario y la contraseña al correo de la persona.
//
// PENDIENTE BACKEND (modulo Seguridad): endpoint que envia el correo con SMTP.
//   POST /api/correo/credenciales
//   body: { para, nombre, usuario, password, motivo: 'alta' | 'restablecer' }
//   respuesta: 200 { ok: true } | 4xx/5xx { ok: false, error: 'mensaje' }
// Cuando exista, poner VITE_CORREO_BACKEND="true" en frontend/.env y no hay que tocar nada mas.
const CORREO_BACKEND = import.meta.env.VITE_CORREO_BACKEND === 'true';

export async function enviarCredenciales({ usuario, password }, motivo = 'alta') {
  if (!CORREO_BACKEND) return; // envio simulado hasta integrar el backend
  await api.post('/correo/credenciales', {
    para: usuario.email,
    nombre: usuario.nombre,
    usuario: usuario.username,
    password,
    motivo,
  });
}
