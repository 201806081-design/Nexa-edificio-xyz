const service = require('../services/dashboard.service');

async function dashboard(req, res, next) {
  try {
    res.json({ ok: true, data: await service.dashboard() });
  } catch (err) { next(err); }
}

async function morosos(req, res, next) {
  try {
    const minDias = req.query.minDias === undefined ? 1 : Number(req.query.minDias);
    if (!Number.isInteger(minDias) || minDias < 0) {
      return res.status(400).json({ ok: false, error: 'minDias debe ser un entero mayor o igual a 0' });
    }
    res.json({ ok: true, data: await service.morosos({ minDias }) });
  } catch (err) { next(err); }
}

async function finanzas(req, res, next) {
  try {
    const { periodo } = req.query;
    if (periodo !== undefined && !/^\d{4}-(0[1-9]|1[0-2])$/.test(String(periodo))) {
      return res.status(400).json({ ok: false, error: 'periodo debe tener el formato YYYY-MM' });
    }
    res.json({ ok: true, data: await service.finanzas({ periodo }) });
  } catch (err) { next(err); }
}

module.exports = { dashboard, morosos, finanzas };
