// Datos de prueba del estado de cuenta por departamento. Montos en Bs.

// Departamentos disponibles en el selector (etiqueta para mostrar + id)
export const DEPARTAMENTOS_CUENTA = [
    { id: '203', etiqueta: 'Depto. 203 -- 1 dormitorio -- piso 2' },
    { id: '302', etiqueta: 'Depto. 302 -- 2 dormitorios -- piso 3' },
];

// Opciones del selector de periodo
export const PERIODOS_CUENTA = [
    'Todos los periodos',
    'Octubre 2026',
    'Septiembre 2026',
    'Agosto 2026',
];

// Estado de cuenta por departamento (indexado por id).
// Cada fila del historial: base + agua + mora = total ; pagado ; saldo = total - pagado.
export const ESTADO_CUENTA_MOCK = {
    203: {
        departamento: 'Depto. 203',
        responsable: 'Carlos Mendoza -- Propietario',
        periodoConsultado: 'Todo el historial',
        resumen: { totalGenerado: 1080, totalPagado: 360, interesAcumulado: 36, saldoPendiente: 756 },
        historial: [
            { periodo: 'Agosto 2026', base: 300, agua: 60, mora: 36, total: 396, pagado: 0, saldo: 396, estado: 'Vencido' },
            { periodo: 'Septiembre 2026', base: 300, agua: 45, mora: 0, total: 345, pagado: 0, saldo: 345, estado: 'Pendiente' },
            { periodo: 'Octubre 2026', base: 300, agua: 39, mora: 0, total: 339, pagado: 339, saldo: 0, estado: 'Pagado' },
        ],
        detalleMora: 'Agosto: Bs 360 vencido * 10% mensual = Bs 36 de interes acumulado.',
    },
    302: {
        departamento: 'Depto. 302',
        responsable: 'Ana Lopez -- Propietario',
        periodoConsultado: 'Todo el historial',
        resumen: { totalGenerado: 415, totalPagado: 415, interesAcumulado: 0, saldoPendiente: 0 },
        historial: [
            { periodo: 'Octubre 2026', base: 400, agua: 15, mora: 0, total: 415, pagado: 415, saldo: 0, estado: 'Pagado' },
        ],
        detalleMora: 'Sin mora: el departamento no tiene periodos vencidos.',
    },
};