import { useState } from 'react';
import { enviarCredenciales } from '../services/correoService';

// Muestra el aviso de credenciales y las envia al correo del usuario.
// credenciales = { usuario, password, titulo, descripcion, envio: { estado, mensaje } } | null
// envio.estado: 'enviando' | 'enviado' | 'error' | 'sin-correo'
export function useEnvioCredenciales() {
  const [credenciales, setCredenciales] = useState(null);

  const mostrar = (cuenta, { titulo, descripcion = '', motivo = 'alta' }) => {
    if (!cuenta) return;
    const tieneCorreo = Boolean(cuenta.usuario.email);
    setCredenciales({ ...cuenta, titulo, descripcion, envio: { estado: tieneCorreo ? 'enviando' : 'sin-correo' } });
    if (!tieneCorreo) return;

    enviarCredenciales(cuenta, motivo)
      .then(() => ({ estado: 'enviado' }))
      .catch((error) => ({
        estado: 'error',
        mensaje: error.response?.data?.error
          ?? 'No se pudo conectar con el servidor para enviar el correo.',
      }))
      // Solo actualiza si el aviso abierto sigue siendo el de esta cuenta
      .then((envio) => setCredenciales((c) => (c?.usuario.id === cuenta.usuario.id ? { ...c, envio } : c)));
  };

  return { credenciales, mostrar, cerrar: () => setCredenciales(null) };
}
