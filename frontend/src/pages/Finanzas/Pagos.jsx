import { useState } from 'react';
import {
    Box, Typography, Paper, Button, Chip, IconButton, Select, MenuItem, TextField, InputAdornment,
    Table, TableHead, TableBody, TableRow, TableCell, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    PERIODOS, RESUMEN_PAGOS, ESTADOS_PAGO, DEPARTAMENTOS_PAGO, PAGOS_MOCK,
} from '../../constants/pagosMock';
import { formatBs } from '../../constants/finanzasMock';

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

// Tarjetas de resumen (cobrado / registrados / recuperado)
const RESUMEN = [
    { clave: 'cobradoOctubre', label: 'Cobrado en octubre', nota: '+12 % frente a septiembre', money: true },
    { clave: 'pagosRegistrados', label: 'Pagos registrados', nota: 'Incluye pagos parciales', money: false, sufijo: ' pagos' },
    { clave: 'saldoRecuperado', label: 'Saldo recuperado', nota: 'Aplicado a deudas pendientes', money: true },
];

export default function Pagos() {
    const navigate = useNavigate();
    const [tab, setTab] = useState('expensas');
    const [periodo, setPeriodo] = useState(PERIODOS[0]);
    const [departamento, setDepartamento] = useState('Todos');
    const [estado, setEstado] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');

    const pagos = PAGOS_MOCK.filter((p) =>
        (departamento === 'Todos' || p.depto === departamento) &&
        (estado === 'Todos' || p.estado === estado) &&
        (p.depto + p.responsable + p.id).toLowerCase().includes(busqueda.toLowerCase()));

    return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                    <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Pagos de expensas</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Consulta el historial y registra los pagos realizados por departamento
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <Chip label="HU-FI-02" sx={{ bgcolor: '#E4EEF5', color: 'primary.main', fontWeight: 600 }} />
                    <Button variant="outlined" startIcon={<AccountBalanceOutlinedIcon />}
                        onClick={() => navigate('/finanzas/pagos/conciliacion')}
                        sx={{ color: '#1a2733', borderColor: '#cdd8e3' }}>
                        Conciliacion bancaria
                    </Button>
                </Box>
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
                    {/* Resumen (3 tarjetas) + Registrar pago */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr) auto' }, gap: 2, mb: 2, alignItems: 'stretch' }}>
                        {RESUMEN.map((r) => (
                            <Paper key={r.clave} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', bgcolor: '#E4F4EE', color: '#2E9D78', display: 'grid', placeItems: 'center' }}>
                                    <PaidOutlinedIcon />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                        {r.money ? formatBs(RESUMEN_PAGOS[r.clave]) : `${RESUMEN_PAGOS[r.clave]}${r.sufijo || ''}`}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#2E9D78' }}>{r.nota}</Typography>
                                </Box>
                            </Paper>
                        ))}
                        <Button variant="contained" startIcon={<AddIcon />}
                            onClick={() => navigate('/finanzas/pagos/registrar')}
                            sx={{ width: { xs: '100%', md: 'auto' }, px: 3 }}>
                            Registrar pago
                        </Button>
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
                                            <TableCell align="center"><IconButton size="small"><MoreVertIcon fontSize="small" /></IconButton></TableCell>
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

            {/* Tab Pagos anticipados: se implementa en el commit 5 (traido desde Mora) */}
            {tab === 'anticipados' && (
                <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="body2">Pagos anticipados (en construccion)</Typography>
                </Paper>
            )}
        </DashboardLayout>
    );
}