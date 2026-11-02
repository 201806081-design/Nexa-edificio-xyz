// Rutas de nómina (HU-AP-01 · SCRUM-107). Todas requieren sesión; las de escritura, rol ADMINISTRADOR.
const { Router } = require('express');
const { autenticar, autorizar } = require('../../shared/middlewares/auth.middleware');
const { ROLES } = require('../../shared/constants/roles');
const c = require('./nomina.controller');

const router = Router();
const soloAdmin = autorizar(ROLES.ADMINISTRADOR);

router.use(autenticar);

// Empleados (lectura; el alta/edición es del módulo personal)
router.get('/empleados', c.empleados);                          // ?activos=true|false
router.get('/empleados/:id/historial', c.historial);            // ?anio=2026 · pantalla Historial de pagos

// Anticipos a empleados (salen de caja/banco, se descuentan en la planilla)
router.get('/anticipos', c.anticipos);                          // ?empleadoId=&pendientes=true
router.post('/anticipos', soloAdmin, c.registrarAnticipo);

// Planillas mensuales (salario + bonos − descuentos − anticipos)
router.get('/planillas', c.planillas);                          // ?anio&mes&empleadoId&estado
router.post('/planillas/generar', soloAdmin, c.generarPlanillas);   // una por empleado activo
router.post('/planillas', soloAdmin, c.crearPlanilla);          // individual, con bonos y descuentos
router.get('/planillas/:id', c.planilla);
router.put('/planillas/:id', soloAdmin, c.actualizarPlanilla);  // solo en borrador
router.post('/planillas/:id/pagar', soloAdmin, c.pagarPlanilla);
router.delete('/planillas/:id', soloAdmin, c.eliminarPlanilla); // solo en borrador

module.exports = router;
