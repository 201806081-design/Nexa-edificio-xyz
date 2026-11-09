// ============================================================
//  Expensas mensuales (flujo unificado).
//
//  Flujo del admin cada mes:
//    1) GENERAR masivamente: a cada depto se le asigna el monto fijo de su
//       tipo (A/B/C). agua = 0, estado = "Agua pendiente".
//    2) REGISTRAR agua uno por uno con el medidor:
//       - lectura anterior: autocargada (readOnly, salvo "Ajustar anterior")
//       - lectura actual : la ingresa el admin
//       - agua (Bs)      : autocalculada; el admin puede sobreescribirla
//    3) REGISTRAR gastos extras (opcional, despues del agua, antes del pago):
//       - lista de {descripcion, monto} por expensa.
//       - total = base + agua + sumatoria(extras).
//    Mientras el estado sea "Agua pendiente" el pago queda bloqueado.
//
//    "Vencida" = expensa que paso el dia de vencimiento sin pagarse.
//
//  --- SINCRONIZACION ---
//  ALICUOTAS, CONFIG_MORA y REGLAS_PERIODO son MISMAS REFERENCIAS que los
//  objetos de configuracionMock y moraMock (mutar en un lado se refleja en el otro).
//  CONFIG_AGUA extiende configuracionMock.CONFIG_AGUA con los campos del flujo
//  nuevo (tarifaPorM3, minimoM3, minimoBs) para que v1 y v2 compartan datos.
//
//  --- PERIODOS DINAMICOS ---
//  El selector de periodo en Expensas.jsx usa `periodosDisponibles()` que
//  devuelve los MESES YA CERRADOS desde Octubre 2026 (inicio del edificio)
//  hasta el mes anterior al actual del sistema. El mes en curso NUNCA aparece
//  (todavia no termino). Si se simula una fecha futura, los nuevos meses
//  cerrados aparecen solos.
//
//  Cada expensa guarda alias v1 (departamento, monto, lecturaAnterior,
//  lecturaActual) ademas de los campos v2, para que Pagos.jsx y otras pantallas
//  sigan funcionando sin modificaciones.
// ============================================================

import { PERIODOS } from './finanzasMock';
import { EXPENSA_BASE, CONFIG_AGUA as CONFIG_AGUA_SHARED, REGLAS_PERIODO } from './configuracionMock';
import { CONFIG_MORA as CONFIG_MORA_SHARED } from './moraMock';
import { departamentos, numeroDe, numerosDepto, vincularResponsable } from './edificioMock';
export { PERIODOS, REGLAS_PERIODO };

// --- Tarifas por tipo de departamento (misma referencia que EXPENSA_BASE) ---
export const TARIFAS = EXPENSA_BASE;
export const ALICUOTAS = EXPENSA_BASE;

// --- Mora: misma referencia que moraMock.CONFIG_MORA (sync automatico) ---
export const CONFIG_MORA = CONFIG_MORA_SHARED;

// --- Agua: extiende el objeto compartido con los campos del flujo nuevo ---
if (CONFIG_AGUA_SHARED.tarifaPorM3 === undefined) CONFIG_AGUA_SHARED.tarifaPorM3 = CONFIG_AGUA_SHARED.precioM3 ?? 3;
if (CONFIG_AGUA_SHARED.minimoM3 === undefined) CONFIG_AGUA_SHARED.minimoM3 = 5;
if (CONFIG_AGUA_SHARED.minimoBs === undefined) CONFIG_AGUA_SHARED.minimoBs = CONFIG_AGUA_SHARED.tarifaMinima ?? 15;
export const CONFIG_AGUA = CONFIG_AGUA_SHARED;

// --- Historial de cambios de tarifas (auditoria) ---
export const HISTORIAL_TARIFAS = [
    {
        id: 'HT-001', fechaCambio: '01/10/2026', vigenteDesde: 'Octubre 2026',
        precioPorM3: CONFIG_AGUA.tarifaPorM3, minimoBs: CONFIG_AGUA.minimoBs, minimoM3: CONFIG_AGUA.minimoM3,
        interesMensual: CONFIG_MORA.interesMensual, tipoCalculo: CONFIG_MORA.tipoCalculo,
        diaVencimiento: REGLAS_PERIODO?.diaVencimiento ?? 15,
        alicuotaA: EXPENSA_BASE.A, alicuotaB: EXPENSA_BASE.B, alicuotaC: EXPENSA_BASE.C,
        admin: 'Oscar Tarque', razon: 'Configuracion inicial del edificio',
    },
];

// Filtro de deptos: sale del edificio (edificioMock)
export const DEPARTAMENTOS_FILTRO = ['Todos', ...numerosDepto()];
export const ESTADOS_EXPENSA = ['Todos', 'Agua pendiente', 'Lista', 'Pagada', 'Vencida'];

