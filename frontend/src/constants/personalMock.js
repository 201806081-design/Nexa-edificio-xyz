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

// Registra un cargo nuevo con su salario base. Devuelve un mensaje de error o null.
export const registrarCargo = (nombre, salario) => {
    const n = String(nombre || '').trim();
    const m = Number(salario);
    if (!n) return 'Escribe el nombre del cargo';
    if (n.length > 40) return 'Maximo 40 caracteres';
    if (CARGOS.some((c) => c.toLowerCase() === n.toLowerCase())) return 'Ese cargo ya existe';
    if (!(m > 0)) return 'Ingresa un salario base mayor a 0';
    CARGOS.push(n);
    TARIFAS_CARGO[n] = Math.round(m * 100) / 100;
    return null;
};

// --- Catalogos de la ficha del empleado ---
// Departamento donde se expidio el carnet (Bolivia)
export const EXPEDIDOS = ['LP', 'CB', 'SC', 'OR', 'PT', 'CH', 'TJ', 'BE', 'PD'];
export const TIPOS_CONTRATO = ['Indefinido', 'Plazo fijo', 'Eventual'];
export const MOTIVOS_BAJA = ['Renuncia', 'Fin de contrato', 'Despido', 'Jubilacion', 'Otro'];

// --- Catalogo de empleados ---
// Ficha completa del empleado. 'nombre' (nombres + apellidos) se mantiene porque
// lo usan Planilla, Historial de pagos y Finanzas.
// celular: 8 digitos (Bolivia, codigo +591 fijo); telefono fijo es opcional.
const emp = (id, nombres, apellidos, ci, expedido, cargo, fechaIngreso, extra) => ({
    id, nombres, apellidos, nombre: `${nombres} ${apellidos}`, ci, complemento: '', expedido,
    cargo, fechaIngreso, estado: 'Activo', tipoContrato: 'Indefinido', telefono: '', cv: null, ...extra,
});
export const EMPLEADOS_MOCK = [
    emp('EM-001', 'Oscar', 'Montenegro', '4712345', 'CB', 'Administrador', '01/03/2024', {
        fechaNacimiento: '1985-06-14', celular: '71456230', correo: 'oscar.montenegro@nexa.bo',
        direccion: 'Av. Ayacucho 1450, Cochabamba',
        contactoEmergencia: { nombre: 'Lucia Rivas (esposa)', celular: '72215566' },
        experiencia: 'Lic. en Administracion de Empresas. 8 años administrando condominios y edificios residenciales.',
    }),
    emp('EM-002', 'Juan', 'Alvarez', '5823456', 'CB', 'Portero', '15/06/2024', {
        fechaNacimiento: '1979-02-03', celular: '76543210', correo: 'juan.alvarez@gmail.com',
        direccion: 'Calle Tumusla 230, Cochabamba',
        contactoEmergencia: { nombre: 'Maria Alvarez (hija)', celular: '70011223' },
        experiencia: '5 años como portero en edificios del centro.',
    }),
    emp('EM-003', 'Elena', 'Quispe', '6934567', 'LP', 'Limpieza', '02/09/2024', {
        fechaNacimiento: '1990-11-21', celular: '67890123', correo: 'elena.quispe@gmail.com',
        direccion: 'Barrio Sarco, calle 4 N.º 12, Cochabamba', tipoContrato: 'Plazo fijo',
        contactoEmergencia: { nombre: 'Rosa Quispe (madre)', celular: '69988776' },
        experiencia: 'Limpieza de oficinas y areas comunes.',
    }),
    emp('EM-004', 'Ricardo', 'Cabrera', '7045678', 'CB', 'Mantenimiento', '10/01/2025', {
        fechaNacimiento: '1983-08-09', celular: '72233445', correo: 'ricardo.cabrera@gmail.com',
        direccion: 'Av. Blanco Galindo km 3, Cochabamba',
        contactoEmergencia: { nombre: 'Carla Cabrera (hermana)', celular: '71122334' },
        experiencia: 'Tecnico electricista y plomeria, 10 años de experiencia.',
    }),
    emp('EM-005', 'Fernando', 'Coca', '8156789', 'SC', 'Seguridad', '20/04/2025', {
        fechaNacimiento: '1992-04-30', celular: '78899001', correo: 'fernando.coca@gmail.com',
        direccion: 'Zona Queru Queru, calle Los Pinos 55, Cochabamba',
        contactoEmergencia: { nombre: 'Jorge Coca (padre)', celular: '77665544' },
        experiencia: 'Ex guardia de seguridad privada, curso de primeros auxilios.',
    }),
].map((e) => ({ ...e, salarioBase: salarioDesdeCargo(e.cargo) }));

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
// La planilla de los meses siguientes la genera el administrador con
// "Generar planilla" cuando el mes termina.
const planillaOctubre = (empleadoId, bonos, anticipos, otrosDesc, estado) => {
    const e = EMPLEADOS_MOCK.find((x) => x.id === empleadoId);
    const salarioBase = e ? e.salarioBase : 0;
    const neto = salarioBase + bonos - anticipos - otrosDesc;
    return { empleadoId, periodo: 'Octubre 2026', salarioBase, bonos, anticipos, otrosDesc, neto, estado };
};
export const PLANILLA_MOCK = [
    planillaOctubre('EM-001', 400, 300, 120, 'Calculado'), // Oscar    -> 4180, pendiente
    planillaOctubre('EM-002', 250, 400, 90, 'Pagada'),    // Juan     -> 2760, pagada
    planillaOctubre('EM-003', 300, 0, 84, 'Pagada'),    // Elena    -> 3016, pagada
    planillaOctubre('EM-004', 250, 350, 105, 'Revisar'),   // Ricardo  -> 3295, en revision
    planillaOctubre('EM-005', 0, 0, 102, 'Pagada'),    // Fernando -> 3298, pagada
];

