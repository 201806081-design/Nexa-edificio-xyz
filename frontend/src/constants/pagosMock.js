// Datos de prueba de pagos de expensas (HU-FI-02). Montos en Bs.

import { PERIODOS } from './finanzasMock';
export { PERIODOS };

// Tarjetas de resumen del historial de pagos
export const RESUMEN_PAGOS = {
    cobradoOctubre: 7250,
    pagosRegistrados: 18,
    saldoRecuperado: 6840,
};

// Opciones de filtros
export const ESTADOS_PAGO = ['Todos', 'Completo', 'Parcial'];
export const DEPARTAMENTOS_PAGO = ['Todos', '101', '102', '201', '203', '302'];

// Historial de pagos. estado: 'Completo' | 'Parcial'
export const PAGOS_MOCK = [
    { id: 'PG-0042', fecha: '19/10/2026', depto: '203', responsable: 'Carlos Mendoza', periodoAplicado: 'Ago. / Sep. 2026', monto: 450, saldoPosterior: 149, estado: 'Parcial' },
    { id: 'PG-0041', fecha: '18/10/2026', depto: '101', responsable: 'Ana Lopez', periodoAplicado: 'Octubre 2026', monto: 315, saldoPosterior: 0, estado: 'Completo' },
    { id: 'PG-0040', fecha: '17/10/2026', depto: '302', responsable: 'Maria Rojas', periodoAplicado: 'Octubre 2026', monto: 415, saldoPosterior: 0, estado: 'Completo' },
    { id: 'PG-0039', fecha: '16/10/2026', depto: '102', responsable: 'Luis Garcia', periodoAplicado: 'Octubre 2026', monto: 200, saldoPosterior: 165, estado: 'Parcial' },
    { id: 'PG-0038', fecha: '15/10/2026', depto: '201', responsable: 'Sofia Flores', periodoAplicado: 'Septiembre 2026', monto: 350, saldoPosterior: 0, estado: 'Completo' },
];