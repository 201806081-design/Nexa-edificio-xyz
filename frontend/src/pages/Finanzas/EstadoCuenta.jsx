import { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Select, MenuItem, Paper, Button, Chip, Alert,
    Table, TableHead, TableBody, TableRow, TableCell, Snackbar, Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PercentIcon from '@mui/icons-material/Percent';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SavingsIcon from '@mui/icons-material/Savings';
import PaidIcon from '@mui/icons-material/Paid';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DashboardLayout from '../../layouts/DashboardLayout';
import { formatBs } from '../../constants/finanzasMock';
import {
    EXPENSAS_MOCK, periodosDisponibles, periodoEnCurso,
} from '../../constants/expensasMock';
import { PAGOS_MOCK, HISTORIAL_ANTICIPOS, DEPARTAMENTOS_DEUDA } from '../../constants/pagosMock';
import { DEUDAS_VENCIDAS, CONFIG_MORA } from '../../constants/moraMock';
import { REGLAS_PERIODO } from '../../constants/configuracionMock';

const MES_IDX = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};
const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const parsePeriodo = (p) => {
    const [mes, anio] = (p || '').toLowerCase().split(' ');
    return { mes: MES_IDX[mes] || 0, anio: Number(anio) || 0 };
};
const periodoCoincide = (periodoAplicado, periodoSel) => {
    const [mesSel, anioSel] = (periodoSel || '').toLowerCase().split(' ');
    const corto = (mesSel || '').slice(0, 3);
    const p = (periodoAplicado || '').toLowerCase();
    return (p.includes(mesSel) || p.includes(corto)) && p.includes(anioSel || '');
};

