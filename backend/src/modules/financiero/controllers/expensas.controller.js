const service = require('../services/expensas.service');

function idValido(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function listar(req, res, next) {
  try {
    const data = await service.listar(req.query);
    res.json({ ok: true, total: data.length, data });
  } catch (err) { next(err); }
}

async function resumen(req, res, next) {
  try {
    res.json({ ok: true, data: await service.resumen() });
  } catch (err) { next(err); }
}

async function obtenerPorId(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: 'El id debe ser un entero positivo' });
    const data = await service.obtenerPorId(id);
    if (!data) return res.status(404).json({ ok: false, error: 'Expensa no encontrada' });
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}

module.exports = { listar, resumen, obtenerPorId, idValido };
