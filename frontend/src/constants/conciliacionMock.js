// Datos de prueba de conciliacion bancaria (HU-FI-02). Montos en Bs.
// Incluye INGRESOS (depositos, transferencias recibidas, QR) y EGRESOS (retiros,
// transferencias enviadas, debitos automaticos) para control contable completo.

import { PERIODOS } from './finanzasMock';
export { PERIODOS };

export const CUENTAS_BANCARIAS = ['Banco Union · 1024', 'Banco Mercantil · 7781'];
export const ESTADOS_CONCILIACION = ['Todos', 'Conciliado', 'Pendiente', 'Alerta'];
export const TIPOS_MOV_BANCO = ['Todos', 'Ingreso', 'Egreso'];

// Movimientos del banco a conciliar con los movimientos del sistema.
// tipo: 'Ingreso' | 'Egreso'
// coincidencia: 'Exacta' | 'Sugerida' | 'Sin coincidencia'
// estado: 'Conciliado' | 'Pendiente' | 'Alerta'   (Alerta = egreso sin coincidencia)
// sistemaRef: codigo del pago (PG-XXXX) o movimiento (MOV-XXXX) asociado, null si no hay
export const MOVIMIENTOS_BANCARIOS = [
    // ======== INGRESOS (depositos de residentes) ========
    // -- Pagos de expensas (PG-XXXX) --
    { id: 1, fecha: '19/10', tipo: 'Ingreso', referencia: 'TRF-2841', descripcion: 'Transferencia recibida — expensa', monto: 450, sistemaRef: 'PG-0042', depto: '203', coincidencia: 'Exacta', estado: 'Conciliado' },
    { id: 2, fecha: '18/10', tipo: 'Ingreso', referencia: 'QR-9330', descripcion: 'Pago por QR — expensa', monto: 315, sistemaRef: 'PG-0041', depto: '101', coincidencia: 'Exacta', estado: 'Conciliado' },
    { id: 3, fecha: '17/10', tipo: 'Ingreso', referencia: 'DEP-771', descripcion: 'Deposito en ventanilla — expensa', monto: 415, sistemaRef: 'PG-0040', depto: '302', coincidencia: 'Sugerida', estado: 'Pendiente' },
    { id: 4, fecha: '16/10', tipo: 'Ingreso', referencia: 'TRF-0990', descripcion: 'Transferencia recibida', monto: 200, sistemaRef: null, depto: null, coincidencia: 'Sin coincidencia', estado: 'Pendiente' },
    // -- Pago anticipado (PA-XXXX) --
    { id: 9, fecha: '19/10', tipo: 'Ingreso', referencia: 'TRF-3012', descripcion: 'Transferencia recibida — anticipo', monto: 500, sistemaRef: 'PA-0012', depto: '303', coincidencia: 'Exacta', estado: 'Conciliado' },

    // ======== EGRESOS registrados (coinciden con MOVIMIENTOS_LISTA) ========
    { id: 5, fecha: '03/10', tipo: 'Egreso', referencia: 'TRF-5521', descripcion: 'Transferencia a proveedor', monto: 3000, sistemaRef: 'MOV-2026-10-003', depto: null, coincidencia: 'Exacta', estado: 'Conciliado' },
    { id: 6, fecha: '04/10', tipo: 'Egreso', referencia: 'DEB-ENDE', descripcion: 'Debito automatico ENDE', monto: 1000, sistemaRef: 'MOV-2026-10-004', depto: null, coincidencia: 'Exacta', estado: 'Conciliado' },
    { id: 7, fecha: '16/10', tipo: 'Egreso', referencia: 'TRF-6102', descripcion: 'Transferencia a proveedor', monto: 1500, sistemaRef: 'MOV-2026-10-014', depto: null, coincidencia: 'Sugerida', estado: 'Pendiente' },

    // ======== EGRESO SIN COINCIDENCIA — ALERTA (retiro no registrado) ========
    { id: 8, fecha: '20/10', tipo: 'Egreso', referencia: 'RET-ATM-9821', descripcion: 'Retiro en cajero automatico', monto: 800, sistemaRef: null, depto: null, coincidencia: 'Sin coincidencia', estado: 'Alerta' },
];