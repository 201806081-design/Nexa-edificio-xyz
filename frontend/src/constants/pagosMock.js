// Datos de prueba de pagos de expensas (HU-FI-02). Montos en Bs.
// El sistema arranca en Octubre 2026 — NO hay pagos ni anticipos de meses anteriores.
// Todo lo que esta aqui matchea con las expensas de Octubre 2026 en expensasMock.js:
//   - EX-0001 Depto 101 (Pagada 315) → PG-0041 Transferencia
//   - EX-0005 Depto 202 (Pagada 365) → cubierta con anticipo PA-0010
//   - EX-0008 Depto 302 (Pagada 415) → PG-0040 QR
//   - EX-0002 Depto 102 (Lista, pagado 200/365) → PG-0039 Efectivo parcial

import { PERIODOS } from './finanzasMock';
export { PERIODOS };

export const RESUMEN_PAGOS = {
    cobradoOctubre: 930, // 315 + 415 + 200 (parcial 102) — PA-0010 no suma aqui
    pagosRegistrados: 3,
    saldoRecuperado: 0,
};

export const ESTADOS_PAGO = ['Todos', 'Completo', 'Parcial'];
export const DEPARTAMENTOS_PAGO = ['Todos', '101', '102', '202', '302'];

export const MEDIOS_PAGO = ['Transferencia', 'Efectivo', 'QR', 'Cheque'];

// Deptos con saldo pendiente (solo Octubre 2026). Se usa en Registrar pago
// para precargar el depto y ver cuanto le queda por pagar.
export const DEPARTAMENTOS_DEUDA = [
    {
        id: '102', etiqueta: '102 — Luis Garcia', responsable: 'Luis Garcia · Inquilino', saldoPendiente: 165,
        deudas: [
            { periodo: 'Octubre 2026', totalDeuda: 365, pagado: 200, pendiente: 165 },
        ],
    },
];

// Historial de pagos — SOLO Octubre 2026 (sistema nacio este mes).
// tipoDepto    → chip Tipo A/B/C en "Datos del pago"
// composicion  → desglose base/agua/m3Agua/mora por periodo
export const PAGOS_MOCK = [
    {
        id: 'PG-0041', fecha: '18/10/2026', depto: '101', tipoDepto: 'A',
        responsable: 'Ana Lopez', pagadoPor: 'Ana Lopez',
        medio: 'Transferencia', referencia: 'TRF-241018-101',
        periodoAplicado: 'Octubre 2026', monto: 315, saldoPosterior: 0, estado: 'Completo',
        composicion: [
            { periodo: 'Octubre 2026', tipo: 'A', base: 300, agua: 15, m3Agua: 3, mora: 0, mesesMora: 0, total: 315 },
        ],
    },
    {
        id: 'PG-0040', fecha: '17/10/2026', depto: '302', tipoDepto: 'C',
        responsable: 'Maria Rojas', pagadoPor: 'Maria Rojas',
        medio: 'QR', referencia: 'QR-241017-302',
        periodoAplicado: 'Octubre 2026', monto: 415, saldoPosterior: 0, estado: 'Completo',
        composicion: [
            { periodo: 'Octubre 2026', tipo: 'C', base: 400, agua: 15, m3Agua: 3, mora: 0, mesesMora: 0, total: 415 },
        ],
    },
    {
        id: 'PG-0039', fecha: '16/10/2026', depto: '102', tipoDepto: 'B',
        responsable: 'Luis Garcia', pagadoPor: 'Luis Garcia',
        medio: 'Efectivo', referencia: 'EF-241016-102',
        periodoAplicado: 'Octubre 2026', monto: 200, saldoPosterior: 165, estado: 'Parcial',
        composicion: [
            { periodo: 'Octubre 2026', tipo: 'B', base: 350, agua: 15, m3Agua: 3, mora: 0, mesesMora: 0, total: 365 },
        ],
    },
];

// ============================================================
//  PAGOS ANTICIPADOS (HU-FI-05) — SOLO Octubre 2026
// ============================================================

export const RESUMEN_ANTICIPOS = {
    recibidos: 2700,   // 500 + 700 + 1500
    aplicado: 715,     // 350 (PA-0011) + 365 (PA-0010 a Octubre)
    disponible: 1985,  // 500 + 350 + 1135
};

export const ESTADOS_ANTICIPO = ['Todos', 'Disponible', 'Parcial', 'Aplicado'];

export const DEPARTAMENTOS_ANTICIPO = [
    { id: '303', etiqueta: '303 — Rafael Cruz', saldoPendiente: 0, creditoAnterior: 500 },
    { id: '101', etiqueta: '101 — Ana Lopez', saldoPendiente: 0, creditoAnterior: 350 },
    { id: '202', etiqueta: '202 — Luis Perez', saldoPendiente: 0, creditoAnterior: 1135 },
];

export const HISTORIAL_ANTICIPOS = [
    {
        id: 'PA-0012', fecha: '19/10/2026', depto: '303', tipoDepto: 'C',
        responsable: 'Rafael Cruz', pagadoPor: 'Rafael Cruz',
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
                base: 300, agua: 50, m3Agua: 10, mora: 0, mesesMora: 0, total: 350, monto: 350
            },
        ],
    },
    {
        id: 'PA-0010', fecha: '03/10/2026', depto: '202', tipoDepto: 'B',
        responsable: 'Luis Perez', pagadoPor: 'Luis Perez',
        medio: 'Transferencia', referencia: 'TRF-241003-202',
        recibido: 1500, aplicado: 365, credito: 1135, estado: 'Parcial',
        aplicaciones: [
            {
                periodo: 'Octubre 2026', pagoRef: 'EX-OCT-202', tipo: 'B',
                base: 350, agua: 15, m3Agua: 4, mora: 0, mesesMora: 0, total: 365, monto: 365
            },
        ],
    },
];