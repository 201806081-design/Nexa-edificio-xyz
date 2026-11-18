// ============================================================
//  REPORTES (requisito 8 y reportes mensuales/anuales del 6.5)
//
//  Ningun reporte guarda datos propios: todos se calculan con lo que ya
//  existe en el sistema (libro de ingresos y gastos, expensas, mora, caja
//  y bancos). Asi un reporte siempre coincide con las demas pantallas.
//
//  Cada reporte tiene:
//    - datosX(...)   -> lo que muestra la pantalla
//    - reporteX(...) -> la definicion para exportar a PDF / Excel
//                      (ver utils/exportarReporte.js)
//
//  PENDIENTE BACKEND: GET /financiero/reportes/* devuelve estas mismas cifras.
// ============================================================

import { libroDiario, resumenFinanciero, enPeriodo, MOVIMIENTOS_LISTA, gastosDePersonal } from './movimientosMock';
import { PAGOS_MOCK, HISTORIAL_ANTICIPOS } from './pagosMock';
import { EXPENSAS_MOCK, totalExtras } from './expensasMock';
import { situacionExpensa, historialDepto, round2, periodoKey } from './deudasMock';
import { numerosDepto, responsableDe } from './edificioMock';
import {
    fondosDelPeriodo, fechaCorte, claveFecha, saldoCajaAl, saldoBancoAl, INICIO_SISTEMA,
} from './cajaBancosMock';
import {
    MESES, PRIMER_PERIODO, nombrePeriodo, periodosConMovimientos, periodosAnuales,
    esPeriodoAnual, anioDePeriodo,
} from './periodos';
import { nombreArchivo } from '../utils/exportarReporte';

// ------------------------------------------------------------
//  CATALOGO
// ------------------------------------------------------------

export const REPORTES = [
    {
        clave: 'reportes.estadoFinanciero', titulo: 'Estado financiero', grupo: 'Financieros',
        descripcion: 'Ingresos, gastos, resultado y fondos al cierre, con validacion de totales.',
        ruta: '/reportes/estado-financiero',
    },
    {
        clave: 'reportes.balanceMensual', titulo: 'Balance mensual', grupo: 'Financieros',
        descripcion: 'Expensas emitidas y cobradas, ingresos y gastos del mes frente al anterior.',
        ruta: '/reportes/balance-mensual',
    },
    {
        clave: 'reportes.flujoCaja', titulo: 'Flujo de caja', grupo: 'Financieros',
        descripcion: 'De donde vino el dinero, en que se gasto y como cambio el saldo mes a mes.',
        ruta: '/reportes/flujo-caja',
    },
    {
        clave: 'reportes.morosos', titulo: 'Lista de morosos', grupo: 'Cobranza', critico: true,
        descripcion: 'Departamentos con deuda vencida, meses de atraso y mora acumulada.',
        ruta: '/reportes/morosos',
    },
    {
        clave: 'reportes.ingresosGastos', titulo: 'Ingresos y gastos', grupo: 'Financieros',
        descripcion: 'Movimientos del periodo clasificados por categoria.',
        ruta: '/reportes/ingresos-gastos',
    },
    {
        clave: 'reportes.historialDepto', titulo: 'Historial por departamento', grupo: 'Cobranza', critico: true,
        descripcion: 'Cargos, pagos, mora y saldo de un departamento por periodo.',
        ruta: '/reportes/historial-departamento',
    },
];

export const GRUPOS_REPORTE = ['Todos', 'Financieros', 'Cobranza'];

// ------------------------------------------------------------
//  PERIODOS Y FECHAS
// ------------------------------------------------------------

const MESES_CORTOS = MESES.map((m) => m.slice(0, 3));

// 'DD/MM/AAAA' -> Date al mediodia (para calcular la mora a esa fecha)
const fechaDate = (texto) => {
    const [d, m, a] = texto.split('/').map(Number);
    return new Date(a, m - 1, d, 12);
};

// Meses (del mas antiguo al mas reciente) que entran en un periodo
// 'Octubre 2026' -> ['Octubre 2026'] | 'Año 2026' -> ['Octubre 2026', 'Noviembre 2026']
export const mesesDelPeriodo = (periodo) => {
    const meses = periodosConMovimientos().reverse();
    if (esPeriodoAnual(periodo)) return meses.filter((p) => anioDePeriodo(p) === anioDePeriodo(periodo));
    return meses.filter((p) => p === periodo);
};

