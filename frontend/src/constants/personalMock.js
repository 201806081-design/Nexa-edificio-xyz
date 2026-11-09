// Mock de personal del edificio (HU-AP-01): empleados, planilla y pagos.
// Montos en Bs. Datos coherentes entre si: el "neto" de la planilla == el
// "monto neto" del pago cuando corresponde. Los pagos pendientes aparecen
// en Historial sin fecha ni N.º pago (quedan como la planilla propone pagar).
//
// IMPORTANTE: los nombres de empleados NO deben coincidir con los copropietarios
// del edificio (que viven en expensasMock). Son dos conjuntos de personas
// distintos: aqui vive el personal contratado para administrar el edificio.
//
// PERIODOS DINAMICOS: el inicio del edificio es Octubre 2026 (PRIMER_PERIODO).
// Los periodos disponibles se calculan a partir de la fecha del sistema:
// aparecen solo los MESES YA CERRADOS (el mes actual aun no se puede pagar).
// Si se simula una fecha futura, aparecen los nuevos meses cerrados; si se
// vuelve atras, el selector los esconde (aunque los datos quedan en memoria
// para no perder pagos aplicados durante la simulacion).

import { periodosCerrados, periodoEnCurso } from './periodos';

export const CARGOS = ['Administrador', 'Portero', 'Limpieza', 'Mantenimiento', 'Seguridad'];

export const ESTADOS_EMPLEADO = ['Todos', 'Activo', 'Inactivo'];
export const ESTADOS_PLANILLA = ['Todos', 'Borrador', 'Calculado', 'Revisar', 'Pagada'];
export const ESTADOS_PAGO_PERSONAL = ['Todos', 'Pagado', 'Pendiente'];

export const MEDIOS_PAGO_PERSONAL = ['Transferencia', 'Efectivo', 'Cheque'];
export const CONCEPTOS_PAGO = ['Salario', 'Bono', 'Anticipo', 'Finiquito'];

// --- Tarifa salarial por cargo (fuente unica de los salarios base) ---
export const TARIFAS_CARGO = {
    Administrador: 4200,
    Portero: 3000,
    Limpieza: 2800,
    Mantenimiento: 3500,
    Seguridad: 3400,
};
export const salarioDesdeCargo = (cargo) => TARIFAS_CARGO[cargo] || 0;

// --- Catalogo de empleados ---
export const EMPLEADOS_MOCK = [
    { id: 'EM-001', nombre: 'Patricia Montenegro', ci: '4712345', cargo: 'Administrador', fechaIngreso: '01/03/2024', estado: 'Activo' },
    { id: 'EM-002', nombre: 'Juan Alvarez', ci: '5823456', cargo: 'Portero', fechaIngreso: '15/06/2024', estado: 'Activo' },
    { id: 'EM-003', nombre: 'Elena Quispe', ci: '6934567', cargo: 'Limpieza', fechaIngreso: '02/09/2024', estado: 'Activo' },
    { id: 'EM-004', nombre: 'Ricardo Cabrera', ci: '7045678', cargo: 'Mantenimiento', fechaIngreso: '10/01/2025', estado: 'Activo' },
    { id: 'EM-005', nombre: 'Fernando Coca', ci: '8156789', cargo: 'Seguridad', fechaIngreso: '20/04/2025', estado: 'Activo' },
].map((e) => ({ ...e, salarioBase: salarioDesdeCargo(e.cargo) }));

// ============================================================
//  PERIODOS DINAMICOS
// ============================================================

// Los periodos salen de la fuente unica (periodos.js).
// periodosDisponibles = meses cerrados (la planilla del mes en curso aun no se paga).
export const periodosDisponibles = periodosCerrados;
export { periodoEnCurso };

