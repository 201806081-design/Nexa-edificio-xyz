// Generación automática de expensas mensuales (requisito 2 · HU-FI-01 / US2.1).
// Sprint 2: generación EN BLOQUES por categoría de departamento y registro de AGUA por unidad (pizarra 22-oct).
const { Prisma } = require('@prisma/client');
const prisma = require('../../../config/prisma');
const { HttpError } = require('../../../shared/errors');
const { configMoraVigente } = require('./configuracion.service');
const {
  validarDatosPeriodo, calcularFechasPeriodo, generarExpensasParaUnidades, calcularAjusteAgua, aplicarDeltaCargo, agruparCargosPorTipo,
} = require('../utils/periodos.utils');
const { fechaActual } = require('../../../shared/fechaSistema');
const { aCentavos, deCentavos, determinarEstadoExpensa } = require('../utils/expensas.utils');
const { CUENTAS } = require('../utils/contabilidad.utils');
const { asentar } = require('./contabilidad.service');
const { etiquetaPeriodo, etiquetaUnidad, soloFecha, ESTADO_UI } = require('../utils/expensasVista.utils');

const D = (v) => new Prisma.Decimal(v);
const UNIDAD = { select: { id: true, codigo: true, tipo: true, piso: true, categoria: true } };
const mmaaaa = (p) => `${String(p.mes).padStart(2, '0')}/${p.anio}`;

async function listar() {
  const periodos = await prisma.periodo.findMany({
    include: { _count: { select: { expensas: true } } },
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
  });
  const [sumas, activas] = await Promise.all([
    prisma.expensa.groupBy({ by: ['periodoId'], _sum: { monto: true, saldoPendiente: true, montoAgua: true, montoExtras: true } }),
    prisma.unidad.count({ where: { activo: true } }),
  ]);
  const porPeriodo = new Map(sumas.map((s) => [s.periodoId, s._sum]));
  return periodos.map((p) => ({
    ...p,
    etiqueta: etiquetaPeriodo(p.anio, p.mes),
    cantidadExpensas: p._count.expensas,
    unidadesActivas: activas,
    completo: p._count.expensas >= activas,
    totalEmitido: porPeriodo.get(p.id)?.monto ?? 0,
    totalAgua: porPeriodo.get(p.id)?.montoAgua ?? 0,
    totalExtras: porPeriodo.get(p.id)?.montoExtras ?? 0,
    saldoPendiente: porPeriodo.get(p.id)?.saldoPendiente ?? 0,
    _count: undefined,
  }));
}

async function contextoGeneracion(datos) {
  const cfg = validarDatosPeriodo(datos);
  const configMora = await configMoraVigente(await fechaActual());
  const diaGeneracion = configMora?.diaGeneracion ?? 1;
  const fechaEmision = new Date(Date.UTC(cfg.anio, cfg.mes - 1, Math.min(diaGeneracion, 28)));
  const diaVencimiento = cfg.diaVencimiento ?? configMora?.diaVencimiento ?? 10;
  let { fechaVencimiento } = calcularFechasPeriodo({ anio: cfg.anio, mes: cfg.mes, diaVencimiento });
  if (datos.fechaVencimiento) {
    const fv = new Date(datos.fechaVencimiento);
    if (Number.isNaN(fv.getTime())) throw new HttpError(400, 'fechaVencimiento inválida (YYYY-MM-DD)');
    fechaVencimiento = new Date(Date.UTC(fv.getUTCFullYear(), fv.getUTCMonth(), fv.getUTCDate()));
  }

  const [existente, unidades] = await Promise.all([
    prisma.periodo.findUnique({ where: { anio_mes: { anio: cfg.anio, mes: cfg.mes } } }),
    prisma.unidad.findMany({ where: { activo: true }, orderBy: [{ categoria: 'asc' }, { codigo: 'asc' }] }),
  ]);
  const yaGeneradas = existente
    ? new Set((await prisma.expensa.findMany({ where: { periodoId: existente.id }, select: { unidadId: true } })).map((e) => e.unidadId))
    : new Set();
  return { cfg, fechaEmision, fechaVencimiento: existente ? existente.fechaVencimiento : fechaVencimiento, existente, unidades, yaGeneradas };
}

