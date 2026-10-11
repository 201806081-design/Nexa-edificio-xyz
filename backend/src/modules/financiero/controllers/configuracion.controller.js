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

module.exports = { obtener, historial, actualizar };
