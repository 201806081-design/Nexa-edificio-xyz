// Reportes financieros base (SCRUM-106): estado de resultados, balance general, flujo de caja, agrupaciones y CSV.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  validarPeriodo, rangoPeriodo, estadoResultados, balanceGeneral, flujoCaja, mesesDelRango, agruparMontos, aCSV, conceptoMovimiento, lineasApertura,
} = require('../src/modules/financiero/utils/reportes.utils');

// Asientos de ejemplo: emisión 1.070 · cobro 700 (650 capital + 50 mora) · gasto luz 420,50 · planilla 2.767,17 (500 anticipo)
const LINEAS = [
  { codigo: '1.1.03', nombre: 'Cuentas por Cobrar Copropietarios', tipo: 'ACTIVO', debe: 1070, haber: 0 },
  { codigo: '4.1.01', nombre: 'Ingresos por Expensas', tipo: 'INGRESO', debe: 0, haber: 1070 },
  { codigo: '1.1.02', nombre: 'Bancos', tipo: 'ACTIVO', debe: 700, haber: 0 },
  { codigo: '1.1.03', nombre: 'Cuentas por Cobrar Copropietarios', tipo: 'ACTIVO', debe: 0, haber: 650 },
  { codigo: '4.1.02', nombre: 'Ingresos por Mora', tipo: 'INGRESO', debe: 0, haber: 50 },
  { codigo: '5.1.01', nombre: 'Servicios Básicos', tipo: 'GASTO', debe: 420.5, haber: 0 },
  { codigo: '1.1.01', nombre: 'Caja', tipo: 'ACTIVO', debe: 0, haber: 420.5 },
  { codigo: '1.1.05', nombre: 'Anticipos a Empleados', tipo: 'ACTIVO', debe: 500, haber: 0 },
  { codigo: '1.1.01', nombre: 'Caja', tipo: 'ACTIVO', debe: 0, haber: 500 },
  { codigo: '5.1.04', nombre: 'Sueldos y Salarios', tipo: 'GASTO', debe: 2767.17, haber: 0 },
  { codigo: '1.1.05', nombre: 'Anticipos a Empleados', tipo: 'ACTIVO', debe: 0, haber: 500 },
  { codigo: '1.1.02', nombre: 'Bancos', tipo: 'ACTIVO', debe: 0, haber: 2267.17 },
];

describe('validarPeriodo / rangoPeriodo', () => {
  const hoy = new Date('2026-11-15T12:00:00Z');
  it('usa el año actual por defecto y el mes solo si se exige', () => {
    assert.deepEqual(validarPeriodo({}, { hoy }), { anio: 2026, mes: null });
    assert.deepEqual(validarPeriodo({}, { hoy, mesObligatorio: true }), { anio: 2026, mes: 11 });
    assert.deepEqual(validarPeriodo({ anio: '2026', mes: '9' }, { hoy }), { anio: 2026, mes: 9 });
    assert.throws(() => validarPeriodo({ mes: 13 }, { hoy }), /mes inválido/);
    assert.throws(() => validarPeriodo({ anio: 1900 }, { hoy }), /anio inválido/);
  });
  it('rango mensual y anual en UTC', () => {
    const m = rangoPeriodo(2026, 11); assert.equal(m.desde.toISOString(), '2026-11-01T00:00:00.000Z'); assert.equal(m.hasta.toISOString(), '2026-12-01T00:00:00.000Z'); assert.equal(m.etiqueta, 'Noviembre 2026');
    const a = rangoPeriodo(2026); assert.equal(a.hasta.toISOString(), '2027-01-01T00:00:00.000Z'); assert.equal(a.tipo, 'ANUAL');
    assert.equal(mesesDelRango(a.desde, a.hasta).length, 12);
  });
});

describe('estado de resultados y balance general (8.1)', () => {
  it('ingresos − gastos = resultado', () => {
    const er = estadoResultados(LINEAS);
    assert.deepEqual(er.ingresos, [{ codigo: '4.1.01', cuenta: 'Ingresos por Expensas', monto: 1070 }, { codigo: '4.1.02', cuenta: 'Ingresos por Mora', monto: 50 }]);
    assert.equal(er.totalIngresos, 1120); assert.equal(er.totalGastos, 3187.67); assert.equal(er.resultado, -2067.67); assert.equal(er.superavit, false);
  });
  it('Activo = Pasivo + Patrimonio + Resultado', () => {
    const bg = balanceGeneral(LINEAS);
    assert.equal(bg.totalActivos, -2067.67);           // 420 CxC − 920,50 caja − 1.567,17 bancos
    assert.equal(bg.totalPasivoPatrimonio, -2067.67);
    assert.equal(bg.cuadra, true);
    assert.ok(bg.activos.find((a) => a.codigo === '1.1.03' && a.saldo === 420));
    assert.ok(!bg.activos.find((a) => a.codigo === '1.1.05'));   // saldo 0 no se lista
  });
});

