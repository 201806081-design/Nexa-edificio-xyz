// Mock de comunicados del edificio (HU-CO-01).
// Los destinatarios se derivan de otros mocks (DEPARTAMENTOS_ACTIVOS, EXPENSAS_MOCK,
// EMPLEADOS_MOCK) para que no haya datos inventados ni inconsistencias con el resto
// del sistema: "Morosos" es el conteo real de deptos con expensas no pagadas,
// "Personal del edificio" es el conteo real de empleados activos, etc.

import { DEPARTAMENTOS_ACTIVOS, EXPENSAS_MOCK } from './expensasMock';
import { EMPLEADOS_MOCK } from './personalMock';

export const PRIORIDADES = ['Normal', 'Importante', 'Urgente'];

export const ESTADOS_COMUNICADO = ['Todos', 'Enviado', 'Parcial', 'Programado', 'Fallido'];

// Canales de envio y su estado tecnico (reproduce el mockup 01/02).
// 'disponible'    -> seleccionable
// 'en integracion' -> deshabilitado pero visible
// 'no configurado' -> deshabilitado pero visible
export const CANALES = [
    { id: 'app', nombre: 'Notificacion en la aplicacion', estado: 'disponible', etiqueta: 'App' },
    { id: 'correo', nombre: 'Correo electronico', estado: 'disponible', etiqueta: 'Correo' },
    { id: 'whatsapp', nombre: 'WhatsApp', estado: 'en integracion', etiqueta: 'WhatsApp' },
    { id: 'sms', nombre: 'SMS', estado: 'no configurado', etiqueta: 'SMS' },
];
export const canalPorId = (id) => CANALES.find((c) => c.id === id);
export const canalEstaDisponible = (id) => canalPorId(id)?.estado === 'disponible';

// Grupos de destinatarios DERIVADOS de los mocks compartidos. Cada vez que se llama
// reconsulta los arrays actuales, asi los conteos reflejan los cambios reales
// (ej. si se pagan todas las moras, el grupo "Morosos" baja a 0).
export const gruposDestinatarios = () => {
    const porPiso = { '1': [], '2': [], '3': [] };
    DEPARTAMENTOS_ACTIVOS.forEach((d) => {
        const piso = String(d.id).charAt(0);
        if (porPiso[piso]) porPiso[piso].push(d.id);
    });
    // Morosos = deptos con alguna expensa no pagada
    const morososIds = [...new Set(
        EXPENSAS_MOCK
            .filter((e) => e.estado !== 'Pagada' && (e.total || e.monto || 0) > (e.pagado || 0))
            .map((e) => e.depto)
    )];

    return [
        { id: 'todos', etiqueta: 'Todos los copropietarios', count: DEPARTAMENTOS_ACTIVOS.length, descripcion: 'Envia a los 9 departamentos del edificio' },
        { id: 'piso-1', etiqueta: 'Piso 1', count: porPiso['1'].length, descripcion: `Deptos ${porPiso['1'].join(', ')}` },
        { id: 'piso-2', etiqueta: 'Piso 2', count: porPiso['2'].length, descripcion: `Deptos ${porPiso['2'].join(', ')}` },
        { id: 'piso-3', etiqueta: 'Piso 3', count: porPiso['3'].length, descripcion: `Deptos ${porPiso['3'].join(', ')}` },
        { id: 'morosos', etiqueta: 'Morosos', count: morososIds.length, descripcion: morososIds.length ? `Deptos ${morososIds.join(', ')}` : 'Sin morosos este periodo' },
        { id: 'personal', etiqueta: 'Personal del edificio', count: EMPLEADOS_MOCK.filter((e) => e.estado === 'Activo').length, descripcion: 'Empleados activos del edificio' },
        { id: 'directorio', etiqueta: 'Directorio', count: 1, descripcion: 'Miembros del directorio' },
    ];
};
export const grupoPorId = (id) => gruposDestinatarios().find((g) => g.id === id);

// Comunicados del mes (semillas que reproducen el mockup "Comunicados enviados").
// Los destinatarioId referencian los grupos definidos arriba; totalDestinatarios
// se calcula tomando el conteo del grupo al momento del envio (se guarda fijo).
export const COMUNICADOS_MOCK = [
    {
        id: 'CO-0005', fecha: '09/11/2026 09:15', titulo: 'Mantenimiento del ascensor',
        mensaje: 'Estimados copropietarios, el ascensor estara fuera de servicio el 10 de noviembre de 08:00 a 12:00 por mantenimiento preventivo. Gracias por su comprension.',
        destinatarioId: 'todos', canalesIds: ['app', 'correo'],
        prioridad: 'Importante', entregados: 9, totalDestinatarios: 9,
        estado: 'Enviado', adjunto: 'aviso_mantenimiento.pdf',
        autor: 'Administrador',
    },
    {
        id: 'CO-0004', fecha: '07/11/2026 18:30', titulo: 'Corte programado de agua',
        mensaje: 'Se realizara un corte de agua programado el 09 de noviembre de 13:00 a 15:00 en el piso 1. Por favor, almacenen agua suficiente.',
        destinatarioId: 'piso-1', canalesIds: ['app', 'correo'],
        prioridad: 'Importante', entregados: 2, totalDestinatarios: 3,
        estado: 'Parcial', adjunto: null,
        autor: 'Administrador',
    },
    {
        id: 'CO-0003', fecha: '05/11/2026 12:00', titulo: 'Recordatorio de expensas',
        mensaje: 'Les recordamos que las expensas del mes vencen el 10 de noviembre. Por favor regularicen su situacion para evitar moras.',
        destinatarioId: 'morosos', canalesIds: ['app', 'correo'],
        prioridad: 'Urgente', entregados: 3, totalDestinatarios: 3,
        estado: 'Enviado', adjunto: null,
        autor: 'Administrador',
    },
    {
        id: 'CO-0002', fecha: '03/11/2026 16:45', titulo: 'Reunion del directorio',
        mensaje: 'Se convoca a los miembros del directorio a reunion ordinaria el viernes 7 de noviembre a las 19:00 en la sala comunal.',
        destinatarioId: 'directorio', canalesIds: ['app'],
        prioridad: 'Normal', entregados: 1, totalDestinatarios: 1,
        estado: 'Enviado', adjunto: 'agenda_reunion.pdf',
        autor: 'Administrador',
    },
    {
        id: 'CO-0001', fecha: '12/11/2026 08:00', titulo: 'Fumigacion de areas comunes',
        mensaje: 'Se realizara fumigacion de areas comunes el 13 de noviembre de 08:00 a 10:00. No se preocupen, se usan productos no toxicos.',
        destinatarioId: 'todos', canalesIds: ['app', 'correo'],
        prioridad: 'Normal', entregados: null, totalDestinatarios: 9,
        estado: 'Programado', adjunto: null,
        autor: 'Administrador',
    },
];

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