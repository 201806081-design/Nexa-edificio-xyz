// Mora y pagos anticipados (HU-FI-05): datos de la pantalla "Mora" y detalle de anticipos.
const prisma = require('../../../config/prisma');
const { configMoraVigente } = require('./configuracion.service');
const { sincronizarEstados } = require('./expensas.service');
const {
  inicioDiaUTC, enriquecerExpensa, filasSaldosVencidos, filaAnticipo, proyectarAplicacionAnticipo,
  configMoraAVista, etiquetaUnidad, soloFecha, fechaCorta,
} = require('../utils/expensasVista.utils');
const { aCentavos, deCentavos } = require('../utils/expensas.utils');

const UNIDAD = { select: { id: true, codigo: true, tipo: true, piso: true } };
const PERIODO = { select: { id: true, anio: true, mes: true } };
const PAGO = { select: { id: true, fecha: true, monto: true, metodo: true, referencia: true, anulado: true } };

/** Resumen + tablas de la pantalla Mora: saldos vencidos (con interés) y pagos anticipados. */
async function resumen({ hoy = new Date() } = {}) {
  await sincronizarEstados({ hoy });
  const [configMora, vencidas, anticipos] = await Promise.all([
    configMoraVigente(hoy),
    prisma.expensa.findMany({
      where: { saldoPendiente: { gt: 0 }, fechaVencimiento: { lt: inicioDiaUTC(hoy) } },
      include: { unidad: UNIDAD, periodo: PERIODO },
      orderBy: [{ fechaVencimiento: 'asc' }, { unidadId: 'asc' }],
    }),
    prisma.anticipo.findMany({ include: { unidad: UNIDAD, pago: PAGO }, orderBy: { creadoEn: 'desc' } }),
  ]);

  const saldosVencidos = filasSaldosVencidos(vencidas.map((e) => enriquecerExpensa(e, { configMora, hoy })));
  const pagosAnticipados = anticipos.map(filaAnticipo);

  const suma = (arr, k) => deCentavos(arr.reduce((a, x) => a + aCentavos(String(x[k] ?? 0)), 0));
  return {
    generadoEn: hoy.toISOString(),
    configuracion: configMoraAVista(configMora),
    resumen: {
      deudasVencidas: suma(saldosVencidos, 'capital'),
      interesAcumulado: suma(saldosVencidos, 'interes'),
      totalVencido: suma(saldosVencidos, 'totalPendiente'),
      saldoAFavor: suma(pagosAnticipados.filter((a) => a.estado === 'Anticipado'), 'saldoAFavor'),
      unidadesConMora: new Set(saldosVencidos.map((s) => s.unidadId)).size,
    },
    saldosVencidos,
    pagosAnticipados,
  };
}

async function listarAnticipos({ unidadId, estado } = {}) {
  const where = {};
  if (unidadId) where.unidadId = Number(unidadId);
  if (estado) where.estado = String(estado).toUpperCase() === 'APLICADO' ? 'APLICADO' : 'DISPONIBLE';
  const filas = await prisma.anticipo.findMany({ where, include: { unidad: UNIDAD, pago: PAGO }, orderBy: { creadoEn: 'desc' } });
  return filas.map(filaAnticipo);
}

/** Detalle de un anticipo (pantalla "Detalle del pago anticipado"), con proyección de períodos cubiertos. */
async function anticipoPorId(id, { hoy = new Date() } = {}) {
  const a = await prisma.anticipo.findUnique({ where: { id }, include: { unidad: UNIDAD, pago: PAGO } });
  if (!a) return null;

  const [ocupacion, deuda, ultimaExpensa, ultimoPeriodo] = await Promise.all([
    prisma.ocupacion.findFirst({
      where: { unidadId: a.unidadId, esResponsablePago: true, OR: [{ fechaFin: null }, { fechaFin: { gte: inicioDiaUTC(hoy) } }] },
      include: { copropietario: { select: { id: true, nombres: true, apellidos: true, tipo: true } } },
      orderBy: { fechaInicio: 'desc' },
    }),
    prisma.expensa.aggregate({ where: { unidadId: a.unidadId, saldoPendiente: { gt: 0 } }, _sum: { saldoPendiente: true } }),
    prisma.expensa.findFirst({ where: { unidadId: a.unidadId }, orderBy: { periodoId: 'desc' }, select: { monto: true } }),
    prisma.periodo.findFirst({ orderBy: [{ anio: 'desc' }, { mes: 'desc' }], select: { anio: true, mes: true } }),
  ]);

  const fila = filaAnticipo(a);
  const c = ocupacion?.copropietario;
  return {
    ...fila,
    unidad: { id: a.unidad.id, codigo: a.unidad.codigo, etiqueta: etiquetaUnidad(a.unidad), tipo: a.unidad.tipo, piso: a.unidad.piso },
    responsable: c ? `${c.nombres} ${c.apellidos} -- ${c.tipo === 'INQUILINO' ? 'Inquilino' : 'Propietario'}` : null,
    fechaPago: fechaCorta(a.pago?.fecha || a.creadoEn),
    montoAnticipado: fila.capital,
    deudaPendiente: deCentavos(aCentavos(String(deuda._sum.saldoPendiente ?? 0))),
    saldoAFavor: fila.saldoAFavor,
    pago: a.pago ? { ...a.pago, fecha: soloFecha(a.pago.fecha), monto: Number(a.pago.monto) } : null,
    aplicacion: proyectarAplicacionAnticipo({
      saldoAFavor: fila.saldoAFavor,
      expensaMensual: ultimaExpensa?.monto ?? 0,
      ultimoPeriodo,
    }),
    aplicacionEsEstimada: true,
  };
}

module.exports = { resumen, listarAnticipos, anticipoPorId };