/**
 * Genera expensas del mes. Si el periodo no existe lo crea; si existe (generación en bloques),
 * agrega solo las unidades que aún no tienen expensa. Cada bloque genera su asiento de devengado.
 * Todo en una transacción.
 */
async function crear(datos, usuarioId = null) {
  const { cfg, fechaEmision, fechaVencimiento, existente, unidades, yaGeneradas } = await contextoGeneracion(datos);
  if (existente && existente.estado === 'CERRADO') throw new HttpError(409, `El periodo ${mmaaaa(existente)} está cerrado`);
  if (unidades.length === 0) throw new HttpError(422, 'No hay unidades activas para generar expensas');

  return prisma.$transaction(async (tx) => {
    const periodo = existente || await tx.periodo.create({
      data: { anio: cfg.anio, mes: cfg.mes, montoBase: D(cfg.montoBase ?? cfg.presupuestoTotal ?? 0), fechaEmision, fechaVencimiento },
    });

    const { filas, omitidas, totalEmitido } = generarExpensasParaUnidades(unidades, cfg, { periodoId: periodo.id, fechaVencimiento, excluirUnidadIds: yaGeneradas });
    if (filas.length === 0) {
      const motivos = [...new Set(omitidas.map((o) => o.motivo))];
      throw new HttpError(409, motivos.includes('YA_GENERADA') && !motivos.includes('MONTO_CERO')
        ? `Las unidades del bloque ya tienen expensa en ${mmaaaa(periodo)}`
        : 'Ningún monto resultó mayor a cero; revisa montoBase/montosPorTipo/montosPorCategoria/coeficientes');
    }

    await tx.expensa.createMany({
      data: filas.map((f) => ({ ...f, monto: D(f.monto), saldoPendiente: D(f.saldoPendiente) })),
    });

    const bloque = cfg.categorias ? ` · bloque ${cfg.categorias.join('/')}` : '';
    const asiento = await asentar(tx, {
      fecha: fechaEmision,
      glosa: `Emisión de expensas ${mmaaaa(periodo)}${bloque} (${filas.length} unidades)`,
      origenTipo: 'EMISION_EXPENSAS',
      origenId: periodo.id,
      lineas: [
        { cuenta: CUENTAS.CUENTAS_POR_COBRAR, debe: totalEmitido, descripcion: 'Expensas por cobrar' },
        { cuenta: CUENTAS.INGRESOS_EXPENSAS, haber: totalEmitido, descripcion: 'Ingresos por expensas del periodo' },
      ],
    }, usuarioId);

    const anticiposAplicados = await aplicarAnticiposEnTx(tx, periodo, filas.map((f) => f.unidadId), usuarioId);

    return {
      periodo: { ...periodo, etiqueta: etiquetaPeriodo(periodo.anio, periodo.mes) },
      periodoNuevo: !existente,
      anticiposAplicados,
      bloque: cfg.categorias,
      modo: cfg.modo,
      expensasGeneradas: filas.length,
      totalEmitido,
      asientoId: asiento.id,
      yaExistentes: yaGeneradas.size,
      acumulado: yaGeneradas.size + filas.length,
      unidadesActivas: unidades.length,
      omitidas,
    };
  });
}

