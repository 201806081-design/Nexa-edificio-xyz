// Usuarios del sistema (mock). Los 3 primeros son los mismos del seed del backend
// (backend/prisma/seed.js): usuario1 / usuario2 / usuario3, contraseña 1234.
// Cuando se integre, esta lista vendra de la API.
//
// Quien tiene cuenta:
//   - Administrador: SIEMPRE es personal del edificio (empleado con cargo
//     Administrador). Al registrar a ese empleado se le crea la cuenta sola.
//   - Directorio y Consulta: personas externas (miembros del directorio, contador, auditor).
//   - Residente: copropietarios e inquilinos registrados en Copropietarios.
//     Solo ven el estado de cuenta de su departamento.
//   - El resto del personal (portero, limpieza...) no tiene cuenta.
//
// CREDENCIALES: el usuario es el nombre de la persona en minusculas y la
// contraseña inicial es 1234. Se envian a su correo (envio simulado) y despues
// la persona puede cambiarla desde "¿Olvidaste tu contraseña?".
//
// enBackend: la cuenta existe en el seed del backend y se autentica contra la API.
// Las demas se autentican aqui (autenticarLocal) hasta que el backend las tenga.
import { ROLES, TIPOS_RESIDENTE } from './permisos';
import { EMPLEADOS_MOCK } from './personalMock';
import { PERSONAS, departamentos, numeroDe, personaPorId } from './edificioMock';

export const PASSWORD_INICIAL = '1234';

export const USUARIOS_MOCK = [
    // nombre: en el seed del backend dice 'Administrador General'; conviene cambiarlo alli a 'Oscar Montenegro'
    { id: 1, username: 'usuario1', nombre: 'Oscar Montenegro', email: 'admin@nexa.bo', celular: '71456230', rol: ROLES.ADMINISTRADOR, empleadoId: 'EM-001', personaId: null, activo: true, enBackend: true },
    { id: 2, username: 'usuario2', nombre: 'Miembro del Directorio', email: 'directorio@nexa.bo', celular: '', rol: ROLES.DIRECTORIO, empleadoId: null, personaId: null, activo: true, enBackend: true },
    { id: 3, username: 'usuario3', nombre: 'Usuario de Consulta', email: 'consulta@nexa.bo', celular: '', rol: ROLES.CONSULTA, empleadoId: null, personaId: null, activo: true, enBackend: true },
];

// ------------------------------------------------------------
//  VINCULOS (personal / residente)
// ------------------------------------------------------------
export const empleadoDeUsuario = (u) => EMPLEADOS_MOCK.find((e) => e.id === u?.empleadoId) ?? null;

export const usuarioDeEmpleado = (empleadoId) => USUARIOS_MOCK.find((u) => u.empleadoId === empleadoId) ?? null;

export const usuarioDePersona = (personaId) => USUARIOS_MOCK.find((u) => u.personaId === personaId) ?? null;

// 'Copropietario' | 'Inquilino' segun el registro de la persona (o null si no es residente)
export const tipoResidente = (u) => TIPOS_RESIDENTE[personaPorId(u?.personaId)?.tipo] ?? null;

// Numero del depto del residente ('101') o null
export const deptoDeUsuario = (u) => {
    const d = departamentos().find((x) => x.personaId === u?.personaId);
    return d ? numeroDe(d) : null;
};

// Copropietarios o inquilinos que todavia no tienen cuenta
export const personasSinCuenta = (tipo) => PERSONAS.filter((p) => TIPOS_RESIDENTE[p.tipo] === tipo && !usuarioDePersona(p.id));

const administradoresActivos = () => USUARIOS_MOCK.filter((u) => u.rol === ROLES.ADMINISTRADOR && u.activo);

// ------------------------------------------------------------
//  ALTA DE USUARIOS
// ------------------------------------------------------------
const sinTildes = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const limpiar = (t) => sinTildes(t).toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9]/g, '');

// Usuario = primer nombre en minusculas: "Ana Lopez" -> "ana".
// Si ya existe se agrega la inicial del apellido ("luisp") y despues un numero ("luisp2").
export const generarUsername = (nombres, apellidos) => {
    const existe = (u) => USUARIOS_MOCK.some((x) => x.username === u);
    const base = limpiar(nombres) || 'usuario';
    if (!existe(base)) return base;
    const conInicial = `${base}${limpiar(apellidos).charAt(0)}`;
    let u = conInicial; let i = 2;
    while (existe(u)) { u = `${conInicial}${i}`; i += 1; }
    return u;
};

// Crea una cuenta activa con la contraseña inicial y "envia" las credenciales a su correo.
// Devuelve { usuario, password } para mostrar el aviso.
export const crearUsuario = ({ nombres, apellidos, email = '', celular = '', rol, empleadoId = null, personaId = null }) => {
    const id = USUARIOS_MOCK.reduce((m, u) => Math.max(m, u.id), 0) + 1;
    const usuario = {
        id,
        username: generarUsername(nombres, apellidos),
        nombre: `${nombres} ${apellidos}`.trim(),
        email, celular, rol, empleadoId, personaId,
        activo: true, enBackend: false, password: PASSWORD_INICIAL,
    };
    USUARIOS_MOCK.push(usuario);
    return { usuario, password: PASSWORD_INICIAL };
};

