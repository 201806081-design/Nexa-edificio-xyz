// Datos de prueba de mora y pagos anticipados. Montos en Bs.

// Totales superiores de la lista
export const RESUMEN_MORA = {
    deudasVencidas: 1057,
    interesAcumulado: 21,
    saldoAFavor: 1050,
};

// Saldos vencidos (deudas con mora). estado: 'Vencido'
export const SALDOS_VENCIDOS = [
    { id: 1, departamento: 'Depto. 101', periodo: 'Septiembre 2026', capital: 350, interes: 7, totalPendiente: 357, estado: 'Vencido' },
    { id: 2, departamento: 'Depto. 304', periodo: 'Septiembre 2026', capital: 700, interes: 14, totalPendiente: 714, estado: 'Vencido' },
];

// Pagos anticipados registrados. estado: 'Anticipado'
export const PAGOS_ANTICIPADOS = [
    { id: 1, fecha: '01/10/2026', departamento: 'Depto. 302', capital: 1050, periodosCubiertos: 'Noviembre-Enero', saldoAFavor: 1050, estado: 'Anticipado' },
];

// Configuracion de interes por mora (valores por defecto del formulario)
export const CONFIG_INTERES = {
    activo: true,
    tipoInteres: 'Porcentaje mensual',
    porcentaje: 2,
    diasGracia: 5,
    aplicarDesde: 'Periodo vencido',
};

export const TIPOS_INTERES = ['Porcentaje mensual', 'Monto fijo'];
export const APLICAR_DESDE = ['Periodo vencido', 'Fecha de vencimiento'];

// Departamentos para el selector de "Registrar pago anticipado"
export const DEPARTAMENTOS_ANTICIPO = [
    { id: '302', etiqueta: 'Depto. 302 -- 2 dormitorios -- Piso 3', responsable: 'Ana Lopez -- Propietario', expensaMensual: 350 },
    { id: '101', etiqueta: 'Depto. 101 -- 1 dormitorio -- Piso 1', responsable: 'Carlos Mendoza -- Propietario', expensaMensual: 350 },
];

export const MESES_APLICA = ['Noviembre 2026', 'Diciembre 2026', 'Enero 2027', 'Febrero 2027'];

// Detalle de un pago anticipado (para la pantalla de detalle)
export const DETALLE_ANTICIPO = {
    codigo: 'ANT-2026-10-302-001',
    departamento: 'Depto. 302',
    responsable: 'Ana Lopez -- Propietario',
    fechaPago: '01/10/2026',
    montoAnticipado: 1050,
    deudaPendiente: 0,
    saldoAFavor: 1050,
    aplicacion: [
        { periodo: 'Noviembre 2026', monto: 350, estado: 'Cubierta anticipadamente' },
        { periodo: 'Diciembre 2026', monto: 350, estado: 'Cubierta anticipadamente' },
        { periodo: 'Enero 2027', monto: 350, estado: 'Cubierta anticipadamente' },
    ],
};