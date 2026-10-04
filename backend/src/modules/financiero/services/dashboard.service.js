// Indicadores del dashboard y lista de morosos (req. 5). Solo lectura: no toca saldos ni asientos.
const prisma = require('../../../config/prisma');
const { configMoraVigente } = require('./configuracion.service');
const {
  inicioDiaUTC, rangoMes, soloFecha,
  agruparMorosos, resumirCuentas, resumirMovimientos, contarExpensasPorEstado,
  etiquetaPeriodo, parsePeriodo, ultimosMeses, serieIngresosGastos, porcentajesEstadoExpensas, clasificarExpensas,
  tablaDepartamentosMora, tablaMovimientos, resumenFinanzas,
} = require('../utils/dashboard.utils');

const INCLUDE_MOROSOS = {
  periodo: { select: { anio: true, mes: true } },
  unidad: {
    select: {
      id: true, codigo: true, tipo: true, piso: true,
      ocupaciones: {
        where: { fechaFin: null },
        orderBy: { fechaInicio: 'desc' },
        select: {
          esResponsablePago: true,
          copropietario: { select: { id: true, nombres: true, apellidos: true, telefono: true, email: true } },
        },
      },
    },
  },
};

/** Configuración de mora vigente; si no hay ninguna configurada, el dashboard sigue funcionando con mora 0. */
async function configMoraSegura(fecha) {
  try {
    return await configMoraVigente(fecha);
  } catch (err) {
    if (err?.status === 404 || err?.statusCode === 404) return null;
    throw err;
  }
}

/**
 * Lista de unidades morosas: expensas con saldo pendiente y fecha de vencimiento anterior a hoy,
 * agrupadas por unidad con su responsable de pago y la mora estimada a la fecha.
 */
async function morosos({ minDias = 1, hoy = new Date() } = {}) {
  const [expensas, configMora] = await Promise.all([
    prisma.expensa.findMany({
      where: { saldoPendiente: { gt: 0 }, fechaVencimiento: { lt: inicioDiaUTC(hoy) } },
      include: INCLUDE_MOROSOS,
      orderBy: [{ unidadId: 'asc' }, { fechaVencimiento: 'asc' }],
    }),
    configMoraSegura(hoy),
  ]);

  return { generadoEn: hoy.toISOString(), ...agruparMorosos({ expensas, configMora, hoy, minDias }) };
}

/** Indicadores para la pantalla de inicio: por cobrar, morosos, expensas del período, caja/bancos y resultado del mes. */
async function dashboard({ hoy = new Date() } = {}) {
  const { inicioMes, finMes } = rangoMes(hoy);

  const [periodoActual, porCobrarAgg, cuentas, movimientosMes, listaMorosos] = await Promise.all([
    prisma.periodo.findFirst({
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
      select: { id: true, anio: true, mes: true, estado: true, fechaVencimiento: true },
    }),
    prisma.expensa.aggregate({ where: { saldoPendiente: { gt: 0 } }, _sum: { saldoPendiente: true }, _count: { _all: true } }),
    prisma.cuenta.findMany({ where: { activa: true }, select: { id: true, nombre: true, tipo: true, saldoActual: true }, orderBy: { id: 'asc' } }),
    prisma.movimiento.groupBy({ by: ['tipo'], where: { fecha: { gte: inicioMes, lt: finMes } }, _sum: { monto: true } }),
    morosos({ hoy }),
  ]);

  const porEstado = periodoActual
    ? await prisma.expensa.groupBy({ by: ['estado'], where: { periodoId: periodoActual.id }, _count: { _all: true } })
    : [];

  const capital = Number(porCobrarAgg._sum.saldoPendiente ?? 0);
  const mora = listaMorosos.items.reduce((acc, i) => acc + Math.round(i.mora * 100), 0) / 100;

  return {
    fecha: soloFecha(hoy),
    periodoActual: periodoActual
      ? { id: periodoActual.id, anio: periodoActual.anio, mes: periodoActual.mes, estado: periodoActual.estado, fechaVencimiento: soloFecha(periodoActual.fechaVencimiento) }
      : null,
    porCobrar: {
      capital,
      mora,
      total: Math.round((capital + mora) * 100) / 100,
      expensas: porCobrarAgg._count._all,
    },
    morosos: { cantidad: listaMorosos.cantidad, montoTotal: listaMorosos.montoTotal },
    expensasPeriodo: contarExpensasPorEstado(porEstado.map((g) => ({ estado: g.estado, cantidad: g._count._all }))),
    cuentas: resumirCuentas(cuentas),
    mes: resumirMovimientos(movimientosMes.map((g) => ({ tipo: g.tipo, total: g._sum.monto }))),
  };
}

