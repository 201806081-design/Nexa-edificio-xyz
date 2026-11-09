// Datos de prueba de pagos de expensas (HU-FI-02). Montos en Bs.
// El sistema arranca en Octubre 2026: NO hay pagos ni anticipos de meses anteriores.
// Todo lo que esta aqui coincide con las expensas de Octubre 2026 (expensasMock.js):
//   - EX-0001 Depto 101 (Pagada 315) -> cubierta con anticipo PA-0011
//   - EX-0002 Depto 102 (pagado 200 de 365) -> PG-0039 Efectivo parcial
//   - EX-0004 Depto 201 (Pagada 318) -> PG-0041 Efectivo
//   - EX-0005 Depto 202 (Pagada 365) -> cubierta con anticipo PA-0010
//   - EX-0007 Depto 301 (Pagada 415) -> PG-0042 QR
//   - EX-0008 Depto 302 (Pagada 415) -> PG-0040 QR
//   - EX-0009 Depto 303 (Pagada 421) -> cubierta con anticipo PA-0012
//   - 103 y 203 no pagaron (las deudas las calcula deudasMock.js)
//
// El responsable NO se escribe aqui: se lee del edificio (edificioMock) segun el depto.
// pagadoPor si se guarda, porque es quien hizo el pago en ese momento.

import { PERIODOS } from './finanzasMock';
import { numerosDepto, vincularResponsable } from './edificioMock';
export { PERIODOS };

export const ESTADOS_PAGO = ['Todos', 'Completo', 'Parcial'];
// Filtro de deptos: sale del edificio (edificioMock)
export const DEPARTAMENTOS_PAGO = ['Todos', ...numerosDepto()];

export const MEDIOS_PAGO = ['Transferencia', 'Efectivo', 'QR', 'Cheque'];

// Historial de pagos (mas reciente primero).
// tipoDepto    -> chip Tipo A/B/C en "Datos del pago"
// composicion  -> desglose base/agua/m3Agua/mora por periodo
export const PAGOS_MOCK = [
    {
        id: 'PG-0042', fecha: '21/10/2026', depto: '301', tipoDepto: 'C',
        pagadoPor: 'Rocio Alba',
        medio: 'QR', referencia: 'QR-241021-301',
        periodoAplicado: 'Octubre 2026', monto: 415, saldoPosterior: 0, estado: 'Completo',
        composicion: [
            { periodo: 'Octubre 2026', tipo: 'C', base: 400, agua: 15, m3Agua: 3, mora: 0, mesesMora: 0, total: 415 },
        ],
    },
    {
        id: 'PG-0041', fecha: '20/10/2026', depto: '201', tipoDepto: 'A',
        pagadoPor: 'Sofia Flores',
        medio: 'Efectivo', referencia: 'EF-241020-201',
        periodoAplicado: 'Octubre 2026', monto: 318, saldoPosterior: 0, estado: 'Completo',
        composicion: [
            { periodo: 'Octubre 2026', tipo: 'A', base: 300, agua: 18, m3Agua: 6, mora: 0, mesesMora: 0, total: 318 },
        ],
    },
    {
        id: 'PG-0040', fecha: '17/10/2026', depto: '302', tipoDepto: 'C',
        pagadoPor: 'Maria Rojas',
        medio: 'QR', referencia: 'QR-241017-302',
        periodoAplicado: 'Octubre 2026', monto: 415, saldoPosterior: 0, estado: 'Completo',
        composicion: [
            { periodo: 'Octubre 2026', tipo: 'C', base: 400, agua: 15, m3Agua: 3, mora: 0, mesesMora: 0, total: 415 },
        ],
    },
    {
        id: 'PG-0039', fecha: '16/10/2026', depto: '102', tipoDepto: 'B',
        pagadoPor: 'Luis Garcia',
        medio: 'Efectivo', referencia: 'EF-241016-102',
        periodoAplicado: 'Octubre 2026', monto: 200, saldoPosterior: 165, estado: 'Parcial',
        composicion: [
            { periodo: 'Octubre 2026', tipo: 'B', base: 350, agua: 15, m3Agua: 5, mora: 0, mesesMora: 0, total: 365 },
        ],
    },
];

// ============================================================
//  PAGOS ANTICIPADOS (HU-FI-05)
//  credito = saldo a favor que queda para las proximas expensas
// ============================================================

export const ESTADOS_ANTICIPO = ['Todos', 'Disponible', 'Parcial', 'Aplicado'];

export const HISTORIAL_ANTICIPOS = [
    {
        id: 'PA-0012', fecha: '19/10/2026', depto: '303', tipoDepto: 'C',
        pagadoPor: 'Rafael Cruz',
        medio: 'Transferencia', referencia: 'TRF-241019-303',
        recibido: 500, aplicado: 421, credito: 79, estado: 'Parcial',
        aplicaciones: [
            {
                periodo: 'Octubre 2026', pagoRef: 'EX-0009', tipo: 'C',
                base: 400, agua: 21, m3Agua: 7, mora: 0, mesesMora: 0, total: 421, monto: 421,
            },
        ],
    },
    {
        id: 'PA-0011', fecha: '12/10/2026', depto: '101', tipoDepto: 'A',
        pagadoPor: 'Ana Lopez',
        medio: 'Transferencia', referencia: 'TRF-241012-101',
        recibido: 700, aplicado: 315, credito: 385, estado: 'Parcial',
        aplicaciones: [
            {
                periodo: 'Octubre 2026', pagoRef: 'EX-0001', tipo: 'A',
                base: 300, agua: 15, m3Agua: 3, mora: 0, mesesMora: 0, total: 315, monto: 315,
            },
        ],
    },
    {
        id: 'PA-0010', fecha: '03/10/2026', depto: '202', tipoDepto: 'B',
        pagadoPor: 'Luis Perez',
        medio: 'Transferencia', referencia: 'TRF-241003-202',
        recibido: 1500, aplicado: 365, credito: 1135, estado: 'Parcial',
        aplicaciones: [
            {
                periodo: 'Octubre 2026', pagoRef: 'EX-0005', tipo: 'B',
                base: 350, agua: 15, m3Agua: 4, mora: 0, mesesMora: 0, total: 365, monto: 365,
            },
        ],
    },
];

// El responsable de cada pago y anticipo se lee del edificio segun su depto
PAGOS_MOCK.forEach((p) => vincularResponsable(p));
HISTORIAL_ANTICIPOS.forEach((a) => vincularResponsable(a));
