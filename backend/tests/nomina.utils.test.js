// Nómina (SCRUM-107): cálculo de planilla, anticipos, asiento y validaciones.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  etiquetaPeriodo, etiquetaEmpleado, validarPeriodo, validarConceptos, validarAnticipo,
  calcularPlanilla, lineasAsientoPlanilla, filaPlanilla, resumirPlanillas,
} = require('../src/modules/nomina/nomina.utils');

const EMP = { id: 1, nombres: 'Juan', apellidos: 'Mamani Choque', cargo: 'Portero' };

describe('etiquetas y validaciones', () => {
  it('etiquetas', () => {
    assert.equal(etiquetaPeriodo(2026, 11), 'Noviembre 2026');
    assert.equal(etiquetaEmpleado(EMP), 'Juan Mamani Choque -- Portero');
    assert.deepEqual(validarPeriodo('2026', '11'), { anio: 2026, mes: 11 });
    assert.throws(() => validarPeriodo(2026, 13), /mes inválido/);
  });
  it('conceptos: concepto no vacío y monto > 0', () => {
    assert.deepEqual(validarConceptos([{ concepto: 'Bono de puntualidad', monto: '150.5' }], 'bonos'), [{ concepto: 'Bono de puntualidad', monto: 150.5 }]);
    assert.deepEqual(validarConceptos(undefined, 'bonos'), []);
    assert.throws(() => validarConceptos([{ concepto: '', monto: 10 }], 'bonos'), /bonos\[0\]\.concepto/);
    assert.throws(() => validarConceptos([{ concepto: 'x', monto: 0 }], 'descuentos'), /descuentos\[0\]\.monto/);
    assert.throws(() => validarConceptos('no', 'bonos'), /debe ser una lista/);
  });
  it('anticipo: empleado, cuenta, monto y fecha', () => {
    const a = validarAnticipo({ empleadoId: '1', cuentaId: 1, monto: 500, fecha: '2026-11-05', observacion: 'emergencia' });
    assert.equal(a.monto, 500); assert.equal(a.fecha.toISOString(), '2026-11-05T00:00:00.000Z'); assert.equal(a.observacion, 'emergencia');
    assert.throws(() => validarAnticipo({ empleadoId: 1, cuentaId: 1, monto: -5 }), /monto inválido/);
    assert.throws(() => validarAnticipo({ cuentaId: 1, monto: 5 }), /empleadoId/);
  });
});

describe('calcularPlanilla', () => {
  it('bruto = base + bonos − descuentos; neto = bruto − anticipos', () => {
    const r = calcularPlanilla({ salarioBase: '2500.00', bonos: [{ monto: 200 }, { monto: 50.5 }], descuentos: [{ monto: 125.25 }], anticipos: [{ monto: '500.00' }] });
    assert.deepEqual(r, { salarioBase: 2500, totalBonos: 250.5, totalDescuentos: 125.25, totalAnticipos: 500, bruto: 2625.25, neto: 2125.25 });
  });
  it('sin conceptos ni anticipos: neto = base', () => {
    assert.equal(calcularPlanilla({ salarioBase: 2500 }).neto, 2500);
  });
  it('rechaza descuentos mayores al bruto, anticipos mayores al líquido y salario cero', () => {
    assert.throws(() => calcularPlanilla({ salarioBase: 1000, descuentos: [{ monto: 1200 }] }), /descuentos superan/);
    assert.throws(() => calcularPlanilla({ salarioBase: 1000, anticipos: [{ monto: 1500 }] }), /anticipos pendientes/);
    assert.throws(() => calcularPlanilla({ salarioBase: 0 }), /salario base/);
  });
});

describe('lineasAsientoPlanilla', () => {
  it('Debe gasto bruto · Haber anticipos y caja; suma debe = suma haber', () => {
    const l = lineasAsientoPlanilla({ bruto: 2625.25, totalAnticipos: 500, neto: 2125.25, cuentaGasto: '5.1.04', cuentaAnticipos: '1.1.05', cuentaCajaBanco: '1.1.01' });
    assert.deepEqual(l.map((x) => [x.cuenta, x.debe ?? 0, x.haber ?? 0]), [['5.1.04', 2625.25, 0], ['1.1.05', 0, 500], ['1.1.01', 0, 2125.25]]);
    const debe = l.reduce((a, x) => a + (x.debe ?? 0), 0); const haber = l.reduce((a, x) => a + (x.haber ?? 0), 0);
    assert.equal(Math.round(debe * 100), Math.round(haber * 100));
  });
  it('sin anticipos solo dos líneas; neto 0 (todo cubierto por anticipos) no toca caja', () => {
    assert.equal(lineasAsientoPlanilla({ bruto: 2500, totalAnticipos: 0, neto: 2500, cuentaGasto: '5.1.04', cuentaAnticipos: null, cuentaCajaBanco: '1.1.02' }).length, 2);
    const l = lineasAsientoPlanilla({ bruto: 2500, totalAnticipos: 2500, neto: 0, cuentaGasto: '5.1.04', cuentaAnticipos: '1.1.05', cuentaCajaBanco: '1.1.02' });
    assert.deepEqual(l.map((x) => x.cuenta), ['5.1.04', '1.1.05']);
  });
});

describe('filaPlanilla / resumirPlanillas', () => {
  const P = { id: 7, empleadoId: 1, empleado: EMP, anio: 2026, mes: 11, salarioBase: '2500.00', totalBonos: '250.50', totalDescuentos: '125.25', totalAnticipos: '500.00', neto: '2125.25', estado: 'PAGADA', fechaPago: new Date('2026-11-30T00:00:00Z'), cuenta: { nombre: 'Caja General' }, cuentaId: 1, detalles: [{ id: 1, tipo: 'BONO', concepto: 'Puntualidad', monto: '200.00' }] };
  it('fila con etiqueta, bruto calculado y estadoUI', () => {
    const f = filaPlanilla(P);
    assert.equal(f.empleado, 'Juan Mamani Choque -- Portero'); assert.equal(f.periodo, 'Noviembre 2026');
    assert.equal(f.bruto, 2625.25); assert.equal(f.neto, 2125.25); assert.equal(f.estadoUI, 'Pagada'); assert.equal(f.fechaPago, '30/11/2026');
    assert.deepEqual(f.detalles, [{ id: 1, tipo: 'BONO', concepto: 'Puntualidad', monto: 200 }]);
  });
  it('resumen separa pagadas y borradores', () => {
    const r = resumirPlanillas([filaPlanilla(P), filaPlanilla({ ...P, id: 8, estado: 'BORRADOR', fechaPago: null, totalAnticipos: '0', neto: '2625.25' })]);
    assert.deepEqual(r, { cantidad: 2, pagadas: 1, borradores: 1, totalBruto: 5250.5, totalAnticipos: 500, totalNeto: 4750.5, netoPagado: 2125.25, netoPendiente: 2625.25 });
  });
});
