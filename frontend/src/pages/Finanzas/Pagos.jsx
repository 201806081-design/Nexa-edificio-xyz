import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, Chip, IconButton, Select, MenuItem, TextField, InputAdornment,
    Table, TableHead, TableBody, TableRow, TableCell, ToggleButton, ToggleButtonGroup,
    Menu, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SavingsIcon from '@mui/icons-material/Savings';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    PERIODOS, ESTADOS_PAGO, DEPARTAMENTOS_PAGO, PAGOS_MOCK, DEPARTAMENTOS_DEUDA,
    HISTORIAL_ANTICIPOS,
} from '../../constants/pagosMock';
import * as ExpMod from '../../constants/expensasMock';
import { DEUDAS_VENCIDAS, CONFIG_MORA } from '../../constants/moraMock';
import { formatBs } from '../../constants/finanzasMock';

const EXPENSAS_MOCK = ExpMod.EXPENSAS_MOCK || [];

// ---------- Helpers ----------
const periodoCoincide = (periodoAplicado, periodoSel) => {
    const [mesSel, anioSel] = (periodoSel || '').toLowerCase().split(' ');
    const corto = (mesSel || '').slice(0, 3);
    const p = (periodoAplicado || '').toLowerCase();
    return (p.includes(mesSel) || p.includes(corto)) && p.includes(anioSel || '');
};

const MES_IDX = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

const fechaEnPeriodo = (fecha, periodoSel) => {
    const [, m, y] = (fecha || '').split('/').map(Number);
    const [mesSel, anioSel] = (periodoSel || '').toLowerCase().split(' ');
    const mesIdx = MES_IDX[mesSel] || 0;
    return m === mesIdx && y === Number(anioSel);
};

// Devuelve el desglose del pago. FIX NaN: usa fallback base+agua+mora si falta e.total
const calcularComposicion = (pago) => {
    if (!pago) return [];
    const items = [];
    const expensas = EXPENSAS_MOCK.filter((e) =>
        e.departamento === `Depto. ${pago.depto}` &&
        periodoCoincide(pago.periodoAplicado, e.periodo));
    for (const e of expensas) {
        const m3 = (e.lecturaActual != null && e.lecturaAnterior != null)
            ? Math.max(0, (e.lecturaActual || 0) - (e.lecturaAnterior || 0)) : null;
        const base = e.base ?? 0;
        const agua = e.agua ?? 0;
        const total = e.total ?? (base + agua);
        items.push({
            periodo: e.periodo, tipo: e.tipo || null,
            base, agua, m3Agua: m3,
            mora: 0, mesesMora: 0,
            total,
        });
    }
    const deudas = DEUDAS_VENCIDAS.filter((d) =>
        d.depto === pago.depto &&
        periodoCoincide(pago.periodoAplicado, d.periodo));
    const tasa = (CONFIG_MORA?.interesMensual || 0) / 100;
    for (const d of deudas) {
        const base = d.expensaBase ?? 0;
        const agua = d.agua ?? 0;
        const deudaOrig = d.deudaOriginal ?? (base + agua);
        const conMora = CONFIG_MORA?.tipoCalculo === 'Simple'
            ? deudaOrig * (1 + tasa * d.meses)
            : deudaOrig * (1 + tasa) ** d.meses;
        const mora = Math.round(conMora - deudaOrig);
        items.push({
            periodo: d.periodo, tipo: d.tipo || null,
            base, agua, m3Agua: null,
            mora, mesesMora: d.meses,
            total: deudaOrig + mora,
        });
    }
    return items;
};

const anticipoChipSx = (estado) => {
    if (estado === 'Disponible') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Aplicado') return { bgcolor: '#E4EEF5', color: '#1F5F8B' };
    return { bgcolor: '#FDF0D5', color: '#B6802A' };
};

const tabGroupSx = {
    bgcolor: '#fff',
    '& .MuiToggleButton-root': {
        textTransform: 'none', fontWeight: 600, color: '#1F5F8B', borderColor: '#cdd8e3', px: 3, py: 1,
    },
    '& .MuiToggleButton-root.Mui-selected': {
        bgcolor: '#1F5F8B', color: '#fff', '&:hover': { bgcolor: '#1C4E70' },
    },
};

const estadoChipSx = (estado) => (estado === 'Completo'
    ? { bgcolor: '#E4F4EE', color: '#2E9D78' }
    : { bgcolor: '#FDF0D5', color: '#B6802A' });

