// Datos de prueba del modulo Finanzas. Se reemplazaran con los del backend.
// Todos los montos estan en bolivianos (Bs).

// Periodo seleccionado por defecto y opciones del selector
export const PERIODO_ACTUAL = 'Octubre 2026';
export const PERIODOS = ['Octubre 2026', 'Septiembre 2026', 'Agosto 2026', 'Julio 2026'];

// Indicadores (KPIs) del periodo actual
export const RESUMEN_MOCK = {
    ingresos: 8500,
    gastos: 3200,
    balance: 5300,        // ingresos - gastos
    saldoPendiente: 3700, // expensas por cobrar
};

// Ingresos vs. gastos por mes (para el grafico de barras)
export const INGRESOS_GASTOS_MOCK = [
    { mes: 'Jul', ingresos: 6200, gastos: 2800 },
    { mes: 'Ago', ingresos: 7400, gastos: 3100 },
    { mes: 'Sep', ingresos: 9100, gastos: 3600 },
    { mes: 'Oct', ingresos: 8500, gastos: 3200 },
];

// Estado de expensas (para el grafico de dona), en porcentaje
export const ESTADO_EXPENSAS_MOCK = [
    { estado: 'Pagadas', valor: 60, color: '#2E9D78' },
    { estado: 'Pendientes', valor: 25, color: '#E8A33D' },
    { estado: 'Vencidas', valor: 15, color: '#D64545' },
];

// Departamentos con mora
export const DEPARTAMENTOS_MORA_MOCK = [
    { id: 1, departamento: 'Depto. 101', estado: 'Vencida', monto: 357 },
    { id: 2, departamento: 'Depto. 304', estado: 'Vencida', monto: 714 },
    { id: 3, departamento: 'Depto. 405', estado: 'Vencida', monto: 520 },
];

// Ultimos movimientos economicos. tipo: 'ingreso' | 'egreso'
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