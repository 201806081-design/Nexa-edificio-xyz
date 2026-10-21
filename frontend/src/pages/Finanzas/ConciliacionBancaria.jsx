import { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    PERIODOS, CUENTAS_BANCARIAS, ESTADOS_CONCILIACION, TIPOS_MOV_BANCO, MOVIMIENTOS_BANCARIOS,
} from '../../constants/conciliacionMock';
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

export default function ConciliacionBancaria() {
    const navigate = useNavigate();
    const [cuenta, setCuenta] = useState(CUENTAS_BANCARIAS[0]);
    const [periodo, setPeriodo] = useState(PERIODOS[0]);
    const [estado, setEstado] = useState('Todos');
    const [tipo, setTipo] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');
    const [movs, setMovs] = useState(MOVIMIENTOS_BANCARIOS.map((m) => ({ ...m })));

    const [verMov, setVerMov] = useState(null);
    const [accionMov, setAccionMov] = useState(null);
    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    const conciliar = (id) => {
        setMovs((arr) => arr.map((m) => (m.id === id && m.sistemaRef ? { ...m, estado: 'Conciliado', coincidencia: 'Exacta' } : m)));
        setSnack({ open: true, msg: 'Movimiento conciliado', sev: 'success' });
    };

    const conciliarAuto = () => {
        setMovs((arr) => arr.map((m) => (m.coincidencia === 'Sugerida' && m.sistemaRef ? { ...m, estado: 'Conciliado', coincidencia: 'Exacta' } : m)));
        setSnack({ open: true, msg: 'Movimientos sugeridos conciliados', sev: 'success' });
    };

    const marcarInvestigado = () => {
        setMovs((arr) => arr.map((m) => (m.id === accionMov.id ? { ...m, estado: 'Pendiente' } : m)));
        setAccionMov(null);
        setSnack({ open: true, msg: 'Marcado como "en investigacion"', sev: 'warning' });
    };

    const total = movs.length;
    const conciliados = movs.filter((m) => m.estado === 'Conciliado').length;
    const pendientes = movs.filter((m) => m.estado === 'Pendiente').length;
    const alertas = movs.filter((m) => m.estado === 'Alerta').length;

    const filtrados = movs.filter((m) =>
        (estado === 'Todos' || m.estado === estado) &&
        (tipo === 'Todos' || m.tipo === tipo) &&
        (m.referencia + (m.sistemaRef || '') + (m.depto || '') + m.descripcion).toLowerCase().includes(busqueda.toLowerCase()));

    const RESUMEN = [
        { label: 'Total movimientos', valor: total, nota: `Periodo ${periodo.toLowerCase()}`, icon: <AccountBalanceWalletIcon />, color: '#1F5F8B', bg: '#E4EEF5' },
        { label: 'Conciliados', valor: conciliados, nota: 'Coincidencia confirmada', icon: <CheckCircleIcon />, color: '#2E9D78', bg: '#E4F4EE' },
        { label: 'Pendientes', valor: pendientes, nota: 'Requieren revision', icon: <HourglassBottomIcon />, color: '#B6802A', bg: '#FDF0D5' },
        { label: 'Alertas', valor: alertas, nota: 'Egreso sin registrar', icon: <ReportProblemIcon />, color: '#D9534F', bg: '#FBEAE9' },
    ];

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Conciliacion bancaria</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Compara los movimientos del banco con lo registrado en el sistema (ingresos y egresos)
            </Typography>

            {/* Fila de acciones (patron Expensas) */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'stretch', md: 'flex-end' }, mb: 2 }}>
                <Button variant="outlined" startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/finanzas/pagos')}
                    sx={{ color: '#1a2733', borderColor: '#cdd8e3', width: { xs: '100%', md: 'auto' } }}>
                    Volver a pagos
                </Button>
                <Button variant="contained" startIcon={<SyncIcon />} onClick={conciliarAuto}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Conciliar automaticamente
                </Button>
            </Box>

            {/* Explicacion rapida */}
            <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>¿Para que sirve esta pantalla?</Typography>
                <Typography variant="body2">
                    Cruza <strong>todos los movimientos del banco</strong> (depositos, pagos QR, debitos y retiros) con los registros del sistema.
                    Si aparece algo en el banco que no esta en el sistema, se marca para revisar — util para detectar pagos no registrados o
                    <strong> retiros sospechosos</strong>.
                </Typography>
            </Alert>

            {/* 4 tarjetas de resumen con iconos y colores semanticos */}
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

            {/* Filtros */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mb: 3 }}>
                <Box sx={{ flex: 1, minWidth: 160 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Cuenta bancaria</Typography>
                    <Select fullWidth value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
                        {CUENTAS_BANCARIAS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 140 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                    <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                        {PERIODOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
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

            {/* Tabla de movimientos */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Movimientos para conciliar</Typography>
                    <Typography variant="body2" color="text.secondary">Ultima sincronizacion: 09:35</Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 980 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Fecha / referencia</strong></TableCell>
                                <TableCell><strong>Tipo</strong></TableCell>
                                <TableCell><strong>Descripcion</strong></TableCell>
                                <TableCell align="right"><strong>Monto</strong></TableCell>
                                <TableCell><strong>Registro en sistema</strong></TableCell>
                                <TableCell><strong>Coincidencia</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell align="center"><strong>Accion</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtrados.map((m) => {
                                const esIngreso = m.tipo === 'Ingreso';
                                const esAlerta = m.estado === 'Alerta';
                                return (
                                    <TableRow key={m.id} sx={esAlerta ? { bgcolor: '#FDEEEC' } : {}}>
                                        <TableCell>{m.fecha} · {m.referencia}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={m.tipo}
                                                size="small"
                                                icon={esIngreso ? <NorthIcon sx={{ fontSize: 14 }} /> : <SouthIcon sx={{ fontSize: 14 }} />}
                                                sx={tipoChipSx(m.tipo)}
                                            />
                                        </TableCell>
                                        <TableCell>{m.descripcion}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: esIngreso ? '#2E9D78' : '#D9534F' }}>
                                            {esIngreso ? '+' : '-'} {formatBs(m.monto)}
                                        </TableCell>
                                        <TableCell sx={{ color: m.sistemaRef ? 'primary.main' : '#D9534F', fontWeight: 600 }}>
                                            {m.sistemaRef || 'Sin registro'}
                                            {m.depto && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>(Dpto. {m.depto})</Typography>}
                                        </TableCell>
                                        <TableCell sx={{ color: coincidenciaColor(m.coincidencia), fontWeight: 600 }}>{m.coincidencia}</TableCell>
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
                        <strong>Conciliar</strong> no modifica el monto: vincula el movimiento bancario con el registro del sistema.
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
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{cuenta}</Typography>
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
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{verMov.descripcion}</Typography>
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
                                    No hay registro en el sistema para este movimiento del banco. {verMov.estado === 'Alerta'
                                        ? 'Investigue si corresponde a un gasto legitimo del edificio.'
                                        : 'Registre el pago para poder conciliarlo.'}
                                </Alert>
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