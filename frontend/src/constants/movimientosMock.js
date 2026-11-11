// Ingresos y gastos operativos del edificio. Montos en Bs.
//
// Aqui NO van los pagos de expensas (pagosMock.PAGOS_MOCK) ni los anticipos
// de copropietarios (pagosMock.HISTORIAL_ANTICIPOS).
//
// Hay dos fuentes de movimientos:
//   1) MOVIMIENTOS_LISTA: los que el administrador registra a mano
//      (servicios, mantenimiento, alquiler de areas comunes, etc.).
//   2) Gastos de PERSONAL: NO se escriben aqui. Salen solos de lo que se paga
//      en el modulo Personal (salarios, bonos, anticipos, finiquitos), asi el
//      gasto en sueldos siempre coincide con la planilla.
// Las pantallas usan todosLosMovimientos(), que junta ambas fuentes.

import { PAGOS_PERSONAL_MOCK, ANTICIPOS_PERSONAL_MOCK, cargoEmpleado } from './personalMock';

// Opciones de los selectores del formulario y filtros.
// 'Personal' la usan solo los gastos que vienen de la planilla.
export const TIPOS_MOVIMIENTO = ['Todos', 'Ingreso', 'Gasto'];
export const CATEGORIAS = ['Mantenimiento', 'Servicios basicos', 'Limpieza', 'Seguridad', 'Administracion', 'Personal', 'Otros'];
// Categorias que se pueden elegir al registrar un movimiento a mano
export const CATEGORIAS_MANUALES = CATEGORIAS.filter((c) => c !== 'Personal');

// Registra una categoria nueva (ej. 'Jardineria'). Aparece en Registrar movimiento
// y en los filtros de Ingresos y gastos. Devuelve un mensaje de error o null.
export const registrarCategoria = (nombre) => {
    const n = String(nombre || '').trim();
    if (!n) return 'Escribe el nombre de la categoria';
    if (n.length > 40) return 'Maximo 40 caracteres';
    if (CATEGORIAS.some((c) => c.toLowerCase() === n.toLowerCase())) return 'Esa categoria ya existe';
    CATEGORIAS.splice(CATEGORIAS.indexOf('Otros'), 0, n);              // antes de 'Otros'
    CATEGORIAS_MANUALES.splice(CATEGORIAS_MANUALES.indexOf('Otros'), 0, n);
    return null;
};

// Movimientos registrados a mano. tipo: 'Ingreso' | 'Gasto'
export const MOVIMIENTOS_LISTA = [
    // --- OTROS INGRESOS (no son pagos de expensas) ---
    { id: 4, fecha: '05/10/2026', tipo: 'Ingreso', categoria: 'Otros', descripcion: 'Alquiler salon de eventos', monto: 500, comprobante: 'recibo_salon_05oct.pdf', codigo: 'MOV-2026-10-005' },
    { id: 6, fecha: '16/10/2026', tipo: 'Ingreso', categoria: 'Otros', descripcion: 'Alquiler parrillero', monto: 200, comprobante: 'recibo_parrillero.pdf', codigo: 'MOV-2026-10-007' },
    { id: 7, fecha: '25/10/2026', tipo: 'Ingreso', categoria: 'Otros', descripcion: 'Alquiler salon de eventos', monto: 400, comprobante: 'recibo_salon_25oct.pdf', codigo: 'MOV-2026-10-008' },
    { id: 8, fecha: '28/10/2026', tipo: 'Ingreso', categoria: 'Otros', descripcion: 'Interes bancario cuenta de reserva', monto: 85, comprobante: 'estado_cuenta_banco.pdf', codigo: 'MOV-2026-10-009' },
    // --- EGRESOS operativos (los sueldos del personal NO van aqui) ---
    { id: 2, fecha: '03/10/2026', tipo: 'Gasto', categoria: 'Mantenimiento', descripcion: 'Reparacion del ascensor', monto: 3000, comprobante: 'factura_ascensor.pdf', codigo: 'MOV-2026-10-003' },
    { id: 3, fecha: '04/10/2026', tipo: 'Gasto', categoria: 'Servicios basicos', descripcion: 'Pago de electricidad', monto: 1000, comprobante: 'factura_luz.pdf', codigo: 'MOV-2026-10-004' },
    { id: 9, fecha: '06/10/2026', tipo: 'Gasto', categoria: 'Servicios basicos', descripcion: 'Pago de agua potable', monto: 650, comprobante: 'factura_agua.pdf', codigo: 'MOV-2026-10-010' },
    { id: 10, fecha: '08/10/2026', tipo: 'Gasto', categoria: 'Servicios basicos', descripcion: 'Internet comun del edificio', monto: 320, comprobante: 'factura_internet.pdf', codigo: 'MOV-2026-10-011' },
    { id: 11, fecha: '11/10/2026', tipo: 'Gasto', categoria: 'Mantenimiento', descripcion: 'Mantenimiento bomba de agua', monto: 450, comprobante: 'factura_bomba.pdf', codigo: 'MOV-2026-10-012' },
    { id: 12, fecha: '14/10/2026', tipo: 'Gasto', categoria: 'Limpieza', descripcion: 'Productos de limpieza', monto: 280, comprobante: 'factura_limpieza.pdf', codigo: 'MOV-2026-10-013' },
    { id: 14, fecha: '22/10/2026', tipo: 'Gasto', categoria: 'Administracion', descripcion: 'Honorarios contador externo octubre', monto: 600, comprobante: 'factura_contador.pdf', codigo: 'MOV-2026-10-015' },
    { id: 15, fecha: '28/10/2026', tipo: 'Gasto', categoria: 'Servicios basicos', descripcion: 'Gas comun del edificio', monto: 150, comprobante: 'factura_gas.pdf', codigo: 'MOV-2026-10-016' },
];

// Gastos de personal: cada pago confirmado en Personal (salario, bono,
// anticipo, finiquito) es un egreso en la fecha en que se pago.
// Los anticipos salariales de ANTICIPOS_PERSONAL_MOCK tambien son egresos
// (se entrego el dinero ese dia; despues se descuentan de la planilla).
export const gastosDePersonal = () => [
    ...PAGOS_PERSONAL_MOCK
        .filter((p) => p.estado === 'Pagado' && p.fecha)
        .map((p) => ({
            id: `PER-${p.id}`, fecha: p.fecha, tipo: 'Gasto', categoria: 'Personal',
            descripcion: `${p.concepto} ${p.periodo} — ${p.empleado} (${cargoEmpleado(p.empleadoId)})`,
            monto: Number(p.montoNeto) || 0,
            comprobante: p.referencia || 'Pago de planilla', codigo: p.id, origen: 'personal',
        })),
    ...ANTICIPOS_PERSONAL_MOCK.map((a) => ({
        id: `PER-${a.id}`, fecha: a.fecha, tipo: 'Gasto', categoria: 'Personal',
        descripcion: `Anticipo salarial — ${a.empleado} (${cargoEmpleado(a.empleadoId)})`,
        monto: Number(a.monto) || 0,
        comprobante: 'Anticipo de personal', codigo: a.id, origen: 'personal',
    })),
];

// Todos los movimientos (manuales + personal), del mas reciente al mas antiguo
export const todosLosMovimientos = () => [...MOVIMIENTOS_LISTA, ...gastosDePersonal()]
    .sort((a, b) => (b.fecha || '').split('/').reverse().join('').localeCompare((a.fecha || '').split('/').reverse().join('')));

// Busca un movimiento por id (numerico para los manuales, 'PER-...' para personal)
export const movimientoPorId = (id) => todosLosMovimientos().find((m) => String(m.id) === String(id)) ?? null;
