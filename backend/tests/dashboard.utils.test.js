const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  diasVencida, rangoMes, responsableDe, agruparMorosos, resumirCuentas, resumirMovimientos, contarExpensasPorEstado,
  etiquetaPeriodo, mesAbrev, parsePeriodo, ultimosMeses, etiquetaUnidad, serieIngresosGastos,
  porcentajesEstadoExpensas, tablaDepartamentosMora, tablaMovimientos, resumenFinanzas, clasificarExpensas,
} = require('../src/modules/financiero/utils/dashboard.utils');

const CONFIG = { tasaMensual: 2, diasGracia: 5, metodo: 'SIMPLE' };
const HOY = new Date('2026-09-25T12:00:00Z');

const ANA = { id: 1, nombres: 'Ana', apellidos: 'Pérez', telefono: '70000001', email: 'ana@nexa.bo' };
const LUIS = { id: 2, nombres: 'Luis', apellidos: 'Rojas', telefono: null, email: null };

const U301 = {
  id: 4, codigo: 'DPTO-301', tipo: 'DEPARTAMENTO', piso: 3,
  ocupaciones: [
    { esResponsablePago: false, copropietario: LUIS },
    { esResponsablePago: true, copropietario: ANA },
  ],
};
const U102 = { id: 2, codigo: 'DPTO-102', tipo: 'DEPARTAMENTO', piso: 1, ocupaciones: [] };

// Mismos datos que estadoCuenta.utils.test: exp 2 vence 10-ago → 25-sep: 46 días vencida, mora 9.57 (41 días tras 5 de gracia)
const EXPENSAS = [
  { id: 1, unidad: U301, periodo: { anio: 2026, mes: 7 }, saldoPendiente: '0.00', moraAcumulada: '3.10', fechaVencimiento: '2026-07-10', estado: 'PAGADA' },
  { id: 2, unidad: U301, periodo: { anio: 2026, mes: 8 }, saldoPendiente: '350.00', moraAcumulada: '0.00', fechaVencimiento: '2026-08-10', estado: 'VENCIDA' },
  { id: 3, unidad: U301, periodo: { anio: 2026, mes: 9 }, saldoPendiente: '150.00', moraAcumulada: '0.00', fechaVencimiento: '2026-09-10', estado: 'PARCIAL' },
  { id: 4, unidad: U102, periodo: { anio: 2026, mes: 9 }, saldoPendiente: '350.00', moraAcumulada: '0.00', fechaVencimiento: '2026-09-10', estado: 'PENDIENTE' },
  { id: 5, unidad: U102, periodo: { anio: 2026, mes: 10 }, saldoPendiente: '350.00', moraAcumulada: '0.00', fechaVencimiento: '2026-10-10', estado: 'PENDIENTE' },
];

describe('diasVencida', () => {
  it('cuenta los días desde el vencimiento sin días de gracia', () => {
    assert.equal(diasVencida('2026-08-10', HOY), 46);
    assert.equal(diasVencida('2026-09-10', HOY), 15);
  });
  it('devuelve 0 si vence hoy o en el futuro', () => {
    assert.equal(diasVencida('2026-09-25', HOY), 0);
    assert.equal(diasVencida('2026-10-10', HOY), 0);
  });
});

describe('rangoMes', () => {
  it('devuelve [primer día del mes, primer día del mes siguiente) en UTC', () => {
    const { inicioMes, finMes } = rangoMes(HOY);
    assert.equal(inicioMes.toISOString(), '2026-09-01T00:00:00.000Z');
    assert.equal(finMes.toISOString(), '2026-10-01T00:00:00.000Z');
  });
  it('salta de año en diciembre', () => {
    assert.equal(rangoMes(new Date('2026-12-15T00:00:00Z')).finMes.toISOString(), '2027-01-01T00:00:00.000Z');
  });
});

describe('responsableDe', () => {
  it('prefiere la ocupación marcada como responsable de pago', () => {
    assert.deepEqual(responsableDe(U301.ocupaciones), { id: 1, nombre: 'Ana Pérez', telefono: '70000001', email: 'ana@nexa.bo' });
  });
  it('usa la primera ocupación si ninguna es responsable, y null si no hay ocupantes', () => {
    assert.equal(responsableDe([{ esResponsablePago: false, copropietario: LUIS }]).nombre, 'Luis Rojas');
    assert.equal(responsableDe([]), null);
  });
});

