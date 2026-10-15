// Datos de prueba de mora y pagos anticipados. Montos en Bs.

// --- Mora e intereses ---

// Tasa de interes mensual por mora (10%)
export const TASA_MORA = 0.10;

// Configuracion de mora (valores por defecto del formulario)
export const CONFIG_MORA = {
    interesMensual: '10%',
    aplicarDespuesDe: 'Fecha de vencimiento',
    tipoCalculo: 'Interes acumulado',
};

export const APLICAR_DESPUES = ['Fecha de vencimiento', 'Periodo vencido'];
export const TIPOS_CALCULO = ['Interes acumulado', 'Interes simple'];

// Texto de la regla aplicada (aviso)
export const REGLA_MORA = {
    texto: 'El interes se calcula una vez por cada mes vencido sobre la deuda acumulada.',
    ejemplo: 'Ejemplo: Bs 360 --> primer mes 396 --> segundo mes Bs 435,60.',
};

// Deudas vencidas. El interes se acumula mes a mes sobre la deuda.
export const DEUDAS_VENCIDAS = [
    { id: 1, depto: '101', periodo: 'Agosto 2026', deudaOriginal: 360, meses: 1 },
    { id: 2, depto: '202', periodo: 'Julio 2026', deudaOriginal: 375, meses: 2 },
    { id: 3, depto: '303', periodo: 'Junio 2026', deudaOriginal: 420, meses: 3 },
];