/**
 * Datos del módulo Finanzas del frontend (misma forma que finanzasMock.js):
 * selector de períodos, KPIs, ingresos vs. gastos por mes, estado de expensas, departamentos con mora
 * y últimos movimientos. `periodo` llega como 'YYYY-MM'; si no se envía, se usa el último período emitido
 * o, si no hay ninguno, el mes actual.
 */
async function finanzas({ periodo, hoy = new Date() } = {}) {
  const periodos = await prisma.periodo.findMany({
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    select: { id: true, anio: true, mes: true },
  });

  const pedido = parsePeriodo(periodo);
  const sel = pedido
    || (periodos[0] ? { anio: periodos[0].anio, mes: periodos[0].mes } : { anio: hoy.getUTCFullYear(), mes: hoy.getUTCMonth() + 1 });
  const periodoSel = periodos.find((p) => p.anio === sel.anio && p.mes === sel.mes) || null;

  const meses = ultimosMeses(sel.anio, sel.mes, 4);
  const { inicioMes, finMes } = rangoMes(new Date(Date.UTC(sel.anio, sel.mes - 1, 1)));
  const inicioSerie = new Date(Date.UTC(meses[0].anio, meses[0].mes - 1, 1));

  const [movsSerie, porCobrar, expensasPeriodo, ultimos, listaMorosos] = await Promise.all([
    prisma.movimiento.findMany({
      where: { fecha: { gte: inicioSerie, lt: finMes } },
      select: { fecha: true, tipo: true, monto: true },
    }),
    prisma.expensa.aggregate({ where: { saldoPendiente: { gt: 0 } }, _sum: { saldoPendiente: true } }),
    prisma.expensa.findMany({
      where: periodoSel ? { periodoId: periodoSel.id } : {},
      select: { saldoPendiente: true, fechaVencimiento: true },
    }),
    prisma.movimiento.findMany({
      where: { fecha: { lt: finMes } },
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
      take: 5,
      select: { id: true, fecha: true, tipo: true, monto: true, descripcion: true, origenTipo: true },
    }),
    morosos({ hoy }),
  ]);

  const serie = serieIngresosGastos(movsSerie, meses);
  const mesSel = serie[serie.length - 1];
  // "Vencidas" se decide por fecha, igual que la tabla de morosos, no por el campo `estado` guardado.
  const estadoExpensas = porcentajesEstadoExpensas(clasificarExpensas(expensasPeriodo, hoy));

  return {
    periodoActual: etiquetaPeriodo(sel.anio, sel.mes),
    periodos: periodos.map((p) => etiquetaPeriodo(p.anio, p.mes)),
    resumen: resumenFinanzas({
      ingresos: mesSel.ingresos,
      gastos: mesSel.gastos,
      saldoPendiente: porCobrar._sum.saldoPendiente ?? 0,
    }),
    ingresosGastos: serie,
    estadoExpensas,
    departamentosMora: tablaDepartamentosMora(listaMorosos.items),
    movimientos: tablaMovimientos(ultimos),
    meta: {
      periodo: `${sel.anio}-${String(sel.mes).padStart(2, '0')}`,
      periodoId: periodoSel?.id ?? null,
      rango: { desde: soloFecha(inicioMes), hasta: soloFecha(finMes) },
      generadoEn: hoy.toISOString(),
    },
  };
}

module.exports = { dashboard, morosos, finanzas };
