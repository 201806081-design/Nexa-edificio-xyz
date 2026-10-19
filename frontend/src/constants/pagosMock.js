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

// Medios de pago para el formulario de registro
export const MEDIOS_PAGO = ['Transferencia', 'Efectivo', 'QR', 'Cheque'];

// Departamentos con deudas pendientes (para "Registrar pago").
// pendiente por periodo = totalDeuda - pagado
export const DEPARTAMENTOS_DEUDA = [
    {
        id: '203', etiqueta: '203 — Carlos Mendoza', responsable: 'Carlos Mendoza · Propietario', saldoPendiente: 599,
        deudas: [
            { periodo: 'Agosto 2026', totalDeuda: 366, pagado: 100, pendiente: 266 },
            { periodo: 'Septiembre 2026', totalDeuda: 333, pagado: 0, pendiente: 333 },
        ],
    },
    {
        id: '102', etiqueta: '102 — Luis Garcia', responsable: 'Luis Garcia · Inquilino', saldoPendiente: 365,
        deudas: [
            { periodo: 'Octubre 2026', totalDeuda: 365, pagado: 200, pendiente: 165 },
            { periodo: 'Septiembre 2026', totalDeuda: 350, pagado: 150, pendiente: 200 },
        ],
    },
];

// Historial de pagos. estado: 'Completo' | 'Parcial'
export const PAGOS_MOCK = [
    { id: 'PG-0042', fecha: '19/10/2026', depto: '203', responsable: 'Carlos Mendoza', periodoAplicado: 'Ago. / Sep. 2026', monto: 450, saldoPosterior: 149, estado: 'Parcial' },
    { id: 'PG-0041', fecha: '18/10/2026', depto: '101', responsable: 'Ana Lopez', periodoAplicado: 'Octubre 2026', monto: 315, saldoPosterior: 0, estado: 'Completo' },
    { id: 'PG-0040', fecha: '17/10/2026', depto: '302', responsable: 'Maria Rojas', periodoAplicado: 'Octubre 2026', monto: 415, saldoPosterior: 0, estado: 'Completo' },
    { id: 'PG-0039', fecha: '16/10/2026', depto: '102', responsable: 'Luis Garcia', periodoAplicado: 'Octubre 2026', monto: 200, saldoPosterior: 165, estado: 'Parcial' },
    { id: 'PG-0038', fecha: '15/10/2026', depto: '201', responsable: 'Sofia Flores', periodoAplicado: 'Septiembre 2026', monto: 350, saldoPosterior: 0, estado: 'Completo' },
];