describe('agruparMorosos', () => {
  it('excluye expensas pagadas y no vencidas, y agrupa por unidad', () => {
    const r = agruparMorosos({ expensas: EXPENSAS, configMora: CONFIG, hoy: HOY });
    assert.equal(r.cantidad, 2);
    const u301 = r.items.find((i) => i.unidad.codigo === 'DPTO-301');
    const u102 = r.items.find((i) => i.unidad.codigo === 'DPTO-102');
    assert.equal(u301.expensasVencidas, 2);          // exp 2 y 3 (la 1 está pagada)
    assert.equal(u102.expensasVencidas, 1);          // exp 4 (la 5 vence en octubre)
    assert.deepEqual(u301.expensas.map((e) => e.id), [2, 3]);
  });

  it('calcula capital, mora estimada y saldo total en centavos exactos', () => {
    const r = agruparMorosos({ expensas: EXPENSAS, configMora: CONFIG, hoy: HOY });
    const u301 = r.items.find((i) => i.unidad.codigo === 'DPTO-301');
    assert.equal(u301.capital, 500);
    assert.equal(u301.mora, 10.57);                  // 9.57 (exp 2) + 1.00 (exp 3)
    assert.equal(u301.saldoTotal, 510.57);
    assert.equal(u301.diasMoraMax, 46);
    assert.equal(u301.expensas[0].moraEstimada, 9.57);
    assert.equal(u301.expensas[0].periodo, '2026-08');
    assert.equal(u301.expensas[0].fechaVencimiento, '2026-08-10');
  });

  it('ordena por saldo total descendente y suma el monto total', () => {
    const r = agruparMorosos({ expensas: EXPENSAS, configMora: CONFIG, hoy: HOY });
    assert.equal(r.items[0].unidad.codigo, 'DPTO-301');
    assert.equal(r.items[1].unidad.codigo, 'DPTO-102');
    assert.equal(r.items[1].capital, 350);
    assert.equal(r.items[1].mora, 2.33);             // 350 × 2% × 10/30 (15 días − 5 de gracia)
    assert.equal(r.montoTotal, 510.57 + 352.33);
  });

  it('incluye responsable de pago y null cuando la unidad no tiene ocupantes', () => {
    const r = agruparMorosos({ expensas: EXPENSAS, configMora: CONFIG, hoy: HOY });
    assert.equal(r.items[0].responsable.nombre, 'Ana Pérez');
    assert.equal(r.items[1].responsable, null);
  });

  it('respeta minDias para filtrar morosidad reciente', () => {
    const r = agruparMorosos({ expensas: EXPENSAS, configMora: CONFIG, hoy: HOY, minDias: 30 });
    assert.equal(r.cantidad, 1);
    assert.equal(r.items[0].expensasVencidas, 1);    // solo exp 2 (46 días)
    assert.equal(r.items[0].capital, 350);
  });

  it('sin configuración de mora, la mora estimada es 0 y el saldo total es el capital', () => {
    const r = agruparMorosos({ expensas: EXPENSAS, configMora: null, hoy: HOY });
    const u301 = r.items.find((i) => i.unidad.codigo === 'DPTO-301');
    assert.equal(u301.mora, 0);
    assert.equal(u301.saldoTotal, 500);
  });

  it('devuelve vacío sin expensas', () => {
    assert.deepEqual(agruparMorosos({ expensas: [], hoy: HOY }), { cantidad: 0, montoTotal: 0, items: [] });
  });
});

describe('resumirCuentas', () => {
  it('separa caja y bancos y totaliza', () => {
    const r = resumirCuentas([
      { id: 1, nombre: 'Caja chica', tipo: 'CAJA', saldoActual: '1200.50' },
      { id: 2, nombre: 'Banco Unión', tipo: 'BANCO', saldoActual: '8500.00' },
      { id: 3, nombre: 'BNB', tipo: 'BANCO', saldoActual: '299.75' },
    ]);
    assert.equal(r.caja, 1200.5);
    assert.equal(r.bancos, 8799.75);
    assert.equal(r.total, 10000.25);
    assert.equal(r.detalle.length, 3);
    assert.equal(r.detalle[0].saldoActual, 1200.5);
  });
});

