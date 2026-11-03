// Mock de comunicados del edificio (HU-CO-01).
// Los destinatarios se derivan de otros mocks (DEPARTAMENTOS_ACTIVOS, EXPENSAS_MOCK,
// EMPLEADOS_MOCK) para que no haya datos inventados ni inconsistencias con el resto
// del sistema: "Morosos" es el conteo real de deptos con expensas no pagadas,
// "Personal del edificio" es el conteo real de empleados activos, etc.

import { DEPARTAMENTOS_ACTIVOS, EXPENSAS_MOCK } from './expensasMock';
import { EMPLEADOS_MOCK } from './personalMock';
import { pushNotificacion } from './notificacionesMock';

export const PRIORIDADES = ['Normal', 'Importante', 'Urgente'];

export const ESTADOS_COMUNICADO = ['Todos', 'Enviado', 'Parcial', 'Programado', 'Fallido'];

// Canales de envio y su estado tecnico.
// 'disponible'       -> seleccionable Y funcional en el mock (solo 'app' por ahora).
// 'pendiente-backend' -> seleccionable pero no envia nada real; el backend lo integrara.
// 'no configurado'   -> deshabilitado.
export const CANALES = [
    { id: 'app', nombre: 'Notificacion en la aplicacion', estado: 'disponible', etiqueta: 'App' },
    { id: 'correo', nombre: 'Correo electronico', estado: 'pendiente-backend', etiqueta: 'Correo' },
    { id: 'whatsapp', nombre: 'WhatsApp', estado: 'pendiente-backend', etiqueta: 'WhatsApp' },
    { id: 'sms', nombre: 'SMS', estado: 'no configurado', etiqueta: 'SMS' },
];
export const canalPorId = (id) => CANALES.find((c) => c.id === id);
export const canalEstaDisponible = (id) => {
    const e = canalPorId(id)?.estado;
    return e === 'disponible' || e === 'pendiente-backend';
};

// Usuarios del sistema (los que se loguean y reciben notificaciones in-app).
// Hoy solo esta el usuario 1; cuando el backend este integrado esto vendra de la API.
export const USUARIOS_SISTEMA = [
    { id: 'U-01', nombre: 'Usuario 1', rol: 'Administrador', depto: null },
];

// Grupos de destinatarios DERIVADOS de los mocks compartidos. Cada vez que se llama
// reconsulta los arrays actuales, asi los conteos reflejan los cambios reales
// (ej. si se pagan todas las moras, el grupo "Morosos" baja a 0).
export const gruposDestinatarios = () => {
    const porPiso = { '1': [], '2': [], '3': [] };
    DEPARTAMENTOS_ACTIVOS.forEach((d) => {
        const piso = String(d.id).charAt(0);
        if (porPiso[piso]) porPiso[piso].push(d);
    });
    const morososIds = [...new Set(
        EXPENSAS_MOCK
            .filter((e) => e.estado !== 'Pagada' && (e.total || e.monto || 0) > (e.pagado || 0))
            .map((e) => e.depto)
    )];
    const morososDeptos = DEPARTAMENTOS_ACTIVOS.filter((d) => morososIds.includes(d.id));

    return [
        { id: 'todos', etiqueta: 'Todos los copropietarios', count: DEPARTAMENTOS_ACTIVOS.length, descripcion: `Envia a los ${DEPARTAMENTOS_ACTIVOS.length} departamentos del edificio` },
        { id: 'piso-1', etiqueta: 'Piso 1', count: porPiso['1'].length, descripcion: `Deptos ${porPiso['1'].map((d) => d.id).join(', ')}` },
        { id: 'piso-2', etiqueta: 'Piso 2', count: porPiso['2'].length, descripcion: `Deptos ${porPiso['2'].map((d) => d.id).join(', ')}` },
        { id: 'piso-3', etiqueta: 'Piso 3', count: porPiso['3'].length, descripcion: `Deptos ${porPiso['3'].map((d) => d.id).join(', ')}` },
        { id: 'morosos', etiqueta: 'Morosos', count: morososDeptos.length, descripcion: morososDeptos.length ? `Deptos ${morososDeptos.map((d) => d.id).join(', ')}` : 'Sin morosos este periodo' },
        { id: 'personal', etiqueta: 'Personal del edificio', count: EMPLEADOS_MOCK.filter((e) => e.estado === 'Activo').length, descripcion: 'Empleados activos del edificio' },
        { id: 'directorio', etiqueta: 'Directorio', count: 1, descripcion: 'Miembros del directorio' },
        { id: 'admins', etiqueta: 'Administradores del sistema', count: USUARIOS_SISTEMA.filter((u) => u.rol === 'Administrador').length, descripcion: 'Usuarios con rol Administrador del sistema' },
    ];
};
export const grupoPorId = (id) => gruposDestinatarios().find((g) => g.id === id);

