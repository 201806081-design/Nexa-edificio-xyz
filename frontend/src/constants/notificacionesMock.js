// Notificaciones in-app (campanita del header).
// Cada notificacion vive en un array global. El filtro por usuario se hace al leer:
// - paraRoles: array de roles que la pueden ver. Vacio = ninguno.
// - paraDeptos: array de IDs de depto (para notificaciones dirigidas a un conjunto
//   de copropietarios). null = sin filtro de depto; array vacio = ningun depto.
// - leidaPor: set de IDs de usuario que ya la leyeron (para que cada uno vea su
//   estado de leida sin pisar a los demas).
//
// Como el mock corre solo en memoria, al recargar la pagina se vuelven a leer las
// semillas. Esta bien para el demo; la persistencia real la pone el backend.

export const TIPOS_NOTIFICACION = ['comunicado', 'sistema'];

export const NOTIFICACIONES_MOCK = [
    {
        id: 'NT-0001',
        titulo: 'Bienvenido al sistema',
        mensaje: 'Esta es tu bandeja de notificaciones. Aqui veras los avisos nuevos del edificio.',
        tipo: 'sistema',
        prioridad: 'Normal',
        fecha: new Date().toISOString(),
        paraRoles: ['Administrador', 'Directorio', 'Consulta'],
        paraDeptos: null,
        leidaPor: [],
        comunicadoId: null,
        ruta: '/dashboard',
    },
];

let secuencia = NOTIFICACIONES_MOCK.length;

// Agrega una notificacion al mock.
export const pushNotificacion = ({ titulo, mensaje, tipo = 'comunicado', prioridad = 'Normal', paraRoles = [], paraDeptos = null, comunicadoId = null, ruta = '/dashboard' }) => {
    // Si no hay nadie a quien le llegue, no la agregamos (evita basura en el mock).
    if ((!paraRoles || paraRoles.length === 0) && (!paraDeptos || paraDeptos.length === 0)) return null;
    secuencia += 1;
    const n = {
        id: `NT-${String(secuencia).padStart(4, '0')}`,
        titulo, mensaje, tipo, prioridad,
        fecha: new Date().toISOString(),
        paraRoles, paraDeptos, comunicadoId, ruta,
        leidaPor: [],
    };
    NOTIFICACIONES_MOCK.unshift(n);
    return n;
};

// Filtra las notificaciones que le corresponden a este usuario.
// Criterio: su rol esta en paraRoles Y (si hay paraDeptos) su depto esta en paraDeptos.
export const notificacionesParaUsuario = (user) => {
    if (!user) return [];
    const rol = user.rol;
    const depto = user.depto ?? null;
    return NOTIFICACIONES_MOCK.filter((n) => {
        const rolOk = n.paraRoles.includes(rol);
        if (!rolOk) return false;
        if (n.paraDeptos == null) return true;
        if (depto == null) return rol === 'Administrador' || rol === 'Directorio';
        return n.paraDeptos.includes(depto);
    });
};

// Cuantas tiene sin leer este usuario.
export const noLeidasParaUsuario = (user) => {
    if (!user) return 0;
    const uid = user.id ?? user.nombre ?? user.rol;
    return notificacionesParaUsuario(user).filter((n) => !n.leidaPor.includes(uid)).length;
};

// Marcar leida por un usuario.
export const marcarLeida = (notificacionId, user) => {
    const n = NOTIFICACIONES_MOCK.find((x) => x.id === notificacionId);
    if (!n || !user) return;
    const uid = user.id ?? user.nombre ?? user.rol;
    if (!n.leidaPor.includes(uid)) n.leidaPor.push(uid);
};

// Marcar todas como leidas por este usuario.
export const marcarTodasLeidas = (user) => {
    if (!user) return;
    const uid = user.id ?? user.nombre ?? user.rol;
    notificacionesParaUsuario(user).forEach((n) => {
        if (!n.leidaPor.includes(uid)) n.leidaPor.push(uid);
    });
};

// Formato "hace X" para la lista desplegable.
export const tiempoRelativo = (fechaIso) => {
    const diff = Date.now() - new Date(fechaIso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'ahora';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `hace ${d} d`;
    return new Date(fechaIso).toLocaleDateString('es-BO');
};