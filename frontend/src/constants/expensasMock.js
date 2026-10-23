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
//  Cada expensa guarda alias v1 (departamento, monto, lecturaAnterior,
//  lecturaActual) ademas de los campos v2, para que Pagos.jsx y otras pantallas
//  sigan funcionando sin modificaciones.
// ============================================================

import { PERIODOS } from './finanzasMock';
import { EXPENSA_BASE, CONFIG_AGUA as CONFIG_AGUA_SHARED, REGLAS_PERIODO } from './configuracionMock';
import { CONFIG_MORA as CONFIG_MORA_SHARED } from './moraMock';
export { PERIODOS, REGLAS_PERIODO };

// --- Tarifas por tipo de departamento (misma referencia que EXPENSA_BASE) ---
export const TARIFAS = EXPENSA_BASE;
export const ALICUOTAS = EXPENSA_BASE;

// --- Mora: misma referencia que moraMock.CONFIG_MORA (sync automatico) ---
export const CONFIG_MORA = CONFIG_MORA_SHARED;

// --- Agua: extiende el objeto compartido con los campos del flujo nuevo ---
// Si configuracionMock ya tenia precioM3/tarifaMinima, los conservamos y agregamos los v2.
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

export const DEPARTAMENTOS_FILTRO = ['Todos', '101', '102', '103', '201', '202', '203', '301', '302', '303'];
export const ESTADOS_EXPENSA = ['Todos', 'Agua pendiente', 'Lista', 'Pagada', 'Vencida'];

// Catalogo de departamentos activos.
// 'ultimaLectura' = ultima lectura del medidor registrada (se usa como "lectura
// anterior" al abrir el modal de registrar agua y se actualiza con la lectura actual).
export const DEPARTAMENTOS_ACTIVOS = [
    { id: '101', depto: '101', departamento: 'Depto. 101', tipo: 'A', responsable: 'Ana Lopez', base: EXPENSA_BASE.A, ultimaLectura: 103, lecturaAnterior: 103 },
    { id: '102', depto: '102', departamento: 'Depto. 102', tipo: 'B', responsable: 'Luis Garcia', base: EXPENSA_BASE.B, ultimaLectura: 120, lecturaAnterior: 120 },
    { id: '103', depto: '103', departamento: 'Depto. 103', tipo: 'A', responsable: 'Pedro Mamani', base: EXPENSA_BASE.A, ultimaLectura: 90, lecturaAnterior: 90 },
    { id: '201', depto: '201', departamento: 'Depto. 201', tipo: 'A', responsable: 'Sofia Flores', base: EXPENSA_BASE.A, ultimaLectura: 180, lecturaAnterior: 180 },
    { id: '202', depto: '202', departamento: 'Depto. 202', tipo: 'B', responsable: 'Luis Perez', base: EXPENSA_BASE.B, ultimaLectura: 204, lecturaAnterior: 204 },
    { id: '203', depto: '203', departamento: 'Depto. 203', tipo: 'B', responsable: 'Carlos Mendoza', base: EXPENSA_BASE.B, ultimaLectura: 150, lecturaAnterior: 150 },
    { id: '301', depto: '301', departamento: 'Depto. 301', tipo: 'C', responsable: 'Rocio Alba', base: EXPENSA_BASE.C, ultimaLectura: 60, lecturaAnterior: 60 },
    { id: '302', depto: '302', departamento: 'Depto. 302', tipo: 'C', responsable: 'Maria Rojas', base: EXPENSA_BASE.C, ultimaLectura: 153, lecturaAnterior: 153 },
    { id: '303', depto: '303', departamento: 'Depto. 303', tipo: 'C', responsable: 'Rafael Cruz', base: EXPENSA_BASE.C, ultimaLectura: 170, lecturaAnterior: 170 },
];

// Calculo del agua por medidor (unico modo automatico).
// Admite un segundo parametro con la tarifa (default: CONFIG_AGUA.tarifaPorM3).
export const calcularAgua = (m3, tarifa = CONFIG_AGUA.tarifaPorM3) => {
    const consumo = Math.max(0, Number(m3) || 0);
    const t = Math.max(0, Number(tarifa) || 0);
    if (consumo <= CONFIG_AGUA.minimoM3) {
        return { agua: CONFIG_AGUA.minimoBs, m3: consumo };
    }
    return { agua: Math.round(consumo * t), m3: consumo };
};

