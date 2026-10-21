import { useState } from 'react';
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
    PERIODOS, RESUMEN_PAGOS, ESTADOS_PAGO, DEPARTAMENTOS_PAGO, PAGOS_MOCK,
    RESUMEN_ANTICIPOS, HISTORIAL_ANTICIPOS,
} from '../../constants/pagosMock';
import { formatBs } from '../../constants/finanzasMock';

const anticipoChipSx = (estado) => (estado === 'Disponible'
    ? { bgcolor: '#E4F4EE', color: '#2E9D78' }
    : { bgcolor: '#FDF0D5', color: '#B6802A' });

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

// Tarjetas de resumen de pagos de expensas (cada una con su icono y color propios)
const RESUMEN = [
    { clave: 'cobradoOctubre', label: 'Cobrado en octubre', nota: '+12 % frente a septiembre', money: true, icon: <TrendingUpIcon />, color: '#2E9D78', bg: '#E4F4EE' },
    { clave: 'pagosRegistrados', label: 'Pagos registrados', nota: 'Incluye pagos parciales', money: false, sufijo: ' pagos', icon: <ReceiptLongIcon />, color: '#1F5F8B', bg: '#E4EEF5' },
    { clave: 'saldoRecuperado', label: 'Saldo recuperado', nota: 'Aplicado a deudas pendientes', money: true, icon: <SavingsIcon />, color: '#8E6DD1', bg: '#EFEAF8' },
];

// Tarjetas de resumen de pagos anticipados
const RESUMEN_ANT = [
    { clave: 'recibidos', label: 'Anticipos recibidos', nota: 'Octubre 2026', icon: <TrendingUpIcon />, color: '#2E9D78', bg: '#E4F4EE' },
    { clave: 'aplicado', label: 'Credito aplicado', nota: 'A expensas generadas', icon: <TaskAltIcon />, color: '#E5A33B', bg: '#FDF0D5' },
    { clave: 'disponible', label: 'Credito disponible', nota: 'Saldo a favor total', icon: <AccountBalanceWalletIcon />, color: '#1F5F8B', bg: '#E4EEF5' },
];