describe('resumirMovimientos', () => {
  it('calcula ingresos, egresos y resultado del mes', () => {
    const r = resumirMovimientos([{ tipo: 'INGRESO', total: '3000.00' }, { tipo: 'EGRESO', total: '1200.25' }]);
    assert.deepEqual(r, { ingresos: 3000, egresos: 1200.25, resultado: 1799.75 });
  });
  it('tolera meses sin movimientos o totales nulos', () => {
    assert.deepEqual(resumirMovimientos([]), { ingresos: 0, egresos: 0, resultado: 0 });
    assert.deepEqual(resumirMovimientos([{ tipo: 'INGRESO', total: null }]), { ingresos: 0, egresos: 0, resultado: 0 });
  });
});

describe('contarExpensasPorEstado', () => {
  it('cuenta por estado y totaliza', () => {
    const r = contarExpensasPorEstado([
      { estado: 'PAGADA', cantidad: 5 }, { estado: 'PARCIAL', cantidad: 1 }, { estado: 'PENDIENTE', cantidad: 3 }, { estado: 'VENCIDA', cantidad: 1 },
    ]);
    assert.deepEqual(r, { total: 10, pagadas: 5, parciales: 1, pendientes: 3, vencidas: 1 });
  });
  it('devuelve ceros sin período', () => {
    assert.deepEqual(contarExpensasPorEstado([]), { total: 0, pagadas: 0, parciales: 0, pendientes: 0, vencidas: 0 });
  });
});


// ---------------------------------------------------------------------------
// Forma "Finanzas" (frontend/src/constants/finanzasMock.js)
// ---------------------------------------------------------------------------

describe('etiquetaPeriodo / mesAbrev / parsePeriodo', () => {
  it('etiqueta el período como lo muestra el selector del frontend', () => {
    assert.equal(etiquetaPeriodo(2026, 10), 'Octubre 2026');
    assert.equal(etiquetaPeriodo(2026, 1), 'Enero 2026');
    assert.equal(mesAbrev(7), 'Jul');
  });
  it('parsea YYYY-MM y rechaza formatos inválidos', () => {
    assert.deepEqual(parsePeriodo('2026-10'), { anio: 2026, mes: 10 });
    assert.equal(parsePeriodo('2026-13'), null);
    assert.equal(parsePeriodo('octubre'), null);
    assert.equal(parsePeriodo(undefined), null);
  });
});

describe('ultimosMeses', () => {
  it('devuelve los 4 meses que terminan en el pedido, en orden cronológico', () => {
    assert.deepEqual(ultimosMeses(2026, 10, 4), [
      { anio: 2026, mes: 7 }, { anio: 2026, mes: 8 }, { anio: 2026, mes: 9 }, { anio: 2026, mes: 10 },
    ]);
  });
  it('cruza el cambio de año', () => {
    assert.deepEqual(ultimosMeses(2027, 2, 4), [
      { anio: 2026, mes: 11 }, { anio: 2026, mes: 12 }, { anio: 2027, mes: 1 }, { anio: 2027, mes: 2 },
    ]);
  });
});

describe('etiquetaUnidad', () => {
  it('traduce el código interno a la etiqueta que usa el frontend', () => {
    assert.equal(etiquetaUnidad({ codigo: 'DPTO-301', tipo: 'DEPARTAMENTO' }), 'Depto. 301');
    assert.equal(etiquetaUnidad({ codigo: 'PARQ-08', tipo: 'PARQUEO' }), 'Parqueo P-08');
    assert.equal(etiquetaUnidad({ codigo: 'BAUL-06', tipo: 'BAULERA' }), 'Baulera B-06');
    assert.equal(etiquetaUnidad({ codigo: 'X-1', tipo: 'OTRO' }), 'X-1');
  });
});

describe('serieIngresosGastos', () => {
  const MESES = ultimosMeses(2026, 10, 4);
  it('agrupa movimientos por mes y tipo, con ceros en meses sin datos', () => {
    const movs = [
      { fecha: '2026-07-05T10:00:00Z', tipo: 'INGRESO', monto: '350.00' },
      { fecha: '2026-07-20T10:00:00Z', tipo: 'EGRESO', monto: '120.50' },
      { fecha: '2026-10-03T10:00:00Z', tipo: 'INGRESO', monto: '700.00' },
      { fecha: '2026-10-03T10:00:00Z', tipo: 'INGRESO', monto: '0.10' },
      { fecha: '2026-06-30T10:00:00Z', tipo: 'INGRESO', monto: '999.00' }, // fuera de rango: se ignora
    ];
    assert.deepEqual(serieIngresosGastos(movs, MESES), [
      { mes: 'Jul', ingresos: 350, gastos: 120.5 },
      { mes: 'Ago', ingresos: 0, gastos: 0 },
      { mes: 'Sep', ingresos: 0, gastos: 0 },
      { mes: 'Oct', ingresos: 700.1, gastos: 0 },
    ]);
  });
});

