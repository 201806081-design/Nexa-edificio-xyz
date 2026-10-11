const service = require('../services/mora.service');

function idValido(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function resumen(req, res, next) {
  try {
    res.json({ ok: true, data: await service.resumen() });
  } catch (err) { next(err); }
}

async function anticipos(req, res, next) {
  try {
    const data = await service.listarAnticipos(req.query);
    res.json({ ok: true, total: data.length, data });
  } catch (err) { next(err); }
}

async function anticipoPorId(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: 'El id debe ser un entero positivo' });
    const data = await service.anticipoPorId(id);
    if (!data) return res.status(404).json({ ok: false, error: 'Anticipo no encontrado' });
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}

module.exports = { resumen, anticipos, anticipoPorId };
