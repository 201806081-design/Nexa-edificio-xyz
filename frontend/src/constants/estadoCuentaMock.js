// Datos de prueba del estado de cuenta por departamento. Montos en Bs.

// Departamentos disponibles en el selector (etiqueta para mostrar + id)
export const DEPARTAMENTOS_CUENTA = [
    { id: '203', etiqueta: 'Depto. 203 -- 1 dormitorio -- piso 2' },
    { id: '302', etiqueta: 'Depto. 302 -- 2 dormitorios -- piso 3' },
];

// Estado de cuenta por departamento (indexado por id)
export const ESTADO_CUENTA_MOCK = {
    203: {
        departamento: 'Depto. 203',
        responsable: 'Carlos Mendoza -- Propietario',
        periodoConsultado: 'Todo el historial',
        resumen: { totalGenerado: 10500, saldoPendiente: 7000, totalPagado: 3500 },
        expensas: [
            { periodo: 'Septiembre 2026', monto: 350, pagado: 350, saldo: 0, estado: 'Pagado' },
            { periodo: 'Octubre 2026', monto: 350, pagado: 200, saldo: 150, estado: 'Pendiente' },
        ],
        pagos: [
            { fecha: '05/09/2026', periodo: 'Septiembre 2026', montoPagado: 350, saldoRestante: 0 },
            { fecha: '04/10/2026', periodo: 'Octubre 2026', montoPagado: 200, saldoRestante: 150 },
        ],
    },
    302: {
        departamento: 'Depto. 302',
        responsable: 'Ana Lopez -- Propietario',
        periodoConsultado: 'Todo el historial',
        resumen: { totalGenerado: 1050, saldoPendiente: 0, totalPagado: 1050 },
        expensas: [
            { periodo: 'Octubre 2026', monto: 350, pagado: 350, saldo: 0, estado: 'Pagado' },
        ],
        pagos: [
            { fecha: '01/10/2026', periodo: 'Octubre 2026', montoPagado: 350, saldoRestante: 0 },
        ],
    },
};