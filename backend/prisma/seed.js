// =====================================================================
//  Seed de datos de prueba · NEXA API
//  Ejecutar: npm run db:seed   (idempotente: limpia y vuelve a cargar)
//
//  Usuarios (coinciden con los mocks del frontend HU-SE-02):
//    usuario1 / 1234 → Administrador
//    usuario2 / 1234 → Directorio
//    usuario3 / 1234 → Consulta
// =====================================================================
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient();
const D = (v) => new Prisma.Decimal(v);
const fecha = (iso) => new Date(iso);

// ---------------------------------------------------------------------
// Helpers de negocio (mismo flujo que usarán los servicios de pagos)
// ---------------------------------------------------------------------
async function registrarMovimiento(tx, { cuentaId, tipo, monto, origenTipo, descripcion, usuarioId, fechaMov }) {
  const cuenta = await tx.cuenta.findUniqueOrThrow({ where: { id: cuentaId } });
  const saldoResultante = tipo === 'INGRESO' ? cuenta.saldoActual.plus(monto) : cuenta.saldoActual.minus(monto);
  const movimiento = await tx.movimiento.create({
    data: { cuentaId, tipo, monto, saldoResultante, origenTipo, descripcion, usuarioId, ...(fechaMov && { fecha: fechaMov }) },
  });
  await tx.cuenta.update({ where: { id: cuentaId }, data: { saldoActual: saldoResultante } });
  return movimiento;
}

async function registrarPagoExpensa({ expensaId, copropietarioId, cuentaId, monto, metodo, referencia, usuarioId, fechaPago }) {
  return prisma.$transaction(async (tx) => {
    const expensa = await tx.expensa.findUniqueOrThrow({ where: { id: expensaId }, include: { unidad: true, periodo: true } });
    const movimiento = await registrarMovimiento(tx, {
      cuentaId, tipo: 'INGRESO', monto, origenTipo: 'PAGO', usuarioId, fechaMov: fechaPago,
      descripcion: `Pago expensa ${String(expensa.periodo.mes).padStart(2, '0')}/${expensa.periodo.anio} ${expensa.unidad.codigo}`,
    });
    const pago = await tx.pago.create({
      data: {
        unidadId: expensa.unidadId, copropietarioId, cuentaId, movimientoId: movimiento.id,
        monto, metodo, referencia, usuarioId, ...(fechaPago && { fecha: fechaPago }),
        detalles: { create: [{ expensaId: expensa.id, montoAplicado: monto, aplicadoA: 'CAPITAL' }] },
      },
    });
    const nuevoSaldo = expensa.saldoPendiente.minus(monto);
    await tx.expensa.update({
      where: { id: expensa.id },
      data: { saldoPendiente: nuevoSaldo, estado: nuevoSaldo.isZero() ? 'PAGADA' : 'PARCIAL' },
    });
    return pago;
  });
}

/** Crea registros uno por uno para que los ids autoincrementales sigan el orden de la lista. */
async function crearEnOrden(modelo, lista) {
  const creados = [];
  for (const data of lista) creados.push(await modelo.create({ data }));
  return creados;
}

