// ============================================================
//  Expensas v2
//
//  Flujo:
//    1) El admin GENERA masivamente: a cada depto le asigna el
//       monto fijo de su tipo. agua = 0, estado = "Agua pendiente".
//    2) El admin REGISTRA el agua uno por uno con el medidor:
//       - lectura anterior: autocargada (no modificable)
//       - lectura actual : la ingresa el admin
//       - precio por m3  : modificable solo para ese registro
//                          (default = CONFIG_AGUA_V2.tarifaPorM3)
//       Si consumo <= minimoM3 se cobra el minimoBs (cargo minimo).
//    Mientras el estado sea "Agua pendiente" el pago queda bloqueado.
//
//    "Vencida" = expensa que paso el dia de vencimiento sin pagarse.
//                A partir de ahi arranca a correr la mora.
// ============================================================

import { PERIODOS } from './finanzasMock';
export { PERIODOS };

export const ESTADOS_V2 = ['Todos', 'Agua pendiente', 'Lista', 'Pagada', 'Vencida'];
export const DEPARTAMENTOS_V2_FILTRO = ['Todos', '101', '102', '103', '201', '202', '203', '301', '302', '303'];

// Alicuota fija por tipo de departamento. Objeto MUTABLE: se actualiza desde
// ConfiguracionFinancieraV2 (los chips/calculos leen de aqui en vivo).
export const ALICUOTAS_V2 = { A: 300, B: 350, C: 400 };

// Configuracion de agua. Objeto MUTABLE: se actualiza desde ConfiguracionFinancieraV2.
export const CONFIG_AGUA_V2 = {
    tarifaPorM3: 3,
    minimoM3: 5,
    minimoBs: 15,
};

// Configuracion de mora. Objeto MUTABLE: se actualiza desde ConfiguracionFinancieraV2.
export const CONFIG_MORA_V2 = {
    interesMensual: 2,                                               // % mensual
    tipoCalculo: 'Compuesto',                                        // 'Simple' | 'Compuesto'
    diaVencimiento: 15,                                              // dia del mes en que vence la expensa
    aplicarMoraDesde: 'Dia siguiente a la fecha de vencimiento',     // sincronizado con Mora e intereses
};

// Historial de cambios de tarifas (auditoria). Se agrega una entrada por cada
// cambio guardado desde ConfiguracionFinancieraV2.
export const HISTORIAL_TARIFAS_V2 = [
    {
        id: 'HT-001', fechaCambio: '01/10/2026', vigenteDesde: 'Octubre 2026',
        precioPorM3: 3, minimoBs: 15, minimoM3: 5,
        interesMensual: 2, tipoCalculo: 'Compuesto', diaVencimiento: 15,
        alicuotaA: 300, alicuotaB: 350, alicuotaC: 400,
        admin: 'Oscar Tarque', razon: 'Configuracion inicial del edificio',
    },
];

// Catalogo de departamentos.
// 'ultimaLectura' = ultima lectura del medidor registrada para ese depto.
// Se autocarga como "lectura anterior" al abrir el modal de registro de agua
// y se actualiza con la lectura actual cada vez que se confirma un registro.
export const DEPTOS_V2 = [
    { id: '101', tipo: 'A', responsable: 'Ana Lopez', ultimaLectura: 103 },
    { id: '102', tipo: 'B', responsable: 'Luis Garcia', ultimaLectura: 120 },
    { id: '103', tipo: 'A', responsable: 'Pedro Mamani', ultimaLectura: 90 },
    { id: '201', tipo: 'A', responsable: 'Sofia Flores', ultimaLectura: 180 },
    { id: '202', tipo: 'B', responsable: 'Luis Perez', ultimaLectura: 204 },
    { id: '203', tipo: 'B', responsable: 'Carlos Mendoza', ultimaLectura: 150 },
    { id: '301', tipo: 'C', responsable: 'Rocio Alba', ultimaLectura: 60 },
    { id: '302', tipo: 'C', responsable: 'Maria Rojas', ultimaLectura: 153 },
    { id: '303', tipo: 'C', responsable: 'Rafael Cruz', ultimaLectura: 170 },
];

// Calculo del agua por medidor (unico modo).
// Admite un segundo parametro con la tarifa (por defecto CONFIG_AGUA_V2.tarifaPorM3)
// para que el modal pueda recalcular con tarifa modificada por el admin.
export const calcularAgua = (m3, tarifa = CONFIG_AGUA_V2.tarifaPorM3) => {
    const consumo = Math.max(0, Number(m3) || 0);
    const t = Math.max(0, Number(tarifa) || 0);
    if (consumo <= CONFIG_AGUA_V2.minimoM3) {
        return { agua: CONFIG_AGUA_V2.minimoBs, m3: consumo };
    }
    return { agua: Math.round(consumo * t), m3: consumo };
};

