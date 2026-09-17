const service = require('../services/cuentas.service');
const { idValido } = require('./expensas.controller');

async function listar(req, res, next) {
  try {
    const data = await service.listar();
    res.json({ ok: true, total: data.length, data });
  } catch (err) { next(err); }
}

async function movimientos(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: 'El id debe ser un entero positivo' });
    const data = await service.movimientos(id);
    if (!data) return res.status(404).json({ ok: false, error: 'Cuenta no encontrada' });
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}

module.exports = { listar, movimientos };
