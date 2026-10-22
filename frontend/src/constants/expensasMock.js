// Datos de prueba de expensas mensuales. Se reemplazaran con los del backend.
// Montos en bolivianos (Bs).

import { PERIODOS } from './finanzasMock';
import { EXPENSA_BASE } from './configuracionMock';

export { PERIODOS };

// Tarifa fija por tipo de departamento (se toma de la configuracion financiera)
export const TARIFAS = EXPENSA_BASE;

// NOTA: RESUMEN_EXPENSAS ya NO se usa; los totales se calculan en vivo en Expensas.jsx
//   totalGenerado = sum(EXPENSAS_MOCK.monto en el periodo)
//   pagado        = sum(PAGOS_MOCK.monto en el periodo)
//   pendiente     = totalGenerado - pagado

// Expensas ya generadas (listado). monto = base + agua. estado: 'Pendiente' | 'Pagado'
// Cada expensa guarda la lectura anterior y la actual del medidor; la "actual" del mes previo
// se usa como "anterior" del siguiente mes al generar.
// Este array se muta cuando se registra una nueva generacion de expensas.
export const EXPENSAS_MOCK = [
    { id: 1, departamento: 'Depto. 101', tipo: 'A', periodo: 'Octubre 2026', base: 300, agua: 15, monto: 315, estado: 'Pendiente', lecturaAnterior: 3940, lecturaActual: 3945 },
    { id: 2, departamento: 'Depto. 102', tipo: 'B', periodo: 'Octubre 2026', base: 350, agua: 15, monto: 365, estado: 'Pagado', lecturaAnterior: 2180, lecturaActual: 2185 },
    { id: 3, departamento: 'Depto. 103', tipo: 'C', periodo: 'Octubre 2026', base: 400, agua: 15, monto: 415, estado: 'Pendiente', lecturaAnterior: 1522, lecturaActual: 1527 },
];

// Departamentos activos para "Generar expensas".
// base = expensa fija del tipo; lecturaAnterior = ultima lectura del medidor de agua.
export const DEPARTAMENTOS_ACTIVOS = [
    { departamento: '101', tipo: 'A', estado: 'Pendiente', base: EXPENSA_BASE.A, lecturaAnterior: 3940 },
    { departamento: '102', tipo: 'B', estado: 'Pendiente', base: EXPENSA_BASE.B, lecturaAnterior: 2180 },
    { departamento: '103', tipo: 'C', estado: 'Pendiente', base: EXPENSA_BASE.C, lecturaAnterior: 1522 },
];

export const ESTADOS_EXPENSA = ['Todos', 'Pendiente', 'Pagado'];