// Mes anterior a 'Noviembre 2026' -> 'Octubre 2026' (null si es antes del inicio del sistema)
const mesAnterior = (periodo) => {
    const [mes, anio] = periodo.split(' ');
    const indice = MESES.indexOf(mes);
    const ant = indice === 0 ? { anio: Number(anio) - 1, mes: 11 } : { anio: Number(anio), mes: indice - 1 };
    if (ant.anio * 12 + ant.mes < PRIMER_PERIODO.anio * 12 + PRIMER_PERIODO.mes) return null;
    return nombrePeriodo(ant.anio, ant.mes);
};

// ------------------------------------------------------------
//  DEUDAS A UNA FECHA DE CORTE
//  Un reporte de un mes pasado debe mostrar las deudas como estaban ese dia:
//  solo expensas ya generadas y solo los pagos hechos hasta esa fecha.
// ------------------------------------------------------------

const expensaAlCorte = (e, corte) => {
    const abonos = e.abonos || [];
    const conFecha = abonos.reduce((s, a) => s + (Number(a.monto) || 0), 0);
    const sinFecha = Math.max(0, (Number(e.pagado) || 0) - conFecha); // datos antiguos: se toman como pagados antes
    const pagadoAlCorte = round2(sinFecha + abonos
        .filter((a) => claveFecha(a.fecha) <= claveFecha(corte))
        .reduce((s, a) => s + (Number(a.monto) || 0), 0));
    // Si una parte se pago despues del corte, ese dia todavia no estaba pagada
    const pagadaDespues = e.estado === 'Pagada' && pagadoAlCorte + 0.005 < (Number(e.pagado) || 0);
    return { ...e, pagado: pagadoAlCorte, estado: pagadaDespues ? 'Lista' : e.estado };
};

// Deudas con saldo al corte: [{ ...situacionExpensa }]
const deudasAlCorte = (corte) => EXPENSAS_MOCK
    .filter((e) => claveFecha(e.fechaGen || INICIO_SISTEMA) <= claveFecha(corte))
    .map((e) => situacionExpensa(expensaAlCorte(e, corte), { hoy: fechaDate(corte) }))
    .filter((d) => d.pendiente >= 0.01);

const suma = (lista, fn = (x) => x) => round2(lista.reduce((s, x) => s + (Number(fn(x)) || 0), 0));
const porcentaje = (parte, total) => (total ? Math.round((parte / total) * 1000) / 10 : 0);
const coincide = (a, b) => Math.abs(round2(a) - round2(b)) < 0.01;

// Movimientos del libro agrupados por categoria: [{ categoria, cantidad, monto, porcentaje }]
const porCategoria = (movs) => {
    const mapa = new Map();
    movs.forEach((m) => {
        const actual = mapa.get(m.categoria) ?? { categoria: m.categoria, cantidad: 0, monto: 0 };
        actual.cantidad += 1;
        actual.monto = round2(actual.monto + (Number(m.monto) || 0));
        mapa.set(m.categoria, actual);
    });
    const total = suma(movs, (m) => m.monto);
    return [...mapa.values()]
        .map((c) => ({ ...c, porcentaje: porcentaje(c.monto, total) }))
        .sort((a, b) => b.monto - a.monto);
};

// ============================================================
//  8.1 ESTADO FINANCIERO
// ============================================================

