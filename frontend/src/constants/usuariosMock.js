// Usuarios del sistema (mock). Los 3 primeros son los mismos del seed del backend
// (backend/prisma/seed.js): usuario1 / usuario2 / usuario3, contraseña 1234.
// Cuando se integre, esta lista vendra de la API.
//
// Quien tiene cuenta:
//   - Administrador: SIEMPRE es personal del edificio (empleado con cargo
//     Administrador). Al registrar a ese empleado se le crea la cuenta sola.
//   - Directorio y Consulta: pueden ser personas externas (miembros del
//     directorio, contador, auditor). Se crean desde Usuarios > Agregar usuario.
//   - El resto del personal (portero, limpieza...) no necesita cuenta.
//
// empleadoId: vinculo con el personal. Es solo del frontend: en el backend las
// tablas Usuario y Empleado todavia no estan relacionadas.
//
// CONTRASEÑAS: nadie las ve, ni el administrador. Al crear una cuenta (o al
// restablecerla) se "envia" al CORREO del usuario un enlace de un solo uso para
// que el mismo cree su contraseña. Mientras no lo use, la cuenta queda
// "pendiente de activacion" (debeCambiarPassword). Aqui el envio es simulado:
// en el backend la contraseña se guarda cifrada (bcrypt) y el correo lo envia el servidor.
import { ROLES } from './permisos';
import { EMPLEADOS_MOCK } from './personalMock';

export const USUARIOS_MOCK = [
    // nombre: en el seed del backend dice 'Administrador General'; conviene cambiarlo alli a 'Oscar Montenegro'
    { id: 1, username: 'usuario1', nombre: 'Oscar Montenegro', email: 'admin@nexa.bo', celular: '71456230', rol: ROLES.ADMINISTRADOR, empleadoId: 'EM-001', activo: true, debeCambiarPassword: false },
    { id: 2, username: 'usuario2', nombre: 'Miembro del Directorio', email: 'directorio@nexa.bo', celular: '', rol: ROLES.DIRECTORIO, empleadoId: null, activo: true, debeCambiarPassword: false },
    { id: 3, username: 'usuario3', nombre: 'Usuario de Consulta', email: 'consulta@nexa.bo', celular: '', rol: ROLES.CONSULTA, empleadoId: null, activo: true, debeCambiarPassword: false },
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

// ------------------------------------------------------------
//  ALTA DE USUARIOS
// ------------------------------------------------------------
const sinTildes = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// "Oscar Montenegro" -> "oscar.montenegro" (si existe: "oscar.montenegro2")
export const generarUsername = (nombres, apellidos) => {
    const n = sinTildes(nombres).toLowerCase().split(/\s+/)[0] || 'usuario';
    const a = sinTildes(apellidos).toLowerCase().split(/\s+/)[0] || '';
    const base = (a ? `${n}.${a}` : n).replace(/[^a-z0-9.]/g, '');
    let u = base; let i = 2;
    while (USUARIOS_MOCK.some((x) => x.username === u)) { u = `${base}${i}`; i += 1; }
    return u;
};

// Crea una cuenta y "envia" el enlace de activacion a su correo. Devuelve { usuario }.
export const crearUsuario = ({ nombre, nombres, apellidos, email, celular = '', rol, empleadoId = null }) => {
    const id = USUARIOS_MOCK.reduce((m, u) => Math.max(m, u.id), 0) + 1;
    const [n1, ...resto] = String(nombre || '').trim().split(/\s+/);
    const usuario = {
        id,
        username: generarUsername(nombres ?? n1, apellidos ?? resto.join(' ')),
        nombre: nombre || `${nombres} ${apellidos}`.trim(),
        email, celular, rol, empleadoId, activo: true, debeCambiarPassword: true,
    };
    if (empleadoId) USUARIOS_MOCK.forEach((u) => { if (u.empleadoId === empleadoId) u.empleadoId = null; });
    USUARIOS_MOCK.push(usuario);
    return { usuario };
};

// "Envia" al correo del usuario un enlace para crear una contraseña nueva
export const restablecerPassword = (id) => {
    const u = USUARIOS_MOCK.find((x) => x.id === id);
    if (!u) return null;
    u.debeCambiarPassword = true;
    return { usuario: u };
};

// El Administrador es personal: al registrar (o pasar a) un empleado con cargo
// Administrador se le crea su cuenta, si aun no tiene. Devuelve { usuario } o null.
export const asegurarCuentaAdministrador = (empleado) => {
    if (!empleado || empleado.cargo !== 'Administrador' || empleado.estado !== 'Activo') return null;
    const existente = usuarioDeEmpleado(empleado.id);
    if (existente) { existente.activo = true; return null; }
    return crearUsuario({
        nombres: empleado.nombres, apellidos: empleado.apellidos, nombre: empleado.nombre,
        email: empleado.correo, celular: empleado.celular, rol: ROLES.ADMINISTRADOR, empleadoId: empleado.id,
    });
};

// Si el empleado se da de baja, su cuenta queda desactivada (no puede entrar)
export const sincronizarCuentaConEmpleado = (empleado) => {
    const u = usuarioDeEmpleado(empleado?.id);
    if (u) u.activo = empleado.estado === 'Activo';
};
