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

import { periodosCerrados, periodoEnCurso } from './periodos';
import { EXPENSA_BASE, CONFIG_AGUA as CONFIG_AGUA_SHARED, REGLAS_PERIODO } from './configuracionMock';
import { CONFIG_MORA as CONFIG_MORA_SHARED } from './moraMock';
import { departamentos, numeroDe, numerosDepto, vincularResponsable, categoriaDe } from './edificioMock';
import { DEPARTAMENTOS_PAGO } from './pagosMock';
export { REGLAS_PERIODO };

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

// Vuelve a armar la lista de deptos de Finanzas y los filtros desde el edificio.
// Llamar despues de registrar o editar una unidad: asi un depto nuevo (ej. el 401)
// aparece en Generar expensa, Expensas, Pagos, Registrar pago y Comunicados.
// Conserva la ultima lectura del medidor de los deptos que ya existian.
export const sincronizarDepartamentosActivos = () => {
    const previos = new Map(DEPARTAMENTOS_ACTIVOS.map((d) => [d.id, d.ultimaLectura]));
    const nuevos = departamentos().map((u) => filaDepto(u, previos.get(numeroDe(u)) ?? 0));
    DEPARTAMENTOS_ACTIVOS.splice(0, DEPARTAMENTOS_ACTIVOS.length, ...nuevos);
    DEPARTAMENTOS_FILTRO.splice(1, DEPARTAMENTOS_FILTRO.length - 1, ...numerosDepto());
    DEPARTAMENTOS_PAGO.splice(1, DEPARTAMENTOS_PAGO.length - 1, ...numerosDepto());
};
export const ESTADOS_EXPENSA = ['Todos', 'Agua pendiente', 'Lista', 'Pagada', 'Vencida'];

// Ultima lectura del medidor de agua de cada depto (dato propio de Finanzas)
const ULTIMA_LECTURA = {
    101: 103, 102: 120, 103: 90, 201: 180, 202: 204, 203: 150, 301: 60, 302: 153, 303: 170,
};

// Catalogo de departamentos activos: se arma desde el edificio (edificioMock).
// tipo = categoria de expensa (A/B/C). responsable se lee siempre del edificio.
const filaDepto = (u, ultimaLectura = 0) => {
    const n = numeroDe(u);
    const categoria = categoriaDe(u);
    return vincularResponsable({
        id: n, depto: n, departamento: u.identificador, tipo: categoria,
        base: EXPENSA_BASE[categoria], ultimaLectura, lecturaAnterior: ultimaLectura,
    });
};
export const DEPARTAMENTOS_ACTIVOS = departamentos().map((u) => filaDepto(u, ULTIMA_LECTURA[numeroDe(u)] ?? 0));

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
//  CARGOS EXTRA DEL MES EN CURSO
//  La expensa de un mes se genera cuando el mes termina, pero los gastos
//  extra (pintura, reparaciones, multas...) ocurren DURANTE el mes. Se
//  registran aqui como pendientes y, al generar la expensa de ese periodo,
//  pasan solos a la columna Extras de cada depto. Despues se pueden editar
//  desde la accion "Editar gastos extras" mientras la expensa no este pagada.
// ============================================================
export const CARGOS_EXTRA_PENDIENTES = [
    // Ejemplo del requisito 2.3: "Extra Pintura Edificio: 250" para todos los deptos
    ...numerosDepto().map((depto, i) => ({
        id: i + 1, grupo: 1, periodo: 'Noviembre 2026', depto,
        descripcion: 'Pintura del edificio', monto: 250, fecha: '05/11/2026',
    })),
];

// Registra un cargo para uno o varios deptos. Devuelve un mensaje de error o null.
export const registrarCargoExtra = ({ periodo, deptos, descripcion, monto }) => {
    const d = String(descripcion || '').trim();
    const m = Number(monto);
    if (!d) return 'La descripcion es obligatoria';
    if (!(m > 0)) return 'Ingresa un monto mayor a 0';
    if (!deptos || deptos.length === 0) return 'Elige al menos un departamento';
    const sigId = CARGOS_EXTRA_PENDIENTES.reduce((mx, c) => Math.max(mx, c.id), 0) + 1;
    const grupo = CARGOS_EXTRA_PENDIENTES.reduce((mx, c) => Math.max(mx, c.grupo), 0) + 1;
    const h = new Date();
    const fecha = `${String(h.getDate()).padStart(2, '0')}/${String(h.getMonth() + 1).padStart(2, '0')}/${h.getFullYear()}`;
    deptos.forEach((depto, i) => CARGOS_EXTRA_PENDIENTES.push({
        id: sigId + i, grupo, periodo, depto: String(depto), descripcion: d, monto: Math.round(m * 100) / 100, fecha,
    }));
    return null;
};

