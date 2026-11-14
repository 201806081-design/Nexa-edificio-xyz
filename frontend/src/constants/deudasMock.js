// ============================================================
//  DEUDAS Y MOROSOS: CALCULO UNICO PARA TODO EL SISTEMA
//
//  Todas las pantallas que muestran deudas, saldos pendientes o morosos
//  (Mora, Dashboard financiero, Gestion financiera, Estado de cuenta,
//  Registrar pago y Comunicados) usan estas funciones. Asi, si un depto
//  es moroso, lo es en todas partes al mismo tiempo.
//
//  La deuda sale SIEMPRE de las expensas (EXPENSAS_MOCK):
//    - original    = total de la expensa (base + agua + extras)
//    - meses       = cuantas fechas de vencimiento pasaron sin pagarla
//    - deudaActual = original con el interes de mora aplicado
//    - pendiente   = deudaActual - pagado
//  Una expensa con estado 'Pagada' no genera deuda.
//
//  Moroso = depto con al menos una expensa VENCIDA (meses > 0) y con saldo.
//  La fecha de referencia es la del sistema (new Date()), salvo que se pase otra.
// ============================================================

import { EXPENSAS_MOCK } from './expensasMock';
import { CONFIG_MORA } from './moraMock';
import { REGLAS_PERIODO } from './configuracionMock';
import { responsableDe } from './edificioMock';

const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Clave numerica para ordenar periodos: 'Octubre 2026' -> 202610
export const periodoKey = (periodo) => {
    const [mes, anio] = String(periodo || '').split(' ');
    return (Number(anio) || 0) * 100 + (MESES_ES.indexOf(mes) + 1);
};

// Dia de vencimiento configurado (REGLAS_PERIODO.diaVencimiento, ej. 10).
// Tambien acepta texto antiguo ('10 de cada mes') o 'Ultimo dia del mes'.
// Devuelve un numero (10, 15, 20) o 'ultimo'.
export const diaVencimiento = (valor = REGLAS_PERIODO.diaVencimiento) => {
    const texto = String(valor ?? '').toLowerCase();
    if (texto.includes('ultimo') || texto.includes('último')) return 'ultimo';
    const n = parseInt(texto, 10);
    return Number.isFinite(n) && n > 0 ? n : 10;
};

// Fecha de vencimiento numero k (k = 0 es la primera) de una expensa.
// La expensa de un mes vence el dia configurado del mes SIGUIENTE.
const fechaVencimiento = (anio, idxMes, dia, k) => {
    const mes = idxMes + 1 + k;
    if (dia === 'ultimo') return new Date(anio, mes + 1, 0);
    return new Date(anio, mes, dia);
};

// Cuantas fechas de vencimiento pasaron desde que vencio el periodo hasta hoy.
// Ej.: 'Octubre 2026' con vencimiento el 10 -> vence el 10/nov/2026.
//      Hoy 09/nov -> 0 | hoy 10/nov -> 1 | hoy 15/dic -> 2
export const mesesVencidos = (periodo, hoy = new Date(), dia = diaVencimiento()) => {
    const [mesNombre, anioTxt] = String(periodo || '').split(' ');
    const idxMes = MESES_ES.indexOf(mesNombre);
    const anio = Number(anioTxt);
    if (idxMes < 0 || !anio) return 0;
    const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
    let meses = 0;
    while (fechaVencimiento(anio, idxMes, dia, meses) <= finDelDia && meses < 240) meses++;
    return meses;
};

// Monto con interes de mora segun la configuracion vigente (simple o compuesto)
export const montoConMora = (original, meses, config = CONFIG_MORA) => {
    const tasa = (Number(config.interesMensual) || 0) / 100;
    const m = Math.max(0, Number(meses) || 0);
    const total = config.tipoCalculo === 'Simple'
        ? original * (1 + tasa * m)
        : original * (1 + tasa) ** m;
    return round2(total);
};

