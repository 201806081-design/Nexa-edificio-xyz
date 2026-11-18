import { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Chip, IconButton, Select, MenuItem, TextField, InputAdornment,
    Table, TableHead, TableBody, TableRow, TableCell, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions, Divider, Snackbar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    ESTADOS_CONCILIACION, TIPOS_MOV_BANCO,
    movimientosConciliacion, conciliarMovimientos, marcarEnInvestigacion,
} from '../../constants/conciliacionMock';
import {
    CUENTAS_BANCARIAS, cuentaBancariaActiva, cuentaBancariaPorId, etiquetaCuenta,
    movimientosBanco, libroDelPeriodo,
} from '../../constants/cajaBancosMock';
import { periodosConMovimientos, periodoEnCurso } from '../../constants/periodos';

// Periodos para conciliacion: meses cerrados MAS el mes en curso (fuente unica periodos.js).
// La conciliacion se hace diariamente, asi que el mes actual debe estar disponible.
const periodosConciliacion = () => periodosConMovimientos();

// Parse "DD/MM/YYYY" -> timestamp para ordenar por fecha descendente
const timestampFecha = (fecha) => {
    if (!fecha) return 0;
    const partes = fecha.split('/').map(Number);
    if (partes.length < 2) return 0;
    const [d, m, y] = partes.length === 3 ? partes : [partes[0], partes[1], 2026];
    return new Date(y, (m || 1) - 1, d || 1).getTime();
};
import { formatBs } from '../../constants/finanzasMock';

const coincidenciaColor = (c) => {
    if (c === 'Exacta') return '#2E9D78';
    if (c === 'Sugerida') return '#B6802A';
    return '#D9534F';
};
const estadoChipSx = (estado) => {
    if (estado === 'Conciliado') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Alerta') return { bgcolor: '#FBEAE9', color: '#D9534F', fontWeight: 700 };
    return { bgcolor: '#FDF0D5', color: '#B6802A' };
};
const tipoChipSx = (tipo) => (tipo === 'Ingreso'
    ? { bgcolor: '#E4F4EE', color: '#2E9D78' }
    : { bgcolor: '#FBEAE9', color: '#D9534F' });

// Helpers de fecha para filtrar por periodo
const MES_IDX = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};
const fechaEnPeriodo = (fecha, periodoSel) => {
    if (!fecha || !periodoSel) return true;
    const partes = fecha.split('/').map(Number);
    if (partes.length < 2) return true;
    const [, m, y] = partes.length === 3 ? partes : [partes[0], partes[1], null];
    const [mesSel, anioSel] = periodoSel.toLowerCase().split(' ');
    const mesIdx = MES_IDX[mesSel] || 0;
    if (m !== mesIdx) return false;
    if (y != null && anioSel) return y === Number(anioSel);
    return true;
};

