const service = require('../services/vistas.service');

function idValido(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function estadoCuenta(req, res, next) {
  try {
    const id = idValido(req.params.unidadId);
    if (!id) return res.status(400).json({ ok: false, error: 'unidadId debe ser un entero positivo' });
    const data = await service.estadoCuenta(id, req.query);
    if (!data) return res.status(404).json({ ok: false, error: 'Unidad no encontrada' });
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}

async function unidadesSelector(req, res, next) {
  try {
    const data = await service.unidadesSelector();
    res.json({ ok: true, total: data.length, data });
  } catch (err) { next(err); }
}

async function movimientos(req, res, next) {
  try {
    const data = await service.movimientos(req.query);
    res.json({ ok: true, total: data.data.length, ...data });
  } catch (err) { next(err); }
}

module.exports = { estadoCuenta, unidadesSelector, movimientos };