export const datosEstadoFinanciero = (periodo) => {
    const r = resumenFinanciero(periodo);
    const fondos = fondosDelPeriodo(periodo);
    const corte = fechaCorte(periodo);
    const deudas = deudasAlCorte(corte);
    const movs = libroDiario().filter((m) => enPeriodo(m.fecha, periodo));

    // Validacion: los totales del reporte se recalculan por otro camino, desde los registros fuente
    const enP = (f) => enPeriodo(f, periodo);
    const ingresosFuente = round2(
        suma(PAGOS_MOCK.filter((p) => enP(p.fecha) && (Number(p.monto) || 0) > 0), (p) => p.monto)
        + suma(HISTORIAL_ANTICIPOS.filter((a) => enP(a.fecha)), (a) => a.recibido)
        + suma(MOVIMIENTOS_LISTA.filter((m) => enP(m.fecha) && m.tipo === 'Ingreso'), (m) => m.monto),
    );
    const gastosFuente = round2(
        suma(MOVIMIENTOS_LISTA.filter((m) => enP(m.fecha) && m.tipo !== 'Ingreso'), (m) => m.monto)
        + suma(gastosDePersonal().filter((m) => enP(m.fecha)), (m) => m.monto),
    );
    const fondosFuente = round2(saldoCajaAl(corte) + saldoBancoAl(corte));
    const validacion = [
        { concepto: 'Ingresos', fuente: 'Pagos + anticipos + otros ingresos', reporte: r.ingresos, calculado: ingresosFuente },
        { concepto: 'Gastos', fuente: 'Gastos registrados + pagos al personal', reporte: r.gastos, calculado: gastosFuente },
        { concepto: 'Fondos al cierre', fuente: 'Libro de caja + cuenta bancaria', reporte: fondos.saldoFinal, calculado: fondosFuente },
    ].map((v) => ({ ...v, coincide: coincide(v.reporte, v.calculado) }));

    return {
        periodo, corte,
        ingresos: r.ingresos, gastos: r.gastos, resultado: round2(r.ingresos - r.gastos),
        porCobrar: suma(deudas, (d) => d.pendiente), deptosConDeuda: new Set(deudas.map((d) => d.depto)).size,
        fondos,
        evolucion: mesesDelPeriodo(esPeriodoAnual(periodo) ? periodo : `Año ${anioDePeriodo(periodo)}`)
            .filter((p) => esPeriodoAnual(periodo) || periodoKey(p) <= periodoKey(periodo))
            .map((p) => {
                const m = resumenFinanciero(p);
                return { mes: MESES_CORTOS[MESES.indexOf(p.split(' ')[0])], ingresos: m.ingresos, gastos: m.gastos };
            }),
        composicion: [
            { concepto: 'Expensas cobradas', monto: r.cobrosExpensas, tipo: 'Ingreso' },
            { concepto: 'Anticipos recibidos', monto: r.anticiposRecibidos, tipo: 'Ingreso' },
            { concepto: 'Otros ingresos', monto: r.otrosIngresos, tipo: 'Ingreso' },
            { concepto: 'Gastos operativos', monto: r.gastosOperativos, tipo: 'Gasto' },
            { concepto: 'Personal', monto: r.gastosPersonal, tipo: 'Gasto' },
        ],
        ingresosPorCategoria: porCategoria(movs.filter((m) => m.tipo === 'Ingreso')),
        gastosPorCategoria: porCategoria(movs.filter((m) => m.tipo !== 'Ingreso')),
        validacion,
        exportable: validacion.every((v) => v.coincide),
    };
};

export const reporteEstadoFinanciero = (d) => ({
    titulo: 'Estado financiero',
    subtitulo: `Periodo: ${d.periodo} · Corte al ${d.corte}`,
    resumen: [
        { etiqueta: 'Ingresos', valor: d.ingresos, tipo: 'monto' },
        { etiqueta: 'Gastos', valor: d.gastos, tipo: 'monto' },
        { etiqueta: 'Resultado del periodo', valor: d.resultado, tipo: 'monto' },
        { etiqueta: `Cuentas por cobrar (${d.deptosConDeuda} deptos.)`, valor: d.porCobrar, tipo: 'monto' },
    ],
    secciones: [
        {
            titulo: 'Estado de resultados',
            columnas: [{ titulo: 'Concepto' }, { titulo: 'Tipo' }, { titulo: 'Monto', tipo: 'monto' }],
            filas: [
                ...d.ingresosPorCategoria.map((c) => [c.categoria, 'Ingreso', c.monto]),
                ...d.gastosPorCategoria.map((c) => [c.categoria, 'Gasto', -c.monto]),
            ],
            totales: ['Resultado del periodo', '', d.resultado],
        },
        {
            titulo: 'Fondos',
            columnas: [{ titulo: 'Concepto' }, { titulo: 'Monto', tipo: 'monto' }],
            filas: [
                [d.fondos.esApertura ? 'Saldo de apertura' : 'Saldo al inicio del periodo', d.fondos.saldoInicial],
                ['Ingresos', d.ingresos],
                ['Gastos', -d.gastos],
                ['Caja al cierre', d.fondos.caja],
                ['Banco al cierre', d.fondos.banco],
            ],
            totales: ['Disponible al cierre', d.fondos.saldoFinal],
        },
        {
            titulo: 'Validacion contra registros fuente',
            columnas: [{ titulo: 'Concepto' }, { titulo: 'Fuente' }, { titulo: 'Reporte', tipo: 'monto' }, { titulo: 'Registros', tipo: 'monto' }, { titulo: 'Estado' }],
            filas: d.validacion.map((v) => [v.concepto, v.fuente, v.reporte, v.calculado, v.coincide ? 'Coincide' : 'No coincide']),
        },
    ],
    notas: ['El saldo de apertura es el dinero con el que el edificio empezo a usar el sistema; no se cuenta como ingreso.'],
    archivo: nombreArchivo('estado-financiero', d.periodo),
});

