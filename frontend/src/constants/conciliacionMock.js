// Mock de conciliacion bancaria.
// Los movimientos del banco se DERIVAN de PAGOS_MOCK y HISTORIAL_ANTICIPOS
// (filtrando los que no son Efectivo, que no pasan por el banco).
// Cada medio de pago va a un banco especifico:
//   - Transferencia y QR  -> Banco Mercantil · 7781
//   - Cheque              -> Banco Union · 1024
//   - Efectivo            -> no entra en conciliacion (no toca banco)
//
// Esto significa que CUALQUIER pago no efectivo registrado en el sistema
// aparece aqui automaticamente como movimiento del banco a conciliar.

import { PAGOS_MOCK, HISTORIAL_ANTICIPOS, PERIODOS } from './pagosMock';
export { PERIODOS };

// Cuentas reales del edificio (sin "Todos" — siempre se ve una cuenta por vez,
// porque el admin concilia banco por banco).
export const CUENTAS_BANCARIAS = ['Banco Mercantil · 7781', 'Banco Union · 1024'];
export const ESTADOS_CONCILIACION = ['Todos', 'Conciliado', 'Pendiente', 'Alerta'];
export const TIPOS_MOV_BANCO = ['Todos', 'Ingreso', 'Egreso'];

// Mapa medio de pago -> cuenta bancaria del edificio
export const BANCOS_POR_MEDIO = {
    'Transferencia': 'Banco Mercantil · 7781',
    'QR': 'Banco Mercantil · 7781',
    'Cheque': 'Banco Union · 1024',
};
export const bancoPorMedio = (medio) => BANCOS_POR_MEDIO[medio] || null;

// IDs del sistema que arrancan ya CONCILIADOS (pagos viejos que el admin ya confirmo).
// Los pagos mas recientes arrancan como 'Pendiente' para que el admin los concilie.
const CONCILIADOS_INICIAL = new Set(['PA-0010', 'PA-0011', 'PG-0039']);

// Convierte un pago (o anticipo) en un movimiento bancario.
// Devuelve null si el medio no pasa por el banco (Efectivo u otro no bancarizable).
const movimientoDesdePago = (pago, { origen }) => {
    const banco = bancoPorMedio(pago.medio);
    if (!banco) return null;
    const monto = pago.monto ?? pago.recibido ?? 0;
    const yaConciliado = CONCILIADOS_INICIAL.has(pago.id);
    const descripcion = origen === 'anticipo'
        ? `${pago.medio} recibido — anticipo Dpto ${pago.depto}`
        : `${pago.medio} recibido — expensa Dpto ${pago.depto}`;
    return {
        id: `BK-${pago.id}`,
        fecha: pago.fecha,
        cuenta: banco,
        tipo: 'Ingreso',
        referencia: pago.referencia || `REF-${pago.id}`,
        descripcion,
        monto,
        sistemaRef: pago.id,
        depto: pago.depto,
        coincidencia: yaConciliado ? 'Exacta' : 'Sugerida',
        estado: yaConciliado ? 'Conciliado' : 'Pendiente',
    };
};

// Movimientos de alerta semilla: egresos sin registro en el sistema.
// Sirven como ejemplo del flujo "Investigar" (ej. retiro no autorizado, debito sospechoso).
export const MOVIMIENTOS_ALERTA_SEMILLA = [
    {
        id: 'BK-ALERT-01',
        fecha: '20/10/2026',
        cuenta: 'Banco Mercantil · 7781',
        tipo: 'Egreso',
        referencia: 'RET-ATM-9821',
        descripcion: 'Retiro en cajero automatico - Mall Las Brisas, zona Sur',
        monto: 800,
        sistemaRef: null,
        depto: null,
        coincidencia: 'Sin coincidencia',
        estado: 'Alerta',
        // Detalles extra para la investigacion (a futuro integrar con Google Maps)
        detalles: {
            cajero: 'ATM-BM-9821',
            ubicacion: 'Mall Las Brisas, Av. Melchor Perez #1250, zona Sur, Cochabamba',
            latitud: -17.4140,
            longitud: -66.1653,
            canal: 'Cajero propio Banco Mercantil',
            horaOperacion: '14:32',
            notas: 'Retiro no coincide con ningun gasto registrado. Revisar movimientos recientes del cajero y pedir video al banco.',
        },
    },
];

// Deriva TODOS los movimientos bancarios: pagos + anticipos + alertas semilla.
// Se llama en cada render, asi si el admin registra un pago nuevo, aparece acá
// al toque como pendiente de conciliar.
export const movimientosBancarios = () => {
    const dePagos = PAGOS_MOCK
        .map((p) => movimientoDesdePago(p, { origen: 'pago' }))
        .filter(Boolean);
    const deAnticipos = HISTORIAL_ANTICIPOS
        .map((a) => movimientoDesdePago(a, { origen: 'anticipo' }))
        .filter(Boolean);
    return [...dePagos, ...deAnticipos, ...MOVIMIENTOS_ALERTA_SEMILLA];
};

// Export legacy (por compatibilidad con otros archivos que aun lo importen).
export const MOVIMIENTOS_BANCARIOS = movimientosBancarios();