// Semillas (Octubre 2026 con mezcla de estados + 1 vencida de Septiembre para demo).
// Cada entrada incluye TANTO los campos v2 (depto, total, lecturaAnt, lecturaAct)
// COMO los alias v1 (departamento, monto, lecturaAnterior, lecturaActual) para
// que Pagos.jsx y otras pantallas sigan funcionando sin cambios.
export const EXPENSAS_MOCK = [
    // --- Octubre 2026 ---
    {
        id: 'EX-0001', depto: '101', departamento: 'Depto. 101', tipo: 'A', responsable: 'Ana Lopez', periodo: 'Octubre 2026',
        base: 300, agua: 15, m3: 3, lecturaAnt: 100, lecturaAct: 103, lecturaAnterior: 100, lecturaActual: 103,
        monto: 315, total: 315, estado: 'Lista', pagado: 0, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: '02/10/2026'
    },
    {
        id: 'EX-0002', depto: '102', departamento: 'Depto. 102', tipo: 'B', responsable: 'Luis Garcia', periodo: 'Octubre 2026',
        base: 350, agua: 15, m3: 5, lecturaAnt: 115, lecturaAct: 120, lecturaAnterior: 115, lecturaActual: 120,
        monto: 365, total: 365, estado: 'Pagada', pagado: 365, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: '03/10/2026'
    },
    {
        id: 'EX-0003', depto: '103', departamento: 'Depto. 103', tipo: 'A', responsable: 'Pedro Mamani', periodo: 'Octubre 2026',
        base: 300, agua: 0, m3: null, lecturaAnt: null, lecturaAct: null, lecturaAnterior: null, lecturaActual: null,
        monto: 300, total: 300, estado: 'Agua pendiente', pagado: 0, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: null
    },
    {
        id: 'EX-0004', depto: '201', departamento: 'Depto. 201', tipo: 'A', responsable: 'Sofia Flores', periodo: 'Octubre 2026',
        base: 300, agua: 0, m3: null, lecturaAnt: null, lecturaAct: null, lecturaAnterior: null, lecturaActual: null,
        monto: 300, total: 300, estado: 'Agua pendiente', pagado: 0, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: null
    },
    {
        id: 'EX-0005', depto: '202', departamento: 'Depto. 202', tipo: 'B', responsable: 'Luis Perez', periodo: 'Octubre 2026',
        base: 350, agua: 15, m3: 4, lecturaAnt: 200, lecturaAct: 204, lecturaAnterior: 200, lecturaActual: 204,
        monto: 365, total: 365, estado: 'Lista', pagado: 0, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: '02/10/2026'
    },
    {
        id: 'EX-0006', depto: '203', departamento: 'Depto. 203', tipo: 'B', responsable: 'Carlos Mendoza', periodo: 'Octubre 2026',
        base: 350, agua: 0, m3: null, lecturaAnt: null, lecturaAct: null, lecturaAnterior: null, lecturaActual: null,
        monto: 350, total: 350, estado: 'Agua pendiente', pagado: 0, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: null
    },
    {
        id: 'EX-0007', depto: '301', departamento: 'Depto. 301', tipo: 'C', responsable: 'Rocio Alba', periodo: 'Octubre 2026',
        base: 400, agua: 0, m3: null, lecturaAnt: null, lecturaAct: null, lecturaAnterior: null, lecturaActual: null,
        monto: 400, total: 400, estado: 'Agua pendiente', pagado: 0, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: null
    },
    {
        id: 'EX-0008', depto: '302', departamento: 'Depto. 302', tipo: 'C', responsable: 'Maria Rojas', periodo: 'Octubre 2026',
        base: 400, agua: 15, m3: 3, lecturaAnt: 150, lecturaAct: 153, lecturaAnterior: 150, lecturaActual: 153,
        monto: 415, total: 415, estado: 'Lista', pagado: 0, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: '02/10/2026'
    },
    {
        id: 'EX-0009', depto: '303', departamento: 'Depto. 303', tipo: 'C', responsable: 'Rafael Cruz', periodo: 'Octubre 2026',
        base: 400, agua: 0, m3: null, lecturaAnt: null, lecturaAct: null, lecturaAnterior: null, lecturaActual: null,
        monto: 400, total: 400, estado: 'Agua pendiente', pagado: 0, aguaNota: '', fechaGen: '01/10/2026', fechaAgua: null
    },

    // --- Septiembre 2026 (vencida, demo) ---
    {
        id: 'EX-0010', depto: '203', departamento: 'Depto. 203', tipo: 'B', responsable: 'Carlos Mendoza', periodo: 'Septiembre 2026',
        base: 350, agua: 15, m3: 5, lecturaAnt: 145, lecturaAct: 150, lecturaAnterior: 145, lecturaActual: 150,
        monto: 365, total: 365, estado: 'Vencida', pagado: 0, aguaNota: '', fechaGen: '01/09/2026', fechaAgua: '02/09/2026'
    },
];

export const estadoChipSx = (estado) => {
    if (estado === 'Lista') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Pagada') return { bgcolor: '#E4EEF5', color: '#1F5F8B' };
    if (estado === 'Vencida') return { bgcolor: '#FDE7E6', color: '#D9534F' };
    return { bgcolor: '#FDF0D5', color: '#B6802A' }; // Agua pendiente
};