// Fecha "DD/MM/YYYY" -> boolean si cae dentro del periodo "Mes Anio".
const fechaEnPeriodo = (fecha, periodoSel) => {
    if (!fecha || !periodoSel || periodoSel === 'Todos los periodos') return true;
    const partes = fecha.split('/').map(Number);
    if (partes.length < 2) return true;
    const [, m, y] = partes.length === 3 ? partes : [partes[0], partes[1], null];
    const [mesSel, anioSel] = periodoSel.toLowerCase().split(' ');
    const mesIdx = MES_IDX[mesSel] || 0;
    if (m !== mesIdx) return false;
    if (y != null && anioSel) return y === Number(anioSel);
    return true;
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const calcularMesesVencidos = (periodoTexto, fechaHoy, diaVenc) => {
    if (!periodoTexto || !fechaHoy) return 0;
    const [mesNombre, anio] = periodoTexto.split(' ');
    const idxMes = MESES_ES.indexOf(mesNombre);
    if (idxMes < 0 || !anio) return 0;
    const anioV = idxMes === 11 ? Number(anio) + 1 : Number(anio);
    const mesV = idxMes === 11 ? 0 : idxMes + 1;
    const fechaVenc = new Date(anioV, mesV, Number(diaVenc) || 10);
    if (fechaHoy < fechaVenc) return 0;
    let count = 0;
    const f = new Date(fechaVenc);
    while (f <= fechaHoy) {
        count++;
        f.setMonth(f.getMonth() + 1);
    }
    return count;
};

// Lista de periodos para el selector: Todos + meses cerrados + mes en curso.
// Igual que Conciliacion: el mes actual aparece aunque no haya terminado (para
// ver anticipos y pagos del dia).
const periodosParaCuenta = () => {
    const enCurso = periodoEnCurso();
    const cerrados = periodosDisponibles();
    const todos = cerrados.includes(enCurso) ? cerrados : [enCurso, ...cerrados];
    return ['Todos los periodos', ...todos];
};

const estadoChipSx = (estado) => {
    if (estado === 'Pagado') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Vencido') return { bgcolor: '#FBEAE9', color: '#D9534F' };
    return { bgcolor: '#FDF0D5', color: '#B6802A' };
};

// Lista unica de deptos del sistema (solo los que tienen expensa o deuda vencida)
function buildDeptosDelSistema() {
    const map = new Map();
    const ensure = (id, patch = {}) => {
        if (!map.has(id)) map.set(id, { id, etiqueta: `Depto. ${id}`, tipo: '', responsable: '' });
        const d = map.get(id);
        if (patch.tipo && !d.tipo) d.tipo = patch.tipo;
        if (patch.responsable && !d.responsable) d.responsable = patch.responsable;
    };
    EXPENSAS_MOCK.forEach((e) => {
        const id = e.departamento.replace('Depto. ', '');
        ensure(id, { tipo: e.tipo, responsable: e.responsable });
    });
    DEUDAS_VENCIDAS.forEach((d) => ensure(d.depto, { tipo: d.tipo }));
    PAGOS_MOCK.forEach((p) => { if (map.has(p.depto)) ensure(p.depto, { responsable: p.responsable }); });
    HISTORIAL_ANTICIPOS.forEach((a) => { if (map.has(a.depto)) ensure(a.depto, { responsable: a.responsable }); });
    DEPARTAMENTOS_DEUDA.forEach((d) => { if (map.has(d.id)) ensure(d.id, { responsable: d.responsable }); });

    map.forEach((d) => {
        const tipoTxt = d.tipo ? ` — Tipo ${d.tipo}` : '';
        d.etiqueta = `Depto. ${d.id}${tipoTxt}`;
    });

    return [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
}

const pagadoParaPeriodo = (deptoId, periodo) => PAGOS_MOCK
    .filter((p) => p.depto === deptoId && periodoCoincide(p.periodoAplicado, periodo))
    .reduce((s, p) => {
        const totalPago = Number(p.total)
            || (Number(p.monto) || 0) + (Number(p.creditoAplicado) || 0);
        return s + totalPago;
    }, 0);

function computeHistorial(deptoId) {
    const tasa = (Number(CONFIG_MORA.interesMensual) || 0) / 100;
    const refHoy = new Date();
    const diaVenc = REGLAS_PERIODO.diaVencimiento;
    const calcMora = (original, meses) => {
        const raw = CONFIG_MORA.tipoCalculo === 'Simple'
            ? original * (1 + tasa * meses)
            : original * (1 + tasa) ** meses;
        return round2(raw);
    };

    const moraFila = (original, periodo, pagado) => {
        if (pagado >= original && pagado > 0) {
            return round2(Math.max(0, pagado - original));
        }
        const meses = calcularMesesVencidos(periodo, refHoy, diaVenc);
        const totalConMora = calcMora(original, meses);
        return round2(totalConMora - original);
    };

    const desdeExpensas = EXPENSAS_MOCK
        .filter((e) => e.departamento === `Depto. ${deptoId}`)
        .map((e) => {
            const base = Number(e.base) || 0;
            const agua = Number(e.agua) || 0;
            const original = base + agua;
            const pagado = round2(Number(e.pagado) || 0);
            const mora = moraFila(original, e.periodo, pagado);
            return { periodo: e.periodo, base, agua, mora, pagado };
        });

    const desdeMora = DEUDAS_VENCIDAS
        .filter((d) => d.depto === deptoId)
        .map((d) => {
            const pagado = round2(pagadoParaPeriodo(deptoId, d.periodo));
            const mora = moraFila(d.deudaOriginal, d.periodo, pagado);
            return {
                periodo: d.periodo, base: d.expensaBase, agua: d.agua, mora, pagado,
            };
        });

    const porPeriodo = new Map();
    [...desdeExpensas, ...desdeMora].forEach((h) => {
        const prev = porPeriodo.get(h.periodo);
        if (!prev || h.mora > prev.mora) porPeriodo.set(h.periodo, h);
    });

    return [...porPeriodo.values()]
        .map((h) => {
            const total = round2(h.base + h.agua + h.mora);
            const saldo = Math.max(0, round2(total - h.pagado));
            let estado;
            if (saldo < 0.01 && total > 0) estado = 'Pagado';
            else if (h.mora > 0) estado = 'Vencido';
            else estado = 'Pendiente';
            return { ...h, total, saldo, estado };
        })
        .sort((a, b) => {
            const pa = parsePeriodo(a.periodo); const pb = parsePeriodo(b.periodo);
            return (pb.anio - pa.anio) || (pb.mes - pa.mes);
        });
}

// Lista de movimientos financieros del depto (pagos + anticipos) ordenados por fecha desc.
// Se filtran por el periodo seleccionado (si no es "Todos los periodos").
function computeMovimientos(deptoId, periodoFiltro) {
    const pagos = PAGOS_MOCK
        .filter((p) => p.depto === deptoId)
        .map((p) => ({
            tipo: 'Pago',
            id: p.id,
            fecha: p.fecha,
            periodoAsociado: p.periodoAplicado,
            medio: p.medio,
            referencia: p.referencia,
            monto: p.monto,
            estado: p.estado,
        }));
    const anticipos = HISTORIAL_ANTICIPOS
        .filter((a) => a.depto === deptoId)
        .map((a) => ({
            tipo: 'Anticipo',
            id: a.id,
            fecha: a.fecha,
            periodoAsociado: null,
            medio: a.medio,
            referencia: a.referencia,
            monto: a.recibido,
            aplicado: a.aplicado,
            credito: a.credito,
            estado: a.estado,
        }));
    const todos = [...pagos, ...anticipos]
        .filter((m) => periodoFiltro === 'Todos los periodos' || fechaEnPeriodo(m.fecha, periodoFiltro))
        .sort((a, b) => {
            // Orden descendente por fecha (DD/MM/YYYY)
            const fa = (a.fecha || '').split('/').reverse().join('');
            const fb = (b.fecha || '').split('/').reverse().join('');
            return fb.localeCompare(fa);
        });
    return todos;
}

function computeEstadoCuenta(deptoId, deptos, periodoFiltro) {
    const depto = deptos.find((d) => d.id === deptoId);
    if (!depto) return null;

    let historial = computeHistorial(deptoId);
    if (periodoFiltro && periodoFiltro !== 'Todos los periodos') {
        historial = historial.filter((h) => h.periodo === periodoFiltro);
    }

    const movimientos = computeMovimientos(deptoId, periodoFiltro);

    const totalGenerado = historial.reduce((s, h) => s + h.base + h.agua, 0);
    const totalPagado = historial.reduce((s, h) => s + h.pagado, 0);
    const interesAcumulado = historial.reduce((s, h) => s + h.mora, 0);
    const saldoPendiente = historial.reduce((s, h) => s + h.saldo, 0);

    // Credito a favor: suma de credito de los anticipos del depto
    const credito = HISTORIAL_ANTICIPOS
        .filter((a) => a.depto === deptoId)
        .reduce((s, a) => s + (a.credito || 0), 0);

    const vencidos = historial.filter((h) => h.mora > 0);
    const detalleMora = vencidos.length === 0
        ? 'Sin mora: el departamento no tiene periodos vencidos.'
        : vencidos
            .map((h) => `${h.periodo}: Bs ${(h.base + h.agua).toFixed(0)} vencido × ${CONFIG_MORA.interesMensual}% = Bs ${h.mora.toFixed(2)} de interes acumulado.`)
            .join(' ');

    // Si el periodo seleccionado es el mes en curso y aun no hay expensa generada,
    // avisamos para que el admin entienda por que los numeros estan en 0.
    const periodoActual = periodoEnCurso();
    const sinExpensaDelMes = periodoFiltro === periodoActual
        && !EXPENSAS_MOCK.some((e) => e.departamento === `Depto. ${deptoId}` && e.periodo === periodoActual);

    return {
        departamento: `Depto. ${deptoId}`,
        responsable: depto.responsable || 'Sin responsable registrado',
        tipo: depto.tipo,
        periodoConsultado: periodoFiltro || 'Todo el historial',
        resumen: { totalGenerado, totalPagado, interesAcumulado, saldoPendiente, credito },
        historial,
        movimientos,
        detalleMora,
        sinExpensaDelMes,
    };
}

const movimientoChipSx = (tipo) => (tipo === 'Pago'
    ? { bgcolor: '#E4F4EE', color: '#2E9D78', fontWeight: 700 }
    : { bgcolor: '#E4EEF5', color: '#1F5F8B', fontWeight: 700 });

const movimientoIcon = (tipo) => (tipo === 'Pago' ? <PaidIcon fontSize="small" /> : <AccountBalanceWalletIcon fontSize="small" />);

// Label de estado segun el tipo de movimiento.
// Pagos: 'Completo' / 'Parcial' (lo que ya usa el sistema).
// Anticipos: 'Disponible' / 'Con saldo a favor' / 'Aplicado' (sin la palabra "Parcial"
// que confunde con pagos parciales — un anticipo nunca es un "pago parcial" porque es
// un adelanto, no una cuota insuficiente).
const labelEstadoMovimiento = (m) => {
    if (m.tipo === 'Pago') return m.estado;
    if (m.estado === 'Parcial') return 'Con saldo a favor';
    return m.estado;
};
const chipEstadoMovimientoSx = (m) => {
    if (m.tipo === 'Pago') {
        return m.estado === 'Completo'
            ? { bgcolor: '#E4F4EE', color: '#2E9D78' }
            : { bgcolor: '#FDF0D5', color: '#B6802A' };
    }
    // Anticipo
    if (m.estado === 'Disponible') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (m.estado === 'Aplicado') return { bgcolor: '#E4EEF5', color: '#1F5F8B' };
    return { bgcolor: '#FDF0D5', color: '#B6802A' }; // Con saldo a favor
};

export default function EstadoCuenta() {
    // Periodos dinamicos (igual que Conciliacion): meses cerrados + mes en curso + "Todos"
    const [tick, setTick] = useState(0);
    const periodosOptions = useMemo(() => periodosParaCuenta(), [tick]);
    const [seleccion, setSeleccion] = useState('');
    const [periodo, setPeriodo] = useState('Todos los periodos');
    const [snack, setSnack] = useState(false);

    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 5000);
        return () => clearInterval(id);
    }, []);
    useEffect(() => {
        if (!periodosOptions.includes(periodo)) {
            setPeriodo('Todos los periodos');
        }
    }, [periodosOptions, periodo]);

    const deptosDisponibles = useMemo(() => buildDeptosDelSistema(), []);

    const consultado = useMemo(() => {
        if (!seleccion) return null;
        return computeEstadoCuenta(seleccion, deptosDisponibles, periodo);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seleccion, periodo, deptosDisponibles, tick]);

    const consultar = () => {
        if (seleccion) setTick((t) => t + 1);
    };

    const RESUMEN = consultado ? [
        { label: 'Expensas generadas', valor: consultado.resumen.totalGenerado, icon: <DescriptionOutlinedIcon />, color: 'primary.main', bg: '#E4EEF5' },
        { label: 'Pagos realizados', valor: consultado.resumen.totalPagado, icon: <CheckCircleIcon />, color: '#2E9D78', bg: '#E4F4EE' },
        { label: 'Interes acumulado', valor: consultado.resumen.interesAcumulado, icon: <PercentIcon />, color: '#D9534F', bg: '#FBEAE9' },
        { label: 'Saldo pendiente', valor: consultado.resumen.saldoPendiente, icon: <ScheduleIcon />, color: '#B6802A', bg: '#FDF0D5' },
    ] : [];

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Estado de cuenta por departamento</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Consulta las expensas, pagos, anticipos y saldos de una unidad.
            </Typography>

            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' } }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Departamento</Typography>
                        <Select fullWidth displayEmpty value={seleccion} onChange={(e) => setSeleccion(e.target.value)}>
                            <MenuItem value=""><em>Seleccionar departamento</em></MenuItem>
                            {deptosDisponibles.map((d) => <MenuItem key={d.id} value={d.id}>{d.etiqueta}</MenuItem>)}
                        </Select>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                        <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                            {periodosOptions.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </Select>
                    </Box>
                    <Button variant="contained" startIcon={<SearchIcon />} onClick={consultar}
                        disabled={!seleccion}
                        sx={{ width: { xs: '100%', md: 'auto' }, height: { md: 56 } }}>
                        Consultar estado
                    </Button>
                </Box>
            </Paper>

            {!consultado && (
                <Paper sx={{ p: 8, borderRadius: 2, textAlign: 'center', color: 'text.secondary' }}>
                    <ApartmentIcon sx={{ fontSize: 72, color: '#9aa8b6', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Seleccione un departamento</Typography>
                    <Typography variant="body2">Elige una unidad para consultar su informacion financiera</Typography>
                </Paper>
            )}

            {consultado && (
                <Box>
                    {/* Encabezado del depto (datos personales del copropietario se agregaran
                        cuando se implemente el modulo Copropietarios ampliado) */}
                    <Paper sx={{ p: 2.5, borderRadius: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flexShrink: 0, width: 48, height: 48, borderRadius: '50%', bgcolor: '#FDF0D5', color: '#B6802A', display: 'grid', placeItems: 'center' }}>
                            <PeopleAltIcon />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700 }}>
                                {consultado.departamento}
                                {consultado.tipo && (
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                        Tipo {consultado.tipo}
                                    </Typography>
                                )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Responsable: {consultado.responsable}</Typography>
                            <Typography variant="body2" color="text.secondary">Periodo consultado: {consultado.periodoConsultado}</Typography>
                        </Box>
                        {consultado.resumen.credito > 0 && (
                            <Chip
                                icon={<SavingsIcon />}
                                label={`Credito a favor: ${formatBs(consultado.resumen.credito)}`}
                                sx={{ bgcolor: '#E4F4EE', color: '#2E9D78', fontWeight: 700, px: 1 }}
                            />
                        )}
                    </Paper>

                    {/* Aviso: si el periodo seleccionado es el mes en curso y aun no hay expensa */}
                    {consultado.sinExpensaDelMes && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            La expensa de <strong>{consultado.periodoConsultado}</strong> aun no se genero. Los montos de base,
                            agua y mora apareceran cuando el admin la genere desde "Expensas".
                        </Alert>
                    )}

                    {/* Tarjetas de resumen */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                        {RESUMEN.map((r) => (
                            <Paper key={r.label} sx={{ p: 2.5, borderRadius: 2, bgcolor: r.bg, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ flexShrink: 0, width: 48, height: 48, color: r.color, display: 'grid', placeItems: 'center' }}>
                                    {r.icon}
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: r.color }}>{formatBs(r.valor)}</Typography>
                                </Box>
                            </Paper>
                        ))}
                    </Box>

                    {/* Movimientos del depto (pagos + anticipos) — arriba porque es la info clave */}
                    <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Movimientos del depto</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Pagos de expensas + anticipos recibidos. Los anticipos quedan como credito a favor hasta aplicarse.
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {consultado.movimientos.length} {consultado.movimientos.length === 1 ? 'movimiento' : 'movimientos'}
                            </Typography>
                        </Box>
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 820 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                        <TableCell><strong>Fecha</strong></TableCell>
                                        <TableCell><strong>Tipo</strong></TableCell>
                                        <TableCell><strong>N.º</strong></TableCell>
                                        <TableCell><strong>Medio</strong></TableCell>
                                        <TableCell><strong>Periodo</strong></TableCell>
                                        <TableCell align="right"><strong>Monto</strong></TableCell>
                                        <TableCell align="right"><strong>Saldo a favor</strong></TableCell>
                                        <TableCell><strong>Estado</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {consultado.movimientos.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                                Sin pagos ni anticipos para {consultado.departamento} en {consultado.periodoConsultado}.
                                            </TableCell>
                                        </TableRow>
                                    ) : consultado.movimientos.map((m) => (
                                        <TableRow key={`${m.tipo}-${m.id}`}>
                                            <TableCell>{m.fecha}</TableCell>
                                            <TableCell>
                                                <Chip size="small" icon={movimientoIcon(m.tipo)} label={m.tipo}
                                                    sx={movimientoChipSx(m.tipo)} />
                                            </TableCell>
                                            <TableCell sx={{ color: 'primary.main', fontWeight: 600 }}>{m.id}</TableCell>
                                            <TableCell>{m.medio}</TableCell>
                                            <TableCell>{m.periodoAsociado || '—'}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, color: m.tipo === 'Pago' ? '#2E9D78' : '#1F5F8B' }}>
                                                {formatBs(m.monto)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, color: (m.credito || 0) > 0 ? '#2E9D78' : 'text.secondary' }}>
                                                {m.tipo === 'Anticipo' ? formatBs(m.credito || 0) : '—'}
                                            </TableCell>
                                            <TableCell><Chip label={labelEstadoMovimiento(m)} size="small" sx={chipEstadoMovimientoSx(m)} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Paper>

                    {/* Historial por periodo (base + agua + mora) — abajo porque es un desglose tecnico */}
                    <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Historial por periodo</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {consultado.historial.length} {consultado.historial.length === 1 ? 'periodo' : 'periodos'}
                            </Typography>
                        </Box>
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 720 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                        <TableCell><strong>Periodo</strong></TableCell>
                                        <TableCell><strong>Base</strong></TableCell>
                                        <TableCell><strong>Agua</strong></TableCell>
                                        <TableCell><strong>Mora</strong></TableCell>
                                        <TableCell><strong>Total</strong></TableCell>
                                        <TableCell><strong>Pagado</strong></TableCell>
                                        <TableCell><strong>Saldo</strong></TableCell>
                                        <TableCell><strong>Estado</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {consultado.historial.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                                Sin movimientos para {consultado.departamento} en {consultado.periodoConsultado}.
                                            </TableCell>
                                        </TableRow>
                                    ) : consultado.historial.map((h) => (
                                        <TableRow key={h.periodo}>
                                            <TableCell>{h.periodo}</TableCell>
                                            <TableCell>{formatBs(h.base)}</TableCell>
                                            <TableCell>{formatBs(h.agua)}</TableCell>
                                            <TableCell sx={{ color: h.mora > 0 ? '#D9534F' : 'text.primary', fontWeight: h.mora > 0 ? 600 : 400 }}>
                                                {formatBs(h.mora)}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>{formatBs(h.total)}</TableCell>
                                            <TableCell sx={{ color: h.pagado > 0 ? '#2E9D78' : 'text.primary' }}>{formatBs(h.pagado)}</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: h.saldo > 0 ? '#D9534F' : '#2E9D78' }}>{formatBs(h.saldo)}</TableCell>
                                            <TableCell><Chip label={h.estado} size="small" sx={estadoChipSx(h.estado)} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Paper>

                    {/* Detalle de mora */}
                    <Alert severity={consultado.resumen.interesAcumulado > 0 ? 'warning' : 'success'} icon={false}
                        sx={{
                            bgcolor: consultado.resumen.interesAcumulado > 0 ? '#FDF0D5' : '#E4F4EE',
                            color: consultado.resumen.interesAcumulado > 0 ? '#8A5A00' : '#2E7D5B',
                            mb: 2,
                        }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Detalle de mora</Typography>
                        <Typography variant="body2">{consultado.detalleMora}</Typography>
                    </Alert>

                    <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                        <Button variant="contained" startIcon={<DownloadIcon />}
                            onClick={() => setSnack(true)}
                            sx={{ width: { xs: '100%', md: 'auto' } }}>
                            Descargar estado
                        </Button>
                    </Box>
                </Box>
            )}

            <Snackbar open={snack} autoHideDuration={2500} onClose={() => setSnack(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity="success" onClose={() => setSnack(false)} sx={{ width: '100%' }}>
                    Estado de cuenta descargado (simulado en mock)
                </Alert>
            </Snackbar>
        </DashboardLayout>
    );
}