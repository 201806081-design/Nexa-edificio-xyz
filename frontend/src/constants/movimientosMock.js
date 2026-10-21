// Datos de prueba de ingresos y gastos del edificio. Montos en Bs.
//
// IMPORTANTE: aqui NO van los pagos de expensas (van en pagosMock.PAGOS_MOCK)
// ni los anticipos (van en pagosMock.HISTORIAL_ANTICIPOS).
// Aqui van:
//   - EGRESOS (gastos operativos del edificio: electricidad, mantenimiento, limpieza, etc.)
//   - OTROS INGRESOS NO-EXPENSA (alquiler de areas comunes, multas, intereses bancarios, etc.)

import { PERIODOS } from './finanzasMock';
export { PERIODOS };

// Totales operativos del mes (sin expensas — esas estan en Pagos)
export const RESUMEN_MOVIMIENTOS = {
    totalIngresos: 1335,  // otros ingresos del periodo (no incluye expensas ni anticipos)
    totalGastos: 7950,    // gastos operativos del periodo
    balance: -6615,       // resultado operativo (los gastos se cubren con las expensas que vienen de Pagos)
};

// Opciones de los selectores del formulario y filtros
export const TIPOS_MOVIMIENTO = ['Todos', 'Ingreso', 'Gasto'];
export const CATEGORIAS = ['Mantenimiento', 'Servicios basicos', 'Limpieza', 'Seguridad', 'Administracion', 'Otros'];

// Movimientos registrados. tipo: 'Ingreso' | 'Gasto'
export const MOVIMIENTOS_LISTA = [
    // --- OTROS INGRESOS (no son pagos de expensas) ---
    { id: 4, fecha: '05/10/2026', tipo: 'Ingreso', categoria: 'Otros', descripcion: 'Alquiler salon de eventos', monto: 500, comprobante: 'recibo_salon_05oct.pdf', codigo: 'MOV-2026-10-005' },
    { id: 5, fecha: '12/10/2026', tipo: 'Ingreso', categoria: 'Otros', descripcion: 'Multa por mora — Dpto. 203', monto: 150, comprobante: 'multa_dpto203.pdf', codigo: 'MOV-2026-10-006' },
    { id: 6, fecha: '16/10/2026', tipo: 'Ingreso', categoria: 'Otros', descripcion: 'Alquiler parrillero', monto: 200, comprobante: 'recibo_parrillero.pdf', codigo: 'MOV-2026-10-007' },
    { id: 7, fecha: '25/10/2026', tipo: 'Ingreso', categoria: 'Otros', descripcion: 'Alquiler salon de eventos', monto: 400, comprobante: 'recibo_salon_25oct.pdf', codigo: 'MOV-2026-10-008' },
    { id: 8, fecha: '28/10/2026', tipo: 'Ingreso', categoria: 'Otros', descripcion: 'Interes bancario cuenta de reserva', monto: 85, comprobante: 'estado_cuenta_banco.pdf', codigo: 'MOV-2026-10-009' },

    // --- EGRESOS operativos (varias categorias) ---
    { id: 2, fecha: '03/10/2026', tipo: 'Gasto', categoria: 'Mantenimiento', descripcion: 'Reparacion del ascensor', monto: 3000, comprobante: 'factura_ascensor.pdf', codigo: 'MOV-2026-10-003' },
    { id: 3, fecha: '04/10/2026', tipo: 'Gasto', categoria: 'Servicios basicos', descripcion: 'Pago de electricidad', monto: 1000, comprobante: 'factura_luz.pdf', codigo: 'MOV-2026-10-004' },
    { id: 9, fecha: '06/10/2026', tipo: 'Gasto', categoria: 'Servicios basicos', descripcion: 'Pago de agua potable', monto: 650, comprobante: 'factura_agua.pdf', codigo: 'MOV-2026-10-010' },
    { id: 10, fecha: '08/10/2026', tipo: 'Gasto', categoria: 'Servicios basicos', descripcion: 'Internet comun del edificio', monto: 320, comprobante: 'factura_internet.pdf', codigo: 'MOV-2026-10-011' },
    { id: 11, fecha: '11/10/2026', tipo: 'Gasto', categoria: 'Mantenimiento', descripcion: 'Mantenimiento bomba de agua', monto: 450, comprobante: 'factura_bomba.pdf', codigo: 'MOV-2026-10-012' },
    { id: 12, fecha: '14/10/2026', tipo: 'Gasto', categoria: 'Limpieza', descripcion: 'Productos de limpieza', monto: 280, comprobante: 'factura_limpieza.pdf', codigo: 'MOV-2026-10-013' },
    { id: 13, fecha: '16/10/2026', tipo: 'Gasto', categoria: 'Seguridad', descripcion: 'Honorarios portero octubre', monto: 1500, comprobante: 'recibo_portero.pdf', codigo: 'MOV-2026-10-014' },
    { id: 14, fecha: '22/10/2026', tipo: 'Gasto', categoria: 'Administracion', descripcion: 'Honorarios administracion octubre', monto: 600, comprobante: 'factura_admin.pdf', codigo: 'MOV-2026-10-015' },
    { id: 15, fecha: '28/10/2026', tipo: 'Gasto', categoria: 'Servicios basicos', descripcion: 'Gas comun del edificio', monto: 150, comprobante: 'factura_gas.pdf', codigo: 'MOV-2026-10-016' },
];