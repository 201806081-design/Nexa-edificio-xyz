// Mock de personal del edificio (HU-AP-01): empleados, planilla y pagos.
// Montos en Bs. Datos coherentes entre si: el "neto" de la planilla == el
// "monto neto" del pago cuando corresponde. Los pagos pendientes aparecen
// en Historial sin fecha ni N.º pago (quedan como la planilla propone pagar).
//
// IMPORTANTE: los nombres de empleados NO deben coincidir con los copropietarios
// del edificio (que viven en expensasMock). Son dos conjuntos de personas
// distintos: aqui vive el personal contratado para administrar el edificio.

export const CARGOS = ['Administradora', 'Portero', 'Limpieza', 'Mantenimiento', 'Seguridad'];

export const ESTADOS_EMPLEADO = ['Todos', 'Activo', 'Inactivo'];
export const ESTADOS_PLANILLA = ['Todos', 'Borrador', 'Calculado', 'Revisar', 'Pagada'];
export const ESTADOS_PAGO_PERSONAL = ['Todos', 'Pagado', 'Pendiente'];

export const MEDIOS_PAGO_PERSONAL = ['Transferencia', 'Efectivo', 'Cheque'];
export const CONCEPTOS_PAGO = ['Salario', 'Bono', 'Anticipo', 'Finiquito'];

// --- Tarifa salarial por cargo (misma idea que EXPENSA_BASE con A/B/C) ---
// Es la fuente unica de los salarios base. Cualquier cambio aqui se refleja
// en EMPLEADOS_MOCK y en la PLANILLA (que leen `salarioDesdeCargo(cargo)`).
export const TARIFAS_CARGO = {
    Administradora: 4200,
    Portero: 3000,
    Limpieza: 2800,
    Mantenimiento: 3500,
    Seguridad: 3400,
};
export const salarioDesdeCargo = (cargo) => TARIFAS_CARGO[cargo] || 0;

// --- Catalogo de empleados ---
// Nombres completamente distintos a los copropietarios para evitar confusiones.
export const EMPLEADOS_MOCK = [
    { id: 'EM-001', nombre: 'Patricia Montenegro', ci: '4712345', cargo: 'Administradora', fechaIngreso: '01/03/2024', estado: 'Activo' },
    { id: 'EM-002', nombre: 'Juan Alvarez', ci: '5823456', cargo: 'Portero', fechaIngreso: '15/06/2024', estado: 'Activo' },
    { id: 'EM-003', nombre: 'Elena Quispe', ci: '6934567', cargo: 'Limpieza', fechaIngreso: '02/09/2024', estado: 'Activo' },
    { id: 'EM-004', nombre: 'Ricardo Cabrera', ci: '7045678', cargo: 'Mantenimiento', fechaIngreso: '10/01/2025', estado: 'Activo' },
    { id: 'EM-005', nombre: 'Fernando Coca', ci: '8156789', cargo: 'Seguridad', fechaIngreso: '20/04/2025', estado: 'Activo' },
].map((e) => ({ ...e, salarioBase: salarioDesdeCargo(e.cargo) }));

// --- Planilla del mes ---
// El salarioBase se deriva del cargo (fuente unica). Los conceptos variables
// (bonos, anticipos descontados, otros) se guardan explicitos para poder
// auditar como se armo el neto de cada empleado.
// neto = salarioBase + bonos - anticipos - otrosDesc
const planillaFila = (empleadoId, bonos, anticipos, otrosDesc, estado) => {
    const emp = EMPLEADOS_MOCK.find((e) => e.id === empleadoId);
    const salarioBase = emp ? emp.salarioBase : 0;
    const neto = salarioBase + bonos - anticipos - otrosDesc;
    return { empleadoId, periodo: 'Noviembre 2026', salarioBase, bonos, anticipos, otrosDesc, neto, estado };
};
export const PLANILLA_MOCK = [
    planillaFila('EM-001', 400, 300, 120, 'Calculado'),  // Patricia Montenegro -> 4180
    planillaFila('EM-002', 250, 400, 90, 'Calculado'),  // Juan Alvarez        -> 2760
    planillaFila('EM-003', 300, 0, 84, 'Calculado'),  // Elena Quispe        -> 3016
    planillaFila('EM-004', 250, 350, 105, 'Revisar'),    // Ricardo Cabrera     -> 3295
    planillaFila('EM-005', 0, 0, 102, 'Calculado'),  // Fernando Coca       -> 3298
];

