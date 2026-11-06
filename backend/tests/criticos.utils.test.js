// Criticos del docente (6-nov): mora por monto fijo, config con dia de generacion, extras con descripcion, listado por tipo.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { calcularMora, parametrosMora } = require('../src/modules/financiero/utils/expensas.utils');
const { configMoraAVista, vistaAConfigMora, proximaFecha, enriquecerExpensa } = require('../src/modules/financiero/utils/expensasVista.utils');
const { aplicarDeltaCargo, agruparCargosPorTipo } = require('../src/modules/financiero/utils/periodos.utils');

const VENC = new Date('2026-11-10T00:00:00Z');

describe('mora por monto fijo (critico 3.1)', () => {
  const cfg = { tasaMensual: 0, montoFijo: 50, diasGracia: 0, metodo: 'FIJO' };
  it('antes del vencimiento: sin mora', () => {
    assert.deepEqual(calcularMora({ saldoPendiente: 300, ...cfg, fechaVencimiento: VENC, fechaCalculo: new Date('2026-11-05T12:00:00Z') }), { diasAtraso: 0, mora: 0 });
  });
  it('el día del vencimiento: sin mora', () => {
    assert.deepEqual(calcularMora({ saldoPendiente: 300, ...cfg, fechaVencimiento: VENC, fechaCalculo: new Date('2026-11-10T12:00:00Z') }), { diasAtraso: 0, mora: 0 });
  });
  it('después del vencimiento: Bs 50 fijos, sin importar los días ni el saldo', () => {
    assert.deepEqual(calcularMora({ saldoPendiente: 300, ...cfg, fechaVencimiento: VENC, fechaCalculo: new Date('2026-11-11T12:00:00Z') }), { diasAtraso: 1, mora: 50 });
    assert.equal(calcularMora({ saldoPendiente: 1000, ...cfg, fechaVencimiento: VENC, fechaCalculo: new Date('2026-12-20T12:00:00Z') }).mora, 50);
  });
  it('porcentaje: 5 % mensual sobre 300 a 30 días = 15', () => {
    assert.equal(calcularMora({ saldoPendiente: 300, tasaMensual: 5, diasGracia: 0, metodo: 'SIMPLE', fechaVencimiento: VENC, fechaCalculo: new Date('2026-12-10T12:00:00Z') }).mora, 15);
  });
  it('parametrosMora lee la fila de configuracion', () => {
    assert.deepEqual(parametrosMora({ tasaMensual: '2.00', montoFijo: null, diasGracia: 5, metodo: 'SIMPLE' }), { tasaMensual: 2, montoFijo: 0, diasGracia: 5, metodo: 'SIMPLE' });
    assert.equal(parametrosMora(null), null);
  });
});

describe('configuración de mora: monto fijo, porcentaje, día de generación y próximas fechas', () => {
  it('formulario con "Monto fijo" ya se acepta', () => {
    assert.deepEqual(vistaAConfigMora({ activo: true, tipoInteres: 'Monto fijo', montoFijo: 50, diasGracia: 0, diaVencimiento: 10, diaGeneracion: 1 }),
      { tasaMensual: 0, montoFijo: 50, diasGracia: 0, diaVencimiento: 10, diaGeneracion: 1, metodo: 'FIJO' });
    assert.deepEqual(vistaAConfigMora({ tipoInteres: 'Porcentaje mensual', porcentaje: 5, diaVencimiento: 10, diaGeneracion: 1 }),
      { tasaMensual: 5, montoFijo: null, diasGracia: 0, diaVencimiento: 10, diaGeneracion: 1, metodo: 'SIMPLE' });
    assert.throws(() => vistaAConfigMora({ tipoInteres: 'Otro', porcentaje: 1 }), /tipoInteres inválido/);
    assert.throws(() => vistaAConfigMora({ tipoInteres: 'Monto fijo', montoFijo: -1 }), /montoFijo/);
    assert.throws(() => vistaAConfigMora({ porcentaje: 2, diaGeneracion: 31 }), /diaGeneracion/);
  });
  it('BD → vista con fechas completas (próxima generación y vencimiento)', () => {
    const hoy = new Date('2026-11-06T12:00:00Z');
    const v = configMoraAVista({ id: 1, tasaMensual: '0', montoFijo: '50.00', diasGracia: 0, diaVencimiento: 10, diaGeneracion: 1, metodo: 'FIJO', vigenteDesde: hoy, vigenteHasta: null }, hoy);
    assert.equal(v.tipoInteres, 'Monto fijo'); assert.equal(v.montoFijo, 50); assert.equal(v.porcentaje, null); assert.equal(v.activo, true);
    assert.equal(v.proximoVencimiento, '2026-11-10');
    assert.equal(v.proximaGeneracion, '2026-12-01');
    assert.match(v.descripcion, /Bs 50 por expensa vencida/);
    assert.equal(proximaFecha(10, new Date('2026-11-11T00:00:00Z')).toISOString().slice(0, 10), '2026-12-10');
  });
});

