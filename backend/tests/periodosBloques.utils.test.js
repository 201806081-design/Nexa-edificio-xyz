// Pizarra 22-oct: generación en bloques por categoría (A/B) y registro de agua uno por uno.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  validarDatosPeriodo, montoParaUnidad, perteneceAlBloque, generarExpensasParaUnidades, calcularAjusteAgua,
} = require('../src/modules/financiero/utils/periodos.utils');

const U = [
  { id: 1, codigo: 'DEP-101', tipo: 'DEPARTAMENTO', piso: 1, categoria: 'A', activo: true, coeficiente: '0.0420' },
  { id: 2, codigo: 'DEP-201', tipo: 'DEPARTAMENTO', piso: 2, categoria: 'A', activo: true, coeficiente: '0.0455' },
  { id: 3, codigo: 'DEP-301', tipo: 'DEPARTAMENTO', piso: 3, categoria: 'B', activo: true, coeficiente: '0.0540' },
  { id: 4, codigo: 'PARQ-01', tipo: 'PARQUEO', piso: -1, categoria: null, activo: true, coeficiente: '0.0060' },
  { id: 5, codigo: 'BAUL-01', tipo: 'BAULERA', piso: -1, categoria: null, activo: true, coeficiente: '0.0020' },
];
const FV = new Date('2026-11-10T00:00:00Z');

describe('validarDatosPeriodo (bloques)', () => {
  it('acepta montosPorCategoria y categorias, y normaliza a mayúsculas', () => {
    const c = validarDatosPeriodo({ anio: 2026, mes: 11, montosPorCategoria: { a: 300, b: '350' }, categorias: ['a', 'A'] });
    assert.deepEqual(c.montosPorCategoria, { A: 300, B: 350 });
    assert.deepEqual(c.categorias, ['A']);
    assert.equal(c.modo, 'FIJO');
  });
  it('en modo FIJO exige al menos una fuente de montos', () => {
    assert.throws(() => validarDatosPeriodo({ anio: 2026, mes: 11 }), /montoBase, montosPorTipo o montosPorCategoria/);
    assert.throws(() => validarDatosPeriodo({ anio: 2026, mes: 11, montosPorCategoria: { A: -1 } }), /montosPorCategoria\.A/);
    assert.throws(() => validarDatosPeriodo({ anio: 2026, mes: 11, montoBase: 300, categorias: [] }), /categorias/);
  });
});

describe('montoParaUnidad (prioridad categoría > tipo > base)', () => {
  const cfg = { modo: 'FIJO', montoBase: 100, montosPorTipo: { PARQUEO: 80 }, montosPorCategoria: { A: 300, B: 350 } };
  it('usa la categoría del departamento cuando existe', () => {
    assert.equal(montoParaUnidad(U[0], cfg), 300);
    assert.equal(montoParaUnidad(U[2], cfg), 350);
  });
  it('cae al tipo y luego al monto base', () => {
    assert.equal(montoParaUnidad(U[3], cfg), 80);   // parqueo por tipo
    assert.equal(montoParaUnidad(U[4], cfg), 100);  // baulera por base
  });
});

describe('generarExpensasParaUnidades (en bloques)', () => {
  it('bloque A primero: solo A1 y A2', () => {
    const cfg = validarDatosPeriodo({ anio: 2026, mes: 11, montosPorCategoria: { A: 300, B: 350 }, categorias: ['A'] });
    const r = generarExpensasParaUnidades(U, cfg, { periodoId: 9, fechaVencimiento: FV });
    assert.deepEqual(r.filas.map((f) => f.unidadId), [1, 2]);
    assert.equal(r.totalEmitido, 600);
    assert.deepEqual(r.omitidas.map((o) => o.motivo), ['FUERA_DEL_BLOQUE', 'FUERA_DEL_BLOQUE', 'FUERA_DEL_BLOQUE']);
    assert.ok(perteneceAlBloque(U[0], ['A']) && !perteneceAlBloque(U[2], ['A']) && !perteneceAlBloque(U[3], ['A']));
  });
  it('bloque B después, sin repetir las ya generadas', () => {
    const cfg = validarDatosPeriodo({ anio: 2026, mes: 11, montosPorCategoria: { A: 300, B: 350 }, categorias: ['B'] });
    const r = generarExpensasParaUnidades(U, cfg, { periodoId: 9, fechaVencimiento: FV, excluirUnidadIds: new Set([1, 2]) });
    assert.deepEqual(r.filas.map((f) => f.unidadId), [3]);
    assert.equal(r.totalEmitido, 350);
  });
  it('sin bloque genera todo lo que falte y marca YA_GENERADA', () => {
    const cfg = validarDatosPeriodo({ anio: 2026, mes: 11, montosPorCategoria: { A: 300, B: 350 }, montosPorTipo: { PARQUEO: 80, BAULERA: 40 } });
    const r = generarExpensasParaUnidades(U, cfg, { periodoId: 9, fechaVencimiento: FV, excluirUnidadIds: new Set([1, 2, 3]) });
    assert.deepEqual(r.filas.map((f) => [f.unidadId, f.monto]), [[4, 80], [5, 40]]);
    assert.equal(r.omitidas.filter((o) => o.motivo === 'YA_GENERADA').length, 3);
  });
});

describe('calcularAjusteAgua (uno por uno)', () => {
  it('agrega agua a una expensa fija: sube monto y saldo por la diferencia', () => {
    const r = calcularAjusteAgua({ montoActual: '300.00', montoAguaActual: '0', saldoActual: '300.00', montoAguaNuevo: 35 });
    assert.deepEqual(r, { montoAgua: 35, montoFijo: 300, monto: 335, saldoPendiente: 335, delta: 35 });
  });
  it('corregir el agua reemplaza, no suma (35 → 41 = +6)', () => {
    const r = calcularAjusteAgua({ montoActual: '335.00', montoAguaActual: '35.00', saldoActual: '335.00', montoAguaNuevo: 41 });
    assert.deepEqual(r, { montoAgua: 41, montoFijo: 300, monto: 341, saldoPendiente: 341, delta: 6 });
  });
  it('si ya pagó parte, el saldo se ajusta y no puede quedar negativo', () => {
    const r = calcularAjusteAgua({ montoActual: '335.00', montoAguaActual: '35.00', saldoActual: '35.00', montoAguaNuevo: 20 });
    assert.deepEqual(r, { montoAgua: 20, montoFijo: 300, monto: 320, saldoPendiente: 20, delta: -15 });
    assert.throws(() => calcularAjusteAgua({ montoActual: '335.00', montoAguaActual: '35.00', saldoActual: '10.00', montoAguaNuevo: 0 }), /por debajo de lo ya pagado/);
  });
});
