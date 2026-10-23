// Datos en la forma exacta de las pantallas "Estado de cuenta" (US2.2) e "Ingresos y gastos" (US2.3).
const prisma = require('../../../config/prisma');
const { configMoraVigente } = require('./configuracion.service');
const { sincronizarEstados } = require('./expensas.service');
const { enriquecerExpensa, etiquetaUnidad, inicioDiaUTC } = require('../utils/expensasVista.utils');
const { aCentavos, deCentavos } = require('../utils/expensas.utils');
const {
  etiquetaResponsable, resumirEstadoCuenta, filaExpensaCuenta, filasPagosCuenta, filaMovimiento, resumirMovimientos, rangoPeriodo,
} = require('../utils/vistas.utils');

/** Pantalla "Estado de cuenta por departamento". anio/mes opcionales para acotar el historial. */
async function estadoCuenta(unidadId, { anio, mes, hoy = new Date() } = {}) {
  const unidad = await prisma.unidad.findUnique({
    where: { id: unidadId },
    include: {
      ocupaciones: {
        where: { OR: [{ fechaFin: null }, { fechaFin: { gte: inicioDiaUTC(hoy) } }] },
        include: { copropietario: { select: { id: true, nombres: true, apellidos: true, tipo: true, telefono: true, email: true } } },
        orderBy: { fechaInicio: 'desc' },
      },
    },
  });
  if (!unidad) return null;
  await sincronizarEstados({ hoy });

  const rango = rangoPeriodo(anio, mes);
  const wherePeriodo = rango ? { periodo: { anio: Number(anio), mes: Number(mes) } } : {};
  const [expensas, pagos, anticipos, configMora] = await Promise.all([
    prisma.expensa.findMany({
      where: { unidadId, ...wherePeriodo },
      include: { unidad: { select: { id: true, codigo: true, tipo: true, piso: true, categoria: true } }, periodo: { select: { id: true, anio: true, mes: true } } },
      orderBy: [{ periodo: { anio: 'desc' } }, { periodo: { mes: 'desc' } }],
    }),
    prisma.pago.findMany({
      where: { unidadId, anulado: false, ...(rango ? { fecha: { gte: rango.inicio, lt: rango.fin } } : {}) },
      include: { cuenta: { select: { nombre: true } }, detalles: { select: { expensaId: true, montoAplicado: true, aplicadoA: true } } },
      orderBy: { fecha: 'desc' },
    }),
    prisma.anticipo.findMany({ where: { unidadId, estado: 'DISPONIBLE' }, select: { saldoDisponible: true } }),
    configMoraVigente(hoy),
  ]);

  const filas = expensas.map((e) => enriquecerExpensa(e, { configMora, hoy }));
  const porId = new Map(filas.map((f) => [f.id, { monto: f.monto, periodo: f.periodo }]));
  // para pagos que aplican a expensas fuera del rango consultado
  const faltantes = [...new Set(pagos.flatMap((p) => p.detalles.map((d) => d.expensaId)).filter((id) => !porId.has(id)))];
  if (faltantes.length) {
    const extra = await prisma.expensa.findMany({ where: { id: { in: faltantes } }, include: { periodo: { select: { anio: true, mes: true } } } });
    for (const e of extra) porId.set(e.id, { monto: Number(e.monto), periodo: e.periodo ? enriquecerExpensa(e, { hoy }).periodo : null });
  }
  const saldoAFavor = deCentavos(anticipos.reduce((a, x) => a + aCentavos(String(x.saldoDisponible)), 0));
  const responsable = unidad.ocupaciones.find((o) => o.esResponsablePago)?.copropietario ?? unidad.ocupaciones[0]?.copropietario ?? null;

  return {
    unidad: { id: unidad.id, codigo: unidad.codigo, tipo: unidad.tipo, piso: unidad.piso, categoria: unidad.categoria },
    departamento: etiquetaUnidad(unidad),
    responsable: etiquetaResponsable(responsable),
    responsableDetalle: responsable ? { id: responsable.id, nombre: `${responsable.nombres} ${responsable.apellidos}`, tipo: responsable.tipo, telefono: responsable.telefono, email: responsable.email } : null,
    periodoConsultado: rango ? rango.etiqueta : 'Todo el historial',
    resumen: resumirEstadoCuenta(filas, saldoAFavor),
    expensas: filas.map(filaExpensaCuenta),
    pagos: filasPagosCuenta(pagos, porId),
    configuracionMora: configMora ? { porcentaje: Number(configMora.tasaMensual), diasGracia: configMora.diasGracia, metodo: configMora.metodo } : null,
    generadoEn: hoy.toISOString(),
  };
}

