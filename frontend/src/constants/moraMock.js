// Datos de prueba de mora y pagos anticipados. Montos en Bs.
// El sistema nacio en Octubre 2026 — NO hay deudas vencidas de meses anteriores.
// Si en Noviembre quedan expensas de Octubre sin pagar, se calculan como mora
// desde las EXPENSAS_MOCK con fecha de vencimiento pasada (logica de Mora.jsx).

// ============================================================
//  MORA E INTERESES
// ============================================================

// Tasa por defecto (compatibilidad); la vigente sale de CONFIG_MORA.interesMensual
export const TASA_MORA = 0.10;

// Configuracion de mora vigente.
// Nota: el "diaVencimiento" NO vive aqui; se lee/escribe en configuracionMock.REGLAS_PERIODO
// para mantenerlo sincronizado con la configuracion financiera de Expensas.
// 'tipoCalculo' usa "Compuesto"/"Simple" (unificado con Configuracion financiera v2).
export const CONFIG_MORA = {
    interesMensual: 10, // porcentaje
    aplicarMoraDesde: 'Dia siguiente a la fecha de vencimiento',
    tipoCalculo: 'Compuesto',
    vigenteDesde: 'Noviembre 2026',
};

export const APLICAR_MORA_DESDE = [
    'Dia siguiente a la fecha de vencimiento',
    'Fecha de vencimiento',
    'Periodo vencido',
];
export const TIPOS_CALCULO = ['Compuesto', 'Simple'];
export const VIGENTE_DESDE = ['Noviembre 2026', 'Diciembre 2026', 'Octubre 2026'];

// Periodo sobre el que se actualizan los intereses
export const PERIODO_ACTUAL_MORA = 'Octubre 2026';

// Texto de la regla aplicada (aviso)
export const REGLA_MORA = {
    texto: 'La mora se calcula una vez por cada mes vencido sobre la deuda actualizada.',
    ejemplo: 'Ejemplo: Bs 360 -> primer mes Bs 396 -> segundo mes Bs 435,60.',
};

// Deudas vencidas: vacio al inicio porque el sistema nacio en Octubre 2026.
// Si Octubre vencio (10-Oct) y alguna expensa quedo sin pagar, la mora se
// calcula directamente desde EXPENSAS_MOCK en la pantalla de Mora, cruzando
// la fecha de vencimiento con la fecha del sistema.
export const DEUDAS_VENCIDAS = [];

// ============================================================
//  PAGOS ANTICIPADOS (compatibilidad con pantallas antiguas)
// ============================================================

export const DEPARTAMENTOS_ANTICIPO = [
    { id: '101', etiqueta: '101 - Tipo A', responsable: 'Ana Lopez -- Propietario', expensaMensual: 300, saldoActual: 0 },
    { id: '202', etiqueta: '202 - Tipo B', responsable: 'Luis Perez -- Propietario', expensaMensual: 350, saldoActual: 0 },
    { id: '303', etiqueta: '303 - Tipo C', responsable: 'Rafael Cruz -- Propietario', expensaMensual: 400, saldoActual: 0 },
];

export const HISTORIAL_ANTICIPOS = [];

// ============================================================
//  COMPATIBILIDAD: pantallas antiguas (si aun existen)
// ============================================================

export const RESUMEN_MORA = { deudasVencidas: 0, interesAcumulado: 0, saldoAFavor: 0 };
export const SALDOS_VENCIDOS = [];
export const PAGOS_ANTICIPADOS = [];
export const CONFIG_INTERES = { activo: true, tipoInteres: 'Porcentaje mensual', porcentaje: 10, diasGracia: 5, aplicarDesde: 'Fecha de vencimiento' };
export const TIPOS_INTERES = ['Porcentaje mensual', 'Monto fijo'];
export const APLICAR_DESDE = ['Fecha de vencimiento', 'Periodo vencido'];
export const APLICAR_DESPUES = ['Fecha de vencimiento', 'Periodo vencido'];
export const MESES_APLICA = ['Noviembre 2026', 'Diciembre 2026', 'Enero 2027', 'Febrero 2027'];
export const DETALLE_ANTICIPO = {
    codigo: 'ANT-2026-10-202-001', departamento: 'Depto. 202', responsable: 'Luis Perez -- Propietario',
    fechaPago: '03/10/2026', montoAnticipado: 1500, deudaPendiente: 0, saldoAFavor: 1135,
    aplicacion: [
        { periodo: 'Octubre 2026', monto: 365, estado: 'Cubierta' },
    ],
};