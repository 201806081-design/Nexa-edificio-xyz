const service = require('./nomina.service');

function idValido(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}
const badId = (res) => res.status(400).json({ ok: false, error: 'El id debe ser un entero positivo' });

async function empleados(req, res, next) {
  try { const data = await service.listarEmpleados(req.query); res.json({ ok: true, total: data.length, data }); } catch (e) { next(e); }
}
async function historial(req, res, next) {
  try {
    const id = idValido(req.params.id); if (!id) return badId(res);
    const data = await service.historialEmpleado(id, req.query);
    if (!data) return res.status(404).json({ ok: false, error: 'Empleado no encontrado' });
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}
async function anticipos(req, res, next) {
  try { const data = await service.listarAnticipos(req.query); res.json({ ok: true, total: data.length, data }); } catch (e) { next(e); }
}
async function registrarAnticipo(req, res, next) {
  try {
    const data = await service.registrarAnticipo(req.body || {}, req.user?.id ?? null);
    res.status(201).json({ ok: true, mensaje: `Anticipo de Bs ${data.monto} a ${data.empleado} registrado`, data });
  } catch (e) { next(e); }
}
async function planillas(req, res, next) {
  try { const r = await service.listarPlanillas(req.query); res.json({ ok: true, total: r.data.length, resumen: r.resumen, data: r.data }); } catch (e) { next(e); }
}
async function planilla(req, res, next) {
  try {
    const id = idValido(req.params.id); if (!id) return badId(res);
    const data = await service.planillaPorId(id);
    if (!data) return res.status(404).json({ ok: false, error: 'Planilla no encontrada' });
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}
async function crearPlanilla(req, res, next) {
  try {
    const data = await service.crearPlanilla(req.body || {}, req.user?.id ?? null);
    res.status(201).json({ ok: true, mensaje: `Planilla ${data.periodo} de ${data.empleado}: neto Bs ${data.neto} (borrador)`, data });
  } catch (e) { next(e); }
}
async function generarPlanillas(req, res, next) {
  try {
    const data = await service.generarPlanillas(req.body || {}, req.user?.id ?? null);
    res.status(201).json({ ok: true, mensaje: `${data.generadas} planillas de ${data.periodo} generadas en borrador (${data.yaExistentes} ya existían)`, data });
  } catch (e) { next(e); }
}
async function actualizarPlanilla(req, res, next) {
  try {
    const id = idValido(req.params.id); if (!id) return badId(res);
    const data = await service.actualizarPlanilla(id, req.body || {}, req.user?.id ?? null);
    res.json({ ok: true, mensaje: `Planilla ${data.periodo} de ${data.empleado}: neto Bs ${data.neto}`, data });
  } catch (e) { next(e); }
}
async function pagarPlanilla(req, res, next) {
  try {
    const id = idValido(req.params.id); if (!id) return badId(res);
    const data = await service.pagarPlanilla(id, req.body || {}, req.user?.id ?? null);
    res.json({ ok: true, mensaje: `Planilla ${data.periodo} de ${data.empleado} pagada: Bs ${data.neto} desde ${data.cuenta}`, data });
  } catch (e) { next(e); }
}
async function eliminarPlanilla(req, res, next) {
  try {
    const id = idValido(req.params.id); if (!id) return badId(res);
    res.json({ ok: true, mensaje: 'Planilla en borrador eliminada', data: await service.eliminarPlanilla(id) });
  } catch (e) { next(e); }
}

module.exports = { empleados, historial, anticipos, registrarAnticipo, planillas, planilla, crearPlanilla, generarPlanillas, actualizarPlanilla, pagarPlanilla, eliminarPlanilla };
