// Datos de prueba del modulo Finanzas. Se reemplazaran con los del backend.
// Todos los montos estan en bolivianos (Bs).

// Periodo seleccionado por defecto y opciones del selector
// Incluye meses pasados (historicos) y futuros (para generar expensas).
export const PERIODO_ACTUAL = 'Octubre 2026';
export const PERIODOS = [
    // Futuros (disponibles para generar expensas)
    'Febrero 2027',
    'Enero 2027',
    'Diciembre 2026',
    'Noviembre 2026',
    // Actual + historicos
    'Octubre 2026',
    'Septiembre 2026',
    'Agosto 2026',
    'Julio 2026',
];

// --- NOTA: los siguientes RESUMEN_MOCK / INGRESOS_GASTOS_MOCK / etc. estan DEPRECADOS.
// Los dashboards ahora calculan todo en vivo desde los mocks reales (PAGOS_MOCK,
// HISTORIAL_ANTICIPOS, MOVIMIENTOS_LISTA, DEUDAS_VENCIDAS).
// Se mantienen para no romper imports antiguos; no se usan en pantallas actualizadas.

export const RESUMEN_MOCK = {
    ingresos: 8500, gastos: 3200, balance: 5300, saldoPendiente: 3700,
};
export const INGRESOS_GASTOS_MOCK = [
    { mes: 'Jul', ingresos: 6200, gastos: 2800 },
    { mes: 'Ago', ingresos: 7400, gastos: 3100 },
    { mes: 'Sep', ingresos: 9100, gastos: 3600 },
    { mes: 'Oct', ingresos: 8500, gastos: 3200 },
];
export const ESTADO_EXPENSAS_MOCK = [
    { estado: 'Pagadas', valor: 60, color: '#2E9D78' },
    { estado: 'Pendientes', valor: 25, color: '#E8A33D' },
    { estado: 'Vencidas', valor: 15, color: '#D64545' },
];
export const DEPARTAMENTOS_MORA_MOCK = [
    { id: 1, departamento: 'Depto. 101', estado: 'Vencida', monto: 357 },
    { id: 2, departamento: 'Depto. 304', estado: 'Vencida', monto: 714 },
    { id: 3, departamento: 'Depto. 405', estado: 'Vencida', monto: 520 },
];
export const MOVIMIENTOS_MOCK = [
    { id: 1, tipo: 'ingreso', monto: 1700, descripcion: 'Cobro de expensas', fecha: '2026-10-15' },
    { id: 2, tipo: 'egreso', monto: 2000, descripcion: 'Reparacion del ascensor', fecha: '2026-10-12' },
    { id: 3, tipo: 'egreso', monto: 1200, descripcion: 'Pago de electricidad', fecha: '2026-10-10' },
];

// --- Helpers ---

// Formatea un monto como "Bs 8.500" (separador de miles con punto)
export function formatBs(monto) {
    return `Bs ${Number(monto).toLocaleString('es-BO')}`;
}

// '2026-10-15' -> '15 oct 2026'
const MESES_ABREV = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export function formatFechaCorta(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${Number(d)} ${MESES_ABREV[Number(m) - 1]} ${y}`;
}