// Pagos reales de Octubre 2026 (coherentes con PLANILLA_MOCK).
// Oscar y Ricardo NO estan aqui: aparecen como pendientes derivados.
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
// ------------------------------------------------------------
//  QUIEN ENTRA EN LA PLANILLA DE UN MES
//  - Debe haber ingresado antes de que termine el mes.
//  - Si esta Inactivo, solo entra en los meses que termino de trabajar:
//    la planilla del mes en que se le dio de baja (y siguientes) ya no lo incluye.
//    Los dias trabajados ese ultimo mes se pagan con el finiquito.
// ------------------------------------------------------------
const MESES_PL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const fechaDMY = (txt) => {
    const [d, m, a] = String(txt || '').split('/').map(Number);
    return a ? new Date(a, m - 1, d) : null;
};
const finDePeriodo = (periodo) => {
    const [mes, anio] = String(periodo || '').split(' ');
    return new Date(Number(anio), MESES_PL.indexOf(mes) + 1, 0); // ultimo dia del mes
};

export const empleadoTrabajoEnPeriodo = (emp, periodo) => {
    const fin = finDePeriodo(periodo);
    const ingreso = fechaDMY(emp.fechaIngreso);
    if (ingreso && ingreso > fin) return false;
    if (emp.estado === 'Activo') return true;
    const baja = fechaDMY(emp.fechaBaja);
    return !!baja && baja > fin; // se fue despues de terminar ese mes
};

export const empleadosParaPlanilla = (periodo) => EMPLEADOS_MOCK.filter((e) => empleadoTrabajoEnPeriodo(e, periodo));

// Empleados a los que se les puede registrar un pago: los activos y tambien
// los inactivos que todavia tienen una planilla sin pagar (se les debe).
export const empleadosPagables = () => EMPLEADOS_MOCK.filter((e) => e.estado === 'Activo'
    || PLANILLA_MOCK.some((p) => p.empleadoId === e.id && p.estado !== 'Pagada'));

// Genera las filas de planilla que falten para los meses cerrados.
// Ya no se llama sola: la planilla de un mes la genera el administrador con el
// boton "Generar planilla" cuando el mes termina (igual que las expensas).
export const asegurarPlanillaActualizada = () => {
    const periodos = periodosDisponibles();
    const existentes = new Set(PLANILLA_MOCK.map((f) => `${f.empleadoId}|${f.periodo}`));
    let agregadas = 0;
    periodos.forEach((periodo) => {
        empleadosParaPlanilla(periodo).forEach((emp) => {
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

// Un empleado con planilla o pagos registrados NO se puede eliminar (se perderia
// historial contable): se le da de baja (Inactivo). Solo se elimina uno registrado por error.
export const empleadoTieneHistorial = (id) => PLANILLA_MOCK.some((p) => p.empleadoId === id)
    || PAGOS_PERSONAL_MOCK.some((p) => p.empleadoId === id)
    || ANTICIPOS_PERSONAL_MOCK.some((a) => a.empleadoId === id);

export const eliminarEmpleado = (id) => {
    if (empleadoTieneHistorial(id)) return false;
    const i = EMPLEADOS_MOCK.findIndex((e) => e.id === id);
    if (i >= 0) EMPLEADOS_MOCK.splice(i, 1);
    return i >= 0;
};
