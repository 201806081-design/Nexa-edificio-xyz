// Rutas del módulo financiero. Todas requieren sesión (JWT); las de escritura, rol ADMINISTRADOR.
const { Router } = require('express');
const { autenticar, autorizar } = require('../../shared/middlewares/auth.middleware');
const { ROLES } = require('../../shared/constants/roles');
const expensas = require('./controllers/expensas.controller');
const cuentas = require('./controllers/cuentas.controller');
const periodos = require('./controllers/periodos.controller');
const unidades = require('./controllers/unidades.controller');
const pagos = require('./controllers/pagos.controller');
const ie = require('./controllers/ingresosEgresos.controller');
const contabilidad = require('./controllers/contabilidad.controller');

const router = Router();
const soloAdmin = autorizar(ROLES.ADMINISTRADOR);

router.use(autenticar);

// Expensas
router.get('/expensas', expensas.listar);
router.get('/expensas/resumen', expensas.resumen);
router.get('/expensas/:id', expensas.obtenerPorId);

// Periodos → generación automática de expensas (+ asiento de devengado)
router.get('/periodos', periodos.listar);
router.post('/periodos', soloAdmin, periodos.crear);

// Unidades → estado de cuenta
router.get('/unidades', unidades.listar);
router.get('/unidades/:id/estado-cuenta', unidades.estadoCuenta);

// Pagos de expensas
router.get('/pagos', pagos.listar);
router.get('/pagos/:id', pagos.obtenerPorId);
router.post('/pagos', soloAdmin, pagos.registrar);

// Ingresos extraordinarios y egresos
router.get('/categorias', ie.categorias);                 // ?tipo=INGRESO|EGRESO
router.get('/ingresos', ie.listarIngresos);
router.post('/ingresos', soloAdmin, ie.registrarIngreso);
router.get('/egresos', ie.listarEgresos);
router.post('/egresos', soloAdmin, ie.registrarEgreso);

// Caja y bancos
router.get('/cuentas', cuentas.listar);
router.get('/cuentas/:id/movimientos', cuentas.movimientos);

// Contabilidad
router.get('/contabilidad/plan-cuentas', contabilidad.planCuentas);          // ?imputables=true
router.get('/contabilidad/asientos', contabilidad.asientos);                 // ?desde&hasta&origenTipo&limite
router.get('/contabilidad/asientos/:id', contabilidad.asientoPorId);
router.get('/contabilidad/balance-comprobacion', contabilidad.balanceComprobacion); // ?desde&hasta

module.exports = router;