// Fabrica una fila de planilla "vacia" (sin bonos ni anticipos) para un empleado y periodo.
const planillaFilaVacia = (empleado, periodo) => ({
    empleadoId: empleado.id, periodo,
    salarioBase: empleado.salarioBase,
    bonos: 0, anticipos: 0, otrosDesc: 0,
    neto: empleado.salarioBase,
    estado: 'Calculado',
});

// ============================================================
//  SEMILLAS (solo Octubre 2026, el primer mes ya cerrado al dia de hoy)
// ============================================================

// Planilla de Octubre 2026: algunas pagadas, algunas pendientes.
// Las filas de meses posteriores se generan automaticamente cuando el mes se cierra
// (ver asegurarPlanillaActualizada abajo).
const planillaOctubre = (empleadoId, bonos, anticipos, otrosDesc, estado) => {
    const emp = EMPLEADOS_MOCK.find((e) => e.id === empleadoId);
    const salarioBase = emp ? emp.salarioBase : 0;
    const neto = salarioBase + bonos - anticipos - otrosDesc;
    return { empleadoId, periodo: 'Octubre 2026', salarioBase, bonos, anticipos, otrosDesc, neto, estado };
};
export const PLANILLA_MOCK = [
    planillaOctubre('EM-001', 400, 300, 120, 'Calculado'), // Patricia -> 4180, pendiente
    planillaOctubre('EM-002', 250, 400, 90, 'Pagada'),    // Juan     -> 2760, pagada
    planillaOctubre('EM-003', 300, 0, 84, 'Pagada'),    // Elena    -> 3016, pagada
    planillaOctubre('EM-004', 250, 350, 105, 'Revisar'),   // Ricardo  -> 3295, en revision
    planillaOctubre('EM-005', 0, 0, 102, 'Pagada'),    // Fernando -> 3298, pagada
];

// Pagos reales de Octubre 2026 (coherentes con PLANILLA_MOCK).
// Patricia y Ricardo NO estan aqui: aparecen como pendientes derivados.
const buscarEmp = (id) => EMPLEADOS_MOCK.find((e) => e.id === id)?.nombre || '—';
const netoPlanilla = (id, periodoBuscado = 'Octubre 2026') =>
    PLANILLA_MOCK.find((p) => p.empleadoId === id && p.periodo === periodoBuscado)?.neto || 0;

export const PAGOS_PERSONAL_MOCK = [
    { id: 'PE-0004', fecha: '03/11/2026', empleadoId: 'EM-002', empleado: buscarEmp('EM-002'), periodo: 'Oct. 2026', concepto: 'Salario', medio: 'Transferencia', referencia: 'TRF-241103-A', montoNeto: netoPlanilla('EM-002'), estado: 'Pagado' },
    { id: 'PE-0003', fecha: '02/11/2026', empleadoId: 'EM-003', empleado: buscarEmp('EM-003'), periodo: 'Oct. 2026', concepto: 'Salario', medio: 'Transferencia', referencia: 'TRF-241102-Q', montoNeto: netoPlanilla('EM-003'), estado: 'Pagado' },
    { id: 'PE-0002', fecha: '02/11/2026', empleadoId: 'EM-005', empleado: buscarEmp('EM-005'), periodo: 'Oct. 2026', concepto: 'Salario', medio: 'Transferencia', referencia: 'TRF-241102-C', montoNeto: netoPlanilla('EM-005'), estado: 'Pagado' },
];