// Situacion de UNA expensa a la fecha indicada.
export const situacionExpensa = (e, { hoy = new Date(), config = CONFIG_MORA, dia = diaVencimiento() } = {}) => {
    const base = Number(e.base) || 0;
    const agua = Number(e.agua) || 0;
    const original = round2(Number(e.total ?? e.monto) || base + agua);
    const extras = round2(original - base - agua);
    const pagado = round2(Number(e.pagado) || 0);
    const pagada = e.estado === 'Pagada';

    const meses = pagada ? 0 : mesesVencidos(e.periodo, hoy, dia);
    const deudaActual = pagada ? original : montoConMora(original, meses, config);
    const pendiente = pagada ? 0 : Math.max(0, round2(deudaActual - pagado));
    const interes = pagada ? Math.max(0, round2(pagado - original)) : round2(deudaActual - original);

    let estado = 'Pendiente';
    if (pagada || (pendiente < 0.01 && original > 0)) estado = 'Pagado';
    else if (meses > 0) estado = 'Vencido';

    return {
        id: e.id, expensaId: e.id,
        depto: e.depto, responsable: responsableDe(e.depto), tipo: e.tipo, periodo: e.periodo,
        base, expensaBase: base, agua, extras,
        deudaOriginal: original, meses, interes, deudaActual, pagado, pendiente,
        vencida: meses > 0 && pendiente >= 0.01,
        estado,
        // Sin el agua registrada la expensa no esta completa: todavia no se puede cobrar
        cobrable: e.estado !== 'Agua pendiente',
    };
};

// ------------------------------------------------------------
//  CONSULTAS (todas aceptan { hoy, config, dia } opcionales)
// ------------------------------------------------------------

// Todas las deudas con saldo (vencidas o no), ordenadas por depto y periodo
export const calcularDeudas = (opts) => EXPENSAS_MOCK
    .map((e) => situacionExpensa(e, opts))
    .filter((d) => d.pendiente >= 0.01)
    .sort((a, b) => String(a.depto).localeCompare(String(b.depto)) || periodoKey(a.periodo) - periodoKey(b.periodo));

// Solo las deudas vencidas (las que generan mora)
export const deudasVencidas = (opts) => calcularDeudas(opts).filter((d) => d.vencida);

// Numeros de depto morosos: ['102', '103', '203']
export const morosos = (opts) => [...new Set(deudasVencidas(opts).map((d) => d.depto))];

export const esMoroso = (depto, opts) => morosos(opts).includes(String(depto));

// Total que los residentes deben hoy (vencido + no vencido)
export const saldoPendienteTotal = (opts) => round2(calcularDeudas(opts).reduce((s, d) => s + d.pendiente, 0));

// Deudas agrupadas por depto (para Registrar pago y resumenes):
// [{ id, etiqueta, responsable, saldoPendiente, deudas: [...] }]
// Con { soloCobrables: true } deja fuera las expensas con el agua pendiente.
export const deudasPorDepto = (opts) => {
    const mapa = new Map();
    calcularDeudas(opts).filter((d) => !opts?.soloCobrables || d.cobrable).forEach((d) => {
        if (!mapa.has(d.depto)) {
            mapa.set(d.depto, {
                id: d.depto,
                etiqueta: `${d.depto} — ${responsableDe(d.depto)}`,
                responsable: responsableDe(d.depto, { conTipo: true }),
                saldoPendiente: 0,
                deudas: [],
            });
        }
        const g = mapa.get(d.depto);
        g.deudas.push({ ...d, totalDeuda: d.deudaActual, mora: d.interes });
        g.saldoPendiente = round2(g.saldoPendiente + d.pendiente);
    });
    return [...mapa.values()];
};

// Historial completo de un depto (incluye expensas pagadas), del periodo mas reciente al mas antiguo
export const historialDepto = (depto, opts) => EXPENSAS_MOCK
    .filter((e) => e.depto === String(depto))
    .map((e) => situacionExpensa(e, opts))
    .sort((a, b) => periodoKey(b.periodo) - periodoKey(a.periodo));

// Estado que se muestra en la pantalla Expensas: una expensa 'Lista' que ya
// paso su fecha de vencimiento sin pagarse se muestra como 'Vencida'.
export const estadoVisibleExpensa = (e, opts) => {
    if (e.estado !== 'Lista') return e.estado;
    return situacionExpensa(e, opts).vencida ? 'Vencida' : 'Lista';
};
