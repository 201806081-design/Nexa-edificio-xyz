// Servicio de autenticación: login con usuario/contraseña y emisión de JWT (requisito 9)
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/prisma');
const env = require('../../config/env');
const { HttpError } = require('../../shared/errors');
const { etiquetaDeRol } = require('../../shared/constants/roles');

/** Forma del usuario que consume el frontend: { id, usuario, nombre, email, rol: 'Administrador' } */
function serializarUsuario(u) {
  return {
    id: u.id,
    usuario: u.username,
    nombre: u.nombre,
    email: u.email,
    rol: etiquetaDeRol(u.rol),
    rolCodigo: u.rol,
  };
}

async function login({ usuario, password }) {
  if (!usuario || !password) throw new HttpError(400, 'usuario y password son obligatorios');

  // Acepta nombre de usuario o correo
  const u = await prisma.usuario.findFirst({
    where: { OR: [{ username: String(usuario).trim() }, { email: String(usuario).trim().toLowerCase() }] },
  });

  const passwordOk = u ? await bcrypt.compare(String(password), u.passwordHash) : false;
  if (!u || !passwordOk) throw new HttpError(401, 'Usuario o contraseña incorrectos');
  if (!u.activo) throw new HttpError(403, 'Usuario inactivo. Contacta al administrador');

  const token = jwt.sign(
    { sub: String(u.id), usuario: u.username, rol: u.rol },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  await prisma.usuario.update({ where: { id: u.id }, data: { ultimoAcceso: new Date() } });

  return { token, user: serializarUsuario(u) };
}

async function perfil(id) {
  const u = await prisma.usuario.findUnique({ where: { id } });
  if (!u) throw new HttpError(404, 'Usuario no encontrado');
  return serializarUsuario(u);
}

module.exports = { login, perfil, serializarUsuario };