describe('porcentajesEstadoExpensas', () => {
  it('convierte conteos en porcentajes que suman 100; PARCIAL cuenta como pendiente', () => {
    const r = porcentajesEstadoExpensas({ total: 5, pagadas: 3, parciales: 1, pendientes: 0, vencidas: 1 });
    assert.deepEqual(r.map((x) => [x.estado, x.valor]), [['Pagadas', 60], ['Pendientes', 20], ['Vencidas', 20]]);
    assert.equal(r.reduce((a, x) => a + x.valor, 0), 100);
    assert.equal(r[0].color, '#2E9D78');
  });
  it('reparte el redondeo por mayor resto (1/3, 1/3, 1/3 → 34, 33, 33)', () => {
    const r = porcentajesEstadoExpensas({ pagadas: 1, parciales: 0, pendientes: 1, vencidas: 1 });
    assert.equal(r.reduce((a, x) => a + x.valor, 0), 100);
    assert.deepEqual(r.map((x) => x.valor).sort((a, b) => b - a), [34, 33, 33]);
  });
  it('sin expensas devuelve 0 % en los tres estados', () => {
    assert.deepEqual(porcentajesEstadoExpensas({}).map((x) => x.valor), [0, 0, 0]);
  });
});

describe('tablaDepartamentosMora', () => {
  it('toma los items de agruparMorosos y devuelve la fila que pinta el frontend', () => {
    const { items } = agruparMorosos({ expensas: EXPENSAS, configMora: CONFIG, hoy: HOY });
    const filas = tablaDepartamentosMora(items);
    assert.equal(filas[0].departamento, 'Depto. 301');
    assert.equal(filas[0].estado, 'Vencida');
    assert.equal(filas[0].monto, items[0].saldoTotal);
    assert.equal(filas[0].responsable, 'Ana Pérez');
    assert.ok(filas.every((f) => typeof f.id === 'number'));
  });
});

describe('tablaMovimientos', () => {
  it('normaliza tipo, monto, descripción y fecha', () => {
    const filas = tablaMovimientos([
      { id: 9, fecha: '2026-10-15T14:00:00Z', tipo: 'INGRESO', monto: '1700.00', descripcion: null, origenTipo: 'PAGO' },
      { id: 8, fecha: '2026-10-12T14:00:00Z', tipo: 'EGRESO', monto: '2000.00', descripcion: 'Reparación del ascensor', origenTipo: 'EGRESO' },
    ]);
    assert.deepEqual(filas, [
      { id: 9, tipo: 'ingreso', monto: 1700, descripcion: 'Cobro de expensas', fecha: '2026-10-15' },
      { id: 8, tipo: 'egreso', monto: 2000, descripcion: 'Reparación del ascensor', fecha: '2026-10-12' },
    ]);
  });
});

describe('resumenFinanzas', () => {
  it('calcula el balance en centavos y acepta Decimal como string', () => {
    assert.deepEqual(resumenFinanzas({ ingresos: '8500.00', gastos: 3200, saldoPendiente: '3700.50' }),
      { ingresos: 8500, gastos: 3200, balance: 5300, saldoPendiente: 3700.5 });
  });
  it('balance negativo cuando los gastos superan los ingresos', () => {
    assert.equal(resumenFinanzas({ ingresos: 100, gastos: 250.75 }).balance, -150.75);
  });
});

describe('clasificarExpensas', () => {
  it('decide vencida por fecha y saldo, no por el campo estado guardado', () => {
    // EXPENSAS al 25-sep: 1 pagada · 3 vencidas (ago y dos de sep, con saldo) · 1 pendiente (oct)
    assert.deepEqual(clasificarExpensas(EXPENSAS, HOY), { total: 5, pagadas: 1, pendientes: 1, vencidas: 3 });
  });
  it('alimenta la dona de forma coherente con la tabla de morosos', () => {
    const dona = porcentajesEstadoExpensas(clasificarExpensas(EXPENSAS, HOY));
    assert.equal(dona.find((d) => d.estado === 'Vencidas').valor, 60);
    assert.equal(dona.reduce((a, d) => a + d.valor, 0), 100);
  });
});
