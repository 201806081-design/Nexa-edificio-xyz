const { Router } = require('express');
const prisma = require('../config/prisma');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      ok: true,
      servicio: 'NEXA API',
      version: '0.2.0',
      db: 'PostgreSQL conectada',
      modulos: ['auth', 'financiero'],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
