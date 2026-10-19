// Datos de prueba de mora y pagos anticipados. Montos en Bs.

// ============================================================
//  MORA E INTERESES
// ============================================================

// Tasa por defecto (compatibilidad); la vigente sale de CONFIG_MORA.interesMensual
export const TASA_MORA = 0.10;

// Configuracion de mora vigente
export const CONFIG_MORA = {
    interesMensual: 10, // porcentaje
    aplicarMoraDesde: 'Dia siguiente a la fecha de vencimiento',
    tipoCalculo: 'Acumulativo',
    vigenteDesde: 'Noviembre 2026',
};

export const APLICAR_MORA_DESDE = [
    'Dia siguiente a la fecha de vencimiento',
    'Fecha de vencimiento',
    'Periodo vencido',
];
export const TIPOS_CALCULO = ['Acumulativo', 'Simple'];
export const VIGENTE_DESDE = ['Noviembre 2026', 'Diciembre 2026', 'Octubre 2026'];

// Periodo sobre el que se actualizan los intereses
export const PERIODO_ACTUAL_MORA = 'Octubre 2026';

// Texto de la regla aplicada (aviso)
export const REGLA_MORA = {
    texto: 'La mora se calcula una vez por cada mes vencido sobre la deuda actualizada.',
    ejemplo: 'Ejemplo: Bs 360 -> primer mes Bs 396 -> segundo mes Bs 435,60.',
};

// Deudas vencidas. El interes se calcula sobre la deuda y los meses vencidos.
export const DEUDAS_VENCIDAS = [
    { id: 1, depto: '101', periodo: 'Agosto 2026', deudaOriginal: 360, meses: 1 },
    { id: 2, depto: '202', periodo: 'Julio 2026', deudaOriginal: 375, meses: 2 },
    { id: 3, depto: '303', periodo: 'Junio 2026', deudaOriginal: 420, meses: 3 },
];

// ============================================================
//  PAGOS ANTICIPADOS
// ============================================================

export const DEPARTAMENTOS_ANTICIPO = [
    { id: '101', etiqueta: '101 - Tipo A', responsable: 'Carlos Mendoza -- Propietario', expensaMensual: 300, saldoActual: 0 },
    { id: '202', etiqueta: '202 - Tipo B', responsable: 'Ana Lopez -- Propietario', expensaMensual: 350, saldoActual: 0 },
    { id: '303', etiqueta: '303 - Tipo C', responsable: 'Luis Rojas -- Propietario', expensaMensual: 400, saldoActual: 0 },
];

export const HISTORIAL_ANTICIPOS = [
    { id: 1, departamento: 'Depto. 203', fecha: '05/10/2026', monto: 700, saldoDisponible: 350, estado: 'Aplicado parcialmente' },
];

// ============================================================
//  COMPATIBILIDAD: pantallas antiguas (si aun existen)
// ============================================================

export const RESUMEN_MORA = { deudasVencidas: 1408.77, interesAcumulado: 253.77, saldoAFavor: 0 };
export const SALDOS_VENCIDOS = [
    { id: 1, departamento: 'Depto. 101', periodo: 'Agosto 2026', capital: 360, interes: 36, totalPendiente: 396, estado: 'Vencido' },
    { id: 2, departamento: 'Depto. 202', periodo: 'Julio 2026', capital: 375, interes: 78.75, totalPendiente: 453.75, estado: 'Vencido' },
];
export const PAGOS_ANTICIPADOS = [
    { id: 1, fecha: '05/10/2026', departamento: 'Depto. 203', capital: 700, periodosCubiertos: 'Noviembre-Diciembre', saldoAFavor: 350, estado: 'Anticipado' },
];
export const CONFIG_INTERES = { activo: true, tipoInteres: 'Porcentaje mensual', porcentaje: 10, diasGracia: 5, aplicarDesde: 'Fecha de vencimiento' };
export const TIPOS_INTERES = ['Porcentaje mensual', 'Monto fijo'];
export const APLICAR_DESDE = ['Fecha de vencimiento', 'Periodo vencido'];
export const APLICAR_DESPUES = ['Fecha de vencimiento', 'Periodo vencido'];
export const MESES_APLICA = ['Noviembre 2026', 'Diciembre 2026', 'Enero 2027', 'Febrero 2027'];
export const DETALLE_ANTICIPO = {
    codigo: 'ANT-2026-10-203-001', departamento: 'Depto. 203', responsable: 'Carlos Mendoza -- Propietario',
    fechaPago: '05/10/2026', montoAnticipado: 700, deudaPendiente: 0, saldoAFavor: 350,
    aplicacion: [
        { periodo: 'Noviembre 2026', monto: 350, estado: 'Cubierta anticipadamente' },
        { periodo: 'Diciembre 2026', monto: 350, estado: 'Cubierta anticipadamente' },
    ],
};