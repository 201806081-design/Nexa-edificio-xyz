// Datos de prueba de ingresos y gastos del edificio. Montos en Bs.

import { PERIODOS } from './finanzasMock';
export { PERIODOS };

// Totales de la parte superior de la lista
export const RESUMEN_MOVIMIENTOS = {
    totalIngresos: 8500,
    totalGastos: 3200,
    balance: 3700,
};

// Opciones de los selectores del formulario y filtros
export const TIPOS_MOVIMIENTO = ['Todos', 'Ingreso', 'Gasto'];
export const CATEGORIAS = ['Expensas', 'Mantenimiento', 'Servicios basicos', 'Otros'];

// Movimientos registrados. tipo: 'Ingreso' | 'Gasto'
export const MOVIMIENTOS_LISTA = [
    { id: 1, fecha: '02/10/2026', tipo: 'Ingreso', categoria: 'Expensas', descripcion: 'Cobro de expensas', monto: 6800, comprobante: 'recibo_octubre.pdf', codigo: 'MOV-2026-10-001' },
    { id: 2, fecha: '03/10/2026', tipo: 'Gasto', categoria: 'Mantenimiento', descripcion: 'Reparacion del ascensor', monto: 3000, comprobante: 'factura_ascensor.pdf', codigo: 'MOV-2026-10-003' },
    { id: 3, fecha: '04/10/2026', tipo: 'Gasto', categoria: 'Servicios basicos', descripcion: 'Pago de electricidad', monto: 1000, comprobante: 'factura_luz.pdf', codigo: 'MOV-2026-10-004' },
];