// Pruebas del motor de expensas: estado real por fecha, mora por fila, resúmenes, mora/anticipos y configuración.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  etiquetaPeriodo, etiquetaUnidad, fechaCorta, inicioDiaUTC, estadosDesdeFiltro, estadoVigente,
  enriquecerExpensa, resumirExpensas, filasSaldosVencidos, codigoAnticipo, filaAnticipo,
  proyectarAplicacionAnticipo, configMoraAVista, vistaAConfigMora,
} = require('../src/modules/financiero/utils/expensasVista.utils');

const HOY = new Date('2026-10-11T15:00:00Z');
const CONFIG = { tasaMensual: '2.00', diasGracia: 5, diaVencimiento: 10, metodo: 'SIMPLE' };
const U301 = { id: 3, codigo: 'DEP-301', tipo: 'DEPARTAMENTO', piso: 3 };
const P = (anio, mes) => ({ id: mes, anio, mes });

const EXPENSAS = [
  { id: 1, unidadId: 3, periodoId: 8, monto: '350.00', saldoPendiente: '0.00', moraAcumulada: '0', estado: 'PAGADA', fechaVencimiento: new Date('2026-07-10T00:00:00Z'), unidad: U301, periodo: P(2026, 7) },
  { id: 2, unidadId: 3, periodoId: 8, monto: '350.00', saldoPendiente: '350.00', moraAcumulada: '0', estado: 'PENDIENTE', fechaVencimiento: new Date('2026-08-10T00:00:00Z'), unidad: U301, periodo: P(2026, 8) },
  { id: 3, unidadId: 3, periodoId: 9, monto: '350.00', saldoPendiente: '150.00', moraAcumulada: '0', estado: 'PARCIAL', fechaVencimiento: new Date('2026-09-10T00:00:00Z'), unidad: U301, periodo: P(2026, 9) },
  { id: 4, unidadId: 3, periodoId: 10, monto: '350.00', saldoPendiente: '350.00', moraAcumulada: '0', estado: 'PENDIENTE', fechaVencimiento: new Date('2026-10-10T00:00:00Z'), unidad: U301, periodo: P(2026, 10) },
  { id: 5, unidadId: 3, periodoId: 11, monto: '350.00', saldoPendiente: '350.00', moraAcumulada: '0', estado: 'PENDIENTE', fechaVencimiento: new Date('2026-11-10T00:00:00Z'), unidad: U301, periodo: P(2026, 11) },
];

describe('etiquetas y fechas', () => {
  it('forma las etiquetas que muestran las pantallas', () => {
    assert.equal(etiquetaPeriodo(2026, 10), 'Octubre 2026');
    assert.equal(etiquetaUnidad(U301), 'Depto. 301');
    assert.equal(etiquetaUnidad({ codigo: 'PARQ-08', tipo: 'PARQUEO' }), 'Parqueo P-08');
    assert.equal(fechaCorta('2026-10-01T04:00:00Z'), '01/10/2026');
    assert.equal(inicioDiaUTC(HOY).toISOString(), '2026-10-11T00:00:00.000Z');
  });
});

describe('estadosDesdeFiltro', () => {
  it('traduce el filtro de la pantalla a códigos de BD', () => {
    assert.deepEqual(estadosDesdeFiltro('Pendiente'), ['PENDIENTE', 'PARCIAL']);
    assert.deepEqual(estadosDesdeFiltro('Pagado'), ['PAGADA']);
    assert.deepEqual(estadosDesdeFiltro('vencido'), ['VENCIDA']);
    assert.equal(estadosDesdeFiltro('Todos'), null);
    assert.equal(estadosDesdeFiltro(undefined), null);
    assert.throws(() => estadosDesdeFiltro('Raro'), /estado inválido/);
  });
});