// ============================================================
//  8.2 BALANCE MENSUAL
// ============================================================

const resumenMes = (periodo) => {
    const expensas = EXPENSAS_MOCK.filter((e) => e.periodo === periodo);
    const totalDe = (e) => Number(e.total ?? e.monto) || 0;
    const emitido = suma(expensas, totalDe);
    const cobrado = suma(expensas, (e) => Math.min(Number(e.pagado) || 0, totalDe(e)));
    const r = resumenFinanciero(periodo);
    const f = fondosDelPeriodo(periodo);
    return {
        periodo,
        expensas: {
            generadas: expensas.length > 0, unidades: expensas.length,
            emitido, base: suma(expensas, (e) => e.base), agua: suma(expensas, (e) => e.agua),
            extras: suma(expensas, totalExtras), cobrado, pendiente: round2(emitido - cobrado),
            porcentajeCobrado: porcentaje(cobrado, emitido),
        },
        caja: {
            saldoInicial: f.saldoInicial, saldoFinal: f.saldoFinal,
            ingresos: r.ingresos, gastos: r.gastos, resultado: round2(r.ingresos - r.gastos),
            cobroExpensas: r.cobrosExpensas, anticipos: r.anticiposRecibidos, otrosIngresos: r.otrosIngresos,
            gastosOperativos: r.gastosOperativos, personal: r.gastosPersonal,
        },
    };
};

export const datosBalanceMensual = (periodo) => {
    const actual = resumenMes(periodo);
    const anteriorNombre = mesAnterior(periodo);
    const anterior = anteriorNombre ? resumenMes(anteriorNombre) : null;
    const fila = (concepto, fn, grupo) => {
        const a = fn(actual);
        const b = anterior ? fn(anterior) : null;
        return {
            concepto, grupo, actual: a, anterior: b,
            variacion: b === null ? null : round2(a - b),
            porcentaje: b ? Math.round(((a - b) / Math.abs(b)) * 1000) / 10 : null,
        };
    };
    return {
        periodo, anteriorNombre, actual, anterior,
        filas: [
            fila('Expensas emitidas', (m) => m.expensas.emitido, 'Expensas del mes'),
            fila('Cobrado de esas expensas', (m) => m.expensas.cobrado, 'Expensas del mes'),
            fila('Pendiente de cobro', (m) => m.expensas.pendiente, 'Expensas del mes'),
            fila('Saldo al inicio', (m) => m.caja.saldoInicial, 'Dinero del edificio'),
            fila('Cobros de expensas', (m) => m.caja.cobroExpensas, 'Dinero del edificio'),
            fila('Anticipos recibidos', (m) => m.caja.anticipos, 'Dinero del edificio'),
            fila('Otros ingresos', (m) => m.caja.otrosIngresos, 'Dinero del edificio'),
            fila('Gastos operativos', (m) => m.caja.gastosOperativos, 'Dinero del edificio'),
            fila('Personal', (m) => m.caja.personal, 'Dinero del edificio'),
            fila('Resultado del mes', (m) => m.caja.resultado, 'Dinero del edificio'),
            fila('Saldo al cierre', (m) => m.caja.saldoFinal, 'Dinero del edificio'),
        ],
    };
};

