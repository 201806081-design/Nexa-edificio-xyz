const service = require('../services/configuracion.service');

async function obtener(req, res, next) {
  try {
    const data = await service.actual();
    res.json({ ok: true, configurada: Boolean(data), data });
  } catch (err) { next(err); }
}

async function historial(req, res, next) {
  try {
    const data = await service.historial();
    res.json({ ok: true, total: data.length, data });
  } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
  try {
    const data = await service.actualizar(req.body || {}, req.user?.id ?? null);
    res.json({ ok: true, mensaje: 'Configuración de mora guardada', data });
  } catch (err) { next(err); }
}

/** Fecha con la que trabaja el sistema (real o simulada). */
async function fechaSistema(req, res, next) {
  try { res.json({ ok: true, data: await service.estadoFechaSistema() }); } catch (err) { next(err); }
}

/** Fija la fecha del sistema para simular cobros antes / en / después del vencimiento. */
async function fijarFechaSistema(req, res, next) {
  try {
    const data = await service.establecerFechaSistema(req.body?.fecha);
    res.json({ ok: true, mensaje: `Fecha del sistema fijada en ${data.fechaActual}`, data });
  } catch (err) { next(err); }
}

async function restaurarFechaSistema(req, res, next) {
  try {
    const data = await service.limpiarFechaSistema();
    res.json({ ok: true, mensaje: 'Fecha del sistema restaurada a la fecha real', data });
  } catch (err) { next(err); }
}

module.exports = { obtener, historial, actualizar, fechaSistema, fijarFechaSistema, restaurarFechaSistema };
