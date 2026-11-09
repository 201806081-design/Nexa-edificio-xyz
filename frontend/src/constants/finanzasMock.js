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