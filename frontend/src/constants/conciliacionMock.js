// ============================================================
//  CONCILIACION BANCARIA (requisito 7.3)
//
//  Conciliar = confirmar que cada movimiento del banco coincide con lo
//  registrado en el sistema. Se concilian INGRESOS y EGRESOS de la cuenta
//  bancaria en uso (cajaBancosMock):
//    - cobros de expensas y anticipos por transferencia, QR, cheque o deposito
//    - gastos y sueldos pagados desde el banco
//    - depositos y retiros entre caja y banco
//    - comisiones e intereses registrados desde el extracto (ya vienen del
//      banco, por eso entran conciliados)
//  Los pagos en efectivo no aparecen: no pasan por el banco.
//
//  El estado (conciliado / en investigacion) se guarda aqui para que no se
//  pierda al cambiar de pantalla. PENDIENTE BACKEND: Movimiento.conciliado
//  y el modelo Conciliacion.
// ============================================================

import { movimientosBanco } from './cajaBancosMock';

export const ESTADOS_CONCILIACION = ['Todos', 'Conciliado', 'Pendiente', 'Alerta'];
export const TIPOS_MOV_BANCO = ['Todos', 'Ingreso', 'Egreso'];

const CONCILIADOS = new Set();
const EN_INVESTIGACION = new Set();

// Movimientos del extracto que NO tienen registro en el sistema.
// Ejemplo del flujo "Investigar" (retiro no reconocido).
export const MOVIMIENTOS_SIN_REGISTRO = [
    {
        id: 'BK-ALERT-01',
        cuentaId: 'BCO-001',
        fecha: '20/10/2026',
        tipo: 'Egreso',
        concepto: 'Retiro en cajero',
        referencia: 'RET-ATM-9821',
        descripcion: 'Retiro en cajero automatico - Mall Las Brisas, zona Sur',
        monto: 800,
        sistemaRef: null,
        depto: null,
        origen: 'extracto',
        detalles: {
            cajero: 'ATM-BU-9821',
            ubicacion: 'Mall Las Brisas, Av. Melchor Perez #1250, zona Sur, Cochabamba',
            latitud: -17.4140,
            longitud: -66.1653,
            canal: 'Cajero automatico',
            horaOperacion: '14:32',
            notas: 'Retiro no coincide con ningun gasto registrado. Revisar movimientos recientes del cajero y pedir video al banco.',
        },
    },
];

const estaConciliado = (m) => m.origen === 'extracto' || CONCILIADOS.has(m.id);

// Movimientos de una cuenta con su estado de conciliacion
export const movimientosConciliacion = (cuentaId) => [
    ...movimientosBanco(cuentaId).map((m) => {
        const conciliado = estaConciliado(m);
        return { ...m, estado: conciliado ? 'Conciliado' : 'Pendiente', coincidencia: conciliado ? 'Exacta' : 'Sugerida' };
    }),
    ...MOVIMIENTOS_SIN_REGISTRO
        .filter((m) => m.cuentaId === cuentaId)
        .map((m) => ({ ...m, estado: EN_INVESTIGACION.has(m.id) ? 'Pendiente' : 'Alerta', coincidencia: 'Sin coincidencia' })),
];

// Cuantos movimientos falta conciliar (pendientes + alertas)
export const porConciliar = (cuentaId) => movimientosConciliacion(cuentaId)
    .filter((m) => m.estado !== 'Conciliado').length;

export const conciliarMovimientos = (ids) => ids.forEach((id) => CONCILIADOS.add(id));

export const marcarEnInvestigacion = (id) => EN_INVESTIGACION.add(id);
