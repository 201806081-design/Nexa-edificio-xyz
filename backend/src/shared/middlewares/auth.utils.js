// Funciones puras de autenticación/autorización (sin dependencias externas → testeables)
const { HttpError } = require('../errors');

/** Extrae el token de un header "Authorization: Bearer <token>". Devuelve null si no hay. */
function extraerToken(headerAuthorization) {
  if (!headerAuthorization || typeof headerAuthorization !== 'string') return null;
  const [esquema, token] = headerAuthorization.trim().split(/\s+/);
  if (!esquema || esquema.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

/** Middleware: permite el paso solo a los roles indicados. Requiere `autenticar` antes. */
function autorizar(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, 'No autenticado'));
    if (!rolesPermitidos.includes(req.user.rol)) {
      return next(new HttpError(403, `Acceso denegado para el rol ${req.user.rol}`));
    }
    return next();
  };
}

module.exports = { extraerToken, autorizar };
