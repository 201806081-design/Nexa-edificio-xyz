// Datos de prueba de expensas mensuales. Se reemplazaran con los del backend.
// Montos en bolivianos (Bs).

import { PERIODOS } from './finanzasMock';

export { PERIODOS };

// Tarifa fija por tipo de departamento (para el monto automatico del asistente)
export const TARIFAS = { A: 300, B: 350, C: 400 };

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

// Departamentos activos para la vista previa del asistente "Generar expensas"
export const DEPARTAMENTOS_ACTIVOS = [
    { departamento: '101', tipo: 'A', estado: 'Pendiente', expensa: TARIFAS.A },
    { departamento: '102', tipo: 'B', estado: 'Pendiente', expensa: TARIFAS.B },
    { departamento: '103', tipo: 'C', estado: 'Pendiente', expensa: TARIFAS.C },
    { departamento: '201', tipo: 'A', estado: 'Pendiente', expensa: TARIFAS.A },
    { departamento: '202', tipo: 'B', estado: 'Pendiente', expensa: TARIFAS.B },
    { departamento: '203', tipo: 'C', estado: 'Pendiente', expensa: TARIFAS.C },
];

export const ESTADOS_EXPENSA = ['Todos', 'Pendiente', 'Pagado'];