// --- Historial de modificaciones de salario por cargo ---
export const HISTORIAL_SALARIOS_CARGO = [
    // Administrador: entro con Bs 4000, subio a Bs 4200 en octubre 2026
    { id: 'HS-001', fecha: '01/01/2024', cargo: 'Administrador', salarioAnterior: null, salarioNuevo: 4000, vigenciaMes: '2024-01', razon: 'Salario inicial del cargo' },
    { id: 'HS-002', fecha: '15/10/2026', cargo: 'Administrador', salarioAnterior: 4000, salarioNuevo: 4200, vigenciaMes: '2026-10', razon: 'Ajuste salarial anual' },
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

// Tipos de descuentos que se pueden aplicar al "Otros desc." de la planilla.
export const TIPOS_DESCUENTO = ['Anticipo salarial', 'Rotura/dano', 'Aporte social', 'Ajuste', 'Otro'];

// Anticipos ya otorgados a empleados (saldo pendiente a descontar).
export const ANTICIPOS_PERSONAL_MOCK = [
    { id: 'AP-001', fecha: '20/10/2026', empleadoId: 'EM-002', empleado: buscarEmp('EM-002'), monto: 400, descontado: 400, saldo: 0, estado: 'Descontado' },
    { id: 'AP-002', fecha: '25/10/2026', empleadoId: 'EM-004', empleado: buscarEmp('EM-004'), monto: 500, descontado: 350, saldo: 150, estado: 'Parcial' },
    { id: 'AP-003', fecha: '28/10/2026', empleadoId: 'EM-001', empleado: buscarEmp('EM-001'), monto: 300, descontado: 300, saldo: 0, estado: 'Descontado' },
];

// ============================================================
//  SINCRONIZACION DE PERIODOS
// ============================================================

// Asegura que PLANILLA_MOCK tenga filas para TODOS los periodos cerrados.
// Agrega filas "vacias" (Calculado, sin bonos ni anticipos) para los periodos
// que no tienen filas todavia; NO toca los periodos que ya existen (asi preserva
// pagos aplicados, bonos, descuentos, etc).
//
// Se llama al abrir Planilla o HistorialPagos y en cada tick de 5s, asi al
// avanzar la fecha del sistema (o simularla), las nuevas planillas aparecen solas.
export const asegurarPlanillaActualizada = () => {
    const periodos = periodosDisponibles();
    const existentes = new Set(PLANILLA_MOCK.map((f) => `${f.empleadoId}|${f.periodo}`));
    const activos = EMPLEADOS_MOCK.filter((e) => e.estado === 'Activo');
    let agregadas = 0;
    periodos.forEach((periodo) => {
        activos.forEach((emp) => {
            const key = `${emp.id}|${periodo}`;
            if (!existentes.has(key)) {
                PLANILLA_MOCK.push(planillaFilaVacia(emp, periodo));
                agregadas++;
            }
        });
    });
    return agregadas;
};

// --- Resumenes derivados (legacy; se recalculan desde las pantallas) ---
export const RESUMEN_PLANILLA = {
    totalPlanilla: PLANILLA_MOCK.reduce((s, p) => s + (p.neto || 0), 0),
    bonos: PLANILLA_MOCK.reduce((s, p) => s + (p.bonos || 0), 0),
    anticiposDescontados: PLANILLA_MOCK.reduce((s, p) => s + (p.anticipos || 0), 0),
    conceptosAplicados: PLANILLA_MOCK.filter((p) => (p.bonos || 0) > 0).length,
    empleadosAnticipos: PLANILLA_MOCK.filter((p) => (p.anticipos || 0) > 0).length,
    periodo: 'Octubre 2026',
};

export const RESUMEN_PAGOS_PERSONAL = {
    pagadoEnMes: PAGOS_PERSONAL_MOCK.filter((p) => p.estado === 'Pagado').reduce((s, p) => s + (p.montoNeto || 0), 0),
    pagosConfirmados: PAGOS_PERSONAL_MOCK.filter((p) => p.estado === 'Pagado').length,
    pendiente: PAGOS_PERSONAL_MOCK.filter((p) => p.estado === 'Pendiente').reduce((s, p) => s + (p.montoNeto || 0), 0),
    empleadosPendientes: PAGOS_PERSONAL_MOCK.filter((p) => p.estado === 'Pendiente').length,
    comprobantes: PAGOS_PERSONAL_MOCK.filter((p) => p.estado === 'Pagado').length,
    periodo: 'Octubre 2026',
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