/** Vista previa del asistente: qué se emitiría a cada unidad del bloque. No escribe nada. */
async function vistaPrevia(datos) {
  const { cfg, fechaEmision, fechaVencimiento, existente, unidades, yaGeneradas } = await contextoGeneracion(datos);
  const porId = new Map(unidades.map((u) => [u.id, u]));
  const { filas, omitidas, totalEmitido } = generarExpensasParaUnidades(unidades, cfg, { periodoId: existente?.id ?? null, fechaVencimiento, excluirUnidadIds: yaGeneradas });
  const motivo = new Map(omitidas.map((o) => [o.unidadId, o.motivo]));

  return {
    periodo: { id: existente?.id ?? null, anio: cfg.anio, mes: cfg.mes, etiqueta: etiquetaPeriodo(cfg.anio, cfg.mes), estado: existente?.estado ?? null },
    modo: cfg.modo,
    bloque: cfg.categorias,
    fechaEmision: soloFecha(fechaEmision),
    fechaVencimiento: soloFecha(fechaVencimiento),
    yaGenerado: Boolean(existente),
    yaExistentes: yaGeneradas.size,
    cantidad: filas.length,
    totalEmitido,
    unidades: unidades
      .filter((u) => motivo.get(u.id) !== 'FUERA_DEL_BLOQUE')
      .map((u) => {
        const fila = filas.find((f) => f.unidadId === u.id);
        return {
          unidadId: u.id,
          departamento: etiquetaUnidad(u),
          codigo: u.codigo,
          tipo: u.tipo,
          categoria: u.categoria,
          piso: u.piso,
          coeficiente: u.coeficiente ? Number(u.coeficiente) : null,
          expensa: fila ? fila.monto : 0,
          estado: fila ? 'Pendiente' : (motivo.get(u.id) === 'YA_GENERADA' ? 'Ya generada' : 'Omitida'),
          yaGenerada: motivo.get(u.id) === 'YA_GENERADA',
        };
      }),
  };
}

/** Cierra un periodo: deja de admitir emisiones y ajustes de agua. Idempotente. */
async function cerrar(id) {
  const p = await prisma.periodo.findUnique({ where: { id } });
  if (!p) throw new HttpError(404, 'Periodo no encontrado');
  if (p.estado === 'CERRADO') return { periodo: p, yaEstabaCerrado: true };
  const periodo = await prisma.periodo.update({ where: { id }, data: { estado: 'CERRADO' } });
  return { periodo, yaEstabaCerrado: false };
}

function filaAgua(e) {
  const montoC = aCentavos(String(e.monto));
  const aguaC = aCentavos(String(e.montoAgua ?? 0));
  const extrasC = aCentavos(String(e.montoExtras ?? 0));
  return {
    expensaId: e.id,
    unidadId: e.unidadId,
    departamento: etiquetaUnidad(e.unidad),
    codigo: e.unidad.codigo,
    tipo: e.unidad.tipo,
    categoria: e.unidad.categoria,
    montoFijo: deCentavos(montoC - aguaC - extrasC),
    montoAgua: deCentavos(aguaC),
    montoExtras: deCentavos(extrasC),
    extras: Array.isArray(e.extras) ? e.extras.map((x) => ({ id: x.id, descripcion: x.descripcion, monto: Number(x.monto) })) : [],
    consumoM3: e.consumoM3 !== null && e.consumoM3 !== undefined ? Number(e.consumoM3) : null,
    montoTotal: deCentavos(montoC),
    saldoPendiente: deCentavos(aCentavos(String(e.saldoPendiente))),
    estado: e.estado,
    aguaRegistrada: aguaC > 0 || (e.consumoM3 !== null && e.consumoM3 !== undefined),
  };
}

/** Pantalla "Registrar montos de agua": una fila por unidad con expensa en el periodo, y totales. */
async function listarAgua(periodoId) {
  const periodo = await prisma.periodo.findUnique({ where: { id: periodoId } });
  if (!periodo) throw new HttpError(404, 'Periodo no encontrado');
  const expensas = await prisma.expensa.findMany({
    where: { periodoId },
    include: { unidad: UNIDAD, extras: { orderBy: { id: 'asc' } } },
    orderBy: [{ unidad: { categoria: 'asc' } }, { unidad: { codigo: 'asc' } }],
  });
  const filas = expensas.map(filaAgua);
  const suma = (k) => deCentavos(filas.reduce((a, f) => a + aCentavos(String(f[k])), 0));
  return {
    periodo: { id: periodo.id, anio: periodo.anio, mes: periodo.mes, etiqueta: etiquetaPeriodo(periodo.anio, periodo.mes), estado: periodo.estado },
    totales: {
      unidades: filas.length,
      conAgua: filas.filter((f) => f.aguaRegistrada).length,
      sinAgua: filas.filter((f) => !f.aguaRegistrada).length,
      totalFijo: suma('montoFijo'),
      totalAgua: suma('montoAgua'),
      totalExtras: suma('montoExtras'),
      totalMensual: suma('montoTotal'),
    },
    unidades: filas,
  };
}

