// ============================================================
//  DEUDAS Y MOROSOS: CALCULO UNICO PARA TODO EL SISTEMA
//
//  Todas las pantallas que muestran deudas, saldos pendientes o morosos
//  (Mora, Resumen de finanzas, Estado de cuenta,
//  Registrar pago y Comunicados) usan estas funciones. Asi, si un depto
//  es moroso, lo es en todas partes al mismo tiempo.
//
//  La deuda sale SIEMPRE de las expensas (EXPENSAS_MOCK):
//    - original    = total de la expensa (base + agua + extras)
//    - meses       = cuantas fechas de cobro de mora pasaron sin terminar de pagarla
//    - deudaActual = original + mora generada (porcentaje o monto fijo)
//    - pendiente   = deudaActual - pagado
//
//  MORA CON PAGOS PARCIALES (configurable en CONFIG_MORA.baseMora):
//    - Sobre la deuda total (defecto): la mora se calcula sobre el total de
//      la expensa aunque se haya pagado una parte.
//    - Solo sobre lo que falta pagar: cada expensa guarda sus pagos con fecha
//      (abonos: [{ fecha: 'DD/MM/AAAA', monto }]) y la mora de cada mes se
//      calcula sobre lo que faltaba pagar ese dia:
//        debe 400, paga 200 antes del vencimiento -> la mora se calcula sobre 200.
//      Los pagos cubren primero la mora acumulada y despues la expensa.
//  Una expensa con estado 'Pagada' no genera deuda.
//
//  Moroso = depto con al menos una expensa VENCIDA (meses > 0) y con saldo.
//  La fecha de referencia es la del sistema (new Date()), salvo que se pase otra.
// ============================================================

import { EXPENSAS_MOCK } from './expensasMock';
import { CONFIG_MORA, APLICAR_DESDE, esMontoFijo, moraSobreSaldo, montoConMora } from './moraMock';
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

// Fecha desde la que se cobra la mora del vencimiento k, segun "Aplicar mora desde":
//   Fecha de vencimiento     -> el mismo dia de vencimiento
//   Dia siguiente (defecto)  -> el dia despues del vencimiento
//   Periodo vencido          -> el dia 1 del mes siguiente al vencimiento
const inicioMora = (vencimiento, aplicarDesde) => {
    if (aplicarDesde === APLICAR_DESDE.VENCIMIENTO) return vencimiento;
    if (aplicarDesde === APLICAR_DESDE.PERIODO_VENCIDO) {
        return new Date(vencimiento.getFullYear(), vencimiento.getMonth() + 1, 1);
    }
    return new Date(vencimiento.getFullYear(), vencimiento.getMonth(), vencimiento.getDate() + 1);
};

// Fechas en las que se cobro mora a un periodo, hasta hoy (una por mes vencido).
// Ej.: 'Octubre 2026' con vencimiento el 10 -> vence el 10/nov/2026.
//      Aplicar desde el dia siguiente: hoy 10/nov -> [] | 11/nov -> [11/nov] | 11/dic -> [11/nov, 11/dic]
//      Aplicar desde el vencimiento:   hoy 10/nov -> [10/nov]
export const fechasCobroMora = (
    periodo,
    hoy = new Date(),
    dia = diaVencimiento(),
    aplicarDesde = CONFIG_MORA.aplicarMoraDesde,
) => {
    const [mesNombre, anioTxt] = String(periodo || '').split(' ');
    const idxMes = MESES_ES.indexOf(mesNombre);
    const anio = Number(anioTxt);
    if (idxMes < 0 || !anio) return [];
    const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
    const fechas = [];
    for (let k = 0; k < 240; k++) {
        const inicio = inicioMora(fechaVencimiento(anio, idxMes, dia, k), aplicarDesde);
        if (inicio > finDelDia) break;
        fechas.push(inicio);
    }
    return fechas;
};

// Cuantos meses de mora acumula un periodo hasta hoy (sin contar pagos)
export const mesesVencidos = (...args) => fechasCobroMora(...args).length;

// 'DD/MM/AAAA' -> Date (a las 00:00). Fecha vacia o invalida -> null
export const fechaDeTexto = (texto) => {
    const [d, m, a] = String(texto || '').split('/').map(Number);
    return d && m && a ? new Date(a, m - 1, d) : null;
};

// Pagos de una expensa ordenados por fecha. Si lo pagado no tiene fecha
// registrada (datos antiguos), se toma como pagado antes de la primera mora.
const abonosDe = (e) => {
    const conFecha = (e.abonos || [])
        .map((a) => ({ fecha: fechaDeTexto(a.fecha), monto: Number(a.monto) || 0 }))
        .filter((a) => a.fecha && a.monto > 0)
        .sort((a, b) => a.fecha - b.fecha);
    const sinFecha = round2((Number(e.pagado) || 0) - conFecha.reduce((s, a) => s + a.monto, 0));
    return sinFecha > 0 ? [{ fecha: new Date(0), monto: sinFecha }, ...conFecha] : conFecha;
};

