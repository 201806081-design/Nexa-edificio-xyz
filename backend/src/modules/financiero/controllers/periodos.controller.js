const service = require('../services/periodos.service');

function idValido(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function listar(req, res, next) {
  try {
    const data = await service.listar();
    res.json({ ok: true, total: data.length, data });
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try {
    const data = await service.crear(req.body || {}, req.user.id);
    res.status(201).json({ ok: true, mensaje: `Periodo ${data.periodo.mes}/${data.periodo.anio} generado con ${data.expensasGeneradas} expensas`, data });
  } catch (err) { next(err); }
}

/** Paso 2 del asistente: vista previa sin escribir en la base. */
async function vistaPrevia(req, res, next) {
  try {
    res.json({ ok: true, data: await service.vistaPrevia(req.body || {}) });
  } catch (err) { next(err); }
}

async function cerrar(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: 'El id debe ser un entero positivo' });
    const data = await service.cerrar(id);
    res.json({ ok: true, mensaje: data.yaEstabaCerrado ? 'El periodo ya estaba cerrado' : 'Periodo cerrado', data: data.periodo });
  } catch (err) { next(err); }
}

module.exports = { listar, crear, vistaPrevia, cerrar };