describe('flujo de caja (8.3)', () => {
  const MOVS = [
    { fecha: '2026-10-05T12:00:00Z', tipo: 'INGRESO', monto: 700, origenTipo: 'PAGO' },
    { fecha: '2026-10-08T12:00:00Z', tipo: 'EGRESO', monto: 420.5, origenTipo: 'EGRESO' },
    { fecha: '2026-11-05T12:00:00Z', tipo: 'EGRESO', monto: 500, origenTipo: 'NOMINA' },
    { fecha: '2026-11-12T12:00:00Z', tipo: 'INGRESO', monto: 150, origenTipo: 'INGRESO' },
    { fecha: '2026-11-30T12:00:00Z', tipo: 'EGRESO', monto: 2267.17, origenTipo: 'NOMINA' },
  ];
  it('saldo inicial + ingresos − egresos = saldo final, mes a mes', () => {
    const f = flujoCaja(MOVS, 26500, [{ anio: 2026, mes: 10 }, { anio: 2026, mes: 11 }]);
    assert.deepEqual(f.meses.map((m) => [m.etiqueta, m.saldoInicial, m.ingresos, m.egresos, m.flujoNeto, m.saldoFinal]), [
      ['Oct', 26500, 700, 420.5, 279.5, 26779.5],
      ['Nov', 26779.5, 150, 2767.17, -2617.17, 24162.33],
    ]);
    assert.equal(f.saldoFinal, 24162.33); assert.equal(f.flujoNeto, -2337.67);
    assert.deepEqual(f.meses[1].detalleEgresos, [{ concepto: 'Sueldos y anticipos al personal', monto: 2767.17 }]);
    assert.equal(conceptoMovimiento({ origenTipo: 'PAGO' }), 'Cobro de expensas');
  });
  it('mes sin movimientos conserva el saldo', () => {
    const f = flujoCaja([], 1000, [{ anio: 2026, mes: 12 }]);
    assert.equal(f.meses[0].saldoFinal, 1000); assert.equal(f.meses[0].flujoNeto, 0);
  });
});

describe('agrupar por categoría (8.5) y CSV', () => {
  it('totales, cantidad y porcentaje por categoría', () => {
    const r = agruparMontos([{ categoria: 'Mantenimiento', monto: 3000 }, { categoria: 'Servicios básicos', monto: 1000 }, { categoria: 'Mantenimiento', monto: 450 }]);
    assert.deepEqual(r.filas, [{ categoria: 'Mantenimiento', monto: 3450, cantidad: 2, porcentaje: 77.5 }, { categoria: 'Servicios básicos', monto: 1000, cantidad: 1, porcentaje: 22.5 }]);
    assert.equal(r.total, 4450);
    assert.deepEqual(agruparMontos([]), { filas: [], total: 0 });
  });
  it('CSV con BOM, comillas escapadas y CRLF', () => {
    const csv = aCSV([{ titulo: 'Dpto', campo: 'dpto' }, { titulo: 'Total (Bs)', campo: 'total' }, { titulo: 'Nota', valor: (f) => f.nota }], [{ dpto: 'Depto. 301', total: 716.1, nota: 'debe "ago, sep"' }]);
    assert.equal(csv, '\uFEFFDpto,Total (Bs),Nota\r\nDepto. 301,716.1,"debe ""ago, sep"""\r\n');
  });
});

describe('asiento de apertura', () => {
  const CUENTAS = [
    { nombre: 'Caja General', codigo: '1.1.01', saldoInicial: '1500.00' },
    { nombre: 'Banco Unión - Cta. Cte.', codigo: '1.1.02', saldoInicial: '25000.00' },
    { nombre: 'Caja chica', codigo: '1.1.01', saldoInicial: 0 },
  ];
  it('saldos iniciales al Debe y el total al Haber del patrimonio', () => {
    const { lineas, total } = lineasApertura(CUENTAS, '3.1.01');
    assert.equal(total, 26500);
    assert.deepEqual(lineas.map((l) => [l.cuenta, l.debe ?? 0, l.haber ?? 0]), [['1.1.01', 1500, 0], ['1.1.02', 25000, 0], ['3.1.01', 0, 26500]]);
  });
  it('con la apertura el balance muestra el efectivo real y sigue cuadrando', () => {
    const { lineas } = lineasApertura(CUENTAS, '3.1.01');
    const tipo = { '1.1.01': 'ACTIVO', '1.1.02': 'ACTIVO', '3.1.01': 'PATRIMONIO' };
    const apertura = lineas.map((l) => ({ codigo: l.cuenta, nombre: l.cuenta, tipo: tipo[l.cuenta], debe: l.debe ?? 0, haber: l.haber ?? 0 }));
    const bg = balanceGeneral([...apertura, ...LINEAS]);
    assert.equal(bg.cuadra, true);
    assert.equal(bg.totalPatrimonio, 26500);
    assert.equal(bg.activos.find((a) => a.codigo === '1.1.01').saldo, 579.5);      // 1.500 − 420,50 − 500
    assert.equal(bg.activos.find((a) => a.codigo === '1.1.02').saldo, 23432.83);   // 25.000 + 700 − 2.267,17
    assert.equal(bg.totalActivos, 24432.33);                                       // 26.500 + resultado (−2.067,67)
  });
  it('sin saldos iniciales no genera líneas', () => {
    assert.deepEqual(lineasApertura([{ nombre: 'Caja', codigo: '1.1.01', saldoInicial: 0 }], '3.1.01'), { lineas: [], total: 0 });
  });
});