// Ultima lectura del medidor de agua de cada depto (dato propio de Finanzas)
const ULTIMA_LECTURA = {
    101: 103, 102: 120, 103: 90, 201: 180, 202: 204, 203: 150, 301: 60, 302: 153, 303: 170,
};

// Catalogo de departamentos activos: se arma desde el edificio (edificioMock).
// tipo = categoria de expensa (A/B/C). responsable se lee siempre del edificio.
export const DEPARTAMENTOS_ACTIVOS = departamentos().map((u) => {
    const n = numeroDe(u);
    const lectura = ULTIMA_LECTURA[n] ?? 0;
    return vincularResponsable({
        id: n, depto: n, departamento: u.identificador, tipo: u.categoria,
        base: EXPENSA_BASE[u.categoria], ultimaLectura: lectura, lecturaAnterior: lectura,
    });
});

// Calculo del agua por medidor (unico modo automatico).
export const calcularAgua = (m3, tarifa = CONFIG_AGUA.tarifaPorM3) => {
    const consumo = Math.max(0, Number(m3) || 0);
    const t = Math.max(0, Number(tarifa) || 0);
    if (consumo <= CONFIG_AGUA.minimoM3) {
        return { agua: CONFIG_AGUA.minimoBs, m3: consumo };
    }
    return { agua: Math.round(consumo * t), m3: consumo };
};

// ============================================================
//  GASTOS EXTRAS
// ============================================================
// Cada expensa puede tener 0..N extras: { id, descripcion, monto, fecha }.
// El total de la expensa = base + agua + sumatoria(extras).
// Las semillas no tienen extras por default; el admin los agrega via UI.

// Suma de los extras de una fila (soporta extras undefined/null).
export const totalExtras = (row) => {
    const arr = row?.extras || [];
    return arr.reduce((s, e) => s + (Number(e.monto) || 0), 0);
};

// Total correcto de una expensa = base + agua + extras.
export const totalExpensa = (row) => (row?.base || 0) + (row?.agua || 0) + totalExtras(row);

// Recalcula row.total segun la composicion actual + extras.
// Se llama despues de agregar/editar/eliminar extras y despues de registrar agua.
export const recalcularTotalExpensa = (row) => {
    if (!row) return;
    row.total = totalExpensa(row);
    row.monto = row.total; // alias v1 para Pagos.jsx
};

// Agrega un extra a la fila y recalcula el total.
export const agregarExtra = (row, { descripcion, monto }) => {
    if (!row) return;
    if (!row.extras) row.extras = [];
    const ultId = row.extras.reduce((m, e) => Math.max(m, e.id || 0), 0);
    row.extras.push({
        id: ultId + 1,
        descripcion: String(descripcion || '').trim(),
        monto: Math.max(0, Number(monto) || 0),
        fecha: new Date().toLocaleDateString('es-BO'),
    });
    recalcularTotalExpensa(row);
};

// Elimina un extra por id y recalcula el total.
export const eliminarExtra = (row, id) => {
    if (!row || !row.extras) return;
    row.extras = row.extras.filter((e) => e.id !== id);
    recalcularTotalExpensa(row);
};

// ============================================================
//  PERIODOS DINAMICOS
// ============================================================

const MESES_LARGOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Inicio del edificio = Octubre 2026 (0-indexed: mes=9).
const PRIMER_PERIODO = { anio: 2026, mes: 9 };

// Devuelve los periodos ya cerrados hasta la fecha del sistema, mas reciente primero.
// Hoy = 6-Nov-2026      -> ['Octubre 2026']
// Simulando Feb-2027   -> ['Enero 2027', 'Diciembre 2026', 'Noviembre 2026', 'Octubre 2026']
// El mes en curso NUNCA aparece (aun no termino).
export const periodosDisponibles = () => {
    const hoy = new Date();
    const primerDiaMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const periodos = [];
    let anio = PRIMER_PERIODO.anio;
    let mes = PRIMER_PERIODO.mes;
    let seguro = 0;
    while (seguro++ < 240) {
        const inicioSiguiente = new Date(anio, mes + 1, 1);
        if (inicioSiguiente > primerDiaMesActual) break;
        periodos.push(`${MESES_LARGOS[mes]} ${anio}`);
        mes++;
        if (mes >= 12) { mes = 0; anio++; }
    }
    return periodos.reverse();
};

// Mes en curso segun fecha del sistema ("Noviembre 2026").
// Util para el aviso "la expensa de este mes aun no se puede generar".
export const periodoEnCurso = () => {
    const hoy = new Date();
    return `${MESES_LARGOS[hoy.getMonth()]} ${hoy.getFullYear()}`;
};