// Personas del grupo (para el selector granular con checkboxes).
// Devuelve {id, nombre, detalle} de cada persona del grupo.
export const personasDeGrupo = (grupoId) => {
    const copropietariosMap = (d) => ({ id: d.id, nombre: `Depto ${d.id} - ${d.responsable}`, detalle: `Tipo ${d.tipo}` });
    switch (grupoId) {
        case 'todos': return DEPARTAMENTOS_ACTIVOS.map(copropietariosMap);
        case 'piso-1': return DEPARTAMENTOS_ACTIVOS.filter((d) => String(d.id).startsWith('1')).map(copropietariosMap);
        case 'piso-2': return DEPARTAMENTOS_ACTIVOS.filter((d) => String(d.id).startsWith('2')).map(copropietariosMap);
        case 'piso-3': return DEPARTAMENTOS_ACTIVOS.filter((d) => String(d.id).startsWith('3')).map(copropietariosMap);
        case 'morosos': {
            const morososIds = [...new Set(
                EXPENSAS_MOCK
                    .filter((e) => e.estado !== 'Pagada' && (e.total || e.monto || 0) > (e.pagado || 0))
                    .map((e) => e.depto)
            )];
            return DEPARTAMENTOS_ACTIVOS.filter((d) => morososIds.includes(d.id)).map(copropietariosMap);
        }
        case 'personal':
            return EMPLEADOS_MOCK.filter((e) => e.estado === 'Activo').map((e) => ({
                id: e.id, nombre: e.nombre, detalle: e.cargo,
            }));
        case 'directorio':
            return [{ id: 'DIR-01', nombre: 'Presidente del directorio', detalle: 'Directorio' }];
        case 'admins':
            return USUARIOS_SISTEMA.filter((u) => u.rol === 'Administrador').map((u) => ({
                id: u.id, nombre: u.nombre, detalle: 'Administrador',
            }));
        default: return [];
    }
};

// Mapa grupo -> criterio de notificacion (roles / deptos del usuario logueado).
// Si matchea, la notificacion aparece en la campanita de ese usuario.
export const criterioNotificacionDelGrupo = (grupoId, destinatariosEspecificos = []) => {
    const esPersonalizado = destinatariosEspecificos.length > 0;
    switch (grupoId) {
        case 'todos':
            return { roles: ['Administrador', 'Directorio', 'Consulta'], deptos: esPersonalizado ? destinatariosEspecificos : null };
        case 'piso-1': case 'piso-2': case 'piso-3': case 'morosos': {
            const personas = personasDeGrupo(grupoId);
            const deptos = esPersonalizado ? destinatariosEspecificos : personas.map((p) => p.id);
            return { roles: ['Consulta'], deptos };
        }
        case 'personal': return { roles: [] }; // empleados no se loguean -> no reciben campanita
        case 'directorio': return { roles: ['Directorio'] };
        case 'admins': return { roles: ['Administrador'] };
        default: return { roles: [] };
    }
};

