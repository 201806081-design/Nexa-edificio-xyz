// Rutas del módulo financiero. Todas requieren sesión (JWT); las de escritura, rol ADMINISTRADOR.
const { Router } = require('express');
const { autenticar, autorizar } = require('../../shared/middlewares/auth.middleware');
const { ROLES } = require('../../shared/constants/roles');
const expensas = require('./controllers/expensas.controller');
const cuentas = require('./controllers/cuentas.controller');
const periodos = require('./controllers/periodos.controller');
const unidades = require('./controllers/unidades.controller');

const router = Router();

router.use(autenticar);

// Expensas
router.get('/expensas', expensas.listar);                 // ?estado=PENDIENTE&unidadId=1&anio=2026&mes=9
router.get('/expensas/resumen', expensas.resumen);
router.get('/expensas/:id', expensas.obtenerPorId);

// Periodos → generación automática de expensas
router.get('/periodos', periodos.listar);
router.post('/periodos', autorizar(ROLES.ADMINISTRADOR), periodos.crear);

// Unidades → estado de cuenta
router.get('/unidades', unidades.listar);
router.get('/unidades/:id/estado-cuenta', unidades.estadoCuenta);

// Caja y bancos
router.get('/cuentas', cuentas.listar);
router.get('/cuentas/:id/movimientos', cuentas.movimientos);

module.exports = router;
