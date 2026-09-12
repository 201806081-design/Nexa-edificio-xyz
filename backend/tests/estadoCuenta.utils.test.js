const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resumirEstadoCuenta } = require('../src/modules/financiero/utils/estadoCuenta.utils');

const CONFIG = { tasaMensual: 2, diasGracia: 5, metodo: 'SIMPLE' };
const HOY = new Date('2026-09-25T12:00:00Z');

const EXPENSAS = [
  { id: 1, monto: '350.00', saldoPendiente: '0.00', fechaVencimiento: '2026-08-10', estado: 'PAGADA', periodo: { anio: 2026, mes: 8 } },
  { id: 2, monto: '350.00', saldoPendiente: '350.00', fechaVencimiento: '2026-08-10', estado: 'VENCIDA', periodo: { anio: 2026, mes: 8 } },
  { id: 3, monto: '350.00', saldoPendiente: '150.00', fechaVencimiento: '2026-09-10', estado: 'PARCIAL', periodo: { anio: 2026, mes: 9 } },
];

describe('resumirEstadoCuenta', () => {
  it('totaliza emitido, pagado y saldo pendiente en centavos exactos', () => {
    const { totales } = resumirEstadoCuenta({ expensas: EXPENSAS, configMora: CONFIG, hoy: HOY });
    assert.equal(totales.totalEmitido, 1050);
    assert.equal(totales.totalPagado, 550);
    assert.equal(totales.saldoPendiente, 500);
    assert.equal(totales.alDia, false);
  });

  it('calcula la mora estimada solo sobre expensas con saldo y vencidas', () => {
    const { expensas, totales } = resumirEstadoCuenta({ expensas: EXPENSAS, configMora: CONFIG, hoy: HOY });
    assert.equal(expensas[0].moraEstimada, 0);            // pagada
    // exp 2: vence 10-ago + 5 gracia = 15-ago → 25-sep = 41 días → 350 × 2% × 41/30 = 9.5666 → 9.57
    assert.equal(expensas[1].diasAtraso, 41);
    assert.equal(expensas[1].moraEstimada, 9.57);
    // exp 3: vence 10-sep + 5 gracia = 15-sep → 25-sep = 10 días → 150 × 2% × 10/30 = 1.00
    assert.equal(expensas[2].diasAtraso, 10);
    assert.equal(expensas[2].moraEstimada, 1);
    assert.equal(totales.moraEstimada, 10.57);
    assert.equal(totales.totalAdeudado, 510.57);
    assert.equal(totales.expensasVencidas, 2);
  });

  it('suma los anticipos como saldo a favor', () => {
    const { totales } = resumirEstadoCuenta({ expensas: [], anticipos: [{ saldoDisponible: '100.00' }, { saldoDisponible: '25.50' }], hoy: HOY });
    assert.equal(totales.saldoAFavor, 125.5);
    assert.equal(totales.alDia, true);
  });

  it('sin configuración de mora no genera intereses', () => {
    const { totales } = resumirEstadoCuenta({ expensas: EXPENSAS, hoy: HOY });
    assert.equal(totales.moraEstimada, 0);
    assert.equal(totales.totalAdeudado, 500);
  });

  it('expone lo pagado por expensa', () => {
    const { expensas } = resumirEstadoCuenta({ expensas: EXPENSAS, configMora: CONFIG, hoy: HOY });
    assert.equal(expensas[2].pagado, 200);
  });
});
