// ============================================================
//  PERIODOS (meses) DEL SISTEMA: FUENTE UNICA
//
//  El sistema empieza en Octubre 2026. Los selectores de periodo muestran
//  solo meses desde ese inicio hasta hoy (nunca meses vacios de antes ni
//  meses futuros). Se calculan con la fecha del sistema, asi que si se
//  cambia la fecha de la computadora para probar, aparecen los meses nuevos.
//
//  Dos reglas, segun lo que hace cada pantalla:
//    - periodosCerrados(): pantallas donde se GENERA algo del mes
//      (Generar expensa, Expensas, Planilla, Historial de pagos del personal).
//      El mes en curso no aparece: no se puede cobrar ni pagar un mes que no termino.
//    - periodosConMovimientos(): pantallas donde se CONSULTAN movimientos
//      (Pagos, Dashboard, Gestion financiera, Ingresos y gastos, Flujo de caja,
//      Conciliacion, Estado de cuenta). Incluye el mes en curso y se abre en el.
// ============================================================

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Inicio del sistema: Octubre 2026 (mes 0-indexado: 9)
export const PRIMER_PERIODO = { anio: 2026, mes: 9 };

// 'Octubre 2026'
export const nombrePeriodo = (anio, mes) => `${MESES[mes]} ${anio}`;

// Mes en curso segun la fecha del sistema: 'Noviembre 2026'
export const periodoEnCurso = (hoy = new Date()) => nombrePeriodo(hoy.getFullYear(), hoy.getMonth());

// Meses ya terminados desde el inicio hasta el mes anterior al actual (mas reciente primero).
// Hoy 9/nov/2026 -> ['Octubre 2026']
export const periodosCerrados = (hoy = new Date()) => {
    const periodos = [];
    let { anio, mes } = PRIMER_PERIODO;
    const limite = hoy.getFullYear() * 12 + hoy.getMonth(); // mes actual (no incluido)
    while (anio * 12 + mes < limite && periodos.length < 240) {
        periodos.push(nombrePeriodo(anio, mes));
        mes += 1;
        if (mes > 11) { mes = 0; anio += 1; }
    }
    return periodos.reverse();
};

// Mes en curso + meses cerrados (mas reciente primero).
// Hoy 9/nov/2026 -> ['Noviembre 2026', 'Octubre 2026']
export const periodosConMovimientos = (hoy = new Date()) => {
    const actual = hoy.getFullYear() * 12 + hoy.getMonth();
    const inicio = PRIMER_PERIODO.anio * 12 + PRIMER_PERIODO.mes;
    if (actual < inicio) return [];
    return [periodoEnCurso(hoy), ...periodosCerrados(hoy)];
};
