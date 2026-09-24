// Validación pura de ingresos extraordinarios y egresos (req. 3)
const { HttpError } = require('../../../shared/errors');
const { aCentavos, deCentavos } = require('./expensas.utils');

function validarDatosMovimientoManual(datos = {}, tipo) {
  const categoriaId = Number(datos.categoriaId);
  if (!Number.isInteger(categoriaId) || categoriaId <= 0) throw new HttpError(400, 'categoriaId es obligatorio');
  const cuentaId = Number(datos.cuentaId);
  if (!Number.isInteger(cuentaId) || cuentaId <= 0) throw new HttpError(400, 'cuentaId (caja o banco) es obligatorio');
  const monto = Number(datos.monto);
  if (!Number.isFinite(monto) || monto <= 0) throw new HttpError(400, 'monto debe ser mayor a cero');
  const descripcion = String(datos.descripcion || '').trim();
  if (descripcion.length < 3) throw new HttpError(400, 'descripcion es obligatoria (mínimo 3 caracteres)');
  const fecha = datos.fecha ? new Date(datos.fecha) : new Date();
  if (Number.isNaN(fecha.getTime())) throw new HttpError(400, 'fecha inválida');

  const base = {
    categoriaId,
    cuentaId,
    monto: deCentavos(aCentavos(monto)),
    descripcion,
    fecha,
    comprobanteUrl: datos.comprobanteUrl ? String(datos.comprobanteUrl).trim() : null,
  };
  if (tipo === 'EGRESO') {
    base.proveedor = datos.proveedor ? String(datos.proveedor).trim() : null;
    base.nroFactura = datos.nroFactura ? String(datos.nroFactura).trim() : null;
  }
  return base;
}

module.exports = { validarDatosMovimientoManual };
