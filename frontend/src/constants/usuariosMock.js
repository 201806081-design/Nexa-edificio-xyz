// Usuarios del sistema (mock). Son los mismos del seed del backend
// (backend/prisma/seed.js): usuario1 / usuario2 / usuario3, contraseña 1234.
// Cuando se integre, esta lista vendra de la API.
//
// empleadoId: si el usuario tambien es personal del edificio (cobra sueldo).
// El administrador (usuario1) es la empleada EM-001 con cargo Administrador.
// El vinculo es solo del frontend: en el backend las tablas Usuario y Empleado
// todavia no estan relacionadas.
import { ROLES } from './permisos';
import { EMPLEADOS_MOCK } from './personalMock';

export const USUARIOS_MOCK = [
    { id: 1, username: 'usuario1', nombre: 'Administrador General', email: 'admin@nexa.bo', rol: ROLES.ADMINISTRADOR, empleadoId: 'EM-001' },
    { id: 2, username: 'usuario2', nombre: 'Miembro del Directorio', email: 'directorio@nexa.bo', rol: ROLES.DIRECTORIO, empleadoId: null },
    { id: 3, username: 'usuario3', nombre: 'Usuario de Consulta', email: 'consulta@nexa.bo', rol: ROLES.CONSULTA, empleadoId: null },
];

export const empleadoDeUsuario = (u) => EMPLEADOS_MOCK.find((e) => e.id === u?.empleadoId) ?? null;

export const usuarioDeEmpleado = (empleadoId) => USUARIOS_MOCK.find((u) => u.empleadoId === empleadoId) ?? null;