/** Selector de departamentos de las pantallas (etiqueta + responsable + categoría + última expensa). */
async function unidadesSelector() {
  const unidades = await prisma.unidad.findMany({
    where: { activo: true },
    include: {
      ocupaciones: { where: { fechaFin: null }, include: { copropietario: { select: { nombres: true, apellidos: true, tipo: true } } } },
      expensas: { orderBy: { periodoId: 'desc' }, take: 1, select: { monto: true, montoAgua: true } },
    },
    orderBy: [{ tipo: 'asc' }, { codigo: 'asc' }],
  });
  return unidades.map((u) => {
    const resp = u.ocupaciones.find((o) => o.esResponsablePago)?.copropietario ?? u.ocupaciones[0]?.copropietario ?? null;
    const ultima = u.expensas[0];
    const piso = u.piso === null || u.piso === undefined ? '' : (u.piso < 0 ? ' -- Subsuelo' : ` -- Piso ${u.piso}`);
    return {
      id: u.id,
      codigo: u.codigo,
      tipo: u.tipo,
      categoria: u.categoria,
      departamento: etiquetaUnidad(u),
      etiqueta: `${etiquetaUnidad(u)}${u.categoria ? ` -- Tipo ${u.categoria}` : ''}${piso}`,
      responsable: etiquetaResponsable(resp),
      expensaMensual: ultima ? deCentavos(aCentavos(String(ultima.monto)) - aCentavos(String(ultima.montoAgua ?? 0))) : null,
    };
  });
}

/** Pantalla "Ingresos y gastos": movimientos operativos (NO pagos de expensas ni anticipos) con resumen. */
async function movimientos({ anio, mes, tipo, categoriaId } = {}) {
  const rango = rangoPeriodo(anio, mes);
  const whereFecha = rango ? { fecha: { gte: rango.inicio, lt: rango.fin } } : {};
  const whereCat = categoriaId ? { categoriaId: Number(categoriaId) } : {};
  const t = tipo ? String(tipo).trim().toUpperCase() : 'TODOS';
  const quiereIngresos = ['TODOS', 'INGRESO', 'INGRESOS'].includes(t);
  const quiereGastos = ['TODOS', 'GASTO', 'GASTOS', 'EGRESO', 'EGRESOS'].includes(t);

  const INC = { categoria: { select: { nombre: true } }, cuenta: { select: { nombre: true } } };
  const [ingresos, egresos, categorias] = await Promise.all([
    quiereIngresos ? prisma.ingreso.findMany({ where: { ...whereFecha, ...whereCat }, include: INC }) : [],
    quiereGastos ? prisma.egreso.findMany({ where: { ...whereFecha, ...whereCat }, include: INC }) : [],
    prisma.categoria.findMany({ where: { activa: true }, orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }], select: { id: true, nombre: true, tipo: true } }),
  ]);
  const filas = [...ingresos.map((m) => filaMovimiento(m, 'INGRESO')), ...egresos.map((m) => filaMovimiento(m, 'EGRESO'))]
    .sort((a, b) => (b.fechaISO > a.fechaISO ? 1 : b.fechaISO < a.fechaISO ? -1 : b.idNum - a.idNum));
  return {
    periodo: rango ? rango.etiqueta : 'Todo el historial',
    resumen: resumirMovimientos(filas),
    categorias: categorias.map((c) => ({ id: c.id, nombre: c.nombre, tipo: c.tipo === 'INGRESO' ? 'Ingreso' : 'Gasto' })),
    data: filas,
  };
}

module.exports = { estadoCuenta, unidadesSelector, movimientos };