// Cargos pendientes de un periodo agrupados por registro:
// [{ grupo, descripcion, monto, fecha, deptos: ['101', ...] }]
export const cargosPendientesAgrupados = (periodo) => {
    const mapa = new Map();
    CARGOS_EXTRA_PENDIENTES.filter((c) => c.periodo === periodo).forEach((c) => {
        if (!mapa.has(c.grupo)) mapa.set(c.grupo, { grupo: c.grupo, descripcion: c.descripcion, monto: c.monto, fecha: c.fecha, deptos: [] });
        mapa.get(c.grupo).deptos.push(c.depto);
    });
    return [...mapa.values()];
};

// Total pendiente de un depto en un periodo (para la vista previa de Generar expensa)
export const totalCargosPendientes = (periodo, depto) => CARGOS_EXTRA_PENDIENTES
    .filter((c) => c.periodo === periodo && c.depto === String(depto))
    .reduce((s, c) => s + c.monto, 0);

export const eliminarCargoExtra = (grupo) => {
    for (let i = CARGOS_EXTRA_PENDIENTES.length - 1; i >= 0; i--) {
        if (CARGOS_EXTRA_PENDIENTES[i].grupo === grupo) CARGOS_EXTRA_PENDIENTES.splice(i, 1);
    }
};

// Al generar una expensa: pasa sus cargos pendientes a extras y los quita de pendientes
export const aplicarCargosPendientes = (expensa) => {
    const propios = CARGOS_EXTRA_PENDIENTES.filter((c) => c.periodo === expensa.periodo && c.depto === String(expensa.depto));
    propios.forEach((c) => agregarExtra(expensa, { descripcion: c.descripcion, monto: c.monto }));
    for (let i = CARGOS_EXTRA_PENDIENTES.length - 1; i >= 0; i--) {
        const c = CARGOS_EXTRA_PENDIENTES[i];
        if (c.periodo === expensa.periodo && c.depto === String(expensa.depto)) CARGOS_EXTRA_PENDIENTES.splice(i, 1);
    }
    return propios.length;
};

// ============================================================
//  PERIODOS DINAMICOS
// ============================================================

// Los periodos salen de la fuente unica (periodos.js).
// periodosDisponibles = meses cerrados (el mes en curso no se puede generar).
export const periodosDisponibles = periodosCerrados;
export { periodoEnCurso };