const PAGE_SIZE = 5;

// --- Tarjeta de dato numerico simplificada (sin subtitulo) ---
const StatMini = ({ label, value, color = '#1a2733', bg = '#fff', border = '#E2E8F0' }) => (
    <Box sx={{ p: 1.75, bgcolor: bg, borderRadius: 2, border: `1px solid ${border}`, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>{label}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color }}>{value}</Typography>
    </Box>
);

// --- Card reusable que renderiza la composicion de UNA expensa (base + agua + consumo + mora + total) ---
// Se usa tanto en el modal de Pago como en el de Anticipo.
const ExpensaCard = ({ periodo, tipo, base, agua, m3Agua, mora, mesesMora, total, chipExtra }) => {
    const esVencida = mora > 0;
    return (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#F8FAFC', borderLeft: `4px solid ${esVencida ? '#D9534F' : '#1F5F8B'}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{periodo}</Typography>
                {chipExtra}
                {esVencida && (
                    <Chip label={`${mesesMora} ${mesesMora === 1 ? 'mes' : 'meses'} de atraso`} size="small"
                        sx={{ bgcolor: '#FDE7E6', color: '#D9534F', fontWeight: 600 }} />
                )}
            </Box>

            {/* 3 cards: Expensa base + Agua + Consumo (solo numeros, sin subtitulos) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: esVencida ? 1.5 : 2 }}>
                <StatMini label="Expensa base" value={formatBs(base)}
                    color="#1F5F8B" bg="#E4EEF5" border="#CFDCEA" />
                <StatMini label="Agua" value={formatBs(agua)}
                    color="#2E9D78" bg="#E4F4EE" border="#C6E6D7" />
                <StatMini label="Consumo" value={m3Agua != null ? `${m3Agua} m³` : '—'}
                    color="#64748B" bg="#F1F5FA" border="#CFDCEA" />
            </Box>

            {/* Card de mora (solo si hay) */}
            {esVencida && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.5, mb: 2 }}>
                    <StatMini label="Mora" value={`+ ${formatBs(mora)}`}
                        color="#D9534F" bg="#FDE7E6" border="#F5C6CB" />
                    <StatMini label="Deuda original" value={formatBs(base + agua)}
                        color="#64748B" bg="#F1F5FA" border="#CFDCEA" />
                </Box>
            )}

            {/* Total del periodo (sin repetir el nombre del mes) */}
            <Box sx={{ borderTop: '1px dashed #CFDCEA', pt: 1.25, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Total</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2733' }}>{formatBs(total)}</Typography>
            </Box>
        </Paper>
    );
};

