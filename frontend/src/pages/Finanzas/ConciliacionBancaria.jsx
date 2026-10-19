import { useState } from 'react';
import {
    Box, Typography, Paper, Button, Chip, Select, MenuItem, TextField, InputAdornment,
    Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    PERIODOS, CUENTAS_BANCARIAS, ESTADOS_CONCILIACION, MOVIMIENTOS_BANCARIOS,
} from '../../constants/conciliacionMock';
import { formatBs } from '../../constants/finanzasMock';

const coincidenciaColor = (c) => {
    if (c === 'Exacta') return '#2E9D78';
    if (c === 'Sugerida') return '#B6802A';
    return '#D9534F';
};
const estadoChipSx = (estado) => (estado === 'Conciliado'
    ? { bgcolor: '#E4F4EE', color: '#2E9D78' }
    : { bgcolor: '#FDF0D5', color: '#B6802A' });

export default function ConciliacionBancaria() {
    const navigate = useNavigate();
    const [cuenta, setCuenta] = useState(CUENTAS_BANCARIAS[0]);
    const [periodo, setPeriodo] = useState(PERIODOS[0]);
    const [estado, setEstado] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');
    // Copia editable de los movimientos (para conciliar en la sesion)
    const [movs, setMovs] = useState(MOVIMIENTOS_BANCARIOS.map((m) => ({ ...m })));

    const conciliar = (id) => setMovs((arr) => arr.map((m) =>
        (m.id === id && m.pago ? { ...m, estado: 'Conciliado', coincidencia: 'Exacta' } : m)));

    const conciliarAuto = () => setMovs((arr) => arr.map((m) =>
        (m.coincidencia === 'Sugerida' && m.pago ? { ...m, estado: 'Conciliado', coincidencia: 'Exacta' } : m)));

    const total = movs.length;
    const conciliados = movs.filter((m) => m.estado === 'Conciliado').length;
    const pendientes = total - conciliados;

    const filtrados = movs.filter((m) =>
        (estado === 'Todos' || m.estado === estado) &&
        (m.referencia + (m.pago || '') + (m.depto || '')).toLowerCase().includes(busqueda.toLowerCase()));

    const RESUMEN = [
        { label: 'Movimientos bancarios', valor: `${total} movimientos`, nota: `Periodo ${periodo.toLowerCase()}`, bg: '#E4EEF5', color: 'primary.main' },
        { label: 'Conciliados', valor: `${conciliados} movimientos`, nota: 'Coincidencia confirmada', bg: '#E4F4EE', color: '#2E9D78' },
        { label: 'Pendientes', valor: `${pendientes} movimientos`, nota: 'Requieren revision', bg: '#FDF0D5', color: '#B6802A' },
    ];

    return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                    <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Conciliacion bancaria</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Compara movimientos bancarios con los pagos registrados en el sistema
                    </Typography>
                </Box>
                <Chip label="HU-FI-02" sx={{ bgcolor: '#E4EEF5', color: 'primary.main', fontWeight: 600 }} />
            </Box>

            {/* Resumen (3) + Conciliar automaticamente */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr) auto' }, gap: 2, mb: 2, alignItems: 'stretch' }}>
                {RESUMEN.map((r) => (
                    <Paper key={r.label} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', bgcolor: r.bg, color: r.color, display: 'grid', placeItems: 'center' }}>
                            <AccountBalanceOutlinedIcon />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                            <Typography variant="h3" sx={{ fontWeight: 700 }}>{r.valor}</Typography>
                            <Typography variant="caption" color="text.secondary">{r.nota}</Typography>
                        </Box>
                    </Paper>
                ))}
                <Button variant="contained" startIcon={<SyncIcon />} onClick={conciliarAuto} sx={{ width: { xs: '100%', md: 'auto' }, px: 3 }}>
                    Conciliar automaticamente
                </Button>
            </Box>

            {/* Filtros */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mb: 3 }}>
                <Box sx={{ flex: 1, minWidth: 160 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Cuenta bancaria</Typography>
                    <Select fullWidth value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
                        {CUENTAS_BANCARIAS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 150 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                    <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                        {PERIODOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 150 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Estado</Typography>
                    <Select fullWidth value={estado} onChange={(e) => setEstado(e.target.value)}>
                        {ESTADOS_CONCILIACION.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 160 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Buscar</Typography>
                    <TextField fullWidth placeholder="Buscar referencia" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} />
                </Box>
            </Box>

            {/* Movimientos para conciliar */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Movimientos para conciliar</Typography>
                    <Typography variant="body2" color="text.secondary">Ultima sincronizacion: 09:35</Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 880 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Fecha / referencia</strong></TableCell>
                                <TableCell><strong>Movimiento banco</strong></TableCell>
                                <TableCell><strong>Pago registrado</strong></TableCell>
                                <TableCell><strong>Departamento</strong></TableCell>
                                <TableCell><strong>Coincidencia</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell align="center"><strong>Accion</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtrados.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell>{m.fecha} · {m.referencia}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{formatBs(m.monto)}</TableCell>
                                    <TableCell sx={{ color: m.pago ? 'primary.main' : '#D9534F', fontWeight: 600 }}>
                                        {m.pago ? `${m.pago} · ${formatBs(m.monto)}` : 'Sin asociar'}
                                    </TableCell>
                                    <TableCell>{m.depto || '—'}</TableCell>
                                    <TableCell sx={{ color: coincidenciaColor(m.coincidencia), fontWeight: 600 }}>{m.coincidencia}</TableCell>
                                    <TableCell><Chip label={m.estado} size="small" sx={estadoChipSx(m.estado)} /></TableCell>
                                    <TableCell align="center">
                                        {m.estado === 'Conciliado' ? (
                                            <Button variant="outlined" size="small" sx={{ color: '#1a2733', borderColor: '#cdd8e3' }}>Ver</Button>
                                        ) : m.pago ? (
                                            <Button variant="contained" size="small" onClick={() => conciliar(m.id)}>Conciliar</Button>
                                        ) : (
                                            <Button variant="contained" size="small" onClick={() => navigate('/finanzas/pagos')}>Seleccionar</Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
                <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 1.5, mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        La conciliacion no modifica el monto: vincula el movimiento bancario con el pago registrado.
                    </Typography>
                </Box>
            </Paper>
        </DashboardLayout>
    );
}