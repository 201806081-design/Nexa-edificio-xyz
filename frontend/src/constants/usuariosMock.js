import { ROLES } from './permisos';

// Usuarios de prueba mientras no hay backend.
// Se eliminaran cuando el login se conecte a la API real.
export const USUARIOS_MOCK = [
  { usuario: 'usuario1', password: '1234', rol: ROLES.ADMINISTRADOR, nombre: 'Administrador' },
  { usuario: 'usuario2', password: '1234', rol: ROLES.DIRECTORIO, nombre: 'Directorio' },
  { usuario: 'usuario3', password: '1234', rol: ROLES.CONSULTA, nombre: 'Consulta' },
];