export default function Pagos() {
    const navigate = useNavigate();
    const [tab, setTab] = useState('expensas');
    const [periodo, setPeriodo] = useState('Octubre 2026');
    const [departamento, setDepartamento] = useState('Todos');
    const [estado, setEstado] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');
    const [limite, setLimite] = useState(PAGE_SIZE);
    const [tick, setTick] = useState(0);

    const [menuAnchor, setMenuAnchor] = useState(null);
    const [pagoSel, setPagoSel] = useState(null);
    const [detalleAbierto, setDetalleAbierto] = useState(false);
    const [anularAbierto, setAnularAbierto] = useState(false);
    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    const [anticipoSel, setAnticipoSel] = useState(null);
    const [anticipoAbierto, setAnticipoAbierto] = useState(false);

    const abrirMenu = (e, p) => { setMenuAnchor(e.currentTarget); setPagoSel(p); };
    const cerrarMenu = () => setMenuAnchor(null);
    const verDetalle = () => { setDetalleAbierto(true); cerrarMenu(); };
    const imprimirRecibo = () => {
        setSnack({ open: true, msg: `Recibo del pago ${pagoSel?.id} enviado a impresion`, sev: 'success' });
        cerrarMenu();
    };
    const abrirAnular = () => { setAnularAbierto(true); cerrarMenu(); };

    const abrirAnticipo = (a) => { setAnticipoSel(a); setAnticipoAbierto(true); };
    const cerrarAnticipo = () => { setAnticipoAbierto(false); };

    const confirmarAnular = () => {
        const idx = PAGOS_MOCK.findIndex((p) => p.id === pagoSel.id);
        if (idx >= 0) {
            const p = PAGOS_MOCK[idx];
            PAGOS_MOCK.splice(idx, 1);
            const depto = DEPARTAMENTOS_DEUDA.find((d) => d.id === p.depto);
            if (depto) depto.saldoPendiente = (depto.saldoPendiente || 0) + p.monto;
            setSnack({ open: true, msg: `Pago ${p.id} anulado. Se restauraron ${formatBs(p.monto)} al saldo del depto ${p.depto}.`, sev: 'warning' });
        }
        setAnularAbierto(false);
        setPagoSel(null);
        setTick((t) => t + 1);
    };

    const resumenExp = useMemo(() => {
        const pagosDelMes = PAGOS_MOCK.filter((p) => fechaEnPeriodo(p.fecha, periodo));
        const registrados = pagosDelMes.length;
        const cobrado = pagosDelMes
            .filter((p) => periodoCoincide(p.periodoAplicado, periodo))
            .reduce((s, p) => s + (p.monto || 0), 0);
        const recuperado = pagosDelMes
            .filter((p) => !periodoCoincide(p.periodoAplicado, periodo))
            .reduce((s, p) => s + (p.monto || 0), 0);
        return { cobrado, registrados, recuperado };
    }, [periodo, tick]);

    const resumenAnt = useMemo(() => {
        const recibidos = HISTORIAL_ANTICIPOS.reduce((s, a) => s + (a.recibido || 0), 0);
        const aplicado = HISTORIAL_ANTICIPOS.reduce((s, a) => s + (a.aplicado || 0), 0);
        const disponible = HISTORIAL_ANTICIPOS.reduce((s, a) => s + (a.credito || 0), 0);
        return { recibidos, aplicado, disponible };
    }, [tick]);

    const nombreMes = (periodo || '').split(' ')[0] || 'periodo';

    const RESUMEN_EXP = [
        { label: `Cobrado en ${nombreMes}`, valor: formatBs(resumenExp.cobrado), nota: 'Pagos aplicados al periodo seleccionado', icon: <TrendingUpIcon />, color: '#2E9D78', bg: '#E4F4EE' },
        { label: 'Pagos registrados', valor: `${resumenExp.registrados} pagos`, nota: 'Incluye pagos parciales', icon: <ReceiptLongIcon />, color: '#1F5F8B', bg: '#E4EEF5' },
        { label: 'Saldo recuperado', valor: formatBs(resumenExp.recuperado), nota: 'Pagos a deudas de meses anteriores', icon: <SavingsIcon />, color: '#8E6DD1', bg: '#EFEAF8' },
    ];

    const RESUMEN_ANT = [
        { label: 'Anticipos recibidos', valor: formatBs(resumenAnt.recibidos), nota: 'Total depositado por residentes', icon: <TrendingUpIcon />, color: '#2E9D78', bg: '#E4F4EE' },
        { label: 'Ya aplicado', valor: formatBs(resumenAnt.aplicado), nota: 'Consumido en expensas', icon: <TaskAltIcon />, color: '#E5A33B', bg: '#FDF0D5' },
        { label: 'Saldo a favor', valor: formatBs(resumenAnt.disponible), nota: 'Pendiente de aplicar', icon: <AccountBalanceWalletIcon />, color: '#1F5F8B', bg: '#E4EEF5' },
    ];

    const pagosFiltrados = useMemo(() => {
        return PAGOS_MOCK.filter((p) =>
            fechaEnPeriodo(p.fecha, periodo) &&
            (departamento === 'Todos' || p.depto === departamento) &&
            (estado === 'Todos' || p.estado === estado) &&
            (p.depto + p.responsable + p.id).toLowerCase().includes(busqueda.toLowerCase()));
    }, [periodo, departamento, estado, busqueda, tick]);

    const pagosVisibles = pagosFiltrados.slice(0, limite);
    const hayMas = pagosFiltrados.length > limite;

    const composicion = useMemo(() => calcularComposicion(pagoSel), [pagoSel]);
    const totalComp = useMemo(() => composicion.reduce((s, c) => s + (c.total || 0), 0), [composicion]);
    const tasaMora = CONFIG_MORA?.interesMensual || 0;
    const tipoCalc = (CONFIG_MORA?.tipoCalculo || 'Simple').toLowerCase();

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Pagos de expensas</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Consulta el historial y registra los pagos realizados por departamento
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'stretch', md: 'flex-end' }, mb: 2 }}>
                {tab === 'expensas' && (
                    <>
                        <Button variant="outlined" startIcon={<AccountBalanceOutlinedIcon />}
                            onClick={() => navigate('/finanzas/pagos/conciliacion')}
                            sx={{ color: '#1a2733', borderColor: '#cdd8e3', width: { xs: '100%', md: 'auto' } }}>
                            Conciliacion bancaria
                        </Button>
                        <Button variant="contained" startIcon={<AddIcon />}
                            onClick={() => navigate('/finanzas/pagos/registrar')}
                            sx={{ width: { xs: '100%', md: 'auto' } }}>
                            Registrar pago
                        </Button>
                    </>
                )}
                {tab === 'anticipados' && (
                    <Button variant="contained" startIcon={<AddIcon />}
                        onClick={() => navigate('/finanzas/pagos/anticipo')}
                        sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Registrar anticipo
                    </Button>
                )}
            </Box>

            <Paper sx={{ p: 1.5, borderRadius: 2, mb: 2 }}>
                <ToggleButtonGroup exclusive value={tab} onChange={(e, v) => v && setTab(v)} sx={tabGroupSx}>
                    <ToggleButton value="expensas">Pagos de expensas</ToggleButton>
                    <ToggleButton value="anticipados">Pagos anticipados</ToggleButton>
                </ToggleButtonGroup>
            </Paper>

            {tab === 'expensas' && (
                <Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                        {RESUMEN_EXP.map((r) => (
                            <Paper key={r.label} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', bgcolor: r.bg, color: r.color, display: 'grid', placeItems: 'center' }}>
                                    {r.icon}
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: r.color }}>{r.valor}</Typography>
                                    <Typography variant="caption" sx={{ color: r.color }}>{r.nota}</Typography>
                                </Box>
                            </Paper>
                        ))}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mb: 3 }}>
                        <Box sx={{ flex: 2, minWidth: 200 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Buscar</Typography>
                            <TextField fullWidth placeholder="Departamento, responsable o N.º de pago" value={busqueda}
                                onChange={(e) => { setBusqueda(e.target.value); setLimite(PAGE_SIZE); }}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                            <Select fullWidth value={periodo} onChange={(e) => { setPeriodo(e.target.value); setLimite(PAGE_SIZE); }}>
                                {PERIODOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                            </Select>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Departamento</Typography>
                            <Select fullWidth value={departamento} onChange={(e) => { setDepartamento(e.target.value); setLimite(PAGE_SIZE); }}>
                                {DEPARTAMENTOS_PAGO.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                            </Select>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Estado</Typography>
                            <Select fullWidth value={estado} onChange={(e) => { setEstado(e.target.value); setLimite(PAGE_SIZE); }}>
                                {ESTADOS_PAGO.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                            </Select>
                        </Box>
                    </Box>

                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Historial de pagos</Typography>
                            <Typography variant="body2" color="text.secondary">{pagosFiltrados.length} {pagosFiltrados.length === 1 ? 'registro' : 'registros'}</Typography>
                        </Box>
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 880 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                        <TableCell><strong>N.º pago</strong></TableCell>
                                        <TableCell><strong>Fecha</strong></TableCell>
                                        <TableCell><strong>Depto.</strong></TableCell>
                                        <TableCell><strong>Responsable</strong></TableCell>
                                        <TableCell><strong>Periodo aplicado</strong></TableCell>
                                        <TableCell><strong>Monto</strong></TableCell>
                                        <TableCell><strong>Saldo posterior</strong></TableCell>
                                        <TableCell><strong>Estado</strong></TableCell>
                                        <TableCell align="center"><strong></strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pagosVisibles.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                                No hay pagos registrados para {periodo}.
                                            </TableCell>
                                        </TableRow>
                                    ) : pagosVisibles.map((p) => {
                                        const esRecuperado = !periodoCoincide(p.periodoAplicado, periodo);
                                        return (
                                            <TableRow key={p.id} sx={esRecuperado ? { bgcolor: '#EFEAF8' } : {}}>
                                                <TableCell sx={{ color: 'primary.main', fontWeight: 600 }}>{p.id}</TableCell>
                                                <TableCell>{p.fecha}</TableCell>
                                                <TableCell>{p.depto}</TableCell>
                                                <TableCell>{p.responsable}</TableCell>
                                                <TableCell>
                                                    {p.periodoAplicado}
                                                    {esRecuperado && (
                                                        <Chip label="Recuperado" size="small"
                                                            sx={{ ml: 0.5, bgcolor: '#8E6DD1', color: '#fff', fontWeight: 600, height: 18, fontSize: '0.65rem' }} />
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>{formatBs(p.monto)}</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: p.saldoPosterior > 0 ? '#D9534F' : '#2E9D78' }}>{formatBs(p.saldoPosterior)}</TableCell>
                                                <TableCell><Chip label={p.estado} size="small" sx={estadoChipSx(p.estado)} /></TableCell>
                                                <TableCell align="center">
                                                    <IconButton size="small" onClick={(e) => abrirMenu(e, p)}>
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Mostrando {pagosVisibles.length} de {pagosFiltrados.length}
                            </Typography>
                            {hayMas && (
                                <Button variant="outlined" onClick={() => setLimite((l) => l + PAGE_SIZE)}
                                    sx={{ color: '#1a2733', borderColor: '#cdd8e3' }}>
                                    Ver mas
                                </Button>
                            )}
                        </Box>

                        <Box sx={{ bgcolor: '#F1F5FA', borderRadius: 2, p: 1.5, mt: 2 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.75 }}>¿Que significa cada columna?</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                <strong>Monto</strong>: cuanto pago el depto en ese registro &nbsp;·&nbsp;
                                <strong>Saldo posterior</strong>: cuanto le queda debiendo al edificio despues del pago &nbsp;·&nbsp;
                                <strong>Completo</strong>: quedo al dia (saldo posterior Bs 0) &nbsp;·&nbsp;
                                <strong>Parcial</strong>: aun queda saldo pendiente.
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                <Box sx={{ width: 14, height: 14, bgcolor: '#EFEAF8', border: '1px solid #CFDCEA', borderRadius: 0.5 }} />
                                <Typography variant="caption" color="text.secondary">
                                    Filas en lila = pagos cobrados en {nombreMes} aplicados a deudas de meses anteriores (<strong>Saldo recuperado</strong>).
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            )}

            {tab === 'anticipados' && (
                <Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                        {RESUMEN_ANT.map((r) => (
                            <Paper key={r.label} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', bgcolor: r.bg, color: r.color, display: 'grid', placeItems: 'center' }}>
                                    {r.icon}
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: r.color }}>{r.valor}</Typography>
                                    <Typography variant="caption" sx={{ color: r.color }}>{r.nota}</Typography>
                                </Box>
                            </Paper>
                        ))}
                    </Box>

                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Historial de anticipos</Typography>
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 880 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                        <TableCell><strong>N.º</strong></TableCell>
                                        <TableCell><strong>Fecha</strong></TableCell>
                                        <TableCell><strong>Depto.</strong></TableCell>
                                        <TableCell><strong>Responsable</strong></TableCell>
                                        <TableCell><strong>Recibido</strong></TableCell>
                                        <TableCell><strong>Aplicado</strong></TableCell>
                                        <TableCell><strong>Saldo a favor</strong></TableCell>
                                        <TableCell><strong>Estado</strong></TableCell>
                                        <TableCell align="center"><strong></strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {HISTORIAL_ANTICIPOS.map((a) => (
                                        <TableRow key={a.id}>
                                            <TableCell sx={{ color: 'primary.main', fontWeight: 600 }}>{a.id}</TableCell>
                                            <TableCell>{a.fecha}</TableCell>
                                            <TableCell>{a.depto}</TableCell>
                                            <TableCell>{a.responsable}</TableCell>
                                            <TableCell sx={{ color: '#2E9D78', fontWeight: 600 }}>{formatBs(a.recibido)}</TableCell>
                                            <TableCell>{formatBs(a.aplicado)}</TableCell>
                                            <TableCell sx={{ color: a.credito > 0 ? '#2E9D78' : '#64748B', fontWeight: 600 }}>{formatBs(a.credito)}</TableCell>
                                            <TableCell><Chip label={a.estado} size="small" sx={anticipoChipSx(a.estado)} /></TableCell>
                                            <TableCell align="center">
                                                <IconButton size="small" onClick={() => abrirAnticipo(a)}>
                                                    <VisibilityOutlinedIcon fontSize="small" sx={{ color: '#1F5F8B' }} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>

                        <Box sx={{ bgcolor: '#F1F5FA', borderRadius: 2, p: 1.5, mt: 2 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.75 }}>¿Que significa cada columna?</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                <strong>Recibido</strong>: lo que el depto deposito por adelantado &nbsp;·&nbsp;
                                <strong>Aplicado</strong>: cuanto de ese anticipo ya se descuento para pagar expensas &nbsp;·&nbsp;
                                <strong>Saldo a favor</strong>: cuanto le queda disponible (Recibido − Aplicado).
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                <Chip label="Disponible" size="small" sx={anticipoChipSx('Disponible')} />
                                <Typography variant="caption" color="text.secondary">todo el anticipo esta a favor del depto, sin usar.</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                <Chip label="Parcial" size="small" sx={anticipoChipSx('Parcial')} />
                                <Typography variant="caption" color="text.secondary">parte se aplico a expensas; queda saldo a favor.</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Chip label="Aplicado" size="small" sx={anticipoChipSx('Aplicado')} />
                                <Typography variant="caption" color="text.secondary">totalmente consumido en expensas, sin saldo a favor.</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 1.5, mt: 1.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Integracion con flujo de caja</Typography>
                            <Typography variant="body2" color="text.secondary">
                                El anticipo cuenta como ingreso al recibirse. Aplicarlo luego no duplica el ingreso.
                            </Typography>
                        </Box>
                    </Paper>
                </Box>
            )}

            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={cerrarMenu}>
                <MenuItem onClick={verDetalle}>
                    <VisibilityOutlinedIcon fontSize="small" sx={{ mr: 1, color: '#1F5F8B' }} />
                    Ver detalle del pago
                </MenuItem>
                <MenuItem onClick={imprimirRecibo}>
                    <PrintOutlinedIcon fontSize="small" sx={{ mr: 1, color: '#1F5F8B' }} />
                    Imprimir recibo
                </MenuItem>
                <MenuItem onClick={abrirAnular} sx={{ color: '#D9534F' }}>
                    <CancelOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                    Anular pago
                </MenuItem>
            </Menu>

            {/* ============================================================ */}
            {/* Dialog: Ver detalle del pago                                 */}
            {/* ============================================================ */}
            <Dialog open={detalleAbierto} onClose={() => setDetalleAbierto(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Detalle del pago {pagoSel?.id}</DialogTitle>
                <DialogContent dividers>
                    {pagoSel && (
                        <Box>
                            {/* 1. Datos del pago */}
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Datos del pago</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Fecha</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{pagoSel.fecha}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Departamento</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{pagoSel.depto}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Responsable</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{pagoSel.responsable}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Pagado por</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{pagoSel.pagadoPor || pagoSel.responsable}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Medio</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{pagoSel.medio || '—'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Referencia</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{pagoSel.referencia || '—'}</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* 2. Composicion con cards reusables */}
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Composicion de la expensa</Typography>
                            {composicion.length === 0 ? (
                                <Box sx={{ bgcolor: '#FDF0D5', borderRadius: 2, p: 1.5, mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Pago conciliado manualmente. Monto registrado: <strong>{formatBs(pagoSel.monto)}</strong>.
                                    </Typography>
                                </Box>
                            ) : composicion.map((c, i) => (
                                <ExpensaCard
                                    key={i}
                                    periodo={c.periodo}
                                    tipo={c.tipo}
                                    base={c.base}
                                    agua={c.agua}
                                    m3Agua={c.m3Agua}
                                    mora={c.mora}
                                    mesesMora={c.mesesMora}
                                    total={c.total}
                                />
                            ))}

                            <Divider sx={{ my: 2 }} />

                            {/* 3. Totales grandes del pago */}
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Resumen del cobro</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 1.5 }}>
                                <Box sx={{ p: 2, bgcolor: '#F1F5FA', borderRadius: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Total a cobrar</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                        {composicion.length > 0 ? formatBs(totalComp) : formatBs(pagoSel.monto + pagoSel.saldoPosterior)}
                                    </Typography>
                                </Box>
                                <Box sx={{ p: 2, bgcolor: '#E4F4EE', borderRadius: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Monto pagado</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(pagoSel.monto)}</Typography>
                                </Box>
                                <Box sx={{ p: 2, bgcolor: pagoSel.saldoPosterior > 0 ? '#FDE7E6' : '#E4F4EE', borderRadius: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Saldo posterior</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: pagoSel.saldoPosterior > 0 ? '#D9534F' : '#2E9D78' }}>
                                        {formatBs(pagoSel.saldoPosterior)}
                                    </Typography>
                                </Box>
                            </Box>

                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                                {pagoSel.saldoPosterior > 0
                                    ? `El saldo pendiente no cobra mora hasta pasar la fecha de vencimiento. Despues: ${tasaMora}% mensual (${tipoCalc}) sobre la deuda original.`
                                    : 'El depto quedo al dia con este pago.'}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetalleAbierto(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog: Confirmar anulacion */}
            <Dialog open={anularAbierto} onClose={() => setAnularAbierto(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Anular pago</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        ¿Confirmas la anulacion del pago <strong>{pagoSel?.id}</strong>?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Se eliminara del historial y los <strong>{formatBs(pagoSel?.monto || 0)}</strong> se devolveran al saldo pendiente del
                        departamento <strong>{pagoSel?.depto}</strong>. Esta accion es util cuando se registra un pago por error.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAnularAbierto(false)}>Cancelar</Button>
                    <Button color="error" variant="contained" onClick={confirmarAnular}>Anular</Button>
                </DialogActions>
            </Dialog>

            {/* ============================================================ */}
            {/* Dialog: Ver detalle del anticipo (misma estructura del pago) */}
            {/* ============================================================ */}
            <Dialog open={anticipoAbierto} onClose={cerrarAnticipo} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Detalle del anticipo {anticipoSel?.id}</DialogTitle>
                <DialogContent dividers>
                    {anticipoSel && (
                        <Box>
                            {/* 1. Datos del anticipo */}
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Datos del anticipo</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Fecha</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{anticipoSel.fecha}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Departamento</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{anticipoSel.depto}</Typography>
                                        {anticipoSel.tipoDepto && (
                                            <Chip label={`Tipo ${anticipoSel.tipoDepto}`} size="small"
                                                sx={{ bgcolor: '#E4EEF5', color: '#1F5F8B', fontWeight: 600, height: 20 }} />
                                        )}
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Responsable</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{anticipoSel.responsable}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Pagado por</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{anticipoSel.pagadoPor || anticipoSel.responsable}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Medio</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{anticipoSel.medio || '—'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Referencia</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{anticipoSel.referencia || '—'}</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* 2. Movimiento del anticipo */}
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Movimiento del anticipo</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                                <Box sx={{ p: 2, bgcolor: '#E4F4EE', borderRadius: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Recibido</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(anticipoSel.recibido)}</Typography>
                                </Box>
                                <Box sx={{ p: 2, bgcolor: '#FDF0D5', borderRadius: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Ya aplicado</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#B6802A' }}>{formatBs(anticipoSel.aplicado)}</Typography>
                                </Box>
                                <Box sx={{ p: 2, bgcolor: '#E4EEF5', borderRadius: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Saldo a favor</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#1F5F8B' }}>{formatBs(anticipoSel.credito)}</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* 3. Expensas cubiertas (MISMA estructura del detalle de pago) */}
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Expensas cubiertas por este anticipo</Typography>
                            {(!anticipoSel.aplicaciones || anticipoSel.aplicaciones.length === 0) ? (
                                <Box sx={{ bgcolor: '#E4F4EE', borderRadius: 2, p: 1.5, mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Todavia no se aplico a ninguna expensa. Saldo integro a favor del depto <strong>{anticipoSel.depto}</strong>.
                                    </Typography>
                                </Box>
                            ) : anticipoSel.aplicaciones.map((ap, i) => (
                                <ExpensaCard
                                    key={i}
                                    periodo={ap.periodo}
                                    tipo={ap.tipo}
                                    base={ap.base}
                                    agua={ap.agua}
                                    m3Agua={ap.m3Agua}
                                    mora={ap.mora || 0}
                                    mesesMora={ap.mesesMora || 0}
                                    total={ap.monto}
                                    chipExtra={ap.pagoRef && (
                                        <Chip label={ap.pagoRef} size="small"
                                            sx={{ bgcolor: '#E4EEF5', color: '#1F5F8B', fontWeight: 600 }} />
                                    )}
                                />
                            ))}

                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                                Un anticipo solo cubre expensas (base + agua + mora). No se aplica a multas, reservas ni servicios extras.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={cerrarAnticipo}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: '100%' }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </DashboardLayout>
    );
}