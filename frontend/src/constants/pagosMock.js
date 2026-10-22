// Datos de prueba de pagos de expensas (HU-FI-02). Montos en Bs.

import { PERIODOS } from './finanzasMock';
export { PERIODOS };

// Tarjetas de resumen del historial de pagos (deprecado: se calcula en vivo en Pagos.jsx)
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
// pagadoPor / medio / referencia alimentan el modal "Ver detalle del pago".
export const PAGOS_MOCK = [
    { id: 'PG-0042', fecha: '19/10/2026', depto: '203', responsable: 'Carlos Mendoza', pagadoPor: 'Carlos Mendoza', medio: 'Transferencia', referencia: 'TRF-241019-203', periodoAplicado: 'Ago. / Sep. 2026', monto: 450, saldoPosterior: 149, estado: 'Parcial' },
    { id: 'PG-0041', fecha: '18/10/2026', depto: '101', responsable: 'Ana Lopez', pagadoPor: 'Ana Lopez', medio: 'Transferencia', referencia: 'TRF-241018-101', periodoAplicado: 'Octubre 2026', monto: 315, saldoPosterior: 0, estado: 'Completo' },
    { id: 'PG-0040', fecha: '17/10/2026', depto: '302', responsable: 'Maria Rojas', pagadoPor: 'Maria Rojas', medio: 'QR', referencia: 'QR-241017-302', periodoAplicado: 'Octubre 2026', monto: 415, saldoPosterior: 0, estado: 'Completo' },
    { id: 'PG-0039', fecha: '16/10/2026', depto: '102', responsable: 'Luis Garcia', pagadoPor: 'Luis Garcia', medio: 'Efectivo', referencia: 'EF-241016-102', periodoAplicado: 'Octubre 2026', monto: 200, saldoPosterior: 165, estado: 'Parcial' },
    { id: 'PG-0038', fecha: '15/10/2026', depto: '201', responsable: 'Sofia Flores', pagadoPor: 'Sofia Flores', medio: 'Transferencia', referencia: 'TRF-241015-201', periodoAplicado: 'Septiembre 2026', monto: 350, saldoPosterior: 0, estado: 'Completo' },
];

// ============================================================
//  PAGOS ANTICIPADOS (movido desde Mora - HU-FI-05)
// ============================================================

export const RESUMEN_ANTICIPOS = {
    recibidos: 2700,   // deprecado: se calcula en vivo en Pagos.jsx
    aplicado: 1200,
    disponible: 1500,
};

export const ESTADOS_ANTICIPO = ['Todos', 'Disponible', 'Parcial', 'Aplicado'];

// Departamentos para registrar un anticipo. creditoAnterior = saldo a favor ya existente.
export const DEPARTAMENTOS_ANTICIPO = [
    { id: '303', etiqueta: '303 — Maria Rojas', saldoPendiente: 0, creditoAnterior: 0 },
    { id: '101', etiqueta: '101 — Ana Lopez', saldoPendiente: 0, creditoAnterior: 350 },
    { id: '202', etiqueta: '202 — Luis Perez', saldoPendiente: 0, creditoAnterior: 300 },
];

// Historial de anticipos.
// recibido  = monto depositado por adelantado por el depto
// aplicado  = cuanto de ese anticipo ya se descuento para pagar expensas
// credito   = saldo a favor que todavia queda sin usar (recibido - aplicado)
// estado:
//   'Disponible' = recibido completo + aplicado 0; todo el saldo esta a favor sin usar
//   'Parcial'    = parte del anticipo YA se aplico a expensas; queda saldo a favor
//   'Aplicado'   = anticipo totalmente consumido en expensas (sin saldo a favor)
// 'notas' alimenta la seccion "Movimientos aplicados" del modal de detalle.
export const HISTORIAL_ANTICIPOS = [
    { id: 'PA-0012', fecha: '19/10/2026', depto: '303', responsable: 'Maria Rojas', pagadoPor: 'Maria Rojas', medio: 'Transferencia', referencia: 'TRF-241019-303', recibido: 500, aplicado: 0, credito: 500, estado: 'Disponible', notas: 'Deposito voluntario para cubrir las expensas de los proximos meses.' },
    { id: 'PA-0011', fecha: '12/10/2026', depto: '101', responsable: 'Ana Lopez', pagadoPor: 'Ana Lopez', medio: 'Transferencia', referencia: 'TRF-241012-101', recibido: 700, aplicado: 350, credito: 350, estado: 'Parcial', notas: 'Se aplico Bs 350 a la expensa de Octubre 2026. Queda Bs 350 a favor.' },
    { id: 'PA-0010', fecha: '03/10/2026', depto: '202', responsable: 'Luis Perez', pagadoPor: 'Luis Perez', medio: 'Transferencia', referencia: 'TRF-241003-202', recibido: 1500, aplicado: 1200, credito: 300, estado: 'Parcial', notas: 'Se aplicaron Bs 600 a Septiembre 2026 y Bs 600 a Octubre 2026. Queda Bs 300 a favor.' },
    { id: 'PA-0009', fecha: '28/09/2026', depto: '201', responsable: 'Marco Vargas', pagadoPor: 'Marco Vargas', medio: 'Efectivo', referencia: 'EF-240928-201', recibido: 300, aplicado: 300, credito: 0, estado: 'Aplicado', notas: 'Totalmente consumido en la expensa de Septiembre 2026.' },
];