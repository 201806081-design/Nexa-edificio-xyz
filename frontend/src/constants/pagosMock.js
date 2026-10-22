// Datos de prueba de pagos de expensas (HU-FI-02). Montos en Bs.

import { PERIODOS } from './finanzasMock';
export { PERIODOS };

export const RESUMEN_PAGOS = {
    cobradoOctubre: 7250,
    pagosRegistrados: 18,
    saldoRecuperado: 6840,
};

export const ESTADOS_PAGO = ['Todos', 'Completo', 'Parcial'];
export const DEPARTAMENTOS_PAGO = ['Todos', '101', '102', '201', '203', '302'];

export const MEDIOS_PAGO = ['Transferencia', 'Efectivo', 'QR', 'Cheque'];

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
    { id: 'PG-0042', fecha: '19/10/2026', depto: '203', responsable: 'Carlos Mendoza', pagadoPor: 'Carlos Mendoza', medio: 'Transferencia', referencia: 'TRF-241019-203', periodoAplicado: 'Ago. / Sep. 2026', monto: 450, saldoPosterior: 149, estado: 'Parcial' },
    { id: 'PG-0041', fecha: '18/10/2026', depto: '101', responsable: 'Ana Lopez', pagadoPor: 'Ana Lopez', medio: 'Transferencia', referencia: 'TRF-241018-101', periodoAplicado: 'Octubre 2026', monto: 315, saldoPosterior: 0, estado: 'Completo' },
    { id: 'PG-0040', fecha: '17/10/2026', depto: '302', responsable: 'Maria Rojas', pagadoPor: 'Maria Rojas', medio: 'QR', referencia: 'QR-241017-302', periodoAplicado: 'Octubre 2026', monto: 415, saldoPosterior: 0, estado: 'Completo' },
    { id: 'PG-0039', fecha: '16/10/2026', depto: '102', responsable: 'Luis Garcia', pagadoPor: 'Luis Garcia', medio: 'Efectivo', referencia: 'EF-241016-102', periodoAplicado: 'Octubre 2026', monto: 200, saldoPosterior: 165, estado: 'Parcial' },
    { id: 'PG-0038', fecha: '15/10/2026', depto: '201', responsable: 'Sofia Flores', pagadoPor: 'Sofia Flores', medio: 'Transferencia', referencia: 'TRF-241015-201', periodoAplicado: 'Septiembre 2026', monto: 350, saldoPosterior: 0, estado: 'Completo' },
];

// ============================================================
//  PAGOS ANTICIPADOS (HU-FI-05)
// ============================================================

export const RESUMEN_ANTICIPOS = {
    recibidos: 2700,
    aplicado: 1200,
    disponible: 1500,
};

export const ESTADOS_ANTICIPO = ['Todos', 'Disponible', 'Parcial', 'Aplicado'];

export const DEPARTAMENTOS_ANTICIPO = [
    { id: '303', etiqueta: '303 — Maria Rojas', saldoPendiente: 0, creditoAnterior: 0 },
    { id: '101', etiqueta: '101 — Ana Lopez', saldoPendiente: 0, creditoAnterior: 350 },
    { id: '202', etiqueta: '202 — Luis Perez', saldoPendiente: 0, creditoAnterior: 300 },
];

// Historial de anticipos.
// recibido  = monto depositado por adelantado
// aplicado  = suma de aplicaciones[].monto (lo que ya se descuento en expensas)
// credito   = recibido - aplicado (saldo que todavia queda a favor)
// aplicaciones[] alimenta la seccion de desglose del modal:
//   cada aplicacion lleva base + agua + m3Agua + (mora, mesesMora si hay)
//   para que se vea igual que la composicion del pago.
export const HISTORIAL_ANTICIPOS = [
    {
        id: 'PA-0012', fecha: '19/10/2026', depto: '303', tipoDepto: 'C',
        responsable: 'Maria Rojas', pagadoPor: 'Maria Rojas',
        medio: 'Transferencia', referencia: 'TRF-241019-303',
        recibido: 500, aplicado: 0, credito: 500, estado: 'Disponible',
        aplicaciones: [],
    },
    {
        id: 'PA-0011', fecha: '12/10/2026', depto: '101', tipoDepto: 'A',
        responsable: 'Ana Lopez', pagadoPor: 'Ana Lopez',
        medio: 'Transferencia', referencia: 'TRF-241012-101',
        recibido: 700, aplicado: 350, credito: 350, estado: 'Parcial',
        aplicaciones: [
            {
                periodo: 'Octubre 2026', pagoRef: 'EX-OCT-101', tipo: 'A',
                base: 300, agua: 50, m3Agua: 10, mora: 0, mesesMora: 0, monto: 350
            },
        ],
    },
    {
        id: 'PA-0010', fecha: '03/10/2026', depto: '202', tipoDepto: 'B',
        responsable: 'Luis Perez', pagadoPor: 'Luis Perez',
        medio: 'Transferencia', referencia: 'TRF-241003-202',
        recibido: 1500, aplicado: 750, credito: 750, estado: 'Parcial',
        aplicaciones: [
            {
                periodo: 'Septiembre 2026', pagoRef: 'EX-SEP-202', tipo: 'B',
                base: 350, agua: 25, m3Agua: 5, mora: 0, mesesMora: 0, monto: 375
            },
            {
                periodo: 'Octubre 2026', pagoRef: 'EX-OCT-202', tipo: 'B',
                base: 350, agua: 25, m3Agua: 5, mora: 0, mesesMora: 0, monto: 375
            },
        ],
    },
    {
        id: 'PA-0009', fecha: '28/09/2026', depto: '201', tipoDepto: 'B',
        responsable: 'Marco Vargas', pagadoPor: 'Marco Vargas',
        medio: 'Efectivo', referencia: 'EF-240928-201',
        recibido: 375, aplicado: 375, credito: 0, estado: 'Aplicado',
        aplicaciones: [
            {
                periodo: 'Septiembre 2026', pagoRef: 'EX-SEP-201', tipo: 'B',
                base: 350, agua: 25, m3Agua: 5, mora: 0, mesesMora: 0, monto: 375
            },
        ],
    },
];