// --- Historial de pagos ---
// Los que ya se pagaron tienen id/fecha; los pendientes quedan sin esos campos
// (son filas que la planilla propone pero aun no se ejecutaron).
const buscarEmp = (id) => EMPLEADOS_MOCK.find((e) => e.id === id)?.nombre || '—';
const netoPlanilla = (id) => PLANILLA_MOCK.find((p) => p.empleadoId === id)?.neto || 0;

export const PAGOS_PERSONAL_MOCK = [
    { id: 'PE-0031', fecha: '02/11/2026', empleadoId: 'EM-002', empleado: buscarEmp('EM-002'), periodo: 'Nov. 2026', concepto: 'Salario', medio: 'Transferencia', referencia: 'TRF-241102-A', montoNeto: netoPlanilla('EM-002'), estado: 'Pagado' },
    { id: 'PE-0030', fecha: '02/11/2026', empleadoId: 'EM-003', empleado: buscarEmp('EM-003'), periodo: 'Nov. 2026', concepto: 'Salario', medio: 'Transferencia', referencia: 'TRF-241102-Q', montoNeto: netoPlanilla('EM-003'), estado: 'Pagado' },
    { id: 'PE-0029', fecha: '02/11/2026', empleadoId: 'EM-004', empleado: buscarEmp('EM-004'), periodo: 'Nov. 2026', concepto: 'Salario', medio: 'Efectivo', referencia: 'REC-00124', montoNeto: netoPlanilla('EM-004'), estado: 'Pagado' },
    { id: 'PE-0028', fecha: '01/11/2026', empleadoId: 'EM-005', empleado: buscarEmp('EM-005'), periodo: 'Nov. 2026', concepto: 'Salario', medio: 'Transferencia', referencia: 'TRF-241101-C', montoNeto: netoPlanilla('EM-005'), estado: 'Pagado' },
    // Pendiente: Patricia Montenegro (administradora) todavia no cobro
    { id: null, fecha: null, empleadoId: 'EM-001', empleado: buscarEmp('EM-001'), periodo: 'Nov. 2026', concepto: 'Salario', medio: null, referencia: null, montoNeto: netoPlanilla('EM-001'), estado: 'Pendiente' },
];

// --- Historial de modificaciones de salario por cargo ---
// Cada entrada registra un cambio de salario a nivel CARGO (no por empleado,
// porque los salarios se definen por cargo). Al mostrar el detalle de un empleado
// se filtra por su cargo y por fecha de ingreso para ver solo lo relevante.
// vigenciaMes = 'YYYY-MM' que indica desde que periodo rige el nuevo salario.
export const HISTORIAL_SALARIOS_CARGO = [
    // Administradora: entro con Bs 4000, subio a Bs 4200 en octubre 2026
    { id: 'HS-001', fecha: '01/01/2024', cargo: 'Administradora', salarioAnterior: null, salarioNuevo: 4000, vigenciaMes: '2024-01', razon: 'Salario inicial del cargo' },
    { id: 'HS-002', fecha: '15/10/2026', cargo: 'Administradora', salarioAnterior: 4000, salarioNuevo: 4200, vigenciaMes: '2026-10', razon: 'Ajuste salarial anual' },
    // Portero
    { id: 'HS-003', fecha: '01/01/2024', cargo: 'Portero', salarioAnterior: null, salarioNuevo: 2800, vigenciaMes: '2024-01', razon: 'Salario inicial del cargo' },
    { id: 'HS-004', fecha: '15/10/2026', cargo: 'Portero', salarioAnterior: 2800, salarioNuevo: 3000, vigenciaMes: '2026-10', razon: 'Ajuste salarial anual' },
    // Limpieza
    { id: 'HS-005', fecha: '01/01/2024', cargo: 'Limpieza', salarioAnterior: null, salarioNuevo: 2600, vigenciaMes: '2024-01', razon: 'Salario inicial del cargo' },
    { id: 'HS-006', fecha: '15/10/2026', cargo: 'Limpieza', salarioAnterior: 2600, salarioNuevo: 2800, vigenciaMes: '2026-10', razon: 'Ajuste salarial anual' },
    // Mantenimiento
    { id: 'HS-007', fecha: '01/01/2024', cargo: 'Mantenimiento', salarioAnterior: null, salarioNuevo: 3200, vigenciaMes: '2024-01', razon: 'Salario inicial del cargo' },
    { id: 'HS-008', fecha: '15/10/2026', cargo: 'Mantenimiento', salarioAnterior: 3200, salarioNuevo: 3500, vigenciaMes: '2026-10', razon: 'Ajuste salarial anual' },
    // Seguridad
    { id: 'HS-009', fecha: '01/01/2024', cargo: 'Seguridad', salarioAnterior: null, salarioNuevo: 3100, vigenciaMes: '2024-01', razon: 'Salario inicial del cargo' },
    { id: 'HS-010', fecha: '15/10/2026', cargo: 'Seguridad', salarioAnterior: 3100, salarioNuevo: 3400, vigenciaMes: '2026-10', razon: 'Ajuste salarial anual' },
];

