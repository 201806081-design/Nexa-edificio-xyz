// ============================================================
//  CAJA Y BANCOS (requisito 7)
//
//  El edificio maneja su dinero en dos lugares:
//    - Caja General: el efectivo que guarda el administrador.
//    - Una cuenta bancaria: recibe TODO lo que no es efectivo
//      (transferencias, QR, cheques y depositos).
//
//  Los movimientos NO se escriben dos veces: salen del libro de ingresos y
//  gastos (pagos de expensas, anticipos, gastos, sueldos) segun su cuenta
//  ('Caja' o 'Banco'). Aqui solo se guardan:
//    - las cuentas bancarias registradas (con su historial),
//    - los traspasos entre caja y banco (no son ingreso ni gasto),
//    - los arqueos de caja.
//  Las comisiones e intereses del banco se registran aqui pero se guardan en
//  el libro (MOVIMIENTOS_LISTA), porque si son gasto o ingreso del edificio.
//
//  Misma forma que el modelo Cuenta del backend (tipo CAJA | BANCO, banco,
//  nroCuenta, saldoInicial, activa). Saldos iniciales del seed del backend.
//
//  PENDIENTE BACKEND: POST /financiero/cuentas, PATCH /financiero/cuentas/:id
//  (activa = false al eliminar), traspasos y arqueos.
// ============================================================

import { libroDiario, MOVIMIENTOS_LISTA, CATEGORIAS_BANCO, enPeriodo, resumenFinanciero } from './movimientosMock';
import {
    MESES, PRIMER_PERIODO, TODOS_LOS_PERIODOS, nombrePeriodo, esPeriodoAnual, anioDePeriodo,
} from './periodos';
import { formatBs } from './finanzasMock';

// ------------------------------------------------------------
//  FECHAS ('DD/MM/AAAA', el formato de todos los mocks)
// ------------------------------------------------------------

const dosDigitos = (n) => String(n).padStart(2, '0');

export const fechaTexto = (d = new Date()) => `${dosDigitos(d.getDate())}/${dosDigitos(d.getMonth() + 1)}/${d.getFullYear()}`;
// 'DD/MM/AAAA' -> 'AAAAMMDD' (para comparar y ordenar)
export const claveFecha = (f) => String(f || '').split('/').reverse().join('');
// '2026-11-18' <-> '18/11/2026' (para los campos type="date")
export const isoATexto = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
export const textoAIso = (texto) => (texto ? texto.split('/').reverse().join('-') : '');

// Primer dia de un periodo: 'Noviembre 2026' -> '20261101' | 'Año 2026' -> '20260101'
export const inicioPeriodo = (periodo) => {
    if (esPeriodoAnual(periodo)) return `${anioDePeriodo(periodo)}0101`;
    const [mes, anio] = String(periodo || '').split(' ');
    return `${anio}${dosDigitos(MESES.indexOf(mes) + 1)}01`;
};

