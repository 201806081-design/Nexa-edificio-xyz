const service = require('../services/ingresosEgresos.service');

async function categorias(req, res, next) {
  try {
    const data = await service.listarCategorias(req.query.tipo);
    res.json({ ok: true, total: data.length, data });
  } catch (err) { next(err); }
}

async function listarIngresos(req, res, next) {
  try {
    const data = await service.listarIngresos(req.query);
    res.json({ ok: true, total: data.length, data });
  } catch (err) { next(err); }
}

async function listarEgresos(req, res, next) {
  try {
    const data = await service.listarEgresos(req.query);
    res.json({ ok: true, total: data.length, data });
  } catch (err) { next(err); }
}

async function registrarIngreso(req, res, next) {
  try {
    const data = await service.registrarIngreso(req.body || {}, req.user.id);
    res.status(201).json({ ok: true, mensaje: 'Ingreso registrado', data });
  } catch (err) { next(err); }
}

async function registrarEgreso(req, res, next) {
  try {
    const data = await service.registrarEgreso(req.body || {}, req.user.id);
    res.status(201).json({ ok: true, mensaje: 'Egreso registrado', data });
  } catch (err) { next(err); }
}

module.exports = { categorias, listarIngresos, listarEgresos, registrarIngreso, registrarEgreso };