describe('estadoVigente / enriquecerExpensa', () => {
  it('decide el estado por fecha y saldo, no por el campo guardado', () => {
    assert.equal(estadoVigente(EXPENSAS[0], HOY), 'PAGADA');
    assert.equal(estadoVigente(EXPENSAS[1], HOY), 'VENCIDA');   // guardada PENDIENTE, venció en agosto
    assert.equal(estadoVigente(EXPENSAS[2], HOY), 'VENCIDA');   // guardada PARCIAL, venció en septiembre
    assert.equal(estadoVigente(EXPENSAS[3], HOY), 'VENCIDA');   // venció el 10-oct, hoy es 11-oct
    assert.equal(estadoVigente(EXPENSAS[4], HOY), 'PENDIENTE');
  });
  it('agrega etiquetas, pagado, mora estimada y total pendiente', () => {
    const f = enriquecerExpensa(EXPENSAS[2], { configMora: CONFIG, hoy: HOY });
    assert.equal(f.departamento, 'Depto. 301');
    assert.equal(f.periodo, 'Septiembre 2026');
    assert.deepEqual(f.periodoDetalle, { anio: 2026, mes: 9 });
    assert.equal(f.estado, 'VENCIDA');
    assert.equal(f.estadoUI, 'Vencido');
    assert.equal(f.monto, 350);
    assert.equal(f.pagado, 200);
    assert.equal(f.saldo, 150);
    // 31 días desde el 10-sep menos 5 de gracia = 26 días · 150 × 2 % × 26/30 = 2.60
    assert.equal(f.diasAtraso, 26);
    assert.equal(f.moraEstimada, 2.6);
    assert.equal(f.totalPendiente, 152.6);
    assert.equal(f.fechaVencimiento, '2026-09-10');
  });
  it('sin configuración de mora no estima interés pero sí marca vencida', () => {
    const f = enriquecerExpensa(EXPENSAS[1], { configMora: null, hoy: HOY });
    assert.equal(f.estado, 'VENCIDA');
    assert.equal(f.moraEstimada, 0);
    assert.equal(f.totalPendiente, 350);
  });
  it('dentro de los días de gracia es vencida pero con mora 0', () => {
    const f = enriquecerExpensa(EXPENSAS[3], { configMora: CONFIG, hoy: HOY }); // venció ayer
    assert.equal(f.estado, 'VENCIDA');
    assert.equal(f.diasAtraso, 0);
    assert.equal(f.moraEstimada, 0);
  });
});

describe('resumirExpensas', () => {
  it('calcula las tarjetas de la lista (totalGenerado, pendiente, pagado, vencido)', () => {
    const filas = EXPENSAS.map((e) => enriquecerExpensa(e, { configMora: CONFIG, hoy: HOY }));
    const r = resumirExpensas(filas);
    assert.equal(r.cantidad, 5);
    assert.equal(r.totalGenerado, 1750);
    assert.equal(r.pendiente, 1200);
    assert.equal(r.pagado, 550);
    assert.equal(r.vencido, 850);        // 350 + 150 + 350
    assert.deepEqual(r.porEstado, { pendientes: 1, parciales: 0, pagadas: 1, vencidas: 3 });
    assert.equal(r.interesEstimado, filas.reduce((a, f) => a + f.moraEstimada, 0));
  });
  it('lista vacía devuelve ceros', () => {
    assert.equal(resumirExpensas([]).totalGenerado, 0);
  });
});

describe('filasSaldosVencidos', () => {
  it('arma la tabla de saldos vencidos con capital, interés y total', () => {
    const filas = EXPENSAS.map((e) => enriquecerExpensa(e, { configMora: CONFIG, hoy: HOY }));
    const t = filasSaldosVencidos(filas);
    assert.equal(t.length, 3);
    assert.deepEqual(Object.keys(t[0]).sort(), ['capital', 'departamento', 'diasAtraso', 'estado', 'fechaVencimiento', 'id', 'interes', 'periodo', 'totalPendiente', 'unidadId'].sort());
    assert.equal(t[0].estado, 'Vencido');
    assert.equal(t[1].capital + t[1].interes, t[1].totalPendiente);
  });
});