/**
 * Registra (o corrige) el monto de agua de una unidad en el periodo: reemplaza el agua anterior,
 * recalcula monto total y saldo, y asienta la diferencia en contabilidad. Uno por uno (pizarra 22-oct).
 */
async function registrarAgua(periodoId, unidadId, datos = {}, usuarioId = null, hoy = null) {
  hoy = hoy || await fechaActual();
  const monto = Number(datos.monto ?? datos.montoAgua);
  if (!Number.isFinite(monto) || monto < 0) throw new HttpError(400, 'monto inválido (número ≥ 0)');
  let consumoM3 = null;
  if (datos.consumoM3 !== undefined && datos.consumoM3 !== null && datos.consumoM3 !== '') {
    consumoM3 = Number(datos.consumoM3);
    if (!Number.isFinite(consumoM3) || consumoM3 < 0) throw new HttpError(400, 'consumoM3 inválido (número ≥ 0)');
  }

  const periodo = await prisma.periodo.findUnique({ where: { id: periodoId } });
  if (!periodo) throw new HttpError(404, 'Periodo no encontrado');
  if (periodo.estado === 'CERRADO') throw new HttpError(409, `El periodo ${mmaaaa(periodo)} está cerrado`);

  const expensa = await prisma.expensa.findUnique({ where: { unidadId_periodoId: { unidadId, periodoId } }, include: { unidad: UNIDAD, extras: true } });
  if (!expensa) throw new HttpError(404, 'La unidad no tiene expensa en este periodo: genere primero el bloque correspondiente');

  const ajuste = calcularAjusteAgua({
    montoActual: String(expensa.monto),
    montoAguaActual: String(expensa.montoAgua ?? 0),
    saldoActual: String(expensa.saldoPendiente),
    montoAguaNuevo: monto,
  });
  const estado = determinarEstadoExpensa({ saldoPendiente: ajuste.saldoPendiente, monto: ajuste.monto, fechaVencimiento: expensa.fechaVencimiento, fechaCalculo: hoy });

  return prisma.$transaction(async (tx) => {
    const actualizada = await tx.expensa.update({
      where: { id: expensa.id },
      data: {
        montoAgua: D(ajuste.montoAgua),
        consumoM3: consumoM3 === null ? expensa.consumoM3 : D(consumoM3),
        monto: D(ajuste.monto),
        saldoPendiente: D(ajuste.saldoPendiente),
        estado,
      },
      include: { unidad: UNIDAD, extras: true },
    });

    let asientoId = null;
    if (ajuste.delta !== 0) {
      const abs = Math.abs(ajuste.delta);
      const sube = ajuste.delta > 0;
      const asiento = await asentar(tx, {
        fecha: hoy,
        glosa: `${sube ? 'Agua' : 'Ajuste de agua'} ${expensa.unidad.codigo} ${mmaaaa(periodo)}`,
        origenTipo: 'EMISION_EXPENSAS',
        origenId: periodo.id,
        lineas: sube
          ? [{ cuenta: CUENTAS.CUENTAS_POR_COBRAR, debe: abs, descripcion: 'Agua por cobrar' }, { cuenta: CUENTAS.INGRESOS_EXPENSAS, haber: abs, descripcion: 'Ingreso por agua' }]
          : [{ cuenta: CUENTAS.INGRESOS_EXPENSAS, debe: abs, descripcion: 'Reversión agua' }, { cuenta: CUENTAS.CUENTAS_POR_COBRAR, haber: abs, descripcion: 'Reversión agua por cobrar' }],
      }, usuarioId);
      asientoId = asiento.id;
    }

    return { ...filaAgua(actualizada), delta: ajuste.delta, asientoId, periodo: { id: periodo.id, etiqueta: etiquetaPeriodo(periodo.anio, periodo.mes) } };
  });
}

