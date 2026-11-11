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
import { PAGOS_MOCK, HISTORIAL_ANTICIPOS } from './pagosMock';

// Opciones de los selectores del formulario y filtros.
export const TIPOS_MOVIMIENTO = ['Todos', 'Ingreso', 'Gasto'];

// Categorias de los pagos al personal: NO se registran a mano aqui. Se registran
// en Personal (Historial de pagos / Anticipos del mes) y aparecen solas en este libro,
// asi no se puede registrar dos veces el mismo pago.
export const CATEGORIAS_PERSONAL = ['Pago al personal', 'Anticipo al personal'];
export const CATEGORIAS = ['Mantenimiento', 'Servicios basicos', 'Limpieza', 'Seguridad', 'Administracion', ...CATEGORIAS_PERSONAL, 'Otros'];
// Categorias que se pueden elegir al registrar un movimiento a mano
export const CATEGORIAS_MANUALES = CATEGORIAS.filter((c) => !CATEGORIAS_PERSONAL.includes(c));

// Medio por el que entra o sale el dinero, y en que cuenta impacta.
// Efectivo -> Caja; el resto -> Banco (cuenta del edificio). Sirve para Caja y bancos.
export const MEDIOS_MOVIMIENTO = ['Efectivo', 'Transferencia', 'Cheque', 'QR', 'Deposito'];
export const CUENTAS = ['Caja', 'Banco'];
export const cuentaPorMedio = (medio) => (medio === 'Efectivo' ? 'Caja' : 'Banco');
// Texto del campo de referencia segun el medio
export const etiquetaReferencia = (medio) => ({
    Transferencia: 'N.º de transferencia', Cheque: 'N.º de cheque', QR: 'N.º de transaccion QR', Deposito: 'N.º de deposito',
}[medio] || 'N.º de recibo (opcional)');

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
    { id: 4, fecha: '05/10/2026', tipo: 'Ingreso', categoria: 'Otros', descripcion: 'Alquiler salon de eventos', monto: 500, comprobante: 'recibo_salon_05oct.pdf', codigo: 'MOV-2026-10-005',
      medio: 'Efectivo', cuenta: 'Caja', referencia: 'REC-0101' },
    { id: 6, fecha: '16/10/2026', tipo: 'Ingreso', categoria: 'Otros', descripcion: 'Alquiler parrillero', monto: 200, comprobante: 'recibo_parrillero.pdf', codigo: 'MOV-2026-10-007',
      medio: 'Efectivo', cuenta: 'Caja', referencia: 'REC-0102' },
    { id: 7, fecha: '25/10/2026', tipo: 'Ingreso', categoria: 'Otros', descripcion: 'Alquiler salon de eventos', monto: 400, comprobante: 'recibo_salon_25oct.pdf', codigo: 'MOV-2026-10-008',
      medio: 'QR', cuenta: 'Banco', referencia: 'QR-261025-01' },
    { id: 8, fecha: '28/10/2026', tipo: 'Ingreso', categoria: 'Otros', descripcion: 'Interes bancario cuenta de reserva', monto: 85, comprobante: 'estado_cuenta_banco.pdf', codigo: 'MOV-2026-10-009',
      medio: 'Deposito', cuenta: 'Banco', referencia: 'BNB-INT-1028' },
    // --- EGRESOS operativos (los sueldos del personal NO van aqui) ---
    { id: 2, fecha: '03/10/2026', tipo: 'Gasto', categoria: 'Mantenimiento', descripcion: 'Reparacion del ascensor', monto: 3000, comprobante: 'factura_ascensor.pdf', codigo: 'MOV-2026-10-003',
      medio: 'Cheque', cuenta: 'Banco', referencia: 'CH-000451' },
    { id: 3, fecha: '04/10/2026', tipo: 'Gasto', categoria: 'Servicios basicos', descripcion: 'Pago de electricidad', monto: 1000, comprobante: 'factura_luz.pdf', codigo: 'MOV-2026-10-004',
      medio: 'Transferencia', cuenta: 'Banco', referencia: 'TRF-261004-ELFEC' },
    { id: 9, fecha: '06/10/2026', tipo: 'Gasto', categoria: 'Servicios basicos', descripcion: 'Pago de agua potable', monto: 650, comprobante: 'factura_agua.pdf', codigo: 'MOV-2026-10-010',
      medio: 'Transferencia', cuenta: 'Banco', referencia: 'TRF-261006-SEMAPA' },
    { id: 10, fecha: '08/10/2026', tipo: 'Gasto', categoria: 'Servicios basicos', descripcion: 'Internet comun del edificio', monto: 320, comprobante: 'factura_internet.pdf', codigo: 'MOV-2026-10-011',
      medio: 'Transferencia', cuenta: 'Banco', referencia: 'TRF-261008-NET' },
    { id: 11, fecha: '11/10/2026', tipo: 'Gasto', categoria: 'Mantenimiento', descripcion: 'Mantenimiento bomba de agua', monto: 450, comprobante: 'factura_bomba.pdf', codigo: 'MOV-2026-10-012',
      medio: 'Efectivo', cuenta: 'Caja', referencia: 'REC-0203' },
    { id: 12, fecha: '14/10/2026', tipo: 'Gasto', categoria: 'Limpieza', descripcion: 'Productos de limpieza', monto: 280, comprobante: 'factura_limpieza.pdf', codigo: 'MOV-2026-10-013',
      medio: 'Efectivo', cuenta: 'Caja', referencia: 'REC-0204' },
    { id: 14, fecha: '22/10/2026', tipo: 'Gasto', categoria: 'Administracion', descripcion: 'Honorarios contador externo octubre', monto: 600, comprobante: 'factura_contador.pdf', codigo: 'MOV-2026-10-015',
      medio: 'Transferencia', cuenta: 'Banco', referencia: 'TRF-261022-CONT' },
    { id: 15, fecha: '28/10/2026', tipo: 'Gasto', categoria: 'Servicios basicos', descripcion: 'Gas comun del edificio', monto: 150, comprobante: 'factura_gas.pdf', codigo: 'MOV-2026-10-016',
      medio: 'Efectivo', cuenta: 'Caja', referencia: 'REC-0205' },
];