describe('anticipos', () => {
  const A = { id: 7, unidadId: 3, pagoId: 12, monto: '1050.00', saldoDisponible: '700.00', estado: 'DISPONIBLE', creadoEn: new Date('2026-10-01T14:00:00Z'), unidad: U301, pago: { fecha: new Date('2026-10-01T14:00:00Z') } };
  it('código legible y fila para la pantalla', () => {
    assert.equal(codigoAnticipo(A), 'ANT-2026-10-301-0007');
    const f = filaAnticipo(A);
    assert.equal(f.fecha, '01/10/2026');
    assert.equal(f.departamento, 'Depto. 301');
    assert.equal(f.capital, 1050);
    assert.equal(f.saldoAFavor, 700);
    assert.equal(f.aplicado, 350);
    assert.equal(f.estado, 'Anticipado');
    assert.equal(filaAnticipo({ ...A, estado: 'APLICADO', saldoDisponible: '0' }).estado, 'Aplicado');
  });
  it('proyecta los períodos que cubre el saldo a favor', () => {
    const p = proyectarAplicacionAnticipo({ saldoAFavor: 800, expensaMensual: 350, ultimoPeriodo: { anio: 2026, mes: 11 } });
    assert.deepEqual(p.map((x) => [x.periodo, x.monto, x.estado]), [
      ['Diciembre 2026', 350, 'Cubierta anticipadamente'],
      ['Enero 2027', 350, 'Cubierta anticipadamente'],
      ['Febrero 2027', 100, 'Cubierta parcialmente'],
    ]);
    assert.deepEqual(proyectarAplicacionAnticipo({ saldoAFavor: 0, expensaMensual: 350, ultimoPeriodo: { anio: 2026, mes: 1 } }), []);
  });
});

describe('configuración de mora', () => {
  it('BD → formulario', () => {
    const v = configMoraAVista({ id: 1, tasaMensual: '2.00', diasGracia: 5, diaVencimiento: 10, metodo: 'SIMPLE', vigenteDesde: new Date('2026-09-01T00:00:00Z'), vigenteHasta: null });
    assert.deepEqual(v, { id: 1, activo: true, tipoInteres: 'Porcentaje mensual', porcentaje: 2, diasGracia: 5, diaVencimiento: 10, metodo: 'SIMPLE', aplicarDesde: 'Periodo vencido', vigenteDesde: '2026-09-01', vigenteHasta: null });
    assert.equal(configMoraAVista(null), null);
    assert.equal(configMoraAVista({ tasaMensual: '0' }).activo, false);
  });
  it('formulario → BD, con validaciones', () => {
    assert.deepEqual(vistaAConfigMora({ activo: true, tipoInteres: 'Porcentaje mensual', porcentaje: 2.5, diasGracia: 5, diaVencimiento: 10 }),
      { tasaMensual: 2.5, diasGracia: 5, diaVencimiento: 10, metodo: 'SIMPLE' });
    assert.equal(vistaAConfigMora({ activo: false, porcentaje: 9 }).tasaMensual, 0);
    assert.equal(vistaAConfigMora({ tasaMensual: 1, metodo: 'compuesto' }).metodo, 'COMPUESTO');
    assert.throws(() => vistaAConfigMora({ tipoInteres: 'Monto fijo', porcentaje: 1 }), /porcentaje mensual/);
    assert.throws(() => vistaAConfigMora({ porcentaje: 150 }), /porcentaje inválido/);
    assert.throws(() => vistaAConfigMora({ porcentaje: 2, diasGracia: 40 }), /diasGracia/);
    assert.throws(() => vistaAConfigMora({ porcentaje: 2, diaVencimiento: 31 }), /diaVencimiento/);
    assert.throws(() => vistaAConfigMora({ porcentaje: 2, metodo: 'RARO' }), /metodo/);
  });
});