describe('cargos adicionales con descripción (critico 2.2) y listado por tipo (critico 2.3)', () => {
  it('agregar un extra sube monto, extras y saldo; quitarlo los baja', () => {
    assert.deepEqual(aplicarDeltaCargo({ montoActual: '335.00', montoExtrasActual: '0', saldoActual: '335.00', delta: 250 }), { monto: 585, montoExtras: 250, saldoPendiente: 585, delta: 250 });
    assert.deepEqual(aplicarDeltaCargo({ montoActual: '585.00', montoExtrasActual: '250', saldoActual: '585.00', delta: -250 }), { monto: 335, montoExtras: 0, saldoPendiente: 335, delta: -250 });
    assert.throws(() => aplicarDeltaCargo({ montoActual: '585', montoExtrasActual: '250', saldoActual: '100', delta: -250 }), /ya pagado/);
    assert.throws(() => aplicarDeltaCargo({ montoActual: '300', montoExtrasActual: '0', saldoActual: '300', delta: 0 }), /distinto de cero/);
  });
  it('fila de expensa expone fijo, agua, extras y descripción', () => {
    const f = enriquecerExpensa({ id: 1, unidadId: 1, monto: '610.00', montoAgua: '25.00', montoExtras: '250.00', saldoPendiente: '610.00', moraAcumulada: '0', fechaVencimiento: VENC, unidad: { codigo: 'DEP-101', tipo: 'DEPARTAMENTO', categoria: 'A' }, periodo: { anio: 2026, mes: 11 }, extras: [{ id: 9, descripcion: 'Extra pintura edificio', monto: '250.00' }] }, { hoy: new Date('2026-11-06T12:00:00Z') });
    assert.equal(f.montoFijo, 335); assert.equal(f.montoAgua, 25); assert.equal(f.montoExtras, 250);
    assert.deepEqual(f.extras, [{ id: 9, descripcion: 'Extra pintura edificio', monto: 250 }]);
  });
  it('agrupa por tipo de departamento con subtotales y totales', () => {
    const filas = [
      { categoria: 'A', tipo: 'DEPARTAMENTO', dpto: 'Depto. 101', expensa: 300, agua: 25, totalExtras: 250, total: 575, pagado: 0, saldo: 575 },
      { categoria: 'A', tipo: 'DEPARTAMENTO', dpto: 'Depto. 201', expensa: 300, agua: 41, totalExtras: 0, total: 341, pagado: 341, saldo: 0 },
      { categoria: 'B', tipo: 'DEPARTAMENTO', dpto: 'Depto. 301', expensa: 350, agua: 20, totalExtras: 0, total: 370, pagado: 100, saldo: 270 },
      { categoria: null, tipo: 'PARQUEO', dpto: 'Parqueo P-01', expensa: 80, agua: 0, totalExtras: 0, total: 80, pagado: 0, saldo: 80 },
    ];
    const r = agruparCargosPorTipo(filas);
    assert.deepEqual(r.grupos.map((g) => [g.grupo, g.unidades, g.expensa, g.agua, g.extras, g.total, g.saldo]), [
      ['Tipo A', 2, 600, 66, 250, 916, 575], ['Tipo B', 1, 350, 20, 0, 370, 270], ['Parqueos', 1, 80, 0, 0, 80, 80],
    ]);
    assert.deepEqual(r.totales, { unidades: 4, expensa: 1030, agua: 86, extras: 250, total: 1366, pagado: 441, saldo: 925 });
  });
});
