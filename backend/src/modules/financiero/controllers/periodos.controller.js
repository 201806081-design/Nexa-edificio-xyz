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

/** Genera el periodo completo o un bloque (categorias: ['A']). Si el periodo existe, agrega las unidades que faltan. */
async function crear(req, res, next) {
  try {
    const data = await service.crear(req.body || {}, req.user.id);
    const bloque = data.bloque ? ` (bloque ${data.bloque.join('/')})` : '';
    res.status(201).json({
      ok: true,
      mensaje: `Periodo ${data.periodo.etiqueta}${bloque}: ${data.expensasGeneradas} expensas generadas, ${data.acumulado}/${data.unidadesActivas} unidades con expensa`,
      data,
    });
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

async function listarAgua(req, res, next) {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: 'El id debe ser un entero positivo' });
    res.json({ ok: true, data: await service.listarAgua(id) });
  } catch (err) { next(err); }
}

/** Registra el monto de agua de UNA unidad en el periodo (uno por uno, como pidió el docente). */
async function registrarAgua(req, res, next) {
  try {
    const id = idValido(req.params.id);
    const unidadId = idValido(req.params.unidadId);
    if (!id || !unidadId) return res.status(400).json({ ok: false, error: 'id y unidadId deben ser enteros positivos' });
    const data = await service.registrarAgua(id, unidadId, req.body || {}, req.user?.id ?? null);
    res.json({ ok: true, mensaje: `Agua de ${data.departamento}: Bs ${data.montoAgua} (total mensual Bs ${data.montoTotal})`, data });
  } catch (err) { next(err); }
}

module.exports = { listar, crear, vistaPrevia, cerrar, listarAgua, registrarAgua };
