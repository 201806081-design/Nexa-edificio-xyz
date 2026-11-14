// ============================================================
//  APLICACION AUTOMATICA DEL CREDITO DE ANTICIPOS (requisito 5.1)
//
//  "Recibir Bs 1.000 de un depto y disminuir en base a los cargos
//  mensuales que le llegan": cuando una expensa queda LISTA PARA COBRAR
//  (al registrar el agua), si el depto tiene saldo a favor de anticipos,
//  se descuenta solo.
//
//  Sigue la misma convencion que Registrar pago:
//    - se crea una fila en PAGOS_MOCK con medio 'Crédito a favor', monto 0
//      (no entra dinero ese dia) y creditoAplicado
//    - se descuenta primero del anticipo mas antiguo y se guarda la
//      aplicacion con pagoRef = id del pago
//    - la expensa suma lo pagado y queda 'Pagada' si se cubrio completa
// ============================================================

import { EXPENSAS_MOCK } from './expensasMock';
import { PAGOS_MOCK, HISTORIAL_ANTICIPOS } from './pagosMock';
import { situacionExpensa, round2 } from './deudasMock';
import { responsableDe, vincularResponsable } from './edificioMock';

const fechaHoy = () => {
    const h = new Date();
    return `${String(h.getDate()).padStart(2, '0')}/${String(h.getMonth() + 1).padStart(2, '0')}/${h.getFullYear()}`;
};
const ordenFecha = (f) => String(f || '').split('/').reverse().join('');

const siguienteCodigoPago = () => {
    const nums = PAGOS_MOCK.map((p) => Number(String(p.id).replace(/\D/g, '')) || 0);
    return `PG-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, '0')}`;
};

// Saldo a favor disponible de un depto (suma de anticipos con credito)
export const creditoDisponible = (depto) => round2(HISTORIAL_ANTICIPOS
    .filter((a) => a.depto === String(depto))
    .reduce((s, a) => s + (Number(a.credito) || 0), 0));

// Aplica el credito disponible a una expensa. Devuelve el monto aplicado (0 si no habia credito).
export const aplicarCreditoAutomatico = (expensaId) => {
    const exp = EXPENSAS_MOCK.find((e) => e.id === expensaId);
    if (!exp || exp.estado !== 'Lista') return 0;

    const sit = situacionExpensa(exp);
    const credito = creditoDisponible(exp.depto);
    const aplicar = round2(Math.min(credito, sit.pendiente));
    if (aplicar <= 0) return 0;

    const codigo = siguienteCodigoPago();
    const fecha = fechaHoy();
    const saldoDespues = round2(sit.pendiente - aplicar);

    // 1) Fila del pago (aparece en el historial de Pagos y en Estado de cuenta)
    PAGOS_MOCK.unshift(vincularResponsable({
        id: codigo, fecha, depto: exp.depto, tipoDepto: exp.tipo,
        pagadoPor: responsableDe(exp.depto),
        medio: 'Crédito a favor', referencia: '',
        periodoAplicado: exp.periodo,
        monto: 0, creditoAplicado: aplicar, total: aplicar,
        saldoPosterior: saldoDespues,
        estado: saldoDespues > 0 ? 'Parcial' : 'Completo',
        composicion: [{
            periodo: exp.periodo, tipo: exp.tipo, base: sit.base, agua: sit.agua, m3Agua: exp.m3 ?? null,
            mora: sit.interes, mesesMora: sit.meses, total: sit.deudaActual, pagadoAntes: sit.pagado,
        }],
    }));

    // 2) Descontar de los anticipos, del mas antiguo al mas nuevo
    let restante = aplicar;
    HISTORIAL_ANTICIPOS
        .filter((a) => a.depto === exp.depto && (a.credito || 0) > 0)
        .sort((a, b) => ordenFecha(a.fecha).localeCompare(ordenFecha(b.fecha)))
        .forEach((a) => {
            if (restante <= 0) return;
            const descontar = round2(Math.min(a.credito, restante));
            a.aplicado = round2((a.aplicado || 0) + descontar);
            a.credito = round2(a.credito - descontar);
            restante = round2(restante - descontar);
            a.estado = a.credito === 0 ? 'Aplicado' : 'Parcial';
            if (!a.aplicaciones) a.aplicaciones = [];
            a.aplicaciones.push({
                periodo: exp.periodo, pagoRef: codigo, tipo: exp.tipo,
                base: sit.base, agua: sit.agua, m3Agua: exp.m3 ?? null,
                mora: sit.interes, mesesMora: sit.meses, total: descontar, monto: descontar,
            });
        });

    // 3) La expensa suma lo pagado
    exp.pagado = round2((exp.pagado || 0) + aplicar);
    if (saldoDespues <= 0.005) exp.estado = 'Pagada';
    return aplicar;
};