// Comunicados del mes (semillas que reproducen el mockup "Comunicados enviados").
export const COMUNICADOS_MOCK = [
    {
        id: 'CO-0005', fecha: '09/11/2026 09:15', titulo: 'Mantenimiento del ascensor',
        mensaje: 'Estimados copropietarios, el ascensor estara fuera de servicio el 10 de noviembre de 08:00 a 12:00 por mantenimiento preventivo. Gracias por su comprension.',
        destinatarioId: 'todos', destinatariosEspecificos: [], canalesIds: ['app', 'correo'],
        prioridad: 'Importante', entregados: 9, totalDestinatarios: 9,
        estado: 'Enviado', adjunto: null, autor: 'Administrador',
    },
    {
        id: 'CO-0004', fecha: '07/11/2026 18:30', titulo: 'Corte programado de agua',
        mensaje: 'Se realizara un corte de agua programado el 09 de noviembre de 13:00 a 15:00 en el piso 1. Por favor, almacenen agua suficiente.',
        destinatarioId: 'piso-1', destinatariosEspecificos: [], canalesIds: ['app', 'correo'],
        prioridad: 'Importante', entregados: 2, totalDestinatarios: 3,
        estado: 'Parcial', adjunto: null, autor: 'Administrador',
    },
    {
        id: 'CO-0003', fecha: '05/11/2026 12:00', titulo: 'Recordatorio de expensas',
        mensaje: 'Les recordamos que las expensas del mes vencen el 10 de noviembre. Por favor regularicen su situacion para evitar moras.',
        destinatarioId: 'morosos', destinatariosEspecificos: [], canalesIds: ['app', 'correo'],
        prioridad: 'Urgente', entregados: 3, totalDestinatarios: 3,
        estado: 'Enviado', adjunto: null, autor: 'Administrador',
    },
    {
        id: 'CO-0002', fecha: '03/11/2026 16:45', titulo: 'Reunion del directorio',
        mensaje: 'Se convoca a los miembros del directorio a reunion ordinaria el viernes 7 de noviembre a las 19:00 en la sala comunal.',
        destinatarioId: 'directorio', destinatariosEspecificos: [], canalesIds: ['app'],
        prioridad: 'Normal', entregados: 1, totalDestinatarios: 1,
        estado: 'Enviado', adjunto: null, autor: 'Administrador',
    },
    {
        id: 'CO-0001', fecha: '12/11/2026 08:00', titulo: 'Fumigacion de areas comunes',
        mensaje: 'Se realizara fumigacion de areas comunes el 13 de noviembre de 08:00 a 10:00. No se preocupen, se usan productos no toxicos.',
        destinatarioId: 'todos', destinatariosEspecificos: [], canalesIds: ['app', 'correo'],
        prioridad: 'Normal', entregados: null, totalDestinatarios: 9,
        estado: 'Programado', adjunto: null, autor: 'Administrador',
        fechaProgramada: new Date('2026-11-12T08:00:00').toISOString(),
    },
];

// Borradores (funcionalidad "Guardar borrador" real).
export const BORRADORES_MOCK = [];

// ----- Helpers de mutacion -----

