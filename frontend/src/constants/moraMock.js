// Configuracion de mora e intereses. Montos en Bs.
// El sistema nacio en Octubre 2026. Las deudas vencidas se calculan en
// deudasMock.js desde las expensas no pagadas con fecha de vencimiento pasada.
//
// FUENTE UNICA: "Mora e intereses" y "Configuracion financiera" (Expensas)
// leen CONFIG_MORA y guardan con guardarConfigMora(). Si se cambia en una
// pantalla, la otra (y todos los calculos de deuda) ven el cambio.

import { REGLAS_PERIODO } from './configuracionMock';
import { formatBs } from './finanzasMock';

// ============================================================
//  OPCIONES
// ============================================================

// Metodo de calculo de la mora: solo uno puede estar activo a la vez.
export const METODOS_MORA = {
    PORCENTAJE: 'Porcentaje', // interes mensual sobre la deuda
    MONTO_FIJO: 'Monto fijo', // recargo fijo en Bs por cada mes vencido
};

// Momento desde el que se empieza a cobrar la mora de cada mes vencido
export const APLICAR_DESDE = {
    DIA_SIGUIENTE: 'Dia siguiente a la fecha de vencimiento',
    VENCIMIENTO: 'Fecha de vencimiento',
    PERIODO_VENCIDO: 'Periodo vencido',
};
export const APLICAR_MORA_DESDE = Object.values(APLICAR_DESDE);

// Solo aplica al metodo Porcentaje
export const TIPOS_CALCULO = ['Compuesto', 'Simple'];

// ============================================================
//  CONFIGURACION VIGENTE
// ============================================================

// Nota: el dia de vencimiento NO vive aqui; se lee/escribe en
// configuracionMock.REGLAS_PERIODO (lo comparte con la configuracion de Expensas).
export const CONFIG_MORA = {
    metodo: METODOS_MORA.PORCENTAJE,
    interesMensual: 10, // % mensual (metodo Porcentaje)
    tipoCalculo: 'Compuesto', // metodo Porcentaje
    montoFijo: 50, // Bs por mes vencido (metodo Monto fijo)
    aplicarMoraDesde: APLICAR_DESDE.DIA_SIGUIENTE,
    vigenteDesde: 'Noviembre 2026',
};

// ============================================================
//  CALCULO
// ============================================================

const redondear = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const esMontoFijo = (config = CONFIG_MORA) => config.metodo === METODOS_MORA.MONTO_FIJO;

// Deuda con la mora de "meses" meses vencidos, segun el metodo configurado:
//   Monto fijo -> original + montoFijo × meses
//   Simple     -> original × (1 + tasa × meses)
//   Compuesto  -> original × (1 + tasa) ^ meses
export const montoConMora = (original, meses, config = CONFIG_MORA) => {
    const base = Number(original) || 0;
    const m = Math.max(0, Number(meses) || 0);
    if (esMontoFijo(config)) {
        return redondear(base + (Number(config.montoFijo) || 0) * m);
    }
    const tasa = (Number(config.interesMensual) || 0) / 100;
    const total = config.tipoCalculo === 'Simple'
        ? base * (1 + tasa * m)
        : base * (1 + tasa) ** m;
    return redondear(total);
};

// ============================================================
//  TEXTOS PARA LAS PANTALLAS
// ============================================================

// Valor corto de la mora: 'Bs 50' | '10 %'
export const valorMora = (config = CONFIG_MORA) => (esMontoFijo(config)
    ? formatBs(Number(config.montoFijo) || 0)
    : `${Number(config.interesMensual) || 0} %`);

// Etiqueta del valor: 'Interes mensual (fijo)' | 'Interes mensual'
export const etiquetaMora = (config = CONFIG_MORA) => (esMontoFijo(config) ? 'Interes mensual (fijo)' : 'Interes mensual');

// Forma de calculo: 'Fijo por mes vencido' | 'Compuesto' | 'Simple'
export const formaCalculoMora = (config = CONFIG_MORA) => (esMontoFijo(config) ? 'Fijo por mes vencido' : config.tipoCalculo);

// Descripcion completa: 'Bs 50 por mes vencido' | '10 % mensual (compuesto)'
export const textoMora = (config = CONFIG_MORA) => (esMontoFijo(config)
    ? `${valorMora(config)} por mes vencido`
    : `${valorMora(config)} mensual (${String(config.tipoCalculo).toLowerCase()})`);

// Texto y ejemplo de la regla aplicada (aviso de la pantalla Mora e intereses)
export const describirReglaMora = (config = CONFIG_MORA) => {
    const original = 360;
    const ejemplo = `Ejemplo: ${formatBs(original)} -> primer mes ${formatBs(montoConMora(original, 1, config))}`
        + ` -> segundo mes ${formatBs(montoConMora(original, 2, config))}.`;

    if (esMontoFijo(config)) {
        if (!(Number(config.montoFijo) > 0)) {
            return { texto: 'El monto fijo es Bs 0: las deudas vencidas no generan recargo por mora.', ejemplo: '' };
        }
        return { texto: `Por cada mes vencido se suma un recargo fijo de ${valorMora(config)} a la deuda.`, ejemplo };
    }
    if (!(Number(config.interesMensual) > 0)) {
        return { texto: 'El interes mensual es 0 %: las deudas vencidas no generan recargo por mora.', ejemplo: '' };
    }
    const sobre = config.tipoCalculo === 'Simple' ? 'la deuda original' : 'la deuda actualizada';
    return { texto: `La mora se calcula una vez por cada mes vencido sobre ${sobre}.`, ejemplo };
};

// ============================================================
//  VALIDAR Y GUARDAR (unico punto de escritura)
// ============================================================

// Devuelve un mensaje de error o '' si la configuracion es valida
export const validarConfigMora = (config) => {
    if (esMontoFijo(config)) {
        const monto = Number(config.montoFijo);
        if (config.montoFijo === '' || !Number.isFinite(monto) || monto < 0) {
            return 'Ingresa un monto fijo valido (puede ser Bs 0).';
        }
        return '';
    }
    const tasa = Number(config.interesMensual);
    if (config.interesMensual === '' || !Number.isFinite(tasa) || tasa < 0 || tasa > 100) {
        return 'Ingresa un interes mensual entre 0 y 100 %.';
    }
    return '';
};

// Guarda la configuracion de mora (y el dia de vencimiento compartido).
// Todas las pantallas leen estos mismos objetos, asi quedan sincronizadas.
// PENDIENTE BACKEND: reemplazar por PUT /api/financiero/configuracion/mora.
export const guardarConfigMora = ({ diaVencimiento, ...config }) => {
    Object.assign(CONFIG_MORA, {
        metodo: config.metodo ?? CONFIG_MORA.metodo,
        interesMensual: Number(config.interesMensual) || 0,
        tipoCalculo: config.tipoCalculo ?? CONFIG_MORA.tipoCalculo,
        montoFijo: Number(config.montoFijo) || 0,
        aplicarMoraDesde: config.aplicarMoraDesde ?? CONFIG_MORA.aplicarMoraDesde,
        vigenteDesde: config.vigenteDesde ?? CONFIG_MORA.vigenteDesde,
    });
    if (diaVencimiento != null) REGLAS_PERIODO.diaVencimiento = Number(diaVencimiento) || REGLAS_PERIODO.diaVencimiento;
    return { ...CONFIG_MORA };
};

// Las deudas vencidas y los morosos NO se escriben aqui: los calcula
// deudasMock.js a partir de las expensas y la fecha del sistema.