// Cuenta de residente para un copropietario o inquilino registrado
export const crearCuentaResidente = (persona) => crearUsuario({
    nombres: persona.nombres, apellidos: persona.apellidos, email: persona.correo || '',
    celular: persona.telefono || '', rol: ROLES.RESIDENTE, personaId: persona.id,
});

// Los copropietarios e inquilinos del mock ya tienen su cuenta
PERSONAS.forEach((p) => { if (!usuarioDePersona(p.id)) crearCuentaResidente(p); });

// ------------------------------------------------------------
//  ACCIONES SOBRE UNA CUENTA
//  Devuelven un mensaje de error (string) o null si se hizo el cambio.
// ------------------------------------------------------------
const buscar = (id) => USUARIOS_MOCK.find((x) => x.id === id);

export const cambiarRol = (id, rol) => {
    const u = buscar(id);
    if (!u) return 'Usuario no encontrado';
    if (u.rol === rol) return null;
    if (rol === ROLES.ADMINISTRADOR && empleadoDeUsuario(u)?.cargo !== 'Administrador') {
        return 'El Administrador debe ser un empleado con cargo Administrador. Registralo en Personal y su cuenta se crea sola.';
    }
    if (u.rol === ROLES.ADMINISTRADOR && u.activo && administradoresActivos().length === 1) {
        return 'Es el unico Administrador activo: el sistema no puede quedarse sin Administrador.';
    }
    u.rol = rol;
    return null;
};

export const cambiarEstado = (id, activo) => {
    const u = buscar(id);
    if (!u) return 'Usuario no encontrado';
    if (!activo && u.rol === ROLES.ADMINISTRADOR && administradoresActivos().length === 1) {
        return 'Es el unico Administrador activo: no se puede desactivar.';
    }
    u.activo = activo;
    return null;
};

// Solo se elimina una cuenta desactivada
export const eliminarUsuario = (id) => {
    const i = USUARIOS_MOCK.findIndex((x) => x.id === id);
    if (i === -1) return 'Usuario no encontrado';
    if (USUARIOS_MOCK[i].activo) return 'Desactiva la cuenta antes de eliminarla.';
    if (USUARIOS_MOCK[i].enBackend) return 'Esta cuenta esta en el backend: se podra eliminar al integrar la API. Por ahora queda desactivada.';
    USUARIOS_MOCK.splice(i, 1);
    return null;
};

// Vuelve la contraseña a la inicial y la "envia" a su correo. Devuelve { usuario, password }.
export const restablecerPassword = (id) => {
    const u = buscar(id);
    if (!u) return null;
    u.password = PASSWORD_INICIAL;
    return { usuario: u, password: PASSWORD_INICIAL };
};

// ------------------------------------------------------------
//  LOGIN LOCAL (cuentas que todavia no existen en el backend)
//  Devuelve null si la cuenta se valida en el backend, o
//  { estado: 'ok' | 'inactivo' | 'incorrecto', user? }.
// ------------------------------------------------------------
export const autenticarLocal = (username, password) => {
    const u = USUARIOS_MOCK.find((x) => x.username === String(username ?? '').trim().toLowerCase());
    if (!u) return null;
    if (!u.activo) return { estado: 'inactivo' };
    if (u.enBackend) return null;
    if (u.password !== password) return { estado: 'incorrecto' };
    return {
        estado: 'ok',
        user: {
            id: u.id, usuario: u.username, nombre: u.nombre, email: u.email, rol: u.rol,
            personaId: u.personaId, tipoResidente: tipoResidente(u), depto: deptoDeUsuario(u),
        },
    };
};

// ------------------------------------------------------------
//  ADMINISTRADOR = PERSONAL (se usa desde Personal > Empleados)
// ------------------------------------------------------------

// Al registrar (o pasar a) un empleado con cargo Administrador se le crea su cuenta,
// si aun no tiene. Devuelve { usuario, password } o null.
export const asegurarCuentaAdministrador = (empleado) => {
    if (!empleado || empleado.cargo !== 'Administrador' || empleado.estado !== 'Activo') return null;
    const existente = usuarioDeEmpleado(empleado.id);
    if (existente) { existente.activo = true; return null; }
    return crearUsuario({
        nombres: empleado.nombres, apellidos: empleado.apellidos,
        email: empleado.correo, celular: empleado.celular, rol: ROLES.ADMINISTRADOR, empleadoId: empleado.id,
    });
};

// Si el empleado se da de baja, su cuenta queda desactivada (no puede entrar)
export const sincronizarCuentaConEmpleado = (empleado) => {
    const u = usuarioDeEmpleado(empleado?.id);
    if (u) u.activo = empleado.estado === 'Activo';
};
