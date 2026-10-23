// Semana 8: estado de cuenta y movimientos en la forma de las pantallas.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  etiquetaResponsable, resumirEstadoCuenta, filaExpensaCuenta, filasPagosCuenta, filaMovimiento, resumirMovimientos, rangoPeriodo,
} = require('../src/modules/financiero/utils/vistas.utils');
const { enriquecerExpensa } = require('../src/modules/financiero/utils/expensasVista.utils');

const HOY = new Date('2026-10-23T15:00:00Z');
const CFG = { tasaMensual: '2.00', diasGracia: 5, metodo: 'SIMPLE' };
const U = { id: 3, codigo: 'DEP-301', tipo: 'DEPARTAMENTO', piso: 3, categoria: 'B' };
const E = [
  { id: 10, unidadId: 3, monto: '350.00', montoAgua: '0', saldoPendiente: '0.00', moraAcumulada: '0', fechaVencimiento: new Date('2026-09-10T00:00:00Z'), unidad: U, periodo: { anio: 2026, mes: 9 } },
  { id: 11, unidadId: 3, monto: '385.00', montoAgua: '35.00', saldoPendiente: '185.00', moraAcumulada: '0', fechaVencimiento: new Date('2026-10-10T00:00:00Z'), unidad: U, periodo: { anio: 2026, mes: 10 } },
];

describe('estado de cuenta', () => {
  it('etiqueta del responsable', () => {
    assert.equal(etiquetaResponsable({ nombres: 'Lucía', apellidos: 'Vargas Soto', tipo: 'INQUILINO' }), 'Lucía Vargas Soto -- Inquilino');
    assert.equal(etiquetaResponsable(null), null);
  });
  it('resumen y filas con agua separada del fijo', () => {
    const filas = E.map((e) => enriquecerExpensa(e, { configMora: CFG, hoy: HOY }));
    const r = resumirEstadoCuenta(filas, 100);
    assert.equal(r.totalGenerado, 735);
    assert.equal(r.totalPagado, 550);
    assert.equal(r.saldoPendiente, 185);
    assert.equal(r.totalAgua, 35);
    assert.equal(r.saldoAFavor, 100);
    assert.equal(r.vencidas, 1);
    const f = filaExpensaCuenta(filas[1]);
    assert.equal(f.periodo, 'Octubre 2026');
    assert.equal(f.montoFijo, 350);
    assert.equal(f.montoAgua, 35);
    assert.equal(f.estado, 'Vencido');
  });
  it('historial de pagos con saldo restante por expensa, del más reciente al más antiguo', () => {
    const porId = new Map([[10, { monto: 350, periodo: 'Septiembre 2026' }], [11, { monto: 385, periodo: 'Octubre 2026' }]]);
    const pagos = [
      { id: 1, fecha: '2026-09-05T12:00:00Z', monto: '350.00', metodo: 'EFECTIVO', detalles: [{ expensaId: 10, montoAplicado: '350.00', aplicadoA: 'CAPITAL' }] },
      { id: 2, fecha: '2026-10-04T12:00:00Z', monto: '200.00', metodo: 'QR', detalles: [{ expensaId: 11, montoAplicado: '200.00', aplicadoA: 'CAPITAL' }] },
      { id: 3, fecha: '2026-10-20T12:00:00Z', monto: '500.00', metodo: 'TRANSFERENCIA', detalles: [] },
    ];
    const h = filasPagosCuenta(pagos, porId);
    assert.deepEqual(h.map((p) => [p.fecha, p.periodo, p.montoPagado, p.saldoRestante, p.anticipo]), [
      ['20/10/2026', 'Anticipo', 500, null, 500],
      ['04/10/2026', 'Octubre 2026', 200, 185, 0],
      ['05/09/2026', 'Septiembre 2026', 350, 0, 0],
    ]);
  });
});

describe('movimientos', () => {
  const ing = { id: 5, fecha: new Date('2026-10-12T00:00:00Z'), monto: '150.00', descripcion: 'Multa', comprobanteUrl: 'multa.pdf', categoria: { nombre: 'Multas' }, categoriaId: 2, cuenta: { nombre: 'Caja General' }, cuentaId: 1 };
  const egr = { id: 2, fecha: new Date('2026-10-03T00:00:00Z'), monto: '3000.00', descripcion: 'Reparación del ascensor', proveedor: 'Otis', nroFactura: 'F-001', categoria: { nombre: 'Mantenimiento' }, categoriaId: 5, cuenta: { nombre: 'Banco Unión' }, cuentaId: 2 };
  it('fila con código, tipo y fecha en el formato de la pantalla', () => {
    const f = filaMovimiento(ing, 'INGRESO');
    assert.equal(f.id, 'I-5'); assert.equal(f.codigo, 'MOV-2026-10-005'); assert.equal(f.tipo, 'Ingreso');
    assert.equal(f.fecha, '12/10/2026'); assert.equal(f.categoria, 'Multas'); assert.equal(f.comprobante, 'multa.pdf');
    const g = filaMovimiento(egr, 'EGRESO');
    assert.equal(g.tipo, 'Gasto'); assert.equal(g.proveedor, 'Otis'); assert.equal(g.monto, 3000);
  });
  it('resumen operativo: ingresos, gastos y balance', () => {
    const r = resumirMovimientos([filaMovimiento(ing, 'INGRESO'), filaMovimiento(egr, 'EGRESO')]);
    assert.deepEqual(r, { totalIngresos: 150, totalGastos: 3000, balance: -2850, cantidad: 2 });
  });
  it('rango del periodo en UTC', () => {
    const r = rangoPeriodo('2026', '10');
    assert.equal(r.inicio.toISOString(), '2026-10-01T00:00:00.000Z');
    assert.equal(r.fin.toISOString(), '2026-11-01T00:00:00.000Z');
    assert.equal(r.etiqueta, 'Octubre 2026');
    assert.equal(rangoPeriodo(undefined, undefined), null);
  });
});
