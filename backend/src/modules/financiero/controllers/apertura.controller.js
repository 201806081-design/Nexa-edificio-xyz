const service = require('../services/apertura.service');

async function estado(req, res, next) {
  try { res.json({ ok: true, data: await service.estado() }); } catch (e) { next(e); }
}

async function registrar(req, res, next) {
  try {
    const data = await service.registrar(req.user?.id ?? null);
    res.status(201).json({ ok: true, mensaje: `Asiento de apertura registrado por Bs ${data.total} con fecha ${data.fecha}`, data });
  } catch (e) { next(e); }
}

module.exports = { estado, registrar };
