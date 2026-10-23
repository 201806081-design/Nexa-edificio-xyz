// Generación automática de expensas mensuales (requisito 2 · HU-FI-01 / US2.1).
// Sprint 2: generación EN BLOQUES por categoría de departamento y registro de AGUA por unidad (pizarra 22-oct).
const { Prisma } = require('@prisma/client');
const prisma = require('../../../config/prisma');
const { HttpError } = require('../../../shared/errors');
const { configMoraVigente } = require('./configuracion.service');
const {
  validarDatosPeriodo, calcularFechasPeriodo, generarExpensasParaUnidades, calcularAjusteAgua,
} = require('../utils/periodos.utils');
const { aCentavos, deCentavos, determinarEstadoExpensa } = require('../utils/expensas.utils');
const { CUENTAS } = require('../utils/contabilidad.utils');
const { asentar } = require('./contabilidad.service');
const { etiquetaPeriodo, etiquetaUnidad, soloFecha } = require('../utils/expensasVista.utils');

const D = (v) => new Prisma.Decimal(v);
const UNIDAD = { select: { id: true, codigo: true, tipo: true, piso: true, categoria: true } };
const mmaaaa = (p) => `${String(p.mes).padStart(2, '0')}/${p.anio}`;

async function listar() {
  const periodos = await prisma.periodo.findMany({
    include: { _count: { select: { expensas: true } } },
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
  });
  const [sumas, activas] = await Promise.all([
    prisma.expensa.groupBy({ by: ['periodoId'], _sum: { monto: true, saldoPendiente: true, montoAgua: true } }),
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
    saldoPendiente: porPeriodo.get(p.id)?.saldoPendiente ?? 0,
    _count: undefined,
  }));
}

async function contextoGeneracion(datos) {
  const cfg = validarDatosPeriodo(datos);
  const { fechaEmision } = calcularFechasPeriodo({ anio: cfg.anio, mes: cfg.mes });
  const configMora = await configMoraVigente(fechaEmision);
  const diaVencimiento = cfg.diaVencimiento ?? configMora?.diaVencimiento ?? 10;
  const { fechaVencimiento } = calcularFechasPeriodo({ anio: cfg.anio, mes: cfg.mes, diaVencimiento });

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

    return {
      periodo: { ...periodo, etiqueta: etiquetaPeriodo(periodo.anio, periodo.mes) },
      periodoNuevo: !existente,
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
  return {
    expensaId: e.id,
    unidadId: e.unidadId,
    departamento: etiquetaUnidad(e.unidad),
    codigo: e.unidad.codigo,
    tipo: e.unidad.tipo,
    categoria: e.unidad.categoria,
    montoFijo: deCentavos(montoC - aguaC),
    montoAgua: deCentavos(aguaC),
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
    include: { unidad: UNIDAD },
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
      totalMensual: suma('montoTotal'),
    },
    unidades: filas,
  };
}

/**
 * Registra (o corrige) el monto de agua de una unidad en el periodo: reemplaza el agua anterior,
 * recalcula monto total y saldo, y asienta la diferencia en contabilidad. Uno por uno (pizarra 22-oct).
 */
async function registrarAgua(periodoId, unidadId, datos = {}, usuarioId = null, hoy = new Date()) {
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

  const expensa = await prisma.expensa.findUnique({ where: { unidadId_periodoId: { unidadId, periodoId } }, include: { unidad: UNIDAD } });
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
      include: { unidad: UNIDAD },
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

module.exports = { listar, crear, vistaPrevia, cerrar, listarAgua, registrarAgua };