export default function ConciliacionBancaria() {
    const navigate = useNavigate();
    // Se entra desde Pagos o desde Caja y bancos: el boton "Volver" regresa a esa pantalla
    const { pathname } = useLocation();
    const volver = pathname.startsWith('/finanzas/caja-bancos')
        ? { ruta: '/finanzas/caja-bancos', estado: { tab: 'bancos' }, texto: 'Volver a caja y bancos' }
        : { ruta: '/finanzas/pagos', estado: null, texto: 'Volver a pagos' };

    // Periodos: meses cerrados + mes en curso (para seguimiento diario)
    const [tick, setTick] = useState(0);
    const periodos = useMemo(() => periodosConciliacion(), [tick]);
    const [periodo, setPeriodo] = useState(() => periodosConciliacion()[0] || periodoEnCurso());
    useEffect(() => {
        const h = setInterval(() => setTick((t) => t + 1), 5000);
        return () => clearInterval(h);
    }, []);
    useEffect(() => {
        if (periodos.length > 0 && !periodos.includes(periodo)) {
            setPeriodo(periodos[0]);
        }
    }, [periodos, periodo]);

    // Cuenta bancaria en uso (se registra en Caja y bancos). Se concilia una cuenta por vez.
    const cuentasActivas = CUENTAS_BANCARIAS.filter((c) => c.activa);
    const [cuentaId, setCuentaId] = useState(() => cuentaBancariaActiva()?.id ?? '');
    const cuenta = cuentaBancariaPorId(cuentaId);
    const [estado, setEstado] = useState('Todos');
    const [tipo, setTipo] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');

    const [verMov, setVerMov] = useState(null);
    const [accionMov, setAccionMov] = useState(null);
    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    // Movimientos de la cuenta (ingresos y egresos) con su estado de conciliacion.
    // El estado se guarda en conciliacionMock: no se pierde al cambiar de pantalla.
    const movs = useMemo(
        () => (cuentaId ? movimientosConciliacion(cuentaId) : []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [cuentaId, tick],
    );
    const refrescar = () => setTick((t) => t + 1);

    // Acciones
    const conciliar = (id) => {
        conciliarMovimientos([id]);
        refrescar();
        setSnack({ open: true, msg: 'Movimiento conciliado con el registro del sistema', sev: 'success' });
    };

    // Concilia de una vez los pendientes del periodo que tienen registro en el sistema
    const conciliarAuto = () => {
        const sugeridos = movsEnVista.filter((m) => m.estado === 'Pendiente' && m.sistemaRef);
        if (sugeridos.length === 0) {
            setSnack({ open: true, msg: 'No hay movimientos pendientes con registro en el sistema', sev: 'warning' });
            return;
        }
        conciliarMovimientos(sugeridos.map((m) => m.id));
        refrescar();
        setSnack({ open: true, msg: `${sugeridos.length} movimiento${sugeridos.length !== 1 ? 's' : ''} conciliado${sugeridos.length !== 1 ? 's' : ''}`, sev: 'success' });
    };

    const marcarInvestigado = () => {
        marcarEnInvestigacion(accionMov.id);
        setAccionMov(null);
        refrescar();
        setSnack({ open: true, msg: 'Marcado como "en investigacion"', sev: 'warning' });
    };

    // KPIs calculados sobre lo filtrado por periodo + cuenta (siempre una cuenta por vez).
    // Ordenados por fecha descendente (mas reciente arriba) para seguimiento diario.
    const movsEnVista = useMemo(() => movs
        .filter((m) => fechaEnPeriodo(m.fecha, periodo))
        .sort((a, b) => timestampFecha(b.fecha) - timestampFecha(a.fecha)), [movs, periodo]);

    // Saldo segun el sistema al cierre del periodo (para comparar con el extracto)
    const saldoSistema = useMemo(
        () => (cuenta ? libroDelPeriodo(movimientosBanco(cuenta.id), cuenta.saldoInicial, periodo).saldoFinal : 0),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [cuenta, periodo, tick],
    );

    const total = movsEnVista.length;
    const conciliados = movsEnVista.filter((m) => m.estado === 'Conciliado').length;
    const pendientes = movsEnVista.filter((m) => m.estado === 'Pendiente').length;
    const alertas = movsEnVista.filter((m) => m.estado === 'Alerta').length;

    const filtrados = movsEnVista.filter((m) =>
        (estado === 'Todos' || m.estado === estado) &&
        (tipo === 'Todos' || m.tipo === tipo) &&
        (m.referencia + (m.sistemaRef || '') + (m.depto || '') + m.descripcion).toLowerCase().includes(busqueda.toLowerCase())
    );

    const RESUMEN = [
        { label: 'Total movimientos', valor: total, nota: `${periodo.toLowerCase()}`, icon: <AccountBalanceWalletIcon />, color: '#1F5F8B', bg: '#E4EEF5' },
        { label: 'Conciliados', valor: conciliados, nota: 'Coincidencia confirmada', icon: <CheckCircleIcon />, color: '#2E9D78', bg: '#E4F4EE' },
        { label: 'Pendientes', valor: pendientes, nota: 'Requieren confirmar', icon: <HourglassBottomIcon />, color: '#B6802A', bg: '#FDF0D5' },
        { label: 'Alertas', valor: alertas, nota: 'Sin registro en el sistema', icon: <ReportProblemIcon />, color: '#D9534F', bg: '#FBEAE9' },
    ];

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Conciliacion bancaria</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Compara los movimientos del banco con los ingresos y egresos registrados en el sistema. Aparecen aqui
                automaticamente cada vez que registras un cobro o un gasto por banco.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'stretch', md: 'flex-end' }, mb: 2 }}>
                <Button variant="outlined" startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(volver.ruta, { state: volver.estado })}
                    sx={{ color: '#1a2733', borderColor: '#cdd8e3', width: { xs: '100%', md: 'auto' } }}>
                    {volver.texto}
                </Button>
                <Button variant="contained" startIcon={<SyncIcon />} onClick={conciliarAuto} disabled={!cuenta}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Conciliar automaticamente
                </Button>
            </Box>

            <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>¿Como funciona esta pantalla?</Typography>
                <Typography variant="body2">
                    Todo lo que se cobra o se paga por <strong>transferencia, QR, cheque o deposito</strong> entra como movimiento en
                    {cuenta ? <strong> {etiquetaCuenta(cuenta)}</strong> : <strong> la cuenta bancaria del edificio</strong>}:
                    cobros de expensas y anticipos, gastos, sueldos y depositos desde caja. Lo que se mueve en
                    <strong> efectivo no aparece</strong> porque no pasa por el banco (se controla en Caja).
                    <strong> Conciliar</strong> = confirmar que el movimiento del banco coincide con lo registrado en el sistema.
                    Si aparece un movimiento del banco <strong>sin registro</strong> en el sistema, hay que <strong>investigar</strong>.
                </Typography>
            </Alert>

            {!cuenta && (
                <Paper sx={{ p: 4, borderRadius: 2, mb: 2, textAlign: 'center' }}>
                    <AccountBalanceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography sx={{ fontWeight: 700, mb: 0.5 }}>No hay una cuenta bancaria registrada</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Registra la cuenta del edificio en Caja y bancos para poder conciliar sus movimientos.
                    </Typography>
                    <Button variant="contained" onClick={() => navigate('/finanzas/caja-bancos', { state: { tab: 'bancos' } })}>
                        Ir a Caja y bancos
                    </Button>
                </Paper>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
                {RESUMEN.map((r) => (
                    <Paper key={r.label} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', bgcolor: r.bg, color: r.color, display: 'grid', placeItems: 'center' }}>
                            {r.icon}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                            <Typography variant="h3" sx={{ fontWeight: 700, color: r.color }}>{r.valor}</Typography>
                            <Typography variant="caption" color="text.secondary">{r.nota}</Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mb: 3 }}>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Cuenta bancaria</Typography>
                    <Select fullWidth displayEmpty value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} disabled={!cuenta}>
                        {!cuenta && <MenuItem value=""><em>Sin cuenta registrada</em></MenuItem>}
                        {cuentasActivas.map((c) => <MenuItem key={c.id} value={c.id}>{etiquetaCuenta(c)}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 140 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                    <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                        {periodos.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 130 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Tipo</Typography>
                    <Select fullWidth value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        {TIPOS_MOV_BANCO.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 140 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Estado</Typography>
                    <Select fullWidth value={estado} onChange={(e) => setEstado(e.target.value)}>
                        {ESTADOS_CONCILIACION.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 2, minWidth: 180 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Buscar</Typography>
                    <TextField fullWidth placeholder="Referencia, descripcion o pago" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} />
                </Box>
            </Box>

            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Movimientos — {cuenta ? etiquetaCuenta(cuenta) : 'sin cuenta'} · {periodo}
                        </Typography>
                        {cuenta && (
                            <Typography variant="caption" color="text.secondary">
                                Saldo segun el sistema al cierre del periodo: <strong>{formatBs(saldoSistema)}</strong>
                                {' '}(comparalo con el saldo del extracto)
                            </Typography>
                        )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {filtrados.length} de {movsEnVista.length}
                    </Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 880 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Fecha / referencia</strong></TableCell>
                                <TableCell><strong>Tipo</strong></TableCell>
                                <TableCell><strong>Descripcion</strong></TableCell>
                                <TableCell align="right"><strong>Monto</strong></TableCell>
                                <TableCell><strong>Registro en sistema</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell align="center"><strong>Accion</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtrados.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                        No hay movimientos{cuenta ? ` en ${etiquetaCuenta(cuenta)}` : ''} para {periodo}.
                                    </TableCell>
                                </TableRow>
                            ) : filtrados.map((m) => {
                                const esIngreso = m.tipo === 'Ingreso';
                                const esAlerta = m.estado === 'Alerta';
                                return (
                                    <TableRow key={m.id} sx={esAlerta ? { bgcolor: '#FDEEEC' } : {}}>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.fecha}</Typography>
                                            <Typography variant="caption" color="text.secondary">{m.referencia}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={m.tipo} size="small"
                                                icon={esIngreso ? <NorthIcon sx={{ fontSize: 14 }} /> : <SouthIcon sx={{ fontSize: 14 }} />}
                                                sx={tipoChipSx(m.tipo)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {m.descripcion}
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{m.concepto}</Typography>
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap', color: esIngreso ? '#2E9D78' : '#D9534F' }}>
                                            {esIngreso ? '+' : '-'} {formatBs(m.monto)}
                                        </TableCell>
                                        <TableCell sx={{ color: m.sistemaRef ? 'primary.main' : '#D9534F', fontWeight: 600 }}>
                                            {m.sistemaRef || 'Sin registro'}
                                            {m.depto && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>(Dpto. {m.depto})</Typography>}
                                            {m.coincidencia !== 'Exacta' && m.sistemaRef && (
                                                <Typography variant="caption" sx={{ display: 'block', color: coincidenciaColor(m.coincidencia) }}>
                                                    Coincidencia: {m.coincidencia}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell><Chip label={m.estado} size="small" sx={estadoChipSx(m.estado)} /></TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                <IconButton size="small" color="primary" onClick={() => setVerMov(m)} title="Ver detalle">
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                                {m.estado === 'Pendiente' && m.sistemaRef && (
                                                    <Button variant="contained" size="small" onClick={() => conciliar(m.id)}>Conciliar</Button>
                                                )}
                                                {m.estado === 'Pendiente' && !m.sistemaRef && (
                                                    <Button variant="contained" size="small" onClick={() => setAccionMov(m)}>Registrar</Button>
                                                )}
                                                {m.estado === 'Alerta' && (
                                                    <Button variant="contained" size="small" color="error" onClick={() => setAccionMov(m)}>Investigar</Button>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Box>
                <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 1.5, mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Tip:</strong> cuando registres un cobro o un gasto por banco (en Pagos o en Ingresos y gastos), aparecera
                        aqui al toque como movimiento <strong>Pendiente</strong>. Las comisiones e intereses que registras en
                        <em> Caja y bancos</em> vienen del extracto, por eso entran ya conciliados.
                    </Typography>
                </Box>
            </Paper>

            {/* ===================== MODAL: VER DETALLE ===================== */}
            <Dialog open={!!verMov} onClose={() => setVerMov(null)} fullWidth maxWidth="sm">
                {verMov && (
                    <>
                        <DialogTitle sx={{ fontWeight: 700 }}>Detalle del movimiento bancario</DialogTitle>
                        <DialogContent dividers>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>Datos del banco</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Cuenta</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{etiquetaCuenta(cuenta)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Fecha</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{verMov.fecha}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Referencia</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{verMov.referencia}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Tipo</Typography>
                                <Chip label={verMov.tipo} size="small" sx={tipoChipSx(verMov.tipo)} />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Descripcion</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>{verMov.descripcion}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Monto</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 700, color: verMov.tipo === 'Ingreso' ? '#2E9D78' : '#D9534F' }}>
                                    {verMov.tipo === 'Ingreso' ? '+' : '-'} {formatBs(verMov.monto)}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>Registro en el sistema</Typography>
                            {verMov.sistemaRef ? (
                                <>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">Codigo</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>{verMov.sistemaRef}</Typography>
                                    </Box>
                                    {verMov.depto && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">Departamento</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{verMov.depto}</Typography>
                                        </Box>
                                    )}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">Coincidencia</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: coincidenciaColor(verMov.coincidencia) }}>{verMov.coincidencia}</Typography>
                                    </Box>
                                </>
                            ) : (
                                <Alert severity={verMov.estado === 'Alerta' ? 'error' : 'warning'} sx={{ mt: 1 }}>
                                    No hay registro en el sistema para este movimiento. {verMov.estado === 'Alerta'
                                        ? 'Investigue si corresponde a un gasto legitimo del edificio o si es un movimiento no autorizado.'
                                        : 'Registre el pago para poder conciliarlo.'}
                                </Alert>
                            )}

                            {/* Detalles extra para la investigacion (si los hay) */}
                            {verMov.detalles && (
                                <>
                                    <Divider sx={{ my: 1.5 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#D9534F' }}>
                                        Datos para investigar
                                    </Typography>
                                    {verMov.detalles.cajero && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">Cajero / canal</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{verMov.detalles.cajero}</Typography>
                                        </Box>
                                    )}
                                    {verMov.detalles.canal && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">Tipo de canal</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{verMov.detalles.canal}</Typography>
                                        </Box>
                                    )}
                                    {verMov.detalles.horaOperacion && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">Hora de operacion</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{verMov.detalles.horaOperacion}</Typography>
                                        </Box>
                                    )}
                                    {verMov.detalles.ubicacion && (
                                        <Box sx={{ py: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">Ubicacion</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{verMov.detalles.ubicacion}</Typography>
                                            {verMov.detalles.latitud != null && verMov.detalles.longitud != null && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Coord: {verMov.detalles.latitud}, {verMov.detalles.longitud}
                                                    &nbsp;·&nbsp;
                                                    <span style={{ fontStyle: 'italic' }}>(pendiente de integracion con Google Maps)</span>
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                    {verMov.detalles.notas && (
                                        <Alert severity="warning" sx={{ mt: 1.5 }}>
                                            <Typography variant="body2">{verMov.detalles.notas}</Typography>
                                        </Alert>
                                    )}
                                </>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setVerMov(null)}>Cerrar</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ===================== MODAL: ACCION (Registrar / Investigar) ===================== */}
            <Dialog open={!!accionMov} onClose={() => setAccionMov(null)} fullWidth maxWidth="sm">
                {accionMov && (
                    <>
                        <DialogTitle sx={{ fontWeight: 700 }}>
                            {accionMov.estado === 'Alerta' ? '⚠ Movimiento sin registrar' : 'Registrar movimiento del banco'}
                        </DialogTitle>
                        <DialogContent dividers>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                El banco registra: <strong>{accionMov.descripcion}</strong> por <strong style={{ color: accionMov.tipo === 'Ingreso' ? '#2E9D78' : '#D9534F' }}>
                                    {accionMov.tipo === 'Ingreso' ? '+' : '-'} {formatBs(accionMov.monto)}
                                </strong> el {accionMov.fecha} (ref. {accionMov.referencia}).
                            </Typography>
                            {accionMov.estado === 'Alerta' && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    Este movimiento no corresponde a ningun gasto registrado. Revise si es un debito legitimo o requiere accion
                                    (bloquear tarjeta, reportar al banco, etc.).
                                </Alert>
                            )}
                            <Typography variant="body2" color="text.secondary">¿Que querés hacer?</Typography>
                        </DialogContent>
                        <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
                            <Button onClick={() => setAccionMov(null)}>Cancelar</Button>
                            {accionMov.estado === 'Alerta' && (
                                <Button variant="outlined" color="warning" onClick={marcarInvestigado}>Marcar en investigacion</Button>
                            )}
                            {accionMov.tipo === 'Ingreso' ? (
                                <Button variant="contained" onClick={() => navigate('/finanzas/pagos/registrar')}>
                                    Registrar como pago de depto
                                </Button>
                            ) : (
                                <Button variant="contained" onClick={() => navigate('/finanzas/ingresos-gastos/registrar')}>
                                    Registrar como gasto
                                </Button>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: '100%' }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </DashboardLayout>
    );
}