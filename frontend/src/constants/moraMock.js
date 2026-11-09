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
