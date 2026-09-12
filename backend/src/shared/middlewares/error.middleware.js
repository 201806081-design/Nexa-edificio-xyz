function notFound(req, res) {
  res.status(404).json({ ok: false, error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let mensaje = err.message || 'Error interno del servidor';

  // Errores conocidos de Prisma → códigos HTTP adecuados
  if (err.code === 'P2002') {
    status = 409;
    const campos = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'clave única';
    mensaje = `Ya existe un registro con el mismo valor en: ${campos}`;
  } else if (err.code === 'P2025') {
    status = 404;
    mensaje = 'Registro no encontrado';
  } else if (err.code === 'P2003') {
    status = 409;
    mensaje = 'La operación viola una relación entre tablas (clave foránea)';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    mensaje = 'JSON inválido en el cuerpo de la petición';
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ ok: false, error: mensaje });
}

module.exports = { notFound, errorHandler };