// Semillas: Octubre 2026 (primer mes del sistema, ya cerrado y con el agua registrada).
// Escenario (debe coincidir con pagosMock):
//   101 Pagada con anticipo PA-0011      | 102 pago parcial PG-0039 (debe 165)
//   103 sin pagar                        | 201 Pagada con PG-0041
//   202 Pagada con anticipo PA-0010      | 203 sin pagar
//   301 Pagada con PG-0042               | 302 Pagada con PG-0040
//   303 Pagada con anticipo PA-0012
// Octubre vence el 10/nov/2026: desde ese dia 102, 103 y 203 quedan morosos
// (lo calcula deudasMock.js, no se escribe a mano).
export const EXPENSAS_MOCK = [
    {
        id: 'EX-0001', depto: '101', departamento: 'Depto. 101', tipo: 'A', periodo: 'Octubre 2026',
        base: 300, agua: 15, m3: 3, lecturaAnt: 100, lecturaAct: 103, lecturaAnterior: 100, lecturaActual: 103,
        extras: [],
        monto: 315, total: 315, estado: 'Pagada', pagado: 315, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: '02/10/2026'
    },
    {
        id: 'EX-0002', depto: '102', departamento: 'Depto. 102', tipo: 'B', periodo: 'Octubre 2026',
        base: 350, agua: 15, m3: 5, lecturaAnt: 115, lecturaAct: 120, lecturaAnterior: 115, lecturaActual: 120,
        extras: [],
        monto: 365, total: 365, estado: 'Lista', pagado: 200, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: '03/10/2026'
    },
    {
        id: 'EX-0003', depto: '103', departamento: 'Depto. 103', tipo: 'A', periodo: 'Octubre 2026',
        base: 300, agua: 15, m3: 4, lecturaAnt: 86, lecturaAct: 90, lecturaAnterior: 86, lecturaActual: 90,
        extras: [],
        monto: 315, total: 315, estado: 'Lista', pagado: 0, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: '03/10/2026'
    },
    {
        id: 'EX-0004', depto: '201', departamento: 'Depto. 201', tipo: 'A', periodo: 'Octubre 2026',
        base: 300, agua: 18, m3: 6, lecturaAnt: 174, lecturaAct: 180, lecturaAnterior: 174, lecturaActual: 180,
        extras: [],
        monto: 318, total: 318, estado: 'Pagada', pagado: 318, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: '03/10/2026'
    },
    {
        id: 'EX-0005', depto: '202', departamento: 'Depto. 202', tipo: 'B', periodo: 'Octubre 2026',
        base: 350, agua: 15, m3: 4, lecturaAnt: 200, lecturaAct: 204, lecturaAnterior: 200, lecturaActual: 204,
        extras: [],
        monto: 365, total: 365, estado: 'Pagada', pagado: 365, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: '02/10/2026'
    },
    {
        id: 'EX-0006', depto: '203', departamento: 'Depto. 203', tipo: 'B', periodo: 'Octubre 2026',
        base: 350, agua: 15, m3: 5, lecturaAnt: 145, lecturaAct: 150, lecturaAnterior: 145, lecturaActual: 150,
        extras: [],
        monto: 365, total: 365, estado: 'Lista', pagado: 0, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: '03/10/2026'
    },
    {
        id: 'EX-0007', depto: '301', departamento: 'Depto. 301', tipo: 'C', periodo: 'Octubre 2026',
        base: 400, agua: 15, m3: 3, lecturaAnt: 57, lecturaAct: 60, lecturaAnterior: 57, lecturaActual: 60,
        extras: [],
        monto: 415, total: 415, estado: 'Pagada', pagado: 415, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: '02/10/2026'
    },
    {
        id: 'EX-0008', depto: '302', departamento: 'Depto. 302', tipo: 'C', periodo: 'Octubre 2026',
        base: 400, agua: 15, m3: 3, lecturaAnt: 150, lecturaAct: 153, lecturaAnterior: 150, lecturaActual: 153,
        extras: [],
        monto: 415, total: 415, estado: 'Pagada', pagado: 415, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: '02/10/2026'
    },
    {
        id: 'EX-0009', depto: '303', departamento: 'Depto. 303', tipo: 'C', periodo: 'Octubre 2026',
        base: 400, agua: 21, m3: 7, lecturaAnt: 163, lecturaAct: 170, lecturaAnterior: 163, lecturaActual: 170,
        extras: [],
        monto: 421, total: 421, estado: 'Pagada', pagado: 421, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: '03/10/2026'
    },
];
// El responsable de cada expensa se lee del edificio segun su depto
EXPENSAS_MOCK.forEach((e) => vincularResponsable(e));

export const estadoChipSx = (estado) => {
    if (estado === 'Lista') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Pagada') return { bgcolor: '#E4EEF5', color: '#1F5F8B' };
    if (estado === 'Vencida') return { bgcolor: '#FDE7E6', color: '#D9534F' };
    return { bgcolor: '#FDF0D5', color: '#B6802A' }; // Agua pendiente
};