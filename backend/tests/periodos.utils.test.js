const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validarDatosPeriodo, calcularFechasPeriodo, montoParaUnidad, generarExpensasParaUnidades } = require('../src/modules/financiero/utils/periodos.utils');

const UNIDADES = [
  { id: 1, codigo: 'DEP-101', tipo: 'DEPARTAMENTO', coeficiente: 0.042, activo: true },
  { id: 2, codigo: 'DEP-201', tipo: 'DEPARTAMENTO', coeficiente: 0.0455, activo: true },
  { id: 3, codigo: 'PARQ-01', tipo: 'PARQUEO', coeficiente: 0.006, activo: true },
  { id: 4, codigo: 'BAUL-09', tipo: 'BAULERA', coeficiente: 0.002, activo: false },
];

describe('validarDatosPeriodo', () => {
  it('acepta un periodo FIJO con montoBase', () => {
    const r = validarDatosPeriodo({ anio: 2026, mes: 10, montoBase: 350 });
    assert.equal(r.modo, 'FIJO');
    assert.equal(r.montoBase, 350);
  });

  it('rechaza mes fuera de rango y año inválido', () => {
    assert.throws(() => validarDatosPeriodo({ anio: 2026, mes: 13, montoBase: 1 }), /mes inválido/);
    assert.throws(() => validarDatosPeriodo({ anio: 1999, mes: 1, montoBase: 1 }), /anio inválido/);
  });

  it('exige montoBase o montosPorTipo en modo FIJO', () => {
    assert.throws(() => validarDatosPeriodo({ anio: 2026, mes: 10 }), /montoBase o montosPorTipo/);
  });

  it('exige presupuestoTotal en modo COEFICIENTE', () => {
    assert.throws(() => validarDatosPeriodo({ anio: 2026, mes: 10, modo: 'COEFICIENTE' }), /presupuestoTotal/);
    const ok = validarDatosPeriodo({ anio: 2026, mes: 10, modo: 'coeficiente', presupuestoTotal: 10000 });
    assert.equal(ok.modo, 'COEFICIENTE');
  });

  it('rechaza diaVencimiento fuera de 1-28', () => {
    assert.throws(() => validarDatosPeriodo({ anio: 2026, mes: 10, montoBase: 1, diaVencimiento: 31 }), /diaVencimiento/);
  });

  it('los errores de validación llevan status 400', () => {
    try {
      validarDatosPeriodo({ anio: 2026, mes: 0 });
      assert.fail('debió lanzar');
    } catch (e) {
      assert.equal(e.status, 400);
    }
  });
});

describe('calcularFechasPeriodo', () => {
  it('emite el día 1 y vence el día configurado (UTC)', () => {
    const { fechaEmision, fechaVencimiento } = calcularFechasPeriodo({ anio: 2026, mes: 10, diaVencimiento: 10 });
    assert.equal(fechaEmision.toISOString(), '2026-10-01T00:00:00.000Z');
    assert.equal(fechaVencimiento.toISOString(), '2026-10-10T00:00:00.000Z');
  });
});

describe('montoParaUnidad', () => {
  it('modo FIJO usa el monto por tipo si existe, si no el montoBase', () => {
    const cfg = { modo: 'FIJO', montoBase: 350, montosPorTipo: { PARQUEO: 50 } };
    assert.equal(montoParaUnidad(UNIDADES[0], cfg), 350);
    assert.equal(montoParaUnidad(UNIDADES[2], cfg), 50);
  });

  it('modo COEFICIENTE prorratea el presupuesto por la alícuota', () => {
    const cfg = { modo: 'COEFICIENTE', presupuestoTotal: 10000 };
    assert.equal(montoParaUnidad(UNIDADES[0], cfg), 420);     // 10000 × 0.0420
    assert.equal(montoParaUnidad(UNIDADES[1], cfg), 455);     // 10000 × 0.0455
    assert.equal(montoParaUnidad(UNIDADES[2], cfg), 60);      // 10000 × 0.0060
  });

  it('redondea a centavos una sola vez', () => {
    const cfg = { modo: 'COEFICIENTE', presupuestoTotal: 12345.67 };
    assert.equal(montoParaUnidad(UNIDADES[0], cfg), 518.52);  // 518.51814 → 518.52
  });

  it('devuelve 0 si la unidad no tiene coeficiente en modo COEFICIENTE', () => {
    assert.equal(montoParaUnidad({ tipo: 'DEPARTAMENTO' }, { modo: 'COEFICIENTE', presupuestoTotal: 1000 }), 0);
  });
});

describe('generarExpensasParaUnidades', () => {
  const venc = new Date('2026-10-10T00:00:00Z');

  it('genera una expensa por unidad activa con saldo igual al monto', () => {
    const { filas, totalEmitido } = generarExpensasParaUnidades(UNIDADES, { modo: 'FIJO', montoBase: 350, montosPorTipo: { PARQUEO: 50 } }, { periodoId: 7, fechaVencimiento: venc });
    assert.equal(filas.length, 3); // BAUL-09 está inactiva
    assert.deepEqual(filas[0], { unidadId: 1, periodoId: 7, monto: 350, saldoPendiente: 350, fechaVencimiento: venc });
    assert.equal(totalEmitido, 750);
  });

  it('omite unidades cuyo monto resulta 0', () => {
    const { filas } = generarExpensasParaUnidades(UNIDADES, { modo: 'FIJO', montoBase: 0, montosPorTipo: { PARQUEO: 50 } }, { periodoId: 1, fechaVencimiento: venc });
    assert.equal(filas.length, 1);
    assert.equal(filas[0].unidadId, 3);
  });
});
