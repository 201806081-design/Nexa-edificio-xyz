// "Fecha actual" del sistema: la real, o una simulada guardada en parametro_sistema (clave fecha_actual).
// Permite probar cobros antes, en y después del vencimiento (critico 4.1-4.3 del docente).
const prisma = require('../config/prisma');
const { HttpError } = require('./errors');

const CLAVE = 'fecha_actual';
let cache = { valor: undefined, leidoEn: 0 };
const TTL_MS = 2000;

function inicioDiaUTC(d) {
  const x = new Date(d);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
}

async function leerSimulada() {
  if (Date.now() - cache.leidoEn < TTL_MS) return cache.valor;
  const fila = await prisma.parametroSistema.findUnique({ where: { clave: CLAVE } }).catch(() => null);
  cache = { valor: fila ? fila.valor : null, leidoEn: Date.now() };
  return cache.valor;
}

/** Fecha con la que trabaja el sistema: la simulada (a las 12:00 UTC) si existe, si no la real. */
async function fechaActual() {
  const sim = await leerSimulada();
  if (sim) { const d = inicioDiaUTC(sim); d.setUTCHours(12); return d; }
  return new Date();
}

async function estadoFechaSistema() {
  const sim = await leerSimulada();
  const actual = await fechaActual();
  return { simulada: Boolean(sim), fechaSimulada: sim || null, fechaReal: new Date().toISOString().slice(0, 10), fechaActual: actual.toISOString().slice(0, 10) };
}

async function establecerFechaSistema(valor) {
  const d = new Date(String(valor ?? ''));
  if (!valor || Number.isNaN(d.getTime())) throw new HttpError(400, 'fecha inválida: use YYYY-MM-DD');
  const iso = inicioDiaUTC(d).toISOString().slice(0, 10);
  await prisma.parametroSistema.upsert({ where: { clave: CLAVE }, update: { valor: iso }, create: { clave: CLAVE, valor: iso } });
  cache = { valor: iso, leidoEn: Date.now() };
  return estadoFechaSistema();
}

async function limpiarFechaSistema() {
  await prisma.parametroSistema.deleteMany({ where: { clave: CLAVE } });
  cache = { valor: null, leidoEn: Date.now() };
  return estadoFechaSistema();
}

module.exports = { fechaActual, estadoFechaSistema, establecerFechaSistema, limpiarFechaSistema, inicioDiaUTC };
