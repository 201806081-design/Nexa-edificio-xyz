const service = require('../services/periodos.service');

async function listar(req, res, next) {
  try {
    const data = await service.listar();
    res.json({ ok: true, total: data.length, data });
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try {
    const data = await service.crear(req.body || {});
    res.status(201).json({ ok: true, mensaje: `Periodo ${data.periodo.mes}/${data.periodo.anio} generado con ${data.expensasGeneradas} expensas`, data });
  } catch (err) { next(err); }
}

module.exports = { listar, crear };