const siguienteCodigo = () => {
    const nums = COMUNICADOS_MOCK
        .map((c) => Number(String(c.id).replace(/\D/g, '')) || 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `CO-${String(next).padStart(4, '0')}`;
};

const fechaBonitaDesde = (d = new Date()) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// Envia un comunicado: lo agrega al historial y dispara notificaciones in-app.
export const enviarComunicado = ({ titulo, mensaje, destinatarioId, destinatariosEspecificos, canalesIds, prioridad, adjunto, autor = 'Administrador' }) => {
    const id = siguienteCodigo();
    const grupo = grupoPorId(destinatarioId);
    const total = destinatariosEspecificos?.length > 0 ? destinatariosEspecificos.length : (grupo?.count ?? 0);

    const comunicado = {
        id, fecha: fechaBonitaDesde(), titulo, mensaje,
        destinatarioId, destinatariosEspecificos: destinatariosEspecificos || [],
        canalesIds, prioridad,
        entregados: total, totalDestinatarios: total,
        estado: 'Enviado', adjunto: adjunto?.name ?? null, autor,
    };
    COMUNICADOS_MOCK.unshift(comunicado);

    // Si el canal 'app' esta elegido, pusheamos notificacion para los destinatarios.
    if (canalesIds.includes('app')) {
        const criterio = criterioNotificacionDelGrupo(destinatarioId, destinatariosEspecificos);
        pushNotificacion({
            titulo: `Nuevo comunicado: ${titulo}`,
            mensaje: mensaje.slice(0, 120) + (mensaje.length > 120 ? '...' : ''),
            prioridad, comunicadoId: id,
            paraRoles: criterio.roles, paraDeptos: criterio.deptos,
            ruta: '/comunicados/enviados',
        });
    }
    return comunicado;
};

// Programa un comunicado para enviarse en fechaProgramada (ISO string).
export const programarComunicado = (data) => {
    const id = siguienteCodigo();
    const grupo = grupoPorId(data.destinatarioId);
    const total = data.destinatariosEspecificos?.length > 0 ? data.destinatariosEspecificos.length : (grupo?.count ?? 0);
    const comunicado = {
        id,
        fecha: fechaBonitaDesde(new Date(data.fechaProgramada)),
        titulo: data.titulo, mensaje: data.mensaje,
        destinatarioId: data.destinatarioId,
        destinatariosEspecificos: data.destinatariosEspecificos || [],
        canalesIds: data.canalesIds, prioridad: data.prioridad,
        entregados: null, totalDestinatarios: total,
        estado: 'Programado', adjunto: data.adjunto?.name ?? null, autor: data.autor ?? 'Administrador',
        fechaProgramada: data.fechaProgramada,
    };
    COMUNICADOS_MOCK.unshift(comunicado);
    return comunicado;
};

// Busca comunicados programados cuya fecha ya paso y los dispara.
// Se llama desde el hook useNotificaciones cada ~10s.
export const procesarProgramadosVencidos = () => {
    const ahora = Date.now();
    let disparados = 0;
    COMUNICADOS_MOCK.forEach((c) => {
        if (c.estado === 'Programado' && c.fechaProgramada) {
            const t = new Date(c.fechaProgramada).getTime();
            if (t <= ahora) {
                c.estado = 'Enviado';
                c.entregados = c.totalDestinatarios;
                c.fecha = fechaBonitaDesde();
                if (c.canalesIds.includes('app')) {
                    const criterio = criterioNotificacionDelGrupo(c.destinatarioId, c.destinatariosEspecificos);
                    pushNotificacion({
                        titulo: `Comunicado programado enviado: ${c.titulo}`,
                        mensaje: c.mensaje.slice(0, 120) + (c.mensaje.length > 120 ? '...' : ''),
                        prioridad: c.prioridad, comunicadoId: c.id,
                        paraRoles: criterio.roles, paraDeptos: criterio.deptos,
                        ruta: '/comunicados/enviados',
                    });
                }
                disparados++;
            }
        }
    });
    return disparados;
};

// ----- Borradores -----

export const guardarBorrador = ({ id, titulo, mensaje, destinatarioId, destinatariosEspecificos, canalesIds, prioridad, adjunto }) => {
    const data = {
        id: id ?? `BR-${String(BORRADORES_MOCK.length + 1).padStart(4, '0')}`,
        titulo, mensaje, destinatarioId,
        destinatariosEspecificos: destinatariosEspecificos || [],
        canalesIds, prioridad, adjunto: adjunto?.name ?? null,
        fechaGuardado: fechaBonitaDesde(),
    };
    const idx = BORRADORES_MOCK.findIndex((b) => b.id === data.id);
    if (idx >= 0) BORRADORES_MOCK[idx] = data;
    else BORRADORES_MOCK.unshift(data);
    return data;
};
export const eliminarBorrador = (id) => {
    const idx = BORRADORES_MOCK.findIndex((b) => b.id === id);
    if (idx >= 0) BORRADORES_MOCK.splice(idx, 1);
};

// Resumen reactivo: se calcula desde el array para que si se agregan comunicados
// desde la UI, los numeros de arriba se actualicen al toque.
export const calcularResumenComunicados = () => {
    const enviadosOParciales = COMUNICADOS_MOCK.filter((c) => c.entregados != null);
    const totalEntregados = enviadosOParciales.reduce((s, c) => s + (c.entregados || 0), 0);
    const totalDestin = enviadosOParciales.reduce((s, c) => s + (c.totalDestinatarios || 0), 0);
    return {
        enviados: COMUNICADOS_MOCK.filter((c) => c.estado !== 'Programado').length,
        programados: COMUNICADOS_MOCK.filter((c) => c.estado === 'Programado').length,
        porcentajeEntrega: totalDestin > 0 ? Math.round((totalEntregados / totalDestin) * 100) : 0,
        pendientesOFallidos: COMUNICADOS_MOCK.filter((c) => c.estado === 'Parcial' || c.estado === 'Fallido').length,
        destinatariosAlcanzados: totalEntregados,
    };
};