export default function Pagos() {
    const navigate = useNavigate();
    const [tab, setTab] = useState('expensas');
    const [periodo, setPeriodo] = useState(PERIODOS[0]);
    const [departamento, setDepartamento] = useState('Todos');
    const [estado, setEstado] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');

    // Menu de acciones de la tabla (3 puntitos)
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [pagoSel, setPagoSel] = useState(null);
    const [detalleAbierto, setDetalleAbierto] = useState(false);
    const [anularAbierto, setAnularAbierto] = useState(false);
    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    const abrirMenu = (e, p) => { setMenuAnchor(e.currentTarget); setPagoSel(p); };
    const cerrarMenu = () => setMenuAnchor(null);
    const verDetalle = () => { setDetalleAbierto(true); cerrarMenu(); };
    const imprimirRecibo = () => {
        setSnack({ open: true, msg: `Recibo del pago ${pagoSel?.id} enviado a impresion`, sev: 'success' });
        cerrarMenu();
    };
    const abrirAnular = () => { setAnularAbierto(true); cerrarMenu(); };
    const confirmarAnular = () => {
        setAnularAbierto(false);
        setSnack({ open: true, msg: `Pago ${pagoSel?.id} anulado (simulado en mock)`, sev: 'warning' });
    };

    const pagos = PAGOS_MOCK.filter((p) =>
        (departamento === 'Todos' || p.depto === departamento) &&
        (estado === 'Todos' || p.estado === estado) &&
        (p.depto + p.responsable + p.id).toLowerCase().includes(busqueda.toLowerCase()));

    return (
        <DashboardLayout>
            {/* Header (patron Expensas): titulo + subtitulo */}
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Pagos de expensas</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Consulta el historial y registra los pagos realizados por departamento
            </Typography>

            {/* Fila de acciones (patron Expensas): alineada a la derecha, debajo del subtitulo */}
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

            {/* Tabs */}
            <Paper sx={{ p: 1.5, borderRadius: 2, mb: 2 }}>
                <ToggleButtonGroup exclusive value={tab} onChange={(e, v) => v && setTab(v)} sx={tabGroupSx}>
                    <ToggleButton value="expensas">Pagos de expensas</ToggleButton>
                    <ToggleButton value="anticipados">Pagos anticipados</ToggleButton>
                </ToggleButtonGroup>
            </Paper>

            {tab === 'expensas' && (
                <Box>
                    {/* Resumen (3 tarjetas) */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                        {RESUMEN.map((r) => (
                            <Paper key={r.clave} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', bgcolor: r.bg, color: r.color, display: 'grid', placeItems: 'center' }}>
                                    {r.icon}
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: r.color }}>
                                        {r.money ? formatBs(RESUMEN_PAGOS[r.clave]) : `${RESUMEN_PAGOS[r.clave]}${r.sufijo || ''}`}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: r.color }}>{r.nota}</Typography>
                                </Box>
                            </Paper>
                        ))}
                    </Box>

                    {/* Filtros */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mb: 3 }}>
                        <Box sx={{ flex: 2, minWidth: 200 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Buscar</Typography>
                            <TextField fullWidth placeholder="Departamento, responsable o N.º de pago" value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                            <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                                {PERIODOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                            </Select>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Departamento</Typography>
                            <Select fullWidth value={departamento} onChange={(e) => setDepartamento(e.target.value)}>
                                {DEPARTAMENTOS_PAGO.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                            </Select>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Estado</Typography>
                            <Select fullWidth value={estado} onChange={(e) => setEstado(e.target.value)}>
                                {ESTADOS_PAGO.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                            </Select>
                        </Box>
                    </Box>

                    {/* Historial de pagos */}
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Historial de pagos</Typography>
                            <Typography variant="body2" color="text.secondary">{pagos.length} registros</Typography>
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
                                    {pagos.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell sx={{ color: 'primary.main', fontWeight: 600 }}>{p.id}</TableCell>
                                            <TableCell>{p.fecha}</TableCell>
                                            <TableCell>{p.depto}</TableCell>
                                            <TableCell>{p.responsable}</TableCell>
                                            <TableCell>{p.periodoAplicado}</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{formatBs(p.monto)}</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: p.saldoPosterior > 0 ? '#D9534F' : '#2E9D78' }}>{formatBs(p.saldoPosterior)}</TableCell>
                                            <TableCell><Chip label={p.estado} size="small" sx={estadoChipSx(p.estado)} /></TableCell>
                                            <TableCell align="center">
                                                <IconButton size="small" onClick={(e) => abrirMenu(e, p)}>
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">Mostrando {pagos.length} de {RESUMEN_PAGOS.pagosRegistrados} pagos</Typography>
                            <Button variant="outlined" sx={{ color: '#1a2733', borderColor: '#cdd8e3' }}>Ver mas</Button>
                        </Box>
                    </Paper>
                </Box>
            )}

            {/* Tab Pagos anticipados (movido desde Mora) */}
            {tab === 'anticipados' && (
                <Box>
                    {/* Resumen (3 tarjetas) */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                        {RESUMEN_ANT.map((r) => (
                            <Paper key={r.clave} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', bgcolor: r.bg, color: r.color, display: 'grid', placeItems: 'center' }}>
                                    {r.icon}
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: r.color }}>{formatBs(RESUMEN_ANTICIPOS[r.clave])}</Typography>
                                    <Typography variant="caption" sx={{ color: r.color }}>{r.nota}</Typography>
                                </Box>
                            </Paper>
                        ))}
                    </Box>

                    {/* Historial de anticipos */}
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Historial de anticipos</Typography>
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 820 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                        <TableCell><strong>N.º</strong></TableCell>
                                        <TableCell><strong>Fecha</strong></TableCell>
                                        <TableCell><strong>Depto.</strong></TableCell>
                                        <TableCell><strong>Responsable</strong></TableCell>
                                        <TableCell><strong>Recibido</strong></TableCell>
                                        <TableCell><strong>Aplicado</strong></TableCell>
                                        <TableCell><strong>Credito</strong></TableCell>
                                        <TableCell><strong>Estado</strong></TableCell>
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
                                            <TableCell sx={{ color: '#2E9D78', fontWeight: 600 }}>{formatBs(a.credito)}</TableCell>
                                            <TableCell><Chip label={a.estado} size="small" sx={anticipoChipSx(a.estado)} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                        <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 1.5, mt: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Integracion con flujo de caja</Typography>
                            <Typography variant="body2" color="text.secondary">
                                El anticipo cuenta como ingreso al recibirse. Aplicarlo luego no duplica el ingreso.
                            </Typography>
                        </Box>
                    </Paper>
                </Box>
            )}

            {/* Menu de los 3 puntitos */}
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

            {/* Dialog: Ver detalle del pago */}
            <Dialog open={detalleAbierto} onClose={() => setDetalleAbierto(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Detalle del pago {pagoSel?.id}</DialogTitle>
                <DialogContent dividers>
                    {pagoSel && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Fecha</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{pagoSel.fecha}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Departamento</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{pagoSel.depto}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Responsable</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{pagoSel.responsable}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Periodo aplicado</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{pagoSel.periodoAplicado}</Typography>
                            </Box>
                            <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                                <Divider sx={{ my: 1 }} />
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Monto pagado</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(pagoSel.monto)}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Saldo posterior</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 700, color: pagoSel.saldoPosterior > 0 ? '#D9534F' : '#2E9D78' }}>
                                    {formatBs(pagoSel.saldoPosterior)}
                                </Typography>
                            </Box>
                            <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                                <Typography variant="body2" color="text.secondary">Estado</Typography>
                                <Chip label={pagoSel.estado} size="small" sx={{ mt: 0.5, ...estadoChipSx(pagoSel.estado) }} />
                            </Box>
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
                    <Typography variant="body2">
                        ¿Confirmas la anulacion del pago <strong>{pagoSel?.id}</strong>? Esta accion revierte el monto aplicado al saldo del departamento.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAnularAbierto(false)}>Cancelar</Button>
                    <Button color="error" variant="contained" onClick={confirmarAnular}>Anular</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: '100%' }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </DashboardLayout>
    );
}