// ---------------------------------------------------------------------------
// Cargos adicionales con descripción (critico 2.2) y listado por tipo de departamento (critico 2.3)
// ---------------------------------------------------------------------------

/** Agrega un cargo extra con descripción a la expensa de una unidad en el periodo (p. ej. "Extra pintura edificio", 250). */
async function registrarExtra(periodoId, unidadId, datos = {}, usuarioId = null, hoy = null) {
  hoy = hoy || await fechaActual();
  const descripcion = String(datos.descripcion ?? '').trim();
  const monto = Number(datos.monto);
  if (!descripcion || descripcion.length > 150) throw new HttpError(400, 'descripcion obligatoria (1-150 caracteres)');
  if (!Number.isFinite(monto) || monto <= 0) throw new HttpError(400, 'monto inválido (número > 0)');

  const periodo = await prisma.periodo.findUnique({ where: { id: periodoId } });
  if (!periodo) throw new HttpError(404, 'Periodo no encontrado');
  if (periodo.estado === 'CERRADO') throw new HttpError(409, `El periodo ${mmaaaa(periodo)} está cerrado`);
  const expensa = await prisma.expensa.findUnique({ where: { unidadId_periodoId: { unidadId, periodoId } }, include: { unidad: UNIDAD } });
  if (!expensa) throw new HttpError(404, 'La unidad no tiene expensa en este periodo: genere primero el bloque correspondiente');

  const ajuste = aplicarDeltaCargo({ montoActual: String(expensa.monto), montoExtrasActual: String(expensa.montoExtras ?? 0), saldoActual: String(expensa.saldoPendiente), delta: monto });
  const estado = determinarEstadoExpensa({ saldoPendiente: ajuste.saldoPendiente, monto: ajuste.monto, fechaVencimiento: expensa.fechaVencimiento, fechaCalculo: hoy });

  return prisma.$transaction(async (tx) => {
    const extra = await tx.expensaExtra.create({ data: { expensaId: expensa.id, descripcion, monto: D(ajuste.delta) } });
    const actualizada = await tx.expensa.update({
      where: { id: expensa.id },
      data: { montoExtras: D(ajuste.montoExtras), monto: D(ajuste.monto), saldoPendiente: D(ajuste.saldoPendiente), estado },
      include: { unidad: UNIDAD, extras: { orderBy: { id: 'asc' } } },
    });
    const asiento = await asentar(tx, {
      fecha: hoy, glosa: `${descripcion} ${expensa.unidad.codigo} ${mmaaaa(periodo)}`, origenTipo: 'EMISION_EXPENSAS', origenId: periodo.id,
      lineas: [
        { cuenta: CUENTAS.CUENTAS_POR_COBRAR, debe: ajuste.delta, descripcion: 'Cargo adicional por cobrar' },
        { cuenta: CUENTAS.INGRESOS_EXPENSAS, haber: ajuste.delta, descripcion: descripcion },
      ],
    }, usuarioId);
    return { ...filaAgua(actualizada), extra: { id: extra.id, descripcion, monto: ajuste.delta }, asientoId: asiento.id, periodo: { id: periodo.id, etiqueta: etiquetaPeriodo(periodo.anio, periodo.mes) } };
  });
}

