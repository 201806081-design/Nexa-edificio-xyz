const service = require('../services/contabilidad.service');
const { idValido } = require('./expensas.controller');

async function planCuentas(req, res, next) {
  try {
    const data = await service.planCuentas({ soloImputables: req.query.imputables === 'true' });
    res.json({ ok: true, total: data.length, data });
  } catch (err) { next(err); }
}

async function asientos(req, res, next) {
  try {
    const data = await service.listarAsientos(req.query);
    res.json({ ok: true, total: data.length, data });
  } catch (err) { next(err); }
}

async function asientoPorId(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: 'El id debe ser un entero positivo' });
    const data = await service.asientoPorId(id);
    if (!data) return res.status(404).json({ ok: false, error: 'Asiento no encontrado' });
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}

async function balanceComprobacion(req, res, next) {
  try {
    res.json({ ok: true, data: await service.balanceComprobacion(req.query) });
  } catch (err) { next(err); }
}

module.exports = { planCuentas, asientos, asientoPorId, balanceComprobacion };
