// Usuarios del sistema (mock). Son los mismos del seed del backend
// (backend/prisma/seed.js): usuario1 / usuario2 / usuario3, contraseña 1234.
// Cuando se integre, esta lista vendra de la API.
//
// empleadoId: si el usuario tambien es personal del edificio (cobra sueldo).
// El administrador (usuario1) es el empleado EM-001, Oscar Montenegro, cargo Administrador.
// El vinculo es solo del frontend: en el backend las tablas Usuario y Empleado
// todavia no estan relacionadas.
import { ROLES } from './permisos';
import { EMPLEADOS_MOCK } from './personalMock';

export const USUARIOS_MOCK = [
    // nombre: en el seed del backend dice 'Administrador General'; conviene cambiarlo alli a 'Oscar Montenegro'
    { id: 1, username: 'usuario1', nombre: 'Oscar Montenegro', email: 'admin@nexa.bo', rol: ROLES.ADMINISTRADOR, empleadoId: 'EM-001' },
    { id: 2, username: 'usuario2', nombre: 'Miembro del Directorio', email: 'directorio@nexa.bo', rol: ROLES.DIRECTORIO, empleadoId: null },
    { id: 3, username: 'usuario3', nombre: 'Usuario de Consulta', email: 'consulta@nexa.bo', rol: ROLES.CONSULTA, empleadoId: null },
];

export const empleadoDeUsuario = (u) => EMPLEADOS_MOCK.find((e) => e.id === u?.empleadoId) ?? null;

export const usuarioDeEmpleado = (empleadoId) => USUARIOS_MOCK.find((u) => u.empleadoId === empleadoId) ?? null;

// Personal que corresponde a un rol: el Administrador es el empleado activo con
// cargo Administrador; Directorio y Consulta no son personal del edificio.
export const personalSugeridoParaRol = (rol) => {
    if (rol !== ROLES.ADMINISTRADOR) return null;
    return EMPLEADOS_MOCK.find((e) => e.cargo === 'Administrador' && e.estado === 'Activo')?.id ?? null;
};

// Guarda el rol y el personal vinculado de un usuario. Un empleado solo puede
// estar vinculado a un usuario: si ya lo estaba con otro, se le quita.
export const actualizarUsuario = (id, { rol, empleadoId }) => {
    if (empleadoId) {
        USUARIOS_MOCK.forEach((u) => { if (u.id !== id && u.empleadoId === empleadoId) u.empleadoId = null; });
    }
    const u = USUARIOS_MOCK.find((x) => x.id === id);
    if (u) { u.rol = rol; u.empleadoId = empleadoId || null; }
};