/** Quita un cargo extra (reversa monto, saldo y asiento). */
async function eliminarExtra(periodoId, extraId, usuarioId = null, hoy = null) {
  hoy = hoy || await fechaActual();
  const extra = await prisma.expensaExtra.findUnique({ where: { id: extraId }, include: { expensa: { include: { unidad: UNIDAD, periodo: true } } } });
  if (!extra || extra.expensa.periodoId !== periodoId) throw new HttpError(404, 'Cargo extra no encontrado en este periodo');
  if (extra.expensa.periodo.estado === 'CERRADO') throw new HttpError(409, `El periodo ${mmaaaa(extra.expensa.periodo)} está cerrado`);
  const e = extra.expensa;
  const ajuste = aplicarDeltaCargo({ montoActual: String(e.monto), montoExtrasActual: String(e.montoExtras ?? 0), saldoActual: String(e.saldoPendiente), delta: -Number(extra.monto) });
  const estado = determinarEstadoExpensa({ saldoPendiente: ajuste.saldoPendiente, monto: ajuste.monto, fechaVencimiento: e.fechaVencimiento, fechaCalculo: hoy });
  return prisma.$transaction(async (tx) => {
    await tx.expensaExtra.delete({ where: { id: extraId } });
    const actualizada = await tx.expensa.update({
      where: { id: e.id },
      data: { montoExtras: D(ajuste.montoExtras), monto: D(ajuste.monto), saldoPendiente: D(ajuste.saldoPendiente), estado },
      include: { unidad: UNIDAD, extras: { orderBy: { id: 'asc' } } },
    });
    const monto = Number(extra.monto);
    const asiento = await asentar(tx, {
      fecha: hoy, glosa: `Reversión ${extra.descripcion} ${e.unidad.codigo} ${mmaaaa(e.periodo)}`, origenTipo: 'EMISION_EXPENSAS', origenId: e.periodoId,
      lineas: [
        { cuenta: CUENTAS.INGRESOS_EXPENSAS, debe: monto, descripcion: 'Reversión cargo adicional' },
        { cuenta: CUENTAS.CUENTAS_POR_COBRAR, haber: monto, descripcion: 'Reversión por cobrar' },
      ],
    }, usuarioId);
    return { ...filaAgua(actualizada), extraEliminado: { id: extraId, descripcion: extra.descripcion, monto }, asientoId: asiento.id };
  });
}

/**
 * Listado por tipo de departamento de los montos del mes (critico 2.3):
 * Tipo Dpto · Dpto · Expensa · Agua · Extras (con descripción) · Total · Pagado · Saldo, con subtotales por tipo.
 */
async function listarCargos(periodoId, { categoria } = {}) {
  const periodo = await prisma.periodo.findUnique({ where: { id: periodoId } });
  if (!periodo) throw new HttpError(404, 'Periodo no encontrado');
  const expensas = await prisma.expensa.findMany({
    where: { periodoId, ...(categoria ? { unidad: { categoria: String(categoria).toUpperCase() } } : {}) },
    include: { unidad: UNIDAD, extras: { orderBy: { id: 'asc' } } },
    orderBy: [{ unidad: { categoria: 'asc' } }, { unidad: { codigo: 'asc' } }],
  });
  const filas = expensas.map((e) => {
    const f = filaAgua(e);
    return {
      tipoDpto: f.categoria ?? (f.tipo === 'DEPARTAMENTO' ? '-' : f.tipo),
      categoria: f.categoria,
      tipo: f.tipo,
      dpto: f.departamento,
      codigo: f.codigo,
      unidadId: f.unidadId,
      expensaId: f.expensaId,
      expensa: f.montoFijo,
      agua: f.montoAgua,
      consumoM3: f.consumoM3,
      extras: f.extras,
      totalExtras: f.montoExtras,
      total: f.montoTotal,
      pagado: deCentavos(aCentavos(String(f.montoTotal)) - aCentavos(String(f.saldoPendiente))),
      saldo: f.saldoPendiente,
      estado: f.estado,
      estadoUI: ESTADO_UI[f.estado] ?? f.estado,
    };
  });
  const { grupos, totales } = agruparCargosPorTipo(filas);
  return {
    periodo: { id: periodo.id, anio: periodo.anio, mes: periodo.mes, etiqueta: etiquetaPeriodo(periodo.anio, periodo.mes), estado: periodo.estado, fechaVencimiento: soloFecha(periodo.fechaVencimiento) },
    columnas: ['Tipo Dpto', 'Dpto', 'Expensa', 'Agua', 'Extras', 'Total', 'Pagado', 'Saldo'],
    totales,
    grupos,
    filas,
  };
}

// ---------------------------------------------------------------------------
// Anticipos de copropietarios aplicados a los cargos del mes (critico 5.1)
// ---------------------------------------------------------------------------

