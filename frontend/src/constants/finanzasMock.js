// Datos de prueba del modulo Finanzas. Se reemplazaran con los del backend.
// Todos los montos estan en bolivianos (Bs).

// Los periodos (meses) ya no se escriben aqui: ver periodos.js

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