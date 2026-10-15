// Datos de prueba de expensas mensuales. Se reemplazaran con los del backend.
// Montos en bolivianos (Bs).

import { PERIODOS } from './finanzasMock';
import { EXPENSA_BASE } from './configuracionMock';

export { PERIODOS };

// Tarifa fija por tipo de departamento (se toma de la configuracion financiera)
export const TARIFAS = EXPENSA_BASE;

// Resumen del periodo (tarjetas superiores de la lista)
export const RESUMEN_EXPENSAS = {
    totalGenerado: 10500,
    pendiente: 7000,
    pagado: 3500,
};

// Expensas ya generadas (listado). estado: 'Pendiente' | 'Pagado'
export const EXPENSAS_MOCK = [
    { id: 1, departamento: 'Depto. 101', periodo: 'Octubre 2026', monto: 350, estado: 'Pendiente' },
    { id: 2, departamento: 'Depto. 203', periodo: 'Octubre 2026', monto: 350, estado: 'Pagado' },
    { id: 3, departamento: 'Depto. 302', periodo: 'Octubre 2026', monto: 350, estado: 'Pendiente' },
];

// Departamentos activos para "Generar expensas".
// base = expensa fija del tipo; lecturaAnterior = ultima lectura del medidor de agua.
export const DEPARTAMENTOS_ACTIVOS = [
    { departamento: '101', tipo: 'A', estado: 'Pendiente', base: EXPENSA_BASE.A, lecturaAnterior: 3940 },
    { departamento: '102', tipo: 'B', estado: 'Pendiente', base: EXPENSA_BASE.B, lecturaAnterior: 2180 },
    { departamento: '103', tipo: 'C', estado: 'Pendiente', base: EXPENSA_BASE.C, lecturaAnterior: 1522 },
];

export const ESTADOS_EXPENSA = ['Todos', 'Pendiente', 'Pagado'];