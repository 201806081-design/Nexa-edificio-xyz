// =====================================================================
//  Seed de datos de prueba · NEXA API
//  Ejecutar: npm run db:seed   (idempotente: TRUNCATE + carga)
//
//  El seed usa los MISMOS servicios que la API (periodos, pagos, ingresos,
//  egresos), así los datos de prueba nacen con sus movimientos de caja y
//  sus asientos contables, igual que en producción.
//
//  Usuarios: usuario1 / usuario2 / usuario3 · contraseña 1234
// =====================================================================
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Prisma } = require('@prisma/client');
const prisma = require('../src/config/prisma');
const periodosService = require('../src/modules/financiero/services/periodos.service');
const pagosService = require('../src/modules/financiero/services/pagos.service');
const ieService = require('../src/modules/financiero/services/ingresosEgresos.service');
const contabilidadService = require('../src/modules/financiero/services/contabilidad.service');

const D = (v) => new Prisma.Decimal(v);
const fecha = (iso) => new Date(iso);

/** Crea registros uno por uno para que los ids autoincrementales sigan el orden de la lista. */
async function crearEnOrden(modelo, lista) {
  const creados = [];
  for (const data of lista) creados.push(await modelo.create({ data }));
  return creados;
}

async function limpiar() {
  const tablas = [
    'asiento_detalle', 'asiento', 'pago_detalle', 'anticipo', 'pago', 'planilla_detalle', 'anticipo_empleado', 'planilla',
    'ingreso', 'egreso', 'movimiento', 'conciliacion', 'expensa', 'periodo', 'configuracion_mora', 'ocupacion', 'unidad',
    'copropietario', 'categoria', 'cuenta', 'cuenta_contable', 'empleado', 'usuario',
  ];
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tablas.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`);
}

// ---------------------------------------------------------------------
// Plan de cuentas básico para administración de edificios (Bolivia)
// ---------------------------------------------------------------------
const PLAN = [
  // código, nombre, tipo, naturaleza, imputable
  ['1', 'ACTIVO', 'ACTIVO', 'DEUDORA', false],
  ['1.1', 'Activo Corriente', 'ACTIVO', 'DEUDORA', false],
  ['1.1.01', 'Caja', 'ACTIVO', 'DEUDORA', true],
  ['1.1.02', 'Bancos', 'ACTIVO', 'DEUDORA', true],
  ['1.1.03', 'Cuentas por Cobrar Copropietarios', 'ACTIVO', 'DEUDORA', true],
  ['1.1.04', 'Intereses por Mora por Cobrar', 'ACTIVO', 'DEUDORA', true],
  ['2', 'PASIVO', 'PASIVO', 'ACREEDORA', false],
  ['2.1', 'Pasivo Corriente', 'PASIVO', 'ACREEDORA', false],
  ['2.1.01', 'Anticipos de Copropietarios', 'PASIVO', 'ACREEDORA', true],
  ['2.1.02', 'Sueldos por Pagar', 'PASIVO', 'ACREEDORA', true],
  ['3', 'PATRIMONIO', 'PATRIMONIO', 'ACREEDORA', false],
  ['3.1', 'Fondos del Edificio', 'PATRIMONIO', 'ACREEDORA', false],
  ['3.1.01', 'Fondo Común del Edificio', 'PATRIMONIO', 'ACREEDORA', true],
  ['4', 'INGRESOS', 'INGRESO', 'ACREEDORA', false],
  ['4.1', 'Ingresos Ordinarios', 'INGRESO', 'ACREEDORA', false],
  ['4.1.01', 'Ingresos por Expensas', 'INGRESO', 'ACREEDORA', true],
  ['4.1.02', 'Ingresos por Mora', 'INGRESO', 'ACREEDORA', true],
  ['4.2', 'Ingresos Extraordinarios', 'INGRESO', 'ACREEDORA', false],
  ['4.2.01', 'Alquiler de Áreas Comunes', 'INGRESO', 'ACREEDORA', true],
  ['4.2.02', 'Multas', 'INGRESO', 'ACREEDORA', true],
  ['4.2.09', 'Otros Ingresos', 'INGRESO', 'ACREEDORA', true],
  ['5', 'GASTOS', 'GASTO', 'DEUDORA', false],
  ['5.1', 'Gastos Operativos', 'GASTO', 'DEUDORA', false],
  ['5.1.01', 'Servicios Básicos', 'GASTO', 'DEUDORA', true],
  ['5.1.02', 'Mantenimiento y Reparaciones', 'GASTO', 'DEUDORA', true],
  ['5.1.03', 'Limpieza', 'GASTO', 'DEUDORA', true],
  ['5.1.04', 'Sueldos y Salarios', 'GASTO', 'DEUDORA', true],
  ['5.1.09', 'Otros Gastos', 'GASTO', 'DEUDORA', true],
];

async function crearPlanCuentas() {
  const porCodigo = new Map();
  for (const [codigo, nombre, tipo, naturaleza, imputable] of PLAN) {
    const partes = codigo.split('.');
    const padreCodigo = partes.length > 1 ? partes.slice(0, -1).join('.') : null;
    const cuenta = await prisma.cuentaContable.create({
      data: { codigo, nombre, tipo, naturaleza, imputable, nivel: partes.length, padreId: padreCodigo ? porCodigo.get(padreCodigo).id : null },
    });
    porCodigo.set(codigo, cuenta);
  }
  return porCodigo;
}

async function main() {
  console.log('🧹 Limpiando tablas...');
  await limpiar();

  // ---------- Usuarios (módulo seguridad) ----------
  const hash = (p) => bcrypt.hashSync(p, 10);
  const [admin] = await crearEnOrden(prisma.usuario, [
    { username: 'usuario1', nombre: 'Administrador General', email: 'admin@nexa.bo', passwordHash: hash('1234'), rol: 'ADMINISTRADOR' },
    { username: 'usuario2', nombre: 'Miembro del Directorio', email: 'directorio@nexa.bo', passwordHash: hash('1234'), rol: 'DIRECTORIO' },
    { username: 'usuario3', nombre: 'Usuario de Consulta', email: 'consulta@nexa.bo', passwordHash: hash('1234'), rol: 'CONSULTA' },
  ]);

  // ---------- Plan de cuentas ----------
  const plan = await crearPlanCuentas();
  const cc = (codigo) => plan.get(codigo).id;

  // ---------- Cuentas de caja y banco (ligadas a su cuenta contable) ----------
  const [caja, banco] = await crearEnOrden(prisma.cuenta, [
    { nombre: 'Caja General', tipo: 'CAJA', saldoInicial: D('1500.00'), saldoActual: D('1500.00'), cuentaContableId: cc('1.1.01') },
    { nombre: 'Banco Unión - Cta. Cte.', tipo: 'BANCO', banco: 'Banco Unión', nroCuenta: '1000-2345-6789', saldoInicial: D('25000.00'), saldoActual: D('25000.00'), cuentaContableId: cc('1.1.02') },
  ]);

  // ---------- Categorías (ligadas a su cuenta contable) ----------
  const [catAlquiler, , , catServicios] = await crearEnOrden(prisma.categoria, [
    { nombre: 'Alquiler de salón de eventos', tipo: 'INGRESO', cuentaContableId: cc('4.2.01') },
    { nombre: 'Multas', tipo: 'INGRESO', cuentaContableId: cc('4.2.02') },
    { nombre: 'Otros ingresos', tipo: 'INGRESO', cuentaContableId: cc('4.2.09') },
    { nombre: 'Servicios básicos (luz, agua)', tipo: 'EGRESO', cuentaContableId: cc('5.1.01') },
    { nombre: 'Mantenimiento', tipo: 'EGRESO', cuentaContableId: cc('5.1.02') },
    { nombre: 'Limpieza', tipo: 'EGRESO', cuentaContableId: cc('5.1.03') },
    { nombre: 'Sueldos y salarios', tipo: 'EGRESO', cuentaContableId: cc('5.1.04') },
  ]);

  // ---------- Unidades ----------
  const [dep101, dep201, dep301, parq01, baul01] = await crearEnOrden(prisma.unidad, [
    { codigo: 'DEP-101', tipo: 'DEPARTAMENTO', piso: 1, superficieM2: D('85.50'), coeficiente: D('0.0420') },
    { codigo: 'DEP-201', tipo: 'DEPARTAMENTO', piso: 2, superficieM2: D('92.00'), coeficiente: D('0.0455') },
    { codigo: 'DEP-301', tipo: 'DEPARTAMENTO', piso: 3, superficieM2: D('110.00'), coeficiente: D('0.0540') },
    { codigo: 'PARQ-01', tipo: 'PARQUEO', piso: -1, superficieM2: D('12.50'), coeficiente: D('0.0060') },
    { codigo: 'BAUL-01', tipo: 'BAULERA', piso: -1, superficieM2: D('4.00'), coeficiente: D('0.0020') },
  ]);

  // ---------- Copropietarios y ocupaciones ----------
  const [maria, carlos, lucia] = await crearEnOrden(prisma.copropietario, [
    { nombres: 'María', apellidos: 'Fernández Quiroga', ci: '4567890 CB', telefono: '70712345', email: 'maria@mail.com', tipo: 'PROPIETARIO' },
    { nombres: 'Carlos', apellidos: 'Rojas Mendoza', ci: '5678901 CB', telefono: '71823456', email: 'carlos@mail.com', tipo: 'PROPIETARIO' },
    { nombres: 'Lucía', apellidos: 'Vargas Soto', ci: '6789012 CB', telefono: '72934567', email: 'lucia@mail.com', tipo: 'INQUILINO' },
  ]);
  await prisma.ocupacion.createMany({
    data: [
      { unidadId: dep101.id, copropietarioId: maria.id, fechaInicio: fecha('2024-03-01') },
      { unidadId: parq01.id, copropietarioId: maria.id, fechaInicio: fecha('2024-03-01') },
      { unidadId: baul01.id, copropietarioId: maria.id, fechaInicio: fecha('2024-03-01') },
      { unidadId: dep201.id, copropietarioId: carlos.id, fechaInicio: fecha('2023-01-15') },
      { unidadId: dep301.id, copropietarioId: lucia.id, fechaInicio: fecha('2026-06-01') },
    ],
  });

  // ---------- Configuración de mora ----------
  await prisma.configuracionMora.create({
    data: { tasaMensual: D('2.00'), diasGracia: 5, diaVencimiento: 10, metodo: 'SIMPLE', vigenteDesde: fecha('2026-01-01'), creadoPorId: admin.id },
  });

  // ---------- Periodos agosto y septiembre (mismo servicio que POST /periodos) ----------
  const cfgPeriodo = { modo: 'FIJO', montoBase: 350, montosPorTipo: { PARQUEO: 50, BAULERA: 20 } };
  await periodosService.crear({ anio: 2026, mes: 8, ...cfgPeriodo }, admin.id);
  await periodosService.crear({ anio: 2026, mes: 9, ...cfgPeriodo }, admin.id);
  await prisma.periodo.update({ where: { anio_mes: { anio: 2026, mes: 8 } }, data: { estado: 'CERRADO' } });

  // ---------- Pagos (mismo servicio que POST /pagos): agosto todos menos DEP-301 ----------
  const pagar = (datos) => pagosService.registrar(datos, admin.id);
  await pagar({ unidadId: dep101.id, cuentaId: caja.id, monto: 350, metodo: 'EFECTIVO', referencia: 'REC-0001', fecha: '2026-08-05T14:00:00Z' });
  await pagar({ unidadId: parq01.id, cuentaId: caja.id, monto: 50, metodo: 'EFECTIVO', referencia: 'REC-0002', fecha: '2026-08-05T14:05:00Z' });
  await pagar({ unidadId: baul01.id, cuentaId: caja.id, monto: 20, metodo: 'EFECTIVO', referencia: 'REC-0003', fecha: '2026-08-05T14:06:00Z' });
  await pagar({ unidadId: dep201.id, cuentaId: banco.id, monto: 350, metodo: 'TRANSFERENCIA', referencia: 'TRX-77120', fecha: '2026-08-09T19:30:00Z' });
  // septiembre: DEP-101 total, DEP-201 parcial
  await pagar({ unidadId: dep101.id, cuentaId: caja.id, monto: 350, metodo: 'EFECTIVO', referencia: 'REC-0004', fecha: '2026-09-03T13:00:00Z' });
  await pagar({ unidadId: dep201.id, cuentaId: banco.id, monto: 200, metodo: 'TRANSFERENCIA', referencia: 'TRX-88912', fecha: '2026-09-04T15:20:00Z' });
  // DEP-301 no pagó agosto → vencida
  const agostoDep301 = await prisma.expensa.findFirst({ where: { unidadId: dep301.id, periodo: { mes: 8 } } });
  await prisma.expensa.update({ where: { id: agostoDep301.id }, data: { estado: 'VENCIDA' } });

  // ---------- Ingreso extraordinario y egreso (mismos servicios que la API) ----------
  await ieService.registrarIngreso({ categoriaId: catAlquiler.id, cuentaId: banco.id, monto: 800, descripcion: 'Alquiler salón de eventos - Sra. Pérez', fecha: '2026-09-03' }, admin.id);
  await ieService.registrarEgreso({ categoriaId: catServicios.id, cuentaId: caja.id, monto: 420.5, descripcion: 'Factura ELFEC agosto 2026', proveedor: 'ELFEC', nroFactura: '00123456', fecha: '2026-09-04' }, admin.id);

  // ---------- Empleado ----------
  await prisma.empleado.create({ data: { nombres: 'Juan', apellidos: 'Mamani Choque', ci: '3456789 CB', cargo: 'Portero', salarioBase: D('2500.00'), fechaIngreso: fecha('2022-05-01') } });

  // ---------- Resumen ----------
  const cuentas = await prisma.cuenta.findMany({ orderBy: { id: 'asc' } });
  const [nExp, nPagos, nMov, nAsientos] = await Promise.all([prisma.expensa.count(), prisma.pago.count(), prisma.movimiento.count(), prisma.asiento.count()]);
  const balance = await contabilidadService.balanceComprobacion();
  console.log('\n✅ Seed completado');
  console.log('   Usuarios: usuario1 / usuario2 / usuario3 (contraseña 1234)');
  console.log(`   Plan de cuentas: ${PLAN.length} cuentas | Unidades: 5 | Copropietarios: 3`);
  console.log(`   Periodos: 2 | Expensas: ${nExp} | Pagos: ${nPagos} | Movimientos: ${nMov} | Asientos: ${nAsientos}`);
  for (const c of cuentas) console.log(`   ${c.nombre}: Bs ${c.saldoActual.toFixed(2)}`);
  console.log(`   Balance de comprobación: debe ${balance.totales.debe.toFixed(2)} = haber ${balance.totales.haber.toFixed(2)} → ${balance.totales.cuadra ? 'CUADRA ✔' : 'NO CUADRA ✘'}`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
