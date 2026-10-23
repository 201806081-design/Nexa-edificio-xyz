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
const configuracion = require('./controllers/configuracion.controller');
const mora = require('./controllers/mora.controller');
const vistas = require('./controllers/vistas.controller');
const dashboard = require('./controllers/dashboard.controller');

const router = Router();
const soloAdmin = autorizar(ROLES.ADMINISTRADOR);

router.use(autenticar);

// Dashboard e indicadores (req. 5). Solo lectura.
router.get('/dashboard', dashboard.dashboard);
router.get('/dashboard/finanzas', dashboard.finanzas);   // ?periodo=YYYY-MM
router.get('/morosos', dashboard.morosos);               // ?minDias=1

// Expensas
router.get('/expensas', expensas.listar);
router.get('/expensas/resumen', expensas.resumen);
router.get('/expensas/:id', expensas.obtenerPorId);
router.post('/expensas/sincronizar', soloAdmin, expensas.sincronizar); // marca VENCIDA lo vencido (también ocurre al leer)

// Periodos → generación automática de expensas (+ asiento de devengado)
router.get('/periodos', periodos.listar);
router.post('/periodos', soloAdmin, periodos.crear);
router.post('/periodos/vista-previa', periodos.vistaPrevia);          // paso 2 del asistente: no escribe
router.patch('/periodos/:id/cerrar', soloAdmin, periodos.cerrar);
router.get('/periodos/:id/agua', periodos.listarAgua);                   // pantalla Registrar agua (uno por uno)
router.put('/periodos/:id/agua/:unidadId', soloAdmin, periodos.registrarAgua);

// Unidades → estado de cuenta
router.get('/unidades', unidades.listar);
router.get('/unidades/selector', vistas.unidadesSelector);           // selector de departamentos (antes de /:id)
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

// Configuración de interés por mora (pantalla Configurar interés)
router.get('/configuracion/mora', configuracion.obtener);
router.get('/configuracion/mora/historial', configuracion.historial);
router.put('/configuracion/mora', soloAdmin, configuracion.actualizar);

// Mora y pagos anticipados (pantalla Mora, HU-FI-05)
router.get('/mora', mora.resumen);
router.get('/anticipos', mora.anticipos);
router.get('/anticipos/:id', mora.anticipoPorId);

// Vistas en la forma de las pantallas (US2.2 estado de cuenta · US2.3 ingresos y gastos)
router.get('/estado-cuenta/:unidadId', vistas.estadoCuenta);           // ?anio&mes
router.get('/movimientos', vistas.movimientos);                         // ?anio&mes&tipo&categoriaId

// Caja y bancos
router.get('/cuentas', cuentas.listar);
router.get('/cuentas/:id/movimientos', cuentas.movimientos);

// Contabilidad
router.get('/contabilidad/plan-cuentas', contabilidad.planCuentas);          // ?imputables=true
router.get('/contabilidad/asientos', contabilidad.asientos);                 // ?desde&hasta&origenTipo&limite
router.get('/contabilidad/asientos/:id', contabilidad.asientoPorId);
router.get('/contabilidad/balance-comprobacion', contabilidad.balanceComprobacion); // ?desde&hasta

module.exports = router;
