const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validarDatosPago, aplicarPagoAExpensas, lineasAsientoPago, estadoTrasPago } = require('../src/modules/financiero/utils/pagos.utils');
const { construirAsiento } = require('../src/modules/financiero/utils/contabilidad.utils');

const EXPENSAS = [
  { id: 8, saldoPendiente: '350.00', mora: 6.53 },  // agosto, vencida
  { id: 13, saldoPendiente: '350.00', mora: 0 },    // septiembre
];
// Cuando el cobro de mora está desactivado el servicio pasa mora = 0
const SIN_MORA = EXPENSAS.map((e) => ({ ...e, mora: 0 }));

describe('validarDatosPago', () => {
  it('normaliza un pago válido', () => {
    const p = validarDatosPago({ unidadId: '3', cuentaId: 1, monto: '350', metodo: 'efectivo' });
    assert.equal(p.unidadId, 3);
    assert.equal(p.monto, 350);
    assert.equal(p.metodo, 'EFECTIVO');
    assert.equal(p.cobrarMora, false);
    assert.equal(p.expensaIds, undefined);
  });

  it('exige referencia en transferencias y QR', () => {
    assert.throws(() => validarDatosPago({ unidadId: 1, cuentaId: 1, monto: 10, metodo: 'QR' }), /referencia/);
    assert.doesNotThrow(() => validarDatosPago({ unidadId: 1, cuentaId: 1, monto: 10, metodo: 'QR', referencia: 'QR-1' }));
  });

  it('rechaza monto cero, método desconocido y unidad faltante con 400', () => {
    for (const body of [
      { unidadId: 1, cuentaId: 1, monto: 0, metodo: 'EFECTIVO' },
      { unidadId: 1, cuentaId: 1, monto: 10, metodo: 'CHEQUE' },
      { cuentaId: 1, monto: 10, metodo: 'EFECTIVO' },
    ]) {
      assert.throws(() => validarDatosPago(body), (e) => e.status === 400);
    }
  });
});

describe('aplicarPagoAExpensas', () => {
  it('paga completa la expensa más antigua y deja el resto pendiente', () => {
    const r = aplicarPagoAExpensas(350, SIN_MORA);
    assert.deepEqual(r.aplicaciones, [{ expensaId: 8, mora: 0, capital: 350 }]);
    assert.equal(r.sobrante, 0);
  });

  it('cobra primero la mora y luego el capital cuando moraPrimero está activo', () => {
    const r = aplicarPagoAExpensas(350, EXPENSAS, { moraPrimero: true });
    assert.deepEqual(r.aplicaciones, [{ expensaId: 8, mora: 6.53, capital: 343.47 }]);
    assert.equal(r.totalMora, 6.53);
    assert.equal(r.totalCapital, 343.47);
  });

  it('distribuye un pago grande entre varias expensas y el excedente es anticipo', () => {
    const r = aplicarPagoAExpensas(800, SIN_MORA);
    assert.deepEqual(r.aplicaciones, [
      { expensaId: 8, mora: 0, capital: 350 },
      { expensaId: 13, mora: 0, capital: 350 },
    ]);
    assert.equal(r.sobrante, 100);
    assert.equal(r.totalCapital, 700);
  });

  it('un pago parcial deja saldo en la primera expensa y no toca la siguiente', () => {
    const r = aplicarPagoAExpensas(200, SIN_MORA);
    assert.deepEqual(r.aplicaciones, [{ expensaId: 8, mora: 0, capital: 200 }]);
  });

  it('con moraPrimero desactivado cobra el capital antes que la mora', () => {
    const r = aplicarPagoAExpensas(352, EXPENSAS, { moraPrimero: false });
    assert.deepEqual(r.aplicaciones, [{ expensaId: 8, mora: 2, capital: 350 }]);
    assert.equal(r.sobrante, 0);
  });

  it('sin expensas pendientes todo el monto es anticipo', () => {
    const r = aplicarPagoAExpensas(150, []);
    assert.equal(r.aplicaciones.length, 0);
    assert.equal(r.sobrante, 150);
  });

  it('rechaza monto no positivo', () => {
    assert.throws(() => aplicarPagoAExpensas(0, EXPENSAS), /mayor a cero/);
  });
});

describe('lineasAsientoPago', () => {
  it('produce un asiento cuadrado: debe caja = capital + mora + anticipo', () => {
    const lineas = lineasAsientoPago({ cuentaOperativa: '1.1.01', totalCapital: 700, totalMora: 6.53, sobrante: 100, codigoUnidad: 'DEP-301' });
    const a = construirAsiento({ glosa: 'Pago', origenTipo: 'PAGO', lineas });
    assert.equal(a.totalDebe, 806.53);
    assert.equal(a.totalHaber, 806.53);
    assert.equal(a.lineas.length, 4);
  });

  it('omite las líneas de mora y anticipo cuando son cero', () => {
    const lineas = lineasAsientoPago({ cuentaOperativa: '1.1.02', totalCapital: 350, totalMora: 0, sobrante: 0, codigoUnidad: 'DEP-201' });
    const a = construirAsiento({ glosa: 'Pago', origenTipo: 'PAGO', lineas });
    assert.equal(a.lineas.length, 2);
    assert.equal(a.lineas[0].cuenta, '1.1.02');
  });
});

describe('estadoTrasPago', () => {
  const base = { monto: 350, estadoActual: 'VENCIDA' };
  it('PAGADA cuando el capital cubre el saldo', () => {
    assert.deepEqual(estadoTrasPago({ ...base, saldoAnterior: '350.00', capitalAplicado: 350 }), { saldo: 0, estado: 'PAGADA' });
  });
  it('PARCIAL cuando queda saldo menor al monto', () => {
    assert.deepEqual(estadoTrasPago({ ...base, saldoAnterior: '350.00', capitalAplicado: 200 }), { saldo: 150, estado: 'PARCIAL' });
  });
  it('mantiene el estado si no se aplicó capital (solo mora)', () => {
    assert.deepEqual(estadoTrasPago({ ...base, saldoAnterior: '350.00', capitalAplicado: 0 }), { saldo: 350, estado: 'VENCIDA' });
  });
  it('rechaza aplicar más capital que el saldo', () => {
    assert.throws(() => estadoTrasPago({ ...base, saldoAnterior: '100.00', capitalAplicado: 150 }), /supera/);
  });
});
