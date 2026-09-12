// Estado de cuenta por unidad: relación unidad ↔ copropietario ↔ expensas ↔ pagos
const prisma = require('../../../config/prisma');
const { configMoraVigente } = require('./configuracion.service');
const { resumirEstadoCuenta } = require('../utils/estadoCuenta.utils');

async function listar() {
  return prisma.unidad.findMany({
    include: {
      ocupaciones: {
        where: { fechaFin: null },
        include: { copropietario: { select: { id: true, nombres: true, apellidos: true, tipo: true } } },
      },
    },
    orderBy: { codigo: 'asc' },
  });
}

async function estadoCuenta(unidadId, hoy = new Date()) {
  const unidad = await prisma.unidad.findUnique({
    where: { id: unidadId },
    include: {
      ocupaciones: {
        where: { fechaFin: null },
        include: { copropietario: true },
        orderBy: { fechaInicio: 'desc' },
      },
    },
  });
  if (!unidad) return null;

  const [expensas, pagos, anticipos, configMora] = await Promise.all([
    prisma.expensa.findMany({
      where: { unidadId },
      include: { periodo: { select: { anio: true, mes: true } } },
      orderBy: [{ periodo: { anio: 'desc' } }, { periodo: { mes: 'desc' } }],
    }),
    prisma.pago.findMany({
      where: { unidadId, anulado: false },
      include: {
        cuenta: { select: { nombre: true, tipo: true } },
        detalles: { select: { expensaId: true, montoAplicado: true, aplicadoA: true } },
      },
      orderBy: { fecha: 'desc' },
    }),
    prisma.anticipo.findMany({ where: { unidadId, estado: 'DISPONIBLE' } }),
    configMoraVigente(hoy),
  ]);

  const responsable = unidad.ocupaciones.find((o) => o.esResponsablePago)?.copropietario
    ?? unidad.ocupaciones[0]?.copropietario ?? null;

  const resumen = resumirEstadoCuenta({ expensas, anticipos, configMora: configMora ?? undefined, hoy });

  return {
    unidad: { id: unidad.id, codigo: unidad.codigo, tipo: unidad.tipo, piso: unidad.piso, coeficiente: unidad.coeficiente },
    responsable: responsable
      ? { id: responsable.id, nombre: `${responsable.nombres} ${responsable.apellidos}`, tipo: responsable.tipo, telefono: responsable.telefono, email: responsable.email }
      : null,
    ocupantes: unidad.ocupaciones.map((o) => ({ copropietarioId: o.copropietarioId, nombre: `${o.copropietario.nombres} ${o.copropietario.apellidos}`, tipo: o.copropietario.tipo, desde: o.fechaInicio, responsablePago: o.esResponsablePago })),
    configuracionMora: configMora ? { tasaMensual: configMora.tasaMensual, diasGracia: configMora.diasGracia, metodo: configMora.metodo } : null,
    resumen: resumen.totales,
    expensas: resumen.expensas,
    pagos,
    generadoEn: hoy,
  };
}

module.exports = { listar, estadoCuenta };