export const reporteBalanceMensual = (d) => ({
    titulo: 'Balance mensual',
    subtitulo: `Periodo: ${d.periodo}${d.anteriorNombre ? ` · Comparado con ${d.anteriorNombre}` : ''}`,
    resumen: [
        { etiqueta: 'Expensas emitidas', valor: d.actual.expensas.emitido, tipo: 'monto' },
        { etiqueta: `Cobrado (${d.actual.expensas.porcentajeCobrado} %)`, valor: d.actual.expensas.cobrado, tipo: 'monto' },
        { etiqueta: 'Resultado del mes', valor: d.actual.caja.resultado, tipo: 'monto' },
        { etiqueta: 'Saldo al cierre', valor: d.actual.caja.saldoFinal, tipo: 'monto' },
    ],
    secciones: [{
        titulo: 'Comparacion con el mes anterior',
        columnas: [
            { titulo: 'Concepto' }, { titulo: d.anteriorNombre || 'Mes anterior', tipo: 'monto' },
            { titulo: d.periodo, tipo: 'monto' }, { titulo: 'Variacion', tipo: 'monto' }, { titulo: 'Variacion %', tipo: 'numero' },
        ],
        filas: d.filas.map((f) => [f.concepto, f.anterior ?? '', f.actual, f.variacion ?? '', f.porcentaje ?? '']),
    }],
    notas: d.actual.expensas.generadas ? [] : [`Las expensas de ${d.periodo} todavia no se generaron (se generan a inicios del mes siguiente).`],
    archivo: nombreArchivo('balance-mensual', d.periodo),
});

// ============================================================
//  8.3 FLUJO DE CAJA (exportacion; la pantalla esta en Reportes > Flujo de caja)
// ============================================================

export const reporteFlujoCaja = (periodo, meses, total) => ({
    titulo: 'Flujo de caja',
    subtitulo: `Periodo: ${periodo}`,
    resumen: [
        { etiqueta: total.esApertura ? 'Saldo de apertura' : 'Saldo inicial', valor: total.saldoInicial, tipo: 'monto' },
        { etiqueta: 'Ingresos', valor: total.ingresos, tipo: 'monto' },
        { etiqueta: 'Gastos', valor: total.gastos, tipo: 'monto' },
        { etiqueta: 'Saldo final', valor: total.saldoFinal, tipo: 'monto' },
    ],
    secciones: [{
        titulo: 'Flujo mes a mes',
        columnas: [
            { titulo: 'Mes' }, { titulo: 'Saldo inicial', tipo: 'monto' }, { titulo: 'Ingresos', tipo: 'monto' },
            { titulo: 'Gastos', tipo: 'monto' }, { titulo: 'Flujo neto', tipo: 'monto' }, { titulo: 'Saldo final', tipo: 'monto' },
        ],
        filas: meses.map((m) => [m.periodo, m.saldoInicial, m.ingresos, m.gastos, round2(m.ingresos - m.gastos), m.saldoFinal]),
        totales: ['Total', total.saldoInicial, total.ingresos, total.gastos, round2(total.ingresos - total.gastos), total.saldoFinal],
    }],
    archivo: nombreArchivo('flujo-de-caja', periodo),
});

// ============================================================
//  8.4 LISTA DE MOROSOS
// ============================================================

export const datosMorosos = (periodo) => {
    const corte = fechaCorte(periodo);
    const deudas = deudasAlCorte(corte).filter((d) => d.vencida);
    const mapa = new Map();
    deudas.forEach((d) => {
        const g = mapa.get(d.depto) ?? {
            depto: d.depto, tipo: d.tipo, responsable: responsableDe(d.depto),
            meses: 0, periodos: 0, interes: 0, total: 0,
        };
        g.meses = Math.max(g.meses, d.meses);
        g.periodos += 1;
        g.interes = round2(g.interes + d.interes);
        g.total = round2(g.total + d.pendiente);
        mapa.set(d.depto, g);
    });
    const filas = [...mapa.values()].map((g) => {
        const mora = Math.min(g.interes, g.total);
        const pagos = PAGOS_MOCK.filter((p) => p.depto === g.depto && claveFecha(p.fecha) <= claveFecha(corte));
        const ultimo = pagos.sort((a, b) => claveFecha(b.fecha).localeCompare(claveFecha(a.fecha)))[0];
        return { ...g, mora, capital: round2(g.total - mora), ultimoPago: ultimo?.fecha ?? '—' };
    }).sort((a, b) => b.total - a.total);
    const totalDeptos = numerosDepto().length;
    return {
        periodo, corte, filas,
        cantidad: filas.length, porcentajeEdificio: porcentaje(filas.length, totalDeptos),
        capital: suma(filas, (f) => f.capital), mora: suma(filas, (f) => f.mora), total: suma(filas, (f) => f.total),
    };
};

