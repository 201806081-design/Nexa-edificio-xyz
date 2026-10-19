// Datos de prueba de conciliacion bancaria (HU-FI-02). Montos en Bs.

import { PERIODOS } from './finanzasMock';
export { PERIODOS };

export const CUENTAS_BANCARIAS = ['Banco Union · 1024', 'Banco Mercantil · 7781'];
export const ESTADOS_CONCILIACION = ['Todos', 'Conciliado', 'Pendiente'];

// Movimientos del banco a conciliar con los pagos registrados.
// coincidencia: 'Exacta' | 'Sugerida' | 'Sin coincidencia'
// estado: 'Conciliado' | 'Pendiente'
export const MOVIMIENTOS_BANCARIOS = [
    { id: 1, fecha: '19/10', referencia: 'TRF-2841', monto: 450, pago: 'PG-0042', depto: '203', coincidencia: 'Exacta', estado: 'Conciliado' },
    { id: 2, fecha: '18/10', referencia: 'QR-9330', monto: 315, pago: 'PG-0041', depto: '101', coincidencia: 'Exacta', estado: 'Conciliado' },
    { id: 3, fecha: '17/10', referencia: 'DEP-771', monto: 415, pago: 'PG-0040', depto: '302', coincidencia: 'Sugerida', estado: 'Pendiente' },
    { id: 4, fecha: '16/10', referencia: 'TRF-0990', monto: 200, pago: null, depto: null, coincidencia: 'Sin coincidencia', estado: 'Pendiente' },
];