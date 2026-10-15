// Configuracion financiera del edificio (mock). Se reemplazara con el backend.
// Todos los montos estan en bolivianos (Bs).

// Expensa base fija por tipo de departamento. Solo cambia cuando el
// administrador actualiza esta configuracion; no se escribe cada mes.
export const EXPENSA_BASE = {
    A: 300,
    B: 350,
    C: 400,
};

// Configuracion del cobro de agua. El consumo se obtiene de la diferencia
// entre la lectura actual y la anterior del medidor.
export const CONFIG_AGUA = {
    precioM3: 3,          // precio por metro cubico
    tarifaMinima: 15,     // cargo minimo de agua
    aplicarMinimo: 'El cargo calculado sea menor al minimo',
};

// Opciones del selector "Aplicar tarifa minima cuando"
export const APLICAR_MINIMO_OPCIONES = [
    'El cargo calculado sea menor al minimo',
    'Siempre',
    'Nunca',
];

// Reglas del periodo
export const REGLAS_PERIODO = {
    diaVencimiento: '10 de cada mes',
    moneda: 'Bolivianos',
};

export const DIAS_VENCIMIENTO = [
    '10 de cada mes',
    '15 de cada mes',
    '20 de cada mes',
    'Ultimo dia del mes',
];

export const MONEDAS = ['Bolivianos', 'Dolares'];

// Desde que periodo se aplica la configuracion vigente
export const CONFIG_VIGENTE_DESDE = 'octubre 2026';