// Fecha de corte de un periodo ('DD/MM/AAAA'): su ultimo dia, o hoy si todavia no termino
export const fechaCorte = (periodo, hoy = new Date()) => {
    if (periodo === TODOS_LOS_PERIODOS) return fechaTexto(hoy);
    const inicio = inicioPeriodo(periodo);
    const anio = Number(inicio.slice(0, 4));
    const mes = Number(inicio.slice(4, 6)) - 1;
    const fin = esPeriodoAnual(periodo) ? new Date(anio, 11, 31) : new Date(anio, mes + 1, 0);
    return fechaTexto(fin < hoy ? fin : hoy);
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Inicio de operaciones del sistema
export const INICIO_SISTEMA = '01/10/2026';

// ------------------------------------------------------------
//  CAJA
// ------------------------------------------------------------

export const CAJA = { id: 'CAJA', nombre: 'Caja General', saldoInicial: 1500, desde: INICIO_SISTEMA };

// ------------------------------------------------------------
//  CUENTAS BANCARIAS
//  El edificio puede tener VARIAS cuentas a la vez. Una de ellas es la
//  PRINCIPAL: la que recibe los cobros y pagos por QR, transferencia,
//  cheque o deposito. Las demas solo tienen lo que se registre en ellas
//  (depositos desde caja, retiros, comisiones, intereses).
//
//  HISTORIAL_PRINCIPAL dice que cuenta era la principal en cada fecha, asi
//  cambiar de principal no mueve los cobros pasados a otra cuenta.
//
//  Eliminar una cuenta la quita junto con lo registrado en ella. Si era la
//  principal, sus cobros y pagos pasan a otra cuenta (o a la proxima que se
//  registre, si no queda ninguna).
// ------------------------------------------------------------

export const BANCOS_BOLIVIA = [
    'Banco Unión', 'Banco Mercantil Santa Cruz', 'Banco Nacional de Bolivia', 'Banco de Crédito de Bolivia',
    'Banco BISA', 'Banco Económico', 'Banco Ganadero', 'Banco FIE', 'BancoSol', 'Banco Fortaleza',
    'Banco Pyme de la Comunidad', 'Banco Prodem',
];
export const TIPOS_CUENTA_BANCARIA = ['Cuenta corriente', 'Caja de ahorro'];

// Cuenta de ejemplo con la que arranca el sistema (la del seed del backend)
export const CUENTAS_BANCARIAS = [
    {
        id: 'BCO-001', banco: 'Banco Unión', nroCuenta: '1000-2345-6789', tipoCuenta: 'Cuenta corriente',
        moneda: 'Bolivianos', titular: 'Edificio XYZ', saldoInicial: 25000,
        desde: INICIO_SISTEMA, activa: true, ejemplo: true,
    },
];

// Que cuenta era la principal desde cada fecha (ordenado por fecha)
const HISTORIAL_PRINCIPAL = [{ cuentaId: 'BCO-001', desde: INICIO_SISTEMA }];

// Ultimos 4 digitos del numero de cuenta: '1000-2345-6789' -> '6789'
export const ultimosDigitos = (nro) => String(nro || '').replace(/\D/g, '').slice(-4);

// 'Banco Unión · 6789'
export const etiquetaCuenta = (c) => (c ? `${c.banco} · ${ultimosDigitos(c.nroCuenta)}` : '');

// Codigo corto para el QR: 'BANCO-UNION-6789'
export const codigoCuenta = (c) => (c
    ? `${c.banco.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, '-')}-${ultimosDigitos(c.nroCuenta)}`
    : 'SIN-CUENTA');

export const cuentaBancariaPorId = (id) => CUENTAS_BANCARIAS.find((c) => c.id === id) ?? null;

// Cuentas registradas (sin las eliminadas), en el orden en que se registraron
export const cuentasBancarias = () => CUENTAS_BANCARIAS.filter((c) => c.activa);

// Cuenta principal en una fecha 'DD/MM/AAAA' (null si no habia ninguna)
export const cuentaPrincipalEn = (fecha) => {
    const f = claveFecha(fecha);
    const tramo = HISTORIAL_PRINCIPAL.filter((h) => claveFecha(h.desde) <= f).at(-1);
    return tramo ? cuentaBancariaPorId(tramo.cuentaId) : null;
};

// Cuenta principal hoy: la que recibe los cobros y pagos por banco
export const cuentaPrincipal = () => {
    const actual = HISTORIAL_PRINCIPAL.at(-1);
    return actual ? cuentaBancariaPorId(actual.cuentaId) : null;
};

export const esPrincipal = (cuentaId) => cuentaPrincipal()?.id === cuentaId;

const ordenarHistorial = () => HISTORIAL_PRINCIPAL.sort((a, b) => claveFecha(a.desde).localeCompare(claveFecha(b.desde)));

// La cuenta pasa a ser la principal desde una fecha (los cobros anteriores no se mueven)
const hacerPrincipalDesde = (cuentaId, desde) => {
    for (let i = HISTORIAL_PRINCIPAL.length - 1; i >= 0; i--) {
        if (claveFecha(HISTORIAL_PRINCIPAL[i].desde) >= claveFecha(desde)) HISTORIAL_PRINCIPAL.splice(i, 1);
    }
    HISTORIAL_PRINCIPAL.push({ cuentaId, desde });
    ordenarHistorial();
};

// Marca una cuenta como principal desde hoy
export const usarComoPrincipal = (cuentaId) => {
    if (!cuentaBancariaPorId(cuentaId)?.activa || esPrincipal(cuentaId)) return;
    hacerPrincipalDesde(cuentaId, fechaTexto());
};

// Valida los datos del formulario. Devuelve { campo: 'mensaje' } (vacio si esta bien)
export const validarCuentaBancaria = (datos) => {
    const err = {};
    if (!String(datos.banco || '').trim()) err.banco = 'Indica el banco';
    const digitos = String(datos.nroCuenta || '').replace(/\D/g, '');
    if (digitos.length < 6 || digitos.length > 20) err.nroCuenta = 'Entre 6 y 20 digitos';
    else if (cuentasBancarias().some((c) => String(c.nroCuenta).replace(/\D/g, '') === digitos)) {
        err.nroCuenta = 'Esa cuenta ya esta registrada';
    }
    if (!TIPOS_CUENTA_BANCARIA.includes(datos.tipoCuenta)) err.tipoCuenta = 'Elige el tipo de cuenta';
    if (!String(datos.titular || '').trim()) err.titular = 'Indica el titular';
    const saldo = Number(datos.saldoInicial);
    if (datos.saldoInicial === '' || !Number.isFinite(saldo) || saldo < 0) err.saldoInicial = 'Saldo valido (puede ser 0)';
    if (!datos.desde) err.desde = 'Indica la fecha';
    else if (claveFecha(datos.desde) < claveFecha(INICIO_SISTEMA)) err.desde = `No puede ser antes del inicio del sistema (${INICIO_SISTEMA})`;
    else if (claveFecha(datos.desde) > claveFecha(fechaTexto())) err.desde = 'No puede ser una fecha futura';
    return err;
};

const siguienteId = (lista, prefijo) => {
    const n = lista.reduce((max, x) => Math.max(max, Number(String(x.id).replace(/\D/g, '')) || 0), 0) + 1;
    return `${prefijo}-${String(n).padStart(3, '0')}`;
};

// Registra una cuenta y la AGREGA a las existentes (no reemplaza a ninguna).
//   principal: true -> recibe los cobros y pagos por banco desde su fecha.
// Si no habia ninguna cuenta, es la principal y recibe tambien los cobros
// y pagos que quedaron sin cuenta.
export const registrarCuentaBancaria = (datos) => {
    const habiaCuentas = cuentasBancarias().length > 0;
    const nueva = {
        id: siguienteId(CUENTAS_BANCARIAS, 'BCO'),
        banco: datos.banco.trim(),
        nroCuenta: datos.nroCuenta.trim(),
        tipoCuenta: datos.tipoCuenta,
        moneda: 'Bolivianos', // moneda del sistema
        titular: datos.titular.trim(),
        saldoInicial: round2(datos.saldoInicial),
        desde: datos.desde,
        activa: true,
        ejemplo: false,
    };
    CUENTAS_BANCARIAS.push(nueva);
    if (!habiaCuentas) hacerPrincipalDesde(nueva.id, INICIO_SISTEMA);
    else if (datos.principal) hacerPrincipalDesde(nueva.id, nueva.desde);
    return nueva;
};

const fuePrincipal = (cuentaId) => HISTORIAL_PRINCIPAL.some((h) => h.cuentaId === cuentaId);

// Lo que pasara al eliminar una cuenta (para avisar antes)
export const resumenEliminacion = (cuentaId) => ({
    registrados: TRASPASOS.filter((t) => t.cuentaId === cuentaId).length
        + MOVIMIENTOS_LISTA.filter((m) => m.cuentaId === cuentaId).length,
    principal: esPrincipal(cuentaId),
    recibioCobros: fuePrincipal(cuentaId),
    sucesora: cuentasBancarias().find((c) => c.id !== cuentaId) ?? null,
});

// Elimina una cuenta y lo registrado en ella (depositos, retiros, comisiones,
// intereses). Si recibio cobros y pagos (fue la principal), esos cobros y su
// saldo inicial pasan a otra cuenta registrada, asi el dinero no desaparece;
// si no queda ninguna, quedan sin cuenta hasta que se registre otra.
export const eliminarCuentaBancaria = (id) => {
    const cuenta = cuentaBancariaPorId(id);
    if (!cuenta || !cuenta.activa) return;
    cuenta.activa = false;
    for (let i = TRASPASOS.length - 1; i >= 0; i--) if (TRASPASOS[i].cuentaId === id) TRASPASOS.splice(i, 1);
    for (let i = MOVIMIENTOS_LISTA.length - 1; i >= 0; i--) if (MOVIMIENTOS_LISTA[i].cuentaId === id) MOVIMIENTOS_LISTA.splice(i, 1);

    const sucesora = cuentasBancarias()[0];
    if (sucesora && fuePrincipal(id)) sucesora.saldoInicial = round2(sucesora.saldoInicial + cuenta.saldoInicial);
    for (let i = HISTORIAL_PRINCIPAL.length - 1; i >= 0; i--) {
        if (HISTORIAL_PRINCIPAL[i].cuentaId !== id) continue;
        if (sucesora) HISTORIAL_PRINCIPAL[i].cuentaId = sucesora.id;
        else HISTORIAL_PRINCIPAL.splice(i, 1);
    }
    // Tramos seguidos de la misma cuenta se unen en uno
    for (let i = HISTORIAL_PRINCIPAL.length - 1; i > 0; i--) {
        if (HISTORIAL_PRINCIPAL[i].cuentaId === HISTORIAL_PRINCIPAL[i - 1].cuentaId) HISTORIAL_PRINCIPAL.splice(i, 1);
    }
};

// ------------------------------------------------------------
//  TRASPASOS ENTRE CAJA Y BANCO
//  Mover dinero propio de un lugar a otro: no es ingreso ni gasto,
//  solo cambia cuanto hay en cada lugar.
// ------------------------------------------------------------

export const TRASPASOS = [];

// ------------------------------------------------------------
//  MOVIMIENTOS QUE SE REGISTRAN DESDE EL EXTRACTO DEL BANCO
// ------------------------------------------------------------

export const TIPOS_MOV_BANCARIO = {
    DEPOSITO: 'Deposito desde caja',
    RETIRO: 'Retiro a caja',
    COMISION: 'Comision o cargo bancario',
    INTERES: 'Interes ganado',
};
export const OPCIONES_MOV_BANCARIO = Object.values(TIPOS_MOV_BANCARIO);

// Si el movimiento entra (+) o sale (-) del banco
export const entraAlBanco = (tipo) => tipo === TIPOS_MOV_BANCARIO.DEPOSITO || tipo === TIPOS_MOV_BANCARIO.INTERES;

// ------------------------------------------------------------
//  LIBROS DE CAJA Y DE BANCO
//  Movimiento: { id, fecha, tipo: 'Ingreso'|'Egreso', concepto, descripcion,
//                referencia, monto, sistemaRef, depto, origen }
// ------------------------------------------------------------

const desdeLibro = (m) => ({
    id: `LIB-${m.id}`,
    fecha: m.fecha,
    tipo: m.tipo === 'Ingreso' ? 'Ingreso' : 'Egreso',
    concepto: m.categoria,
    descripcion: m.descripcion,
    referencia: m.referencia || '',
    monto: Number(m.monto) || 0,
    sistemaRef: m.codigo ?? m.id,
    depto: m.descripcion?.match(/Depto\. (\w+)/)?.[1] ?? null,
    origen: m.origen === 'banco' ? 'extracto' : 'sistema',
    cuentaId: m.cuentaId ?? null, // solo los registrados desde el extracto la tienen
});

const traspasoEnCaja = (t) => ({
    id: `CJ-${t.id}`, fecha: t.fecha,
    tipo: t.origen === 'Caja' ? 'Egreso' : 'Ingreso',
    concepto: t.origen === 'Caja' ? 'Deposito al banco' : 'Retiro del banco',
    descripcion: t.descripcion, referencia: t.referencia, monto: t.monto,
    sistemaRef: t.id, depto: null, origen: 'traspaso',
});

const traspasoEnBanco = (t) => ({
    id: `BK-${t.id}`, fecha: t.fecha,
    tipo: t.origen === 'Caja' ? 'Ingreso' : 'Egreso',
    concepto: t.origen === 'Caja' ? TIPOS_MOV_BANCARIO.DEPOSITO : TIPOS_MOV_BANCARIO.RETIRO,
    descripcion: t.descripcion, referencia: t.referencia, monto: t.monto,
    sistemaRef: t.id, depto: null, origen: 'traspaso', cuentaId: t.cuentaId,
});

const porFechaAsc = (a, b) => claveFecha(a.fecha).localeCompare(claveFecha(b.fecha));

// Movimientos de caja, del mas antiguo al mas reciente
export const movimientosCaja = () => [
    ...libroDiario().filter((m) => m.cuenta === 'Caja').map(desdeLibro),
    ...TRASPASOS.map(traspasoEnCaja),
].filter((m) => claveFecha(m.fecha) >= claveFecha(CAJA.desde)).sort(porFechaAsc);

// Todos los movimientos por banco con la cuenta a la que pertenecen:
// los registrados en una cuenta (depositos, retiros, comisiones, intereses)
// son de esa cuenta; los cobros y pagos por banco, de la principal de su fecha.
const movimientosPorBanco = () => [
    ...libroDiario().filter((m) => m.cuenta === 'Banco').map(desdeLibro),
    ...TRASPASOS.map(traspasoEnBanco),
].map((m) => ({ ...m, cuentaId: m.cuentaId ?? cuentaPrincipalEn(m.fecha)?.id ?? null }));

// Movimientos de una cuenta bancaria, del mas antiguo al mas reciente
export const movimientosBanco = (cuentaId) => movimientosPorBanco()
    .filter((m) => m.cuentaId === cuentaId).sort(porFechaAsc);

// Cobros y pagos por banco que no tienen cuenta (se eliminaron todas las cuentas)
export const movimientosSinCuenta = () => movimientosPorBanco()
    .filter((m) => !m.cuentaId || !cuentaBancariaPorId(m.cuentaId)?.activa).sort(porFechaAsc);

const neto = (movs) => round2(movs.reduce((s, m) => s + (m.tipo === 'Ingreso' ? m.monto : -m.monto), 0));

// Saldo hoy
export const saldoCaja = () => round2(CAJA.saldoInicial + neto(movimientosCaja()));
export const saldoBanco = (cuentaId) => {
    const cuenta = cuentaBancariaPorId(cuentaId);
    return cuenta?.activa ? round2(cuenta.saldoInicial + neto(movimientosBanco(cuentaId))) : 0;
};

// Suma de todas las cuentas registradas
export const saldoBancos = () => round2(cuentasBancarias().reduce((s, c) => s + saldoBanco(c.id), 0));

// Saldo de todas las cuentas al cierre de una fecha
export const saldoBancoAl = (fecha) => round2(cuentasBancarias().reduce((s, c) => s + c.saldoInicial
    + neto(movimientosBanco(c.id).filter((m) => claveFecha(m.fecha) <= claveFecha(fecha))), 0));

// Libro de un periodo con saldo acumulado en cada fila.
// Devuelve { saldoInicial, ingresos, egresos, saldoFinal, filas } (filas: mas reciente primero)
export const libroDelPeriodo = (movs, saldoApertura, periodo) => {
    const inicio = inicioPeriodo(periodo);
    const saldoInicial = round2(saldoApertura + neto(movs.filter((m) => claveFecha(m.fecha) < inicio)));
    let saldo = saldoInicial;
    const filas = movs.filter((m) => enPeriodo(m.fecha, periodo)).map((m) => {
        saldo = round2(saldo + (m.tipo === 'Ingreso' ? m.monto : -m.monto));
        return { ...m, saldo };
    });
    const suma = (tipo) => round2(filas.filter((m) => m.tipo === tipo).reduce((s, m) => s + m.monto, 0));
    return { saldoInicial, ingresos: suma('Ingreso'), egresos: suma('Egreso'), saldoFinal: saldo, filas: filas.reverse() };
};

// ------------------------------------------------------------
//  SALDO DE APERTURA
//  Dinero con el que el edificio empezo a usar el sistema (01/10/2026):
//  lo que habia en caja y en la cuenta bancaria ese dia. NO es un ingreso
//  (no se cobro en octubre); es el punto de partida. En el backend es el
//  asiento de apertura contra el Fondo comun (POST /contabilidad/apertura).
//
//  Cuadre: apertura + ingresos - gastos = caja + banco
// ------------------------------------------------------------

export const PRIMER_MES = nombrePeriodo(PRIMER_PERIODO.anio, PRIMER_PERIODO.mes);

// Caja + saldo inicial de cada cuenta registrada
export const saldoApertura = () => {
    const cuentas = cuentasBancarias();
    const banco = round2(cuentas.reduce((s, c) => s + c.saldoInicial, 0));
    return { fecha: INICIO_SISTEMA, caja: CAJA.saldoInicial, banco, cuentas, total: round2(CAJA.saldoInicial + banco) };
};

// Punto mas bajo al que llega el saldo si se parte de 0: { monto, fecha }
const puntoMasBajo = (movs) => {
    let saldo = 0;
    let minimo = { monto: 0, fecha: null };
    movs.forEach((m) => {
        saldo = round2(saldo + (m.tipo === 'Ingreso' ? m.monto : -m.monto));
        if (saldo < minimo.monto) minimo = { monto: saldo, fecha: m.fecha };
    });
    return minimo;
};

// Valida { caja, [cuentaId]: saldo }: montos validos y que con ellos ningun saldo quede negativo
export const validarSaldosApertura = (saldos) => {
    const err = {};
    const revisar = (campo, valor, movs, lugar) => {
        const n = Number(valor);
        if (valor === '' || !Number.isFinite(n) || n < 0) { err[campo] = 'Ingresa un monto valido (puede ser 0)'; return; }
        const bajo = puntoMasBajo(movs);
        if (n + bajo.monto < -0.005) {
            err[campo] = `Con ese monto ${lugar} quedaria en negativo el ${bajo.fecha}. Minimo: ${formatBs(round2(-bajo.monto))}`;
        }
    };
    revisar('caja', saldos.caja, movimientosCaja(), 'la caja');
    cuentasBancarias().forEach((c) => revisar(c.id, saldos[c.id], movimientosBanco(c.id), etiquetaCuenta(c)));
    return err;
};

export const editarSaldosApertura = (saldos) => {
    CAJA.saldoInicial = round2(saldos.caja);
    cuentasBancarias().forEach((c) => { c.saldoInicial = round2(saldos[c.id]); });
};

// Cuadre de fondos de un periodo (o de todos):
//   saldoInicial + ingresos - gastos = saldoFinal (= caja + banco)
// Ingresos y gastos son los mismos del Resumen y de Ingresos y gastos.
export const fondosDelPeriodo = (periodo) => {
    const apertura = saldoApertura();
    const todos = periodo === TODOS_LOS_PERIODOS;
    const { ingresos, gastos } = resumenFinanciero(periodo);
    const antes = todos ? 0 : round2(libroDiario()
        .filter((m) => claveFecha(m.fecha) < inicioPeriodo(periodo))
        .reduce((s, m) => s + (m.tipo === 'Ingreso' ? m.monto : -m.monto), 0));
    const saldoInicial = round2(apertura.total + antes);
    const saldoFinal = round2(saldoInicial + ingresos - gastos);
    const caja = todos ? saldoCaja() : libroDelPeriodo(movimientosCaja(), CAJA.saldoInicial, periodo).saldoFinal;
    return {
        esApertura: todos || periodo === PRIMER_MES || (esPeriodoAnual(periodo) && anioDePeriodo(periodo) === PRIMER_PERIODO.anio),
        apertura, saldoInicial, ingresos, gastos, saldoFinal,
        caja, banco: round2(saldoFinal - caja),
    };
};

// ------------------------------------------------------------
//  REGISTRAR UN MOVIMIENTO DEL BANCO (extracto)
// ------------------------------------------------------------

// Valida { tipo, fecha, monto, referencia, descripcion }. Devuelve { campo: 'mensaje' }
export const validarMovimientoBancario = (datos, cuentaId) => {
    const err = {};
    if (!OPCIONES_MOV_BANCARIO.includes(datos.tipo)) err.tipo = 'Elige el tipo de movimiento';
    if (!datos.fecha) err.fecha = 'Indica la fecha';
    else if (claveFecha(datos.fecha) > claveFecha(fechaTexto())) err.fecha = 'No puede ser una fecha futura';
    else if (claveFecha(datos.fecha) < claveFecha(cuentaBancariaPorId(cuentaId)?.desde ?? INICIO_SISTEMA)) {
        err.fecha = 'Es anterior a la fecha de apertura de la cuenta';
    }
    const monto = Number(datos.monto);
    if (!(monto > 0)) err.monto = 'Ingresa un monto mayor a 0';
    else if (datos.tipo === TIPOS_MOV_BANCARIO.DEPOSITO && monto > saldoCaja()) err.monto = 'Es mas de lo que hay en caja';
    else if (!entraAlBanco(datos.tipo) && monto > saldoBanco(cuentaId)) err.monto = 'Es mas de lo que hay en el banco';
    if (!String(datos.descripcion || '').trim()) err.descripcion = 'Agrega una descripcion';
    return err;
};

// Depositos y retiros -> traspaso. Comisiones e intereses -> libro de ingresos y gastos.
export const registrarMovimientoBancario = (datos, cuentaId) => {
    const base = {
        fecha: datos.fecha, monto: round2(datos.monto),
        referencia: String(datos.referencia || '').trim(), descripcion: datos.descripcion.trim(),
    };
    if (datos.tipo === TIPOS_MOV_BANCARIO.DEPOSITO || datos.tipo === TIPOS_MOV_BANCARIO.RETIRO) {
        TRASPASOS.push({
            ...base, id: siguienteId(TRASPASOS, 'TRP'), cuentaId,
            origen: datos.tipo === TIPOS_MOV_BANCARIO.DEPOSITO ? 'Caja' : 'Banco',
        });
        return;
    }
    const esInteres = datos.tipo === TIPOS_MOV_BANCARIO.INTERES;
    MOVIMIENTOS_LISTA.unshift({
        ...base,
        id: Date.now(),
        tipo: esInteres ? 'Ingreso' : 'Gasto',
        categoria: esInteres ? CATEGORIAS_BANCO.INGRESO : CATEGORIAS_BANCO.GASTO,
        medio: 'Transferencia', cuenta: 'Banco', cuentaId,
        comprobante: 'Extracto bancario', archivo: null,
        codigo: `MOV-${textoAIso(datos.fecha).slice(0, 7)}-${String(MOVIMIENTOS_LISTA.length + 1).padStart(3, '0')}`,
        origen: 'banco',
    });
};

// ------------------------------------------------------------
//  ARQUEO DE CAJA
//  Contar el efectivo y compararlo con el saldo del sistema.
// ------------------------------------------------------------

// Billetes y monedas en circulacion en Bolivia
export const DENOMINACIONES = {
    billetes: [200, 100, 50, 20, 10],
    monedas: [5, 2, 1, 0.5, 0.2, 0.1],
};

export const ARQUEOS = [];

// Saldo de caja al cierre de una fecha 'DD/MM/AAAA'
export const saldoCajaAl = (fecha) => round2(CAJA.saldoInicial
    + neto(movimientosCaja().filter((m) => claveFecha(m.fecha) <= claveFecha(fecha))));

// Total contado a partir de { denominacion: cantidad }
export const totalContado = (conteo) => round2(Object.entries(conteo)
    .reduce((s, [valor, cantidad]) => s + Number(valor) * (Number(cantidad) || 0), 0));

// 'Cuadra' | 'Sobrante' | 'Faltante'
export const resultadoArqueo = (diferencia) => {
    if (Math.abs(diferencia) < 0.005) return 'Cuadra';
    return diferencia > 0 ? 'Sobrante' : 'Faltante';
};

export const registrarArqueo = ({ contado, observacion, responsable }) => {
    const fecha = fechaTexto();
    const saldoSistema = saldoCajaAl(fecha);
    const arqueo = {
        id: siguienteId(ARQUEOS, 'ARQ'), fecha, saldoSistema,
        contado: round2(contado), diferencia: round2(contado - saldoSistema),
        responsable, observacion: String(observacion || '').trim(),
    };
    ARQUEOS.unshift(arqueo);
    return arqueo;
};