// Gastos de personal: cada pago confirmado en Personal (salario, bono,
// anticipo, finiquito) es un egreso en la fecha en que se pago.
// Categoria 'Pago al personal' (salario, bono, finiquito) o 'Anticipo al personal'.
// Los anticipos salariales de ANTICIPOS_PERSONAL_MOCK tambien son egresos
// (se entrego el dinero ese dia; despues se descuentan de la planilla).
export const gastosDePersonal = () => [
    ...PAGOS_PERSONAL_MOCK
        .filter((p) => p.estado === 'Pagado' && p.fecha)
        .map((p) => ({
            id: `PER-${p.id}`, fecha: p.fecha, tipo: 'Gasto',
            categoria: p.concepto === 'Anticipo' ? 'Anticipo al personal' : 'Pago al personal',
            descripcion: `${p.concepto} ${p.periodo} — ${p.empleado} (${cargoEmpleado(p.empleadoId)})`,
            monto: Number(p.montoNeto) || 0,
            medio: p.medio || 'Efectivo', cuenta: p.cuenta || cuentaPorMedio(p.medio), referencia: p.referencia || '',
            comprobante: p.comprobante?.name || (p.referencia ? `Pago ${p.referencia}` : 'Pago de planilla'),
            archivo: p.comprobante || null, codigo: p.id, origen: 'personal',
        })),
    ...ANTICIPOS_PERSONAL_MOCK.map((a) => ({
        id: `PER-${a.id}`, fecha: a.fecha, tipo: 'Gasto', categoria: 'Anticipo al personal',
        descripcion: `Anticipo salarial — ${a.empleado} (${cargoEmpleado(a.empleadoId)})`,
        monto: Number(a.monto) || 0,
        medio: 'Efectivo', cuenta: 'Caja', referencia: '',
        comprobante: 'Recibo de anticipo', codigo: a.id, origen: 'personal',
    })),
];

// Todos los movimientos (manuales + personal), del mas reciente al mas antiguo
export const todosLosMovimientos = () => [...MOVIMIENTOS_LISTA, ...gastosDePersonal()]
    .sort((a, b) => (b.fecha || '').split('/').reverse().join('').localeCompare((a.fecha || '').split('/').reverse().join('')));