export const reporteMorosos = (d, filas = d.filas) => ({
    titulo: 'Lista de morosos',
    subtitulo: `Deuda vencida al ${d.corte}`,
    resumen: [
        { etiqueta: 'Departamentos morosos', valor: `${filas.length} (${d.porcentajeEdificio} % del edificio)` },
        { etiqueta: 'Capital vencido', valor: suma(filas, (f) => f.capital), tipo: 'monto' },
        { etiqueta: 'Mora acumulada', valor: suma(filas, (f) => f.mora), tipo: 'monto' },
    ],
    secciones: [{
        titulo: 'Morosidad por departamento',
        columnas: [
            { titulo: 'Tipo' }, { titulo: 'Dpto.' }, { titulo: 'Responsable' }, { titulo: 'Meses vencidos', tipo: 'numero' },
            { titulo: 'Capital', tipo: 'monto' }, { titulo: 'Mora', tipo: 'monto' }, { titulo: 'Total deuda', tipo: 'monto' },
            { titulo: 'Ultimo pago' },
        ],
        filas: filas.map((f) => [f.tipo, f.depto, f.responsable, f.meses, f.capital, f.mora, f.total, f.ultimoPago]),
        totales: ['', '', 'Total', '', suma(filas, (f) => f.capital), suma(filas, (f) => f.mora), suma(filas, (f) => f.total), ''],
        vacio: 'No hay departamentos con deuda vencida.',
    }],
    archivo: nombreArchivo('lista-de-morosos', d.corte.split('/').reverse().join('-')),
});

// ============================================================
//  8.5 INGRESOS Y GASTOS
// ============================================================

export const datosIngresosGastos = (periodo) => {
    const movs = libroDiario().filter((m) => enPeriodo(m.fecha, periodo));
    const ingresos = movs.filter((m) => m.tipo === 'Ingreso');
    const gastos = movs.filter((m) => m.tipo !== 'Ingreso');
    return {
        periodo,
        ingresos: suma(ingresos, (m) => m.monto), gastos: suma(gastos, (m) => m.monto),
        resultado: round2(suma(ingresos, (m) => m.monto) - suma(gastos, (m) => m.monto)),
        ingresosPorCategoria: porCategoria(ingresos), gastosPorCategoria: porCategoria(gastos),
        movimientos: movs,
    };
};

export const reporteIngresosGastos = (d) => ({
    titulo: 'Reporte de ingresos y gastos',
    subtitulo: `Periodo: ${d.periodo}`,
    resumen: [
        { etiqueta: 'Ingresos', valor: d.ingresos, tipo: 'monto' },
        { etiqueta: 'Gastos', valor: d.gastos, tipo: 'monto' },
        { etiqueta: 'Resultado', valor: d.resultado, tipo: 'monto' },
    ],
    secciones: [
        {
            titulo: 'Ingresos por categoria',
            columnas: [{ titulo: 'Categoria' }, { titulo: 'Movimientos', tipo: 'numero' }, { titulo: 'Monto', tipo: 'monto' }, { titulo: '%', tipo: 'numero' }],
            filas: d.ingresosPorCategoria.map((c) => [c.categoria, c.cantidad, c.monto, c.porcentaje]),
            totales: ['Total ingresos', d.ingresosPorCategoria.reduce((s, c) => s + c.cantidad, 0), d.ingresos, d.ingresos ? 100 : 0],
        },
        {
            titulo: 'Gastos por categoria',
            columnas: [{ titulo: 'Categoria' }, { titulo: 'Movimientos', tipo: 'numero' }, { titulo: 'Monto', tipo: 'monto' }, { titulo: '%', tipo: 'numero' }],
            filas: d.gastosPorCategoria.map((c) => [c.categoria, c.cantidad, c.monto, c.porcentaje]),
            totales: ['Total gastos', d.gastosPorCategoria.reduce((s, c) => s + c.cantidad, 0), d.gastos, d.gastos ? 100 : 0],
        },
        {
            titulo: 'Detalle de movimientos',
            columnas: [
                { titulo: 'Fecha' }, { titulo: 'Tipo' }, { titulo: 'Categoria' }, { titulo: 'Descripcion' },
                { titulo: 'Medio' }, { titulo: 'Cuenta' }, { titulo: 'Monto', tipo: 'monto' },
            ],
            filas: d.movimientos.map((m) => [
                m.fecha, m.tipo === 'Ingreso' ? 'Ingreso' : 'Gasto', m.categoria, m.descripcion,
                m.medio || '', m.cuenta || '', m.tipo === 'Ingreso' ? m.monto : -m.monto,
            ]),
            totales: ['', '', '', '', '', 'Resultado', d.resultado],
        },
    ],
    archivo: nombreArchivo('ingresos-y-gastos', d.periodo),
});