/** Aplica el saldo a favor DISPONIBLE de cada unidad a sus expensas con saldo del periodo. Devuelve el detalle. */
async function aplicarAnticiposEnTx(tx, periodo, unidadIds = null, usuarioId = null) {
  const anticipos = await tx.anticipo.findMany({
    where: { estado: 'DISPONIBLE', saldoDisponible: { gt: 0 }, ...(unidadIds ? { unidadId: { in: unidadIds } } : {}) },
    include: { unidad: UNIDAD },
    orderBy: [{ unidadId: 'asc' }, { creadoEn: 'asc' }],
  });
  if (anticipos.length === 0) return { aplicaciones: [], total: 0 };
  const aplicaciones = [];
  let totalC = 0;
  for (const a of anticipos) {
    const expensa = await tx.expensa.findUnique({ where: { unidadId_periodoId: { unidadId: a.unidadId, periodoId: periodo.id } } });
    if (!expensa) continue;
    const saldoC = aCentavos(String(expensa.saldoPendiente));
    const dispC = aCentavos(String(a.saldoDisponible));
    const aplicaC = Math.min(saldoC, dispC);
    if (aplicaC <= 0) continue;
    const nuevoSaldoC = saldoC - aplicaC;
    const nuevoDispC = dispC - aplicaC;
    await tx.expensa.update({ where: { id: expensa.id }, data: { saldoPendiente: D(deCentavos(nuevoSaldoC)), estado: nuevoSaldoC === 0 ? 'PAGADA' : 'PARCIAL' } });
    await tx.anticipo.update({ where: { id: a.id }, data: { saldoDisponible: D(deCentavos(nuevoDispC)), estado: nuevoDispC === 0 ? 'APLICADO' : 'DISPONIBLE' } });
    await tx.pagoDetalle.create({ data: { pagoId: a.pagoId, expensaId: expensa.id, montoAplicado: D(deCentavos(aplicaC)), aplicadoA: 'CAPITAL' } });
    totalC += aplicaC;
    aplicaciones.push({ unidadId: a.unidadId, departamento: etiquetaUnidad(a.unidad), anticipoId: a.id, expensaId: expensa.id, aplicado: deCentavos(aplicaC), saldoExpensa: deCentavos(nuevoSaldoC), saldoAFavorRestante: deCentavos(nuevoDispC) });
  }
  if (totalC > 0) {
    const asiento = await asentar(tx, {
      fecha: periodo.fechaEmision, glosa: `Aplicación de anticipos de copropietarios ${mmaaaa(periodo)} (${aplicaciones.length} unidades)`, origenTipo: 'AJUSTE', origenId: periodo.id,
      lineas: [
        { cuenta: CUENTAS.ANTICIPOS_COPROPIETARIOS, debe: deCentavos(totalC), descripcion: 'Anticipos aplicados' },
        { cuenta: CUENTAS.CUENTAS_POR_COBRAR, haber: deCentavos(totalC), descripcion: 'Expensas cubiertas con saldo a favor' },
      ],
    }, usuarioId);
    return { aplicaciones, total: deCentavos(totalC), asientoId: asiento.id };
  }
  return { aplicaciones, total: 0 };
}

/** Reaplica anticipos disponibles a un periodo (p. ej. tras agregar agua o extras). Idempotente. */
async function aplicarAnticipos(periodoId, usuarioId = null) {
  const periodo = await prisma.periodo.findUnique({ where: { id: periodoId } });
  if (!periodo) throw new HttpError(404, 'Periodo no encontrado');
  return prisma.$transaction(async (tx) => {
    const r = await aplicarAnticiposEnTx(tx, periodo, null, usuarioId);
    return { periodo: { id: periodo.id, etiqueta: etiquetaPeriodo(periodo.anio, periodo.mes) }, ...r };
  });
}

module.exports = { listar, crear, vistaPrevia, cerrar, listarAgua, registrarAgua, registrarExtra, eliminarExtra, listarCargos, aplicarAnticipos };
