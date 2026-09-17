// Pruebas unitarias base · se ejecutan con:  npm test
// Usa el test runner nativo de Node (node:test), sin dependencias externas.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { calcularMora, calcularDiasAtraso, determinarEstadoExpensa, aCentavos } = require('../src/modules/financiero/utils/expensas.utils');

const CONFIG = { tasaMensual: 2, diasGracia: 5, fechaVencimiento: '2026-09-10', metodo: 'SIMPLE' };

describe('aCentavos', () => {
  it('convierte a centavos enteros sin error de punto flotante', () => {
    assert.equal(aCentavos(0.1 + 0.2), 30);
    assert.equal(aCentavos('350.00'), 35000);
    assert.equal(aCentavos(19.99), 1999);
  });

  it('rechaza montos negativos o no numéricos', () => {
    assert.throws(() => aCentavos(-1));
    assert.throws(() => aCentavos('abc'));
  });
});

describe('calcularDiasAtraso', () => {
  it('es 0 antes del vencimiento', () => {
    assert.equal(calcularDiasAtraso({ fechaVencimiento: '2026-09-10', fechaCalculo: '2026-09-05', diasGracia: 5 }), 0);
  });

  it('es 0 dentro del periodo de gracia', () => {
    assert.equal(calcularDiasAtraso({ fechaVencimiento: '2026-09-10', fechaCalculo: '2026-09-15', diasGracia: 5 }), 0);
  });

  it('descuenta los días de gracia', () => {
    assert.equal(calcularDiasAtraso({ fechaVencimiento: '2026-09-10', fechaCalculo: '2026-09-25', diasGracia: 5 }), 10);
  });
});

describe('calcularMora · método SIMPLE', () => {
  it('no genera mora si la expensa aún no venció', () => {
    const r = calcularMora({ ...CONFIG, saldoPendiente: 350, fechaCalculo: '2026-09-08' });
    assert.deepEqual(r, { diasAtraso: 0, mora: 0 });
  });

  it('no genera mora si el saldo es cero', () => {
    const r = calcularMora({ ...CONFIG, saldoPendiente: 0, fechaCalculo: '2026-12-01' });
    assert.equal(r.mora, 0);
  });

  it('30 días de atraso al 2% sobre Bs 350 = Bs 7.00', () => {
    // vence 10-sep + 5 gracia = 15-sep → 15-oct son 30 días
    const r = calcularMora({ ...CONFIG, saldoPendiente: 350, fechaCalculo: '2026-10-15' });
    assert.equal(r.diasAtraso, 30);
    assert.equal(r.mora, 7);
  });

  it('15 días de atraso al 2% sobre Bs 350 = Bs 3.50 (proporcional)', () => {
    const r = calcularMora({ ...CONFIG, saldoPendiente: 350, fechaCalculo: '2026-09-30' });
    assert.equal(r.diasAtraso, 15);
    assert.equal(r.mora, 3.5);
  });

  it('redondea a 2 decimales (333.33 × 2% = 6.6666 → 6.67)', () => {
    const r = calcularMora({ ...CONFIG, saldoPendiente: 333.33, fechaCalculo: '2026-10-15' });
    assert.equal(r.mora, 6.67);
  });

  it('acepta el saldo como string (como llega de DECIMAL en la BD)', () => {
    const r = calcularMora({ ...CONFIG, saldoPendiente: '350.00', fechaCalculo: '2026-10-15' });
    assert.equal(r.mora, 7);
  });
});

describe('calcularMora · método COMPUESTO', () => {
  it('60 días al 2% sobre Bs 350 = Bs 14.14 (capitaliza mensualmente)', () => {
    // 350 × ((1.02)^2 − 1) = 350 × 0.0404 = 14.14
    const r = calcularMora({ ...CONFIG, metodo: 'COMPUESTO', saldoPendiente: 350, fechaCalculo: '2026-11-14' });
    assert.equal(r.diasAtraso, 60);
    assert.equal(r.mora, 14.14);
  });

  it('coincide con el simple durante el primer mes', () => {
    const simple = calcularMora({ ...CONFIG, saldoPendiente: 350, fechaCalculo: '2026-09-30' });
    const compuesto = calcularMora({ ...CONFIG, metodo: 'COMPUESTO', saldoPendiente: 350, fechaCalculo: '2026-09-30' });
    assert.equal(simple.mora, compuesto.mora);
  });
});

describe('calcularMora · validaciones', () => {
  it('rechaza tasa negativa', () => {
    assert.throws(() => calcularMora({ ...CONFIG, tasaMensual: -1, saldoPendiente: 100, fechaCalculo: '2026-10-15' }));
  });

  it('rechaza método desconocido', () => {
    assert.throws(() => calcularMora({ ...CONFIG, metodo: 'RARO', saldoPendiente: 100, fechaCalculo: '2026-10-15' }), /desconocido/);
  });
});

describe('determinarEstadoExpensa', () => {
  const base = { monto: 350, fechaVencimiento: '2026-09-10' };

  it('PAGADA cuando el saldo es cero', () => {
    assert.equal(determinarEstadoExpensa({ ...base, saldoPendiente: 0, fechaCalculo: '2026-09-05' }), 'PAGADA');
  });

  it('PENDIENTE cuando no hay pagos y no venció', () => {
    assert.equal(determinarEstadoExpensa({ ...base, saldoPendiente: 350, fechaCalculo: '2026-09-05' }), 'PENDIENTE');
  });

  it('PARCIAL cuando hay pago incompleto y no venció', () => {
    assert.equal(determinarEstadoExpensa({ ...base, saldoPendiente: 150, fechaCalculo: '2026-09-05' }), 'PARCIAL');
  });

  it('VENCIDA cuando hay saldo y pasó la fecha de vencimiento', () => {
    assert.equal(determinarEstadoExpensa({ ...base, saldoPendiente: 150, fechaCalculo: '2026-09-20' }), 'VENCIDA');
    assert.equal(determinarEstadoExpensa({ ...base, saldoPendiente: 350, fechaCalculo: '2026-09-20' }), 'VENCIDA');
  });

  it('rechaza saldo mayor al monto', () => {
    assert.throws(() => determinarEstadoExpensa({ ...base, saldoPendiente: 400, fechaCalculo: '2026-09-05' }));
  });
});