async function limpiar() {
  // TRUNCATE ... RESTART IDENTITY deja los ids estables en cada seed (usuario1 = 1, DEP-101 = 1, etc.)
  const tablas = [
    'pago_detalle', 'anticipo', 'pago', 'planilla_detalle', 'anticipo_empleado', 'planilla', 'ingreso', 'egreso',
    'movimiento', 'conciliacion', 'expensa', 'periodo', 'configuracion_mora', 'ocupacion', 'unidad', 'copropietario',
    'categoria', 'cuenta', 'empleado', 'usuario',
  ];
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tablas.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`);
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

  // ---------- Cuentas: caja y banco ----------
  const caja = await prisma.cuenta.create({ data: { nombre: 'Caja General', tipo: 'CAJA', saldoInicial: D('1500.00'), saldoActual: D('1500.00') } });
  const banco = await prisma.cuenta.create({
    data: { nombre: 'Banco Unión - Cta. Cte.', tipo: 'BANCO', banco: 'Banco Unión', nroCuenta: '1000-2345-6789', saldoInicial: D('25000.00'), saldoActual: D('25000.00') },
  });

  // ---------- Categorías ----------
  await prisma.categoria.createMany({
    data: [
      { nombre: 'Alquiler de salón de eventos', tipo: 'INGRESO' },
      { nombre: 'Multas', tipo: 'INGRESO' },
      { nombre: 'Otros ingresos', tipo: 'INGRESO' },
      { nombre: 'Servicios básicos (luz, agua)', tipo: 'EGRESO' },
      { nombre: 'Mantenimiento', tipo: 'EGRESO' },
      { nombre: 'Limpieza', tipo: 'EGRESO' },
      { nombre: 'Sueldos y salarios', tipo: 'EGRESO' },
    ],
  });
  const catAlquiler = await prisma.categoria.findFirst({ where: { nombre: 'Alquiler de salón de eventos' } });
  const catServicios = await prisma.categoria.findFirst({ where: { nombre: 'Servicios básicos (luz, agua)' } });

  // ---------- Unidades ----------
  const [dep101, dep201, dep301, parq01, baul01] = await crearEnOrden(prisma.unidad, [
      { codigo: 'DEP-101', tipo: 'DEPARTAMENTO', piso: 1, superficieM2: D('85.50'), coeficiente: D('0.0420') },
      { codigo: 'DEP-201', tipo: 'DEPARTAMENTO', piso: 2, superficieM2: D('92.00'), coeficiente: D('0.0455') },
      { codigo: 'DEP-301', tipo: 'DEPARTAMENTO', piso: 3, superficieM2: D('110.00'), coeficiente: D('0.0540') },
      { codigo: 'PARQ-01', tipo: 'PARQUEO', piso: -1, superficieM2: D('12.50'), coeficiente: D('0.0060') },
      { codigo: 'BAUL-01', tipo: 'BAULERA', piso: -1, superficieM2: D('4.00'), coeficiente: D('0.0020') },
  ]);

  // ---------- Copropietarios y ocupaciones ----------
  const maria = await prisma.copropietario.create({ data: { nombres: 'María', apellidos: 'Fernández Quiroga', ci: '4567890 CB', telefono: '70712345', email: 'maria@mail.com', tipo: 'PROPIETARIO' } });
  const carlos = await prisma.copropietario.create({ data: { nombres: 'Carlos', apellidos: 'Rojas Mendoza', ci: '5678901 CB', telefono: '71823456', email: 'carlos@mail.com', tipo: 'PROPIETARIO' } });
  const lucia = await prisma.copropietario.create({ data: { nombres: 'Lucía', apellidos: 'Vargas Soto', ci: '6789012 CB', telefono: '72934567', email: 'lucia@mail.com', tipo: 'INQUILINO' } });

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

  // ---------- Periodos agosto y septiembre 2026 ----------
  const montoPorTipo = { DEPARTAMENTO: D('350.00'), PARQUEO: D('50.00'), BAULERA: D('20.00') };
  const unidades = [dep101, dep201, dep301, parq01, baul01];
  const expensas = {};

  for (const [anio, mes, emision, venc] of [[2026, 8, '2026-08-01', '2026-08-10'], [2026, 9, '2026-09-01', '2026-09-10']]) {
    const periodo = await prisma.periodo.create({
      data: { anio, mes, montoBase: D('350.00'), fechaEmision: fecha(emision), fechaVencimiento: fecha(venc), estado: mes === 8 ? 'CERRADO' : 'ABIERTO' },
    });
    for (const u of unidades) {
      const monto = montoPorTipo[u.tipo];
      expensas[`${u.codigo}-${mes}`] = await prisma.expensa.create({
        data: { unidadId: u.id, periodoId: periodo.id, monto, saldoPendiente: monto, fechaVencimiento: periodo.fechaVencimiento },
      });
    }
  }

  // ---------- Pagos de agosto: todos pagan menos DEP-301 (queda VENCIDA) ----------
  await registrarPagoExpensa({ expensaId: expensas['DEP-101-8'].id, copropietarioId: maria.id, cuentaId: caja.id, monto: D('350.00'), metodo: 'EFECTIVO', referencia: 'REC-0001', usuarioId: admin.id, fechaPago: fecha('2026-08-05T10:00:00Z') });
  await registrarPagoExpensa({ expensaId: expensas['PARQ-01-8'].id, copropietarioId: maria.id, cuentaId: caja.id, monto: D('50.00'), metodo: 'EFECTIVO', referencia: 'REC-0002', usuarioId: admin.id, fechaPago: fecha('2026-08-05T10:05:00Z') });
  await registrarPagoExpensa({ expensaId: expensas['BAUL-01-8'].id, copropietarioId: maria.id, cuentaId: caja.id, monto: D('20.00'), metodo: 'EFECTIVO', referencia: 'REC-0003', usuarioId: admin.id, fechaPago: fecha('2026-08-05T10:06:00Z') });
  await registrarPagoExpensa({ expensaId: expensas['DEP-201-8'].id, copropietarioId: carlos.id, cuentaId: banco.id, monto: D('350.00'), metodo: 'TRANSFERENCIA', referencia: 'TRX-77120', usuarioId: admin.id, fechaPago: fecha('2026-08-09T15:30:00Z') });
  await prisma.expensa.update({ where: { id: expensas['DEP-301-8'].id }, data: { estado: 'VENCIDA' } });

  // ---------- Pagos de septiembre: uno total, uno parcial ----------
  await registrarPagoExpensa({ expensaId: expensas['DEP-101-9'].id, copropietarioId: maria.id, cuentaId: caja.id, monto: D('350.00'), metodo: 'EFECTIVO', referencia: 'REC-0004', usuarioId: admin.id, fechaPago: fecha('2026-09-03T09:00:00Z') });
  await registrarPagoExpensa({ expensaId: expensas['DEP-201-9'].id, copropietarioId: carlos.id, cuentaId: banco.id, monto: D('200.00'), metodo: 'TRANSFERENCIA', referencia: 'TRX-88912', usuarioId: admin.id, fechaPago: fecha('2026-09-04T11:20:00Z') });

  // ---------- Ingreso extraordinario y egreso ----------
  await prisma.$transaction(async (tx) => {
    const mov = await registrarMovimiento(tx, { cuentaId: banco.id, tipo: 'INGRESO', monto: D('800.00'), origenTipo: 'INGRESO', descripcion: 'Alquiler salón de eventos - Sra. Pérez', usuarioId: admin.id, fechaMov: fecha('2026-09-03T16:00:00Z') });
    await tx.ingreso.create({ data: { categoriaId: catAlquiler.id, cuentaId: banco.id, movimientoId: mov.id, fecha: fecha('2026-09-03'), monto: D('800.00'), descripcion: 'Alquiler salón de eventos - Sra. Pérez', usuarioId: admin.id } });
  });
  await prisma.$transaction(async (tx) => {
    const mov = await registrarMovimiento(tx, { cuentaId: caja.id, tipo: 'EGRESO', monto: D('420.50'), origenTipo: 'EGRESO', descripcion: 'Factura ELFEC agosto 2026', usuarioId: admin.id, fechaMov: fecha('2026-09-04T12:00:00Z') });
    await tx.egreso.create({ data: { categoriaId: catServicios.id, cuentaId: caja.id, movimientoId: mov.id, fecha: fecha('2026-09-04'), monto: D('420.50'), proveedor: 'ELFEC', nroFactura: '00123456', descripcion: 'Factura ELFEC agosto 2026', usuarioId: admin.id } });
  });

  // ---------- Empleado ----------
  await prisma.empleado.create({ data: { nombres: 'Juan', apellidos: 'Mamani Choque', ci: '3456789 CB', cargo: 'Portero', salarioBase: D('2500.00'), fechaIngreso: fecha('2022-05-01') } });

  // ---------- Resumen ----------
  const cuentas = await prisma.cuenta.findMany({ orderBy: { id: 'asc' } });
  const nExp = await prisma.expensa.count();
  const nPagos = await prisma.pago.count();
  const nMov = await prisma.movimiento.count();
  console.log('\n✅ Seed completado');
  console.log('   Usuarios: usuario1 / usuario2 / usuario3 (contraseña 1234)');
  console.log(`   Unidades: 5 | Copropietarios: 3 | Periodos: 2 | Expensas: ${nExp} | Pagos: ${nPagos} | Movimientos: ${nMov}`);
  for (const c of cuentas) console.log(`   ${c.nombre}: Bs ${c.saldoActual.toFixed(2)}`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
