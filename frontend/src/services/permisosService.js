import api from './api';
import { PERMISOS_INICIALES, normalizarPermisos } from '../constants/permisos';

// Permisos por rol: { [rol]: ['inicio', 'finanzas.pagos', ...] }
//
// PENDIENTE BACKEND (modulo Seguridad):
//   GET /api/permisos        -> 200 { Administrador: [...], Directorio: [...], Consulta: [...], Residente: [...] }
//   PUT /api/permisos/:rol   body { pantallas: [...] } -> 200 { rol, pantallas: [...] }
//   Las claves son las de PANTALLAS (constants/permisos.js). El backend tambien debe
//   validar cada endpoint con estos permisos (el frontend solo oculta y bloquea pantallas).
// Cuando exista, poner VITE_PERMISOS_BACKEND="true" en frontend/.env y no hay que tocar nada mas.
const PERMISOS_BACKEND = import.meta.env.VITE_PERMISOS_BACKEND === 'true';

// Mientras tanto se guardan en memoria (se reinician al recargar, como los demas mocks)
const copiar = (permisos) => Object.fromEntries(Object.entries(permisos).map(([rol, lista]) => [rol, [...lista]]));
let permisosMock = copiar(PERMISOS_INICIALES);

export async function obtenerPermisos() {
  if (PERMISOS_BACKEND) {
    const { data } = await api.get('/permisos');
    return data;
  }
  return copiar(permisosMock);
}

// Guarda la lista de un rol y devuelve la lista guardada
export async function guardarPermisosDeRol(rol, pantallas) {
  const lista = normalizarPermisos(rol, pantallas);
  if (PERMISOS_BACKEND) {
    const { data } = await api.put(`/permisos/${encodeURIComponent(rol)}`, { pantallas: lista });
    return data.pantallas;
  }
  permisosMock = { ...permisosMock, [rol]: lista };
  return [...lista];
}