// Semillas: Octubre 2026 (primer mes del sistema).
// LINEA DE TIEMPO (una expensa se genera cuando su mes TERMINA):
//   octubre      -> el edificio opera; algunos copropietarios dejan anticipos
//   01/11/2026   -> se generan las expensas de octubre
//   02-03/11     -> se registra el agua de cada depto
//   03-07/11     -> se aplican los anticipos y llegan los pagos (ver pagosMock)
//   10/11/2026   -> vence octubre: quien no pago queda moroso (deudasMock)
// Situacion de cada depto:
//   101 Pagada PG-0037 (credito PA-0011)  | 102 pago parcial PG-0039 (debe 165)
//   103 sin pagar                         | 201 Pagada PG-0041 (efectivo)
//   202 Pagada PG-0036 (credito PA-0010)  | 203 sin pagar
//   301 Pagada PG-0042 (QR)               | 302 Pagada PG-0040 (QR)
//   303 Pagada PG-0038 (credito PA-0012)
export const EXPENSAS_MOCK = [
    {
        id: 'EX-0001', depto: '101', departamento: 'Depto. 101', tipo: 'A', periodo: 'Octubre 2026',
        base: 300, agua: 15, m3: 3, lecturaAnt: 100, lecturaAct: 103, lecturaAnterior: 100, lecturaActual: 103,
        extras: [],
        monto: 315, total: 315, estado: 'Pagada', pagado: 315, aguaNota: '', fechaGen: '01/11/2026', fechaAgua: '02/11/2026'
    },
    {
        id: 'EX-0002', depto: '102', departamento: 'Depto. 102', tipo: 'B', periodo: 'Octubre 2026',
        base: 350, agua: 15, m3: 5, lecturaAnt: 115, lecturaAct: 120, lecturaAnterior: 115, lecturaActual: 120,
        extras: [],
        monto: 365, total: 365, estado: 'Lista', pagado: 200, aguaNota: '', fechaGen: '01/11/2026', fechaAgua: '03/11/2026'
    },
    {
        id: 'EX-0003', depto: '103', departamento: 'Depto. 103', tipo: 'A', periodo: 'Octubre 2026',
        base: 300, agua: 15, m3: 4, lecturaAnt: 86, lecturaAct: 90, lecturaAnterior: 86, lecturaActual: 90,
        extras: [],
        monto: 315, total: 315, estado: 'Lista', pagado: 0, aguaNota: '', fechaGen: '01/11/2026', fechaAgua: '03/11/2026'
    },
    {
        id: 'EX-0004', depto: '201', departamento: 'Depto. 201', tipo: 'A', periodo: 'Octubre 2026',
        base: 300, agua: 18, m3: 6, lecturaAnt: 174, lecturaAct: 180, lecturaAnterior: 174, lecturaActual: 180,
        extras: [],
        monto: 318, total: 318, estado: 'Pagada', pagado: 318, aguaNota: '', fechaGen: '01/11/2026', fechaAgua: '03/11/2026'
    },
    {
        id: 'EX-0005', depto: '202', departamento: 'Depto. 202', tipo: 'B', periodo: 'Octubre 2026',
        base: 350, agua: 15, m3: 4, lecturaAnt: 200, lecturaAct: 204, lecturaAnterior: 200, lecturaActual: 204,
        extras: [],
        monto: 365, total: 365, estado: 'Pagada', pagado: 365, aguaNota: '', fechaGen: '01/11/2026', fechaAgua: '02/11/2026'
    },
    {
        id: 'EX-0006', depto: '203', departamento: 'Depto. 203', tipo: 'B', periodo: 'Octubre 2026',
        base: 350, agua: 15, m3: 5, lecturaAnt: 145, lecturaAct: 150, lecturaAnterior: 145, lecturaActual: 150,
        extras: [],
        monto: 365, total: 365, estado: 'Lista', pagado: 0, aguaNota: '', fechaGen: '01/11/2026', fechaAgua: '03/11/2026'
    },
    {
        id: 'EX-0007', depto: '301', departamento: 'Depto. 301', tipo: 'C', periodo: 'Octubre 2026',
        base: 400, agua: 15, m3: 3, lecturaAnt: 57, lecturaAct: 60, lecturaAnterior: 57, lecturaActual: 60,
        extras: [],
        monto: 415, total: 415, estado: 'Pagada', pagado: 415, aguaNota: '', fechaGen: '01/11/2026', fechaAgua: '02/11/2026'
    },
    {
        id: 'EX-0008', depto: '302', departamento: 'Depto. 302', tipo: 'C', periodo: 'Octubre 2026',
        base: 400, agua: 15, m3: 3, lecturaAnt: 150, lecturaAct: 153, lecturaAnterior: 150, lecturaActual: 153,
        extras: [],
        monto: 415, total: 415, estado: 'Pagada', pagado: 415, aguaNota: '', fechaGen: '01/11/2026', fechaAgua: '02/11/2026'
    },
    {
        id: 'EX-0009', depto: '303', departamento: 'Depto. 303', tipo: 'C', periodo: 'Octubre 2026',
        base: 400, agua: 21, m3: 7, lecturaAnt: 163, lecturaAct: 170, lecturaAnterior: 163, lecturaActual: 170,
        extras: [],
        monto: 421, total: 421, estado: 'Pagada', pagado: 421, aguaNota: '', fechaGen: '01/11/2026', fechaAgua: '03/11/2026'
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