// ============================================================
//  LIBRO DE INGRESOS Y GASTOS (base de caja)
//  Un movimiento existe cuando el dinero ENTRA o SALE de verdad:
//    - Cobro de expensa: cuando el copropietario paga (no cuando se genera la expensa).
//      Un pago hecho solo con credito a favor no es ingreso nuevo (el dinero ya
//      entro el dia del anticipo).
//    - Anticipo de copropietario: el dia que se recibe.
//    - Otros ingresos y gastos: los registrados a mano.
//    - Pagos y anticipos al personal: el dia que se pagan (desde Personal).
//  Los descuentos al personal NO son movimientos: bajan el neto que se le paga.
//  Las expensas generadas y los cargos extra son dinero POR COBRAR (saldo pendiente),
//  no ingresos, hasta que se pagan.
// ============================================================
export const CATEGORIAS_COBROS = ['Expensas', 'Anticipos de copropietarios'];
export const CATEGORIAS_FILTRO = [...CATEGORIAS_COBROS, ...CATEGORIAS];

const cobrosDeCopropietarios = () => [
    ...PAGOS_MOCK.filter((p) => (Number(p.monto) || 0) > 0).map((p) => ({
        id: `EXP-${p.id}`, fecha: p.fecha, tipo: 'Ingreso', categoria: 'Expensas',
        descripcion: `Pago ${p.id} — Depto. ${p.depto} (${p.periodoAplicado})`,
        monto: Number(p.monto) || 0,
        medio: p.medio, cuenta: cuentaPorMedio(p.medio), referencia: p.referencia || '',
        comprobante: p.referencia ? `Pago ${p.referencia}` : `Pago ${p.id}`, codigo: p.id, origen: 'pagos',
    })),
    ...HISTORIAL_ANTICIPOS.map((a) => ({
        id: `ANT-${a.id}`, fecha: a.fecha, tipo: 'Ingreso', categoria: 'Anticipos de copropietarios',
        descripcion: `Anticipo ${a.id} — Depto. ${a.depto}`,
        monto: Number(a.recibido) || 0,
        medio: a.medio, cuenta: cuentaPorMedio(a.medio), referencia: a.referencia || '',
        comprobante: a.referencia ? `Anticipo ${a.referencia}` : `Anticipo ${a.id}`, codigo: a.id, origen: 'pagos',
    })),
];

const ordenFecha = (f) => (f || '').split('/').reverse().join('');

// Libro completo: cobros + otros ingresos + gastos (incluye personal), mas reciente primero
export const libroDiario = () => [...cobrosDeCopropietarios(), ...todosLosMovimientos()]
    .sort((a, b) => ordenFecha(b.fecha).localeCompare(ordenFecha(a.fecha)));

// Resumen de un periodo ('Noviembre 2026'). UNA sola formula para Dashboard,
// Gestion financiera, Flujo de caja e Ingresos y gastos.
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const enPeriodo = (fecha, periodo) => {
    const [, m, a] = String(fecha || '').split('/').map(Number);
    const [mes, anio] = String(periodo || '').split(' ');
    return m === MESES.indexOf(mes) + 1 && a === Number(anio);
};
export const resumenFinanciero = (periodo) => {
    const movs = libroDiario().filter((m) => enPeriodo(m.fecha, periodo));
    const suma = (fn) => movs.filter(fn).reduce((s, m) => s + (m.monto || 0), 0);
    const cobrosExpensas = suma((m) => m.categoria === 'Expensas');
    const anticiposRecibidos = suma((m) => m.categoria === 'Anticipos de copropietarios');
    const ingresos = suma((m) => m.tipo === 'Ingreso');
    const otrosIngresos = ingresos - cobrosExpensas - anticiposRecibidos;
    const gastosPersonal = suma((m) => CATEGORIAS_PERSONAL.includes(m.categoria));
    const gastos = suma((m) => m.tipo !== 'Ingreso');
    return {
        ingresos, cobrosExpensas, anticiposRecibidos, otrosIngresos,
        gastos, gastosPersonal, gastosOperativos: gastos - gastosPersonal,
        balance: ingresos - gastos,
        enCaja: suma((m) => m.tipo === 'Ingreso' && m.cuenta === 'Caja') - suma((m) => m.tipo !== 'Ingreso' && m.cuenta === 'Caja'),
        enBanco: suma((m) => m.tipo === 'Ingreso' && m.cuenta === 'Banco') - suma((m) => m.tipo !== 'Ingreso' && m.cuenta === 'Banco'),
    };
};

// Busca un movimiento por id en el libro completo
export const movimientoPorId = (id) => libroDiario().find((m) => String(m.id) === String(id)) ?? null;
