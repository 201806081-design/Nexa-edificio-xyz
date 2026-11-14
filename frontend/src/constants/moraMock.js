// Configuracion de mora e intereses. Montos en Bs.
// El sistema nacio en Octubre 2026. Las deudas vencidas se calculan en
// deudasMock.js desde las expensas no pagadas con fecha de vencimiento pasada.

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

// Texto de la regla aplicada (aviso)
export const REGLA_MORA = {
    texto: 'La mora se calcula una vez por cada mes vencido sobre la deuda actualizada.',
    ejemplo: 'Ejemplo: Bs 360 -> primer mes Bs 396 -> segundo mes Bs 435,60.',
};

// Las deudas vencidas y los morosos NO se escriben aqui: los calcula
// deudasMock.js a partir de las expensas y la fecha del sistema.