// ============================================================
//  8.6 HISTORIAL POR DEPARTAMENTO
// ============================================================

export const TODO_EL_HISTORIAL = 'Todo el historial';
export const periodosHistorial = () => [TODO_EL_HISTORIAL, ...periodosAnuales()];

// Estado de una expensa en el historial
const estadoHistorial = (h) => {
    if (h.estado === 'Pagado') return 'Pagado';
    if (h.pagado > 0 && h.pendiente > 0) return 'Parcial';
    if (h.vencida) return 'Vencido';
    return 'Pendiente';
};

export const datosHistorialDepto = (depto, periodo = TODO_EL_HISTORIAL) => {
    const filas = historialDepto(depto)
        .filter((h) => periodo === TODO_EL_HISTORIAL || anioDePeriodo(h.periodo) === anioDePeriodo(periodo))
        .sort((a, b) => periodoKey(a.periodo) - periodoKey(b.periodo))
        .map((h) => ({
            periodo: h.periodo, tipo: h.tipo, base: h.base, agua: h.agua, extras: h.extras,
            mora: h.interes, total: round2(h.deudaOriginal + h.interes),
            pagado: h.pagado, saldo: h.pendiente, estado: estadoHistorial(h), meses: h.meses,
        }));
    const cargos = suma(filas, (f) => f.total);
    const pagado = suma(filas, (f) => f.pagado);
    const saldo = suma(filas, (f) => f.saldo);
    const pagos = PAGOS_MOCK.filter((p) => p.depto === String(depto)
        && (periodo === TODO_EL_HISTORIAL || Number(p.fecha.split('/')[2]) === anioDePeriodo(periodo)));
    return {
        depto, periodo, filas,
        responsable: responsableDe(depto, { conTipo: true }),
        tipo: filas[0]?.tipo ?? '',
        cargos, pagado, saldo, cantidadPagos: pagos.length,
        cuadra: coincide(cargos - pagado, saldo),
    };
};

export const reporteHistorialDepto = (d) => ({
    titulo: `Historial del departamento ${d.depto}`,
    subtitulo: `${d.periodo} · Responsable: ${d.responsable}`,
    resumen: [
        { etiqueta: 'Cargos generados', valor: d.cargos, tipo: 'monto' },
        { etiqueta: `Pagos realizados (${d.cantidadPagos})`, valor: d.pagado, tipo: 'monto' },
        { etiqueta: 'Saldo pendiente', valor: d.saldo, tipo: 'monto' },
    ],
    secciones: [{
        titulo: 'Historial financiero',
        columnas: [
            { titulo: 'Periodo' }, { titulo: 'Expensa', tipo: 'monto' }, { titulo: 'Agua', tipo: 'monto' },
            { titulo: 'Extras', tipo: 'monto' }, { titulo: 'Mora', tipo: 'monto' }, { titulo: 'Total', tipo: 'monto' },
            { titulo: 'Pagado', tipo: 'monto' }, { titulo: 'Saldo', tipo: 'monto' }, { titulo: 'Estado' },
        ],
        filas: d.filas.map((f) => [f.periodo, f.base, f.agua, f.extras, f.mora, f.total, f.pagado, f.saldo, f.estado]),
        totales: ['Total', '', '', '', '', d.cargos, d.pagado, d.saldo, ''],
        vacio: 'El departamento no tiene expensas en este periodo.',
    }],
    notas: [`Saldo = cargos ${d.cargos.toFixed(2)} - pagos ${d.pagado.toFixed(2)} = ${d.saldo.toFixed(2)}.`],
    archivo: nombreArchivo('historial-departamento', d.depto, d.periodo),
});
