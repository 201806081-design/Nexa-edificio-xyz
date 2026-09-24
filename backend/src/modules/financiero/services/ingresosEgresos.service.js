// Ingresos extraordinarios y egresos (req. 3) con movimiento de caja y asiento contable.
const prisma = require('../../../config/prisma');
const { HttpError } = require('../../../shared/errors');
const { validarDatosMovimientoManual } = require('../utils/ingresosEgresos.utils');
const { codigoCuentaOperativa, CUENTAS } = require('../utils/contabilidad.utils');
const { registrarMovimiento, bloquearCuenta, D } = require('./movimientos.service');
const { asentar } = require('./contabilidad.service');

const include = {
  categoria: { select: { nombre: true, tipo: true, cuentaContable: { select: { codigo: true, nombre: true } } } },
  cuenta: { select: { nombre: true, tipo: true } },
  movimiento: { select: { id: true, saldoResultante: true } },
};

async function listarCategorias(tipo) {
  return prisma.categoria.findMany({
    where: { activa: true, ...(tipo && { tipo: String(tipo).toUpperCase() }) },
    include: { cuentaContable: { select: { codigo: true, nombre: true } } },
    orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
  });
}

async function listarIngresos({ desde, hasta, categoriaId } = {}) {
  return prisma.ingreso.findMany({
    where: { ...(categoriaId && { categoriaId: Number(categoriaId) }), ...((desde || hasta) && { fecha: { ...(desde && { gte: new Date(desde) }), ...(hasta && { lte: new Date(hasta) }) } }) },
    include, orderBy: { fecha: 'desc' },
  });
}

async function listarEgresos({ desde, hasta, categoriaId } = {}) {
  return prisma.egreso.findMany({
    where: { ...(categoriaId && { categoriaId: Number(categoriaId) }), ...((desde || hasta) && { fecha: { ...(desde && { gte: new Date(desde) }), ...(hasta && { lte: new Date(hasta) }) } }) },
    include, orderBy: { fecha: 'desc' },
  });
}

async function categoriaValida(tx, categoriaId, tipoEsperado) {
  const categoria = await tx.categoria.findUnique({ where: { id: categoriaId }, include: { cuentaContable: true } });
  if (!categoria) throw new HttpError(404, 'Categoría no encontrada');
  if (categoria.tipo !== tipoEsperado) throw new HttpError(422, `La categoría "${categoria.nombre}" es de tipo ${categoria.tipo}, no ${tipoEsperado}`);
  if (!categoria.activa) throw new HttpError(422, `La categoría "${categoria.nombre}" está inactiva`);
  return categoria;
}

/** Ingreso extraordinario: Debe caja/banco · Haber cuenta de ingreso de la categoría. */
async function registrarIngreso(datos, usuarioId) {
  const d = validarDatosMovimientoManual(datos, 'INGRESO');
  return prisma.$transaction(async (tx) => {
    const categoria = await categoriaValida(tx, d.categoriaId, 'INGRESO');
    await bloquearCuenta(tx, d.cuentaId);
    const { movimiento, cuenta } = await registrarMovimiento(tx, { cuentaId: d.cuentaId, tipo: 'INGRESO', monto: d.monto, origenTipo: 'INGRESO', descripcion: d.descripcion, usuarioId, fecha: d.fecha });
    const ingreso = await tx.ingreso.create({
      data: { categoriaId: d.categoriaId, cuentaId: d.cuentaId, movimientoId: movimiento.id, fecha: d.fecha, monto: D(d.monto), descripcion: d.descripcion, comprobanteUrl: d.comprobanteUrl, usuarioId },
      include,
    });
    const asiento = await asentar(tx, {
      fecha: d.fecha, glosa: `${categoria.nombre}: ${d.descripcion}`, origenTipo: 'INGRESO', origenId: ingreso.id,
      lineas: [
        { cuenta: codigoCuentaOperativa(cuenta), debe: d.monto },
        { cuenta: categoria.cuentaContable?.codigo ?? CUENTAS.OTROS_INGRESOS, haber: d.monto },
      ],
    }, usuarioId);
    return { ingreso, asientoId: asiento.id, saldoCuenta: Number(movimiento.saldoResultante) };
  });
}

/** Egreso: Debe cuenta de gasto de la categoría · Haber caja/banco. Rechaza si no hay saldo. */
async function registrarEgreso(datos, usuarioId) {
  const d = validarDatosMovimientoManual(datos, 'EGRESO');
  return prisma.$transaction(async (tx) => {
    const categoria = await categoriaValida(tx, d.categoriaId, 'EGRESO');
    await bloquearCuenta(tx, d.cuentaId);
    const { movimiento, cuenta } = await registrarMovimiento(tx, { cuentaId: d.cuentaId, tipo: 'EGRESO', monto: d.monto, origenTipo: 'EGRESO', descripcion: d.descripcion, usuarioId, fecha: d.fecha });
    const egreso = await tx.egreso.create({
      data: { categoriaId: d.categoriaId, cuentaId: d.cuentaId, movimientoId: movimiento.id, fecha: d.fecha, monto: D(d.monto), descripcion: d.descripcion, proveedor: d.proveedor, nroFactura: d.nroFactura, comprobanteUrl: d.comprobanteUrl, usuarioId },
      include,
    });
    const asiento = await asentar(tx, {
      fecha: d.fecha, glosa: `${categoria.nombre}: ${d.descripcion}`, origenTipo: 'EGRESO', origenId: egreso.id,
      lineas: [
        { cuenta: categoria.cuentaContable?.codigo ?? CUENTAS.OTROS_GASTOS, debe: d.monto },
        { cuenta: codigoCuentaOperativa(cuenta), haber: d.monto },
      ],
    }, usuarioId);
    return { egreso, asientoId: asiento.id, saldoCuenta: Number(movimiento.saldoResultante) };
  });
}

module.exports = { listarCategorias, listarIngresos, listarEgresos, registrarIngreso, registrarEgreso };