// --- Catalogos preparados para la proxima rama (CRUD + Registrar pago personal) ---
// Tipos de descuentos que se pueden aplicar al "Otros desc." de la planilla.
// Ya quedan definidos aqui para que cuando se arme la pantalla de Registrar pago
// el admin tenga de donde elegir, sin tener que modificar el mock otra vez.
export const TIPOS_DESCUENTO = ['Anticipo salarial', 'Rotura/dano', 'Aporte social', 'Ajuste', 'Otro'];

// Anticipos ya otorgados a empleados (saldo pendiente a descontar).
// Es analogo a HISTORIAL_ANTICIPOS de pagosMock, pero para empleados.
export const ANTICIPOS_PERSONAL_MOCK = [
    { id: 'AP-001', fecha: '20/10/2026', empleadoId: 'EM-002', empleado: buscarEmp('EM-002'), monto: 400, descontado: 400, saldo: 0, estado: 'Descontado' },
    { id: 'AP-002', fecha: '25/10/2026', empleadoId: 'EM-004', empleado: buscarEmp('EM-004'), monto: 500, descontado: 350, saldo: 150, estado: 'Parcial' },
    { id: 'AP-003', fecha: '28/10/2026', empleadoId: 'EM-001', empleado: buscarEmp('EM-001'), monto: 300, descontado: 300, saldo: 0, estado: 'Descontado' },
];

// --- Resumenes derivados (totales del mes de Noviembre) ---
// Se calculan desde el mock, no son valores hardcoded, para que cualquier cambio
// en el mock se refleje automaticamente en las tarjetas de arriba.
export const RESUMEN_PLANILLA = {
    totalPlanilla: PLANILLA_MOCK.reduce((s, p) => s + (p.neto || 0), 0),
    bonos: PLANILLA_MOCK.reduce((s, p) => s + (p.bonos || 0), 0),
    anticiposDescontados: PLANILLA_MOCK.reduce((s, p) => s + (p.anticipos || 0), 0),
    conceptosAplicados: PLANILLA_MOCK.filter((p) => (p.bonos || 0) > 0).length,
    empleadosAnticipos: PLANILLA_MOCK.filter((p) => (p.anticipos || 0) > 0).length,
    periodo: 'Noviembre 2026',
};

export const RESUMEN_PAGOS_PERSONAL = {
    pagadoEnMes: PAGOS_PERSONAL_MOCK.filter((p) => p.estado === 'Pagado').reduce((s, p) => s + (p.montoNeto || 0), 0),
    pagosConfirmados: PAGOS_PERSONAL_MOCK.filter((p) => p.estado === 'Pagado').length,
    pendiente: PAGOS_PERSONAL_MOCK.filter((p) => p.estado === 'Pendiente').reduce((s, p) => s + (p.montoNeto || 0), 0),
    empleadosPendientes: PAGOS_PERSONAL_MOCK.filter((p) => p.estado === 'Pendiente').length,
    comprobantes: PAGOS_PERSONAL_MOCK.filter((p) => p.estado === 'Pagado').length,
    periodo: 'Noviembre 2026',
};

// --- Helpers ---
export const nombreEmpleado = (id) => {
    const e = EMPLEADOS_MOCK.find((x) => x.id === id);
    return e ? e.nombre : '—';
};
export const cargoEmpleado = (id) => {
    const e = EMPLEADOS_MOCK.find((x) => x.id === id);
    return e ? e.cargo : '—';
};