const service = require('../services/pagos.service');
const { idValido } = require('./expensas.controller');

async function listar(req, res, next) {
  try {
    const data = await service.listar(req.query);
    res.json({ ok: true, total: data.length, data });
  } catch (err) { next(err); }
}

async function obtenerPorId(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: 'El id debe ser un entero positivo' });
    const data = await service.obtenerPorId(id);
    if (!data) return res.status(404).json({ ok: false, error: 'Pago no encontrado' });
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}

async function registrar(req, res, next) {
  try {
    const data = await service.registrar(req.body || {}, req.user.id);
    res.status(201).json({ ok: true, mensaje: `Pago de Bs ${data.pago.monto.toFixed(2)} registrado para ${data.pago.unidad}`, data });
  } catch (err) { next(err); }
}

module.exports = { listar, obtenerPorId, registrar };
