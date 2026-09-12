const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { HttpError } = require('../errors');
const { extraerToken, autorizar } = require('./auth.utils');

/** Middleware: valida el JWT y deja el usuario en req.user = { id, usuario, rol } */
function autenticar(req, res, next) {
  const token = extraerToken(req.headers.authorization);
  if (!token) return next(new HttpError(401, 'Token requerido (Authorization: Bearer <token>)'));
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: Number(payload.sub), usuario: payload.usuario, rol: payload.rol };
    return next();
  } catch (err) {
    return next(new HttpError(401, 'Token inválido o expirado'));
  }
}

module.exports = { autenticar, autorizar };
