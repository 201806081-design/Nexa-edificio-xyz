const service = require('./auth.service');

async function login(req, res, next) {
  try {
    const data = await service.login(req.body || {});
    // El frontend espera exactamente { token, user }
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await service.perfil(req.user.id);
    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me };
