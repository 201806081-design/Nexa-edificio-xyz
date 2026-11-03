// Mock de personal del edificio (HU-AP-01): empleados, planilla y pagos.
// Montos en Bs. Datos coherentes entre si: el "neto" de la planilla == el
// "monto neto" del pago cuando corresponde. Los pagos pendientes aparecen
// en Historial sin fecha ni N.º pago (quedan como la planilla propone pagar).

export const CARGOS = ['Administradora', 'Portero', 'Limpieza', 'Mantenimiento', 'Seguridad'];

export const ESTADOS_EMPLEADO = ['Todos', 'Activo', 'Inactivo'];
export const ESTADOS_PLANILLA = ['Todos', 'Borrador', 'Calculado', 'Revisar', 'Pagada'];
export const ESTADOS_PAGO_PERSONAL = ['Todos', 'Pagado', 'Pendiente'];

export const MEDIOS_PAGO_PERSONAL = ['Transferencia', 'Efectivo', 'Cheque'];
export const CONCEPTOS_PAGO = ['Salario', 'Bono', 'Anticipo', 'Finiquito'];

// --- Catalogo de empleados ---
export const EMPLEADOS_MOCK = [
    { id: 'EM-001', nombre: 'Maria Lopez', ci: '4567890', cargo: 'Administradora', salarioBase: 4200, fechaIngreso: '01/03/2024', estado: 'Activo' },
    { id: 'EM-002', nombre: 'Carlos Rojas', ci: '5123890', cargo: 'Portero', salarioBase: 3000, fechaIngreso: '15/06/2024', estado: 'Activo' },
    { id: 'EM-003', nombre: 'Ana Perez', ci: '6234512', cargo: 'Limpieza', salarioBase: 2800, fechaIngreso: '02/09/2024', estado: 'Activo' },
    { id: 'EM-004', nombre: 'Luis Vargas', ci: '7345623', cargo: 'Mantenimiento', salarioBase: 3500, fechaIngreso: '10/01/2025', estado: 'Activo' },
    { id: 'EM-005', nombre: 'Sofia Cruz', ci: '8456734', cargo: 'Seguridad', salarioBase: 3400, fechaIngreso: '20/04/2025', estado: 'Activo' },
];

// --- Planilla del mes (borrador/calculada) ---
// bonos, anticipos y otros descuentos se calculan en pantalla; el neto es el total a pagar.
export const PLANILLA_MOCK = [
    { empleadoId: 'EM-001', periodo: 'Noviembre 2026', salarioBase: 4200, bonos: 400, anticipos: 300, otrosDesc: 120, neto: 4180, estado: 'Calculado' },
    { empleadoId: 'EM-002', periodo: 'Noviembre 2026', salarioBase: 3000, bonos: 250, anticipos: 400, otrosDesc: 90, neto: 2760, estado: 'Calculado' },
    { empleadoId: 'EM-003', periodo: 'Noviembre 2026', salarioBase: 2800, bonos: 300, anticipos: 0, otrosDesc: 84, neto: 3016, estado: 'Calculado' },
    { empleadoId: 'EM-004', periodo: 'Noviembre 2026', salarioBase: 3500, bonos: 250, anticipos: 350, otrosDesc: 105, neto: 3295, estado: 'Revisar' },
    { empleadoId: 'EM-005', periodo: 'Noviembre 2026', salarioBase: 3400, bonos: 0, anticipos: 0, otrosDesc: 102, neto: 3298, estado: 'Calculado' },
];

// --- Historial de pagos ---
// Los que ya se pagaron tienen id/fecha; los pendientes quedan sin esos campos
// (son filas que la planilla propone pero aun no se ejecutaron).
export const PAGOS_PERSONAL_MOCK = [
    { id: 'PE-0031', fecha: '02/11/2026', empleadoId: 'EM-002', empleado: 'Carlos Rojas', periodo: 'Nov. 2026', concepto: 'Salario', medio: 'Transferencia', referencia: 'TRF-241102-R', montoNeto: 2760, estado: 'Pagado' },
    { id: 'PE-0030', fecha: '02/11/2026', empleadoId: 'EM-003', empleado: 'Ana Perez', periodo: 'Nov. 2026', concepto: 'Salario', medio: 'Transferencia', referencia: 'TRF-241102-P', montoNeto: 3016, estado: 'Pagado' },
    { id: 'PE-0029', fecha: '02/11/2026', empleadoId: 'EM-004', empleado: 'Luis Vargas', periodo: 'Nov. 2026', concepto: 'Salario', medio: 'Efectivo', referencia: 'REC-00124', montoNeto: 3295, estado: 'Pagado' },
    { id: 'PE-0028', fecha: '01/11/2026', empleadoId: 'EM-005', empleado: 'Sofia Cruz', periodo: 'Nov. 2026', concepto: 'Salario', medio: 'Transferencia', referencia: 'TRF-241101-C', montoNeto: 3298, estado: 'Pagado' },
    // Pendiente: Maria Lopez (administradora) todavia no cobro
    { id: null, fecha: null, empleadoId: 'EM-001', empleado: 'Maria Lopez', periodo: 'Nov. 2026', concepto: 'Salario', medio: null, referencia: null, montoNeto: 4180, estado: 'Pendiente' },
];

// --- Resumenes derivados (totales del mes de Noviembre) ---
// Se mantienen aqui para que las tarjetas de arriba usen los mismos numeros
// que los demas modulos sin recalcular en cada render.
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

// --- Helper para obtener nombre del empleado por id ---
export const nombreEmpleado = (id) => {
    const e = EMPLEADOS_MOCK.find((x) => x.id === id);
    return e ? e.nombre : '—';
};
export const cargoEmpleado = (id) => {
    const e = EMPLEADOS_MOCK.find((x) => x.id === id);
    return e ? e.cargo : '—';
};