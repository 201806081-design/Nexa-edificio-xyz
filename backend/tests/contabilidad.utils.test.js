const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { construirAsiento, saldoPorNaturaleza, codigoCuentaOperativa, CUENTAS } = require('../src/modules/financiero/utils/contabilidad.utils');

describe('construirAsiento · partida doble', () => {
  it('acepta un asiento cuadrado y calcula totales', () => {
    const a = construirAsiento({
      fecha: '2026-09-05', glosa: 'Pago expensa DEP-101', origenTipo: 'PAGO', origenId: 7,
      lineas: [{ cuenta: CUENTAS.CAJA, debe: 350 }, { cuenta: CUENTAS.CUENTAS_POR_COBRAR, haber: 350 }],
    });
    assert.equal(a.totalDebe, 350);
    assert.equal(a.totalHaber, 350);
    assert.equal(a.lineas.length, 2);
    assert.equal(a.origenId, 7);
  });

  it('rechaza un asiento descuadrado con status 422', () => {
    assert.throws(
      () => construirAsiento({ glosa: 'x', origenTipo: 'MANUAL', lineas: [{ cuenta: '1.1.01', debe: 100 }, { cuenta: '4.1.01', haber: 99.99 }] }),
      (e) => e.status === 422 && /descuadrado/.test(e.message)
    );
  });

  it('cuadra en centavos aunque los importes tengan decimales "difíciles"', () => {
    const a = construirAsiento({ glosa: 'x', origenTipo: 'MANUAL', lineas: [
      { cuenta: '1.1.01', debe: 0.1 }, { cuenta: '1.1.02', debe: 0.2 }, { cuenta: '4.1.01', haber: 0.3 },
    ] });
    assert.equal(a.totalDebe, 0.3);
    assert.equal(a.totalHaber, 0.3);
  });

  it('descarta líneas en cero (p. ej. sobrante 0) y mantiene el cuadre', () => {
    const a = construirAsiento({ glosa: 'x', origenTipo: 'PAGO', lineas: [
      { cuenta: '1.1.01', debe: 350 }, { cuenta: '1.1.03', haber: 350 }, { cuenta: '4.1.02', haber: 0 }, { cuenta: '2.1.01', haber: 0 },
    ] });
    assert.equal(a.lineas.length, 2);
  });

  it('rechaza una línea con debe y haber a la vez', () => {
    assert.throws(() => construirAsiento({ glosa: 'x', origenTipo: 'MANUAL', lineas: [{ cuenta: '1.1.01', debe: 10, haber: 10 }, { cuenta: '4.1.01', haber: 0 }] }), /debe y haber/);
  });

  it('rechaza asientos sin glosa, con menos de dos líneas o de importe cero', () => {
    assert.throws(() => construirAsiento({ glosa: '', origenTipo: 'MANUAL', lineas: [{ cuenta: '1', debe: 1 }, { cuenta: '2', haber: 1 }] }), /glosa/);
    assert.throws(() => construirAsiento({ glosa: 'x', origenTipo: 'MANUAL', lineas: [{ cuenta: '1', debe: 1 }] }), /dos líneas/);
    assert.throws(() => construirAsiento({ glosa: 'x', origenTipo: 'MANUAL', lineas: [{ cuenta: '1', debe: 0 }, { cuenta: '2', haber: 0 }] }), /dos líneas con importe/);
  });
});

describe('saldoPorNaturaleza', () => {
  it('deudora: debe − haber; acreedora: haber − debe', () => {
    assert.equal(saldoPorNaturaleza({ naturaleza: 'DEUDORA', debe: 1000, haber: 300 }), 700);
    assert.equal(saldoPorNaturaleza({ naturaleza: 'ACREEDORA', debe: 300, haber: 1000 }), 700);
    assert.equal(saldoPorNaturaleza({ naturaleza: 'ACREEDORA', debe: 1000, haber: 300 }), -700);
  });
});

describe('codigoCuentaOperativa', () => {
  it('usa la cuenta contable asignada si existe, si no infiere por tipo', () => {
    assert.equal(codigoCuentaOperativa({ tipo: 'CAJA', cuentaContable: { codigo: '1.1.05' } }), '1.1.05');
    assert.equal(codigoCuentaOperativa({ tipo: 'CAJA' }), CUENTAS.CAJA);
    assert.equal(codigoCuentaOperativa({ tipo: 'BANCO' }), CUENTAS.BANCOS);
  });
});