// Semillas (Octubre 2026 con mezcla de estados + 1 vencida de Septiembre para demo)
export const EXPENSAS_V2_MOCK = [
    // --- Octubre 2026 ---
    {
        id: 'EX2-0001', depto: '101', tipo: 'A', responsable: 'Ana Lopez', periodo: 'Octubre 2026',
        base: 300, agua: 15, m3: 3, lecturaAnt: 100, lecturaAct: 103, aguaNota: '',
        total: 315, estado: 'Lista', pagado: 0, fechaGen: '01/10/2026', fechaAgua: '02/10/2026'
    },
    {
        id: 'EX2-0002', depto: '102', tipo: 'B', responsable: 'Luis Garcia', periodo: 'Octubre 2026',
        base: 350, agua: 15, m3: 5, lecturaAnt: 115, lecturaAct: 120, aguaNota: '',
        total: 365, estado: 'Pagada', pagado: 365, fechaGen: '01/10/2026', fechaAgua: '03/10/2026'
    },
    {
        id: 'EX2-0003', depto: '103', tipo: 'A', responsable: 'Pedro Mamani', periodo: 'Octubre 2026',
        base: 300, agua: 0, m3: null, lecturaAnt: null, lecturaAct: null, aguaNota: '',
        total: 300, estado: 'Agua pendiente', pagado: 0, fechaGen: '01/10/2026', fechaAgua: null
    },
    {
        id: 'EX2-0004', depto: '201', tipo: 'A', responsable: 'Sofia Flores', periodo: 'Octubre 2026',
        base: 300, agua: 0, m3: null, lecturaAnt: null, lecturaAct: null, aguaNota: '',
        total: 300, estado: 'Agua pendiente', pagado: 0, fechaGen: '01/10/2026', fechaAgua: null
    },
    {
        id: 'EX2-0005', depto: '202', tipo: 'B', responsable: 'Luis Perez', periodo: 'Octubre 2026',
        base: 350, agua: 15, m3: 4, lecturaAnt: 200, lecturaAct: 204, aguaNota: '',
        total: 365, estado: 'Lista', pagado: 0, fechaGen: '01/10/2026', fechaAgua: '02/10/2026'
    },
    {
        id: 'EX2-0006', depto: '203', tipo: 'B', responsable: 'Carlos Mendoza', periodo: 'Octubre 2026',
        base: 350, agua: 0, m3: null, lecturaAnt: null, lecturaAct: null, aguaNota: '',
        total: 350, estado: 'Agua pendiente', pagado: 0, fechaGen: '01/10/2026', fechaAgua: null
    },
    {
        id: 'EX2-0007', depto: '301', tipo: 'C', responsable: 'Rocio Alba', periodo: 'Octubre 2026',
        base: 400, agua: 0, m3: null, lecturaAnt: null, lecturaAct: null, aguaNota: '',
        total: 400, estado: 'Agua pendiente', pagado: 0, fechaGen: '01/10/2026', fechaAgua: null
    },
    {
        id: 'EX2-0008', depto: '302', tipo: 'C', responsable: 'Maria Rojas', periodo: 'Octubre 2026',
        base: 400, agua: 15, m3: 3, lecturaAnt: 150, lecturaAct: 153, aguaNota: '',
        total: 415, estado: 'Lista', pagado: 0, fechaGen: '01/10/2026', fechaAgua: '02/10/2026'
    },
    {
        id: 'EX2-0009', depto: '303', tipo: 'C', responsable: 'Rafael Cruz', periodo: 'Octubre 2026',
        base: 400, agua: 0, m3: null, lecturaAnt: null, lecturaAct: null, aguaNota: '',
        total: 400, estado: 'Agua pendiente', pagado: 0, fechaGen: '01/10/2026', fechaAgua: null
    },

    // --- Septiembre 2026 (vencida, demo) ---
    {
        id: 'EX2-0010', depto: '203', tipo: 'B', responsable: 'Carlos Mendoza', periodo: 'Septiembre 2026',
        base: 350, agua: 15, m3: 5, lecturaAnt: 145, lecturaAct: 150, aguaNota: '',
        total: 365, estado: 'Vencida', pagado: 0, fechaGen: '01/09/2026', fechaAgua: '02/09/2026'
    },
];

export const estadoV2ChipSx = (estado) => {
    if (estado === 'Lista') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Pagada') return { bgcolor: '#E4EEF5', color: '#1F5F8B' };
    if (estado === 'Vencida') return { bgcolor: '#FDE7E6', color: '#D9534F' };
    return { bgcolor: '#FDF0D5', color: '#B6802A' }; // Agua pendiente
};