// Mora mes a mes sobre el saldo pendiente de cada momento.
// Un pago hecho ANTES de la fecha de cobro reduce la base de ese mes;
// uno hecho ese mismo dia o despues, ya paga la mora generada.
//   Compuesto -> % sobre todo lo que se debe (expensa + mora anterior)
//   Simple    -> % solo sobre la parte de la expensa que falta pagar
//   Fijo      -> monto fijo cada mes mientras quede saldo
// Devuelve { interes, tramos: [{ fecha, base, recargo, saldo }] }
const calcularMoraSobreSaldo = (original, abonos, fechas, config) => {
    let capital = original; // parte de la expensa sin pagar
    let mora = 0;           // mora generada y aun sin pagar
    let interes = 0;        // mora total generada
    let i = 0;
    const pagar = (monto) => {
        const aMora = Math.min(mora, monto);
        mora -= aMora;
        capital -= monto - aMora;
    };
    const tramos = fechas.map((fecha) => {
        while (i < abonos.length && abonos[i].fecha < fecha) pagar(abonos[i++].monto);
        const debe = Math.max(0, capital + mora);
        let recargo = 0;
        if (debe > 0.005) {
            if (esMontoFijo(config)) {
                recargo = Number(config.montoFijo) || 0;
            } else {
                const tasa = (Number(config.interesMensual) || 0) / 100;
                const base = config.tipoCalculo === 'Simple' ? Math.max(0, capital) : debe;
                recargo = base * tasa;
            }
        }
        recargo = round2(recargo);
        mora += recargo;
        interes += recargo;
        return { fecha, base: round2(debe), recargo, saldo: round2(debe + recargo) };
    });
    return { interes: round2(interes), tramos };
};

// Mora mes a mes sobre la deuda total (los pagos parciales no la reducen).
// Mismo formato de resultado que calcularMoraSobreSaldo.
const calcularMoraSobreTotal = (original, fechas, config) => {
    const tramos = fechas.map((fecha, k) => {
        const base = montoConMora(original, k, config);
        const saldo = montoConMora(original, k + 1, config);
        return { fecha, base, recargo: round2(saldo - base), saldo };
    });
    return { interes: round2(montoConMora(original, fechas.length, config) - original), tramos };
};

// Mora de una expensa segun la opcion configurada para pagos parciales
const calcularMora = (e, original, fechas, config) => (moraSobreSaldo(config)
    ? calcularMoraSobreSaldo(original, abonosDe(e), fechas, config)
    : calcularMoraSobreTotal(original, fechas, config));

// Situacion de UNA expensa a la fecha indicada.
export const situacionExpensa = (e, { hoy = new Date(), config = CONFIG_MORA, dia = diaVencimiento() } = {}) => {
    const base = Number(e.base) || 0;
    const agua = Number(e.agua) || 0;
    const original = round2(Number(e.total ?? e.monto) || base + agua);
    const extras = round2(original - base - agua);
    const pagado = round2(Number(e.pagado) || 0);
    const pagada = e.estado === 'Pagada';

    const { interes: moraGenerada, tramos } = pagada
        ? { interes: 0, tramos: [] }
        : calcularMora(e, original, fechasCobroMora(e.periodo, hoy, dia, config.aplicarMoraDesde), config);
    // Meses con mora = meses en los que todavia se debia algo
    const meses = tramos.filter((t) => t.base > 0.005).length;
    const deudaActual = pagada ? original : round2(original + moraGenerada);
    const pendiente = pagada ? 0 : Math.max(0, round2(deudaActual - pagado));
    const interes = pagada ? Math.max(0, round2(pagado - original)) : moraGenerada;

    let estado = 'Pendiente';
    if (pagada || (pendiente < 0.01 && original > 0)) estado = 'Pagado';
    else if (meses > 0) estado = 'Vencido';

    return {
        id: e.id, expensaId: e.id,
        depto: e.depto, responsable: responsableDe(e.depto), tipo: e.tipo, periodo: e.periodo,
        base, expensaBase: base, agua, extras,
        deudaOriginal: original, meses, interes, deudaActual, pagado, pendiente,
        tramosMora: tramos.filter((t) => t.base > 0.005),
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

// ------------------------------------------------------------
//  REGISTRO DE PAGOS (unico punto que escribe lo pagado de una expensa)
// ------------------------------------------------------------

// Suma un pago a la expensa con su fecha ('DD/MM/AAAA') y la marca 'Pagada'
// si con eso cubre la expensa mas la mora QUE TENIA ESE DIA (un pago hecho
// antes de que corra la mora no la debe). Devuelve el saldo que queda.
export const registrarAbono = (expensa, monto, fecha) => {
    const valor = round2(monto);
    if (!expensa || valor <= 0) return 0;
    expensa.abonos = [...(expensa.abonos || []), { fecha, monto: valor }];
    expensa.pagado = round2((Number(expensa.pagado) || 0) + valor);
    const { pendiente } = situacionExpensa({ ...expensa, estado: '' }, { hoy: fechaDeTexto(fecha) ?? new Date() });
    if (pendiente < 0.01) expensa.estado = 'Pagada';
    return pendiente;
};
