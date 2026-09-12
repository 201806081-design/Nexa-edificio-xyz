const { Router } = require('express');
const ctrl = require('./auth.controller');
const { autenticar } = require('../../shared/middlewares/auth.middleware');

const router = Router();

router.post('/login', ctrl.login);        // POST /api/auth/login  { usuario, password } → { token, user }
router.get('/me', autenticar, ctrl.me);   // GET  /api/auth/me     (Bearer token) → { ok, user }

module.exports = router;
