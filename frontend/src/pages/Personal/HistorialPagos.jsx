import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, Chip, Select, MenuItem, TextField,
    Table, TableHead, TableBody, TableRow, TableCell, IconButton, InputAdornment, Alert, Snackbar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DescriptionIcon from '@mui/icons-material/Description';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    PAGOS_PERSONAL_MOCK, RESUMEN_PAGOS_PERSONAL, ESTADOS_PAGO_PERSONAL,
} from '../../constants/personalMock';
import { PERIODOS, formatBs } from '../../constants/finanzasMock';

const PERIODOS_PAGOS = ['Noviembre 2026', ...PERIODOS.filter((p) => p !== 'Noviembre 2026')];

const estadoChipSx = (estado) => {
    if (estado === 'Pagado') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Pendiente') return { bgcolor: '#FDF0D5', color: '#B6802A' };
    return { bgcolor: '#FBEAE9', color: '#D9534F' };
};

// Normalizador: convierte "Nov. 2026" <-> "Noviembre 2026" para que el filtro
// por periodo funcione sin importar cual este guardado en el mock.
const normalizaPeriodo = (p) => {
    if (!p) return '';
    const map = {
        'Nov.': 'Noviembre', 'Oct.': 'Octubre', 'Sep.': 'Septiembre',
        'Ago.': 'Agosto', 'Jul.': 'Julio', 'Jun.': 'Junio', 'May.': 'Mayo',
        'Abr.': 'Abril', 'Mar.': 'Marzo', 'Feb.': 'Febrero', 'Ene.': 'Enero',
        'Dic.': 'Diciembre'
    };
    let out = p;
    Object.entries(map).forEach(([k, v]) => { out = out.replace(k, v); });
    return out;
};

export default function HistorialPagos() {
    const [periodo, setPeriodo] = useState('Noviembre 2026');
    const [estado, setEstado] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');
    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    const filas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return PAGOS_PERSONAL_MOCK
            .filter((p) => normalizaPeriodo(p.periodo) === periodo)
            .filter((p) => estado === 'Todos' || p.estado === estado)
            .filter((p) => !q || `${p.empleado} ${p.id || ''}`.toLowerCase().includes(q));
    }, [periodo, estado, busqueda]);

    const registrarPago = () => {
        setSnack({ open: true, msg: 'Registrar pago de empleado (proximamente)', sev: 'success' });
    };
    const exportar = () => {
        setSnack({ open: true, msg: 'Historial exportado (simulado)', sev: 'success' });
    };
    const filtrar = () => {
        setSnack({ open: true, msg: `${filas.length} pagos coinciden con los filtros`, sev: 'success' });
    };
    const verDetalle = (p) => {
        setSnack({ open: true, msg: `Comprobante del pago ${p.id || 'pendiente'} de ${p.empleado}`, sev: 'success' });
    };

    return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', mb: 0.5 }}>
                <Box>
                    <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Historial de pagos de empleados</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Consulta pagos realizados y abre el detalle de cada comprobante.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={registrarPago}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Registrar pago
                </Button>
            </Box>

            {/* Tarjetas de resumen */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#E4F4EE', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, color: '#2E9D78', display: 'grid', placeItems: 'center' }}>
                        <CheckCircleIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Pagado en noviembre</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(RESUMEN_PAGOS_PERSONAL.pagadoEnMes)}</Typography>
                        <Typography variant="caption" color="text.secondary">{RESUMEN_PAGOS_PERSONAL.pagosConfirmados} pagos confirmados</Typography>
                    </Box>
                </Paper>
                <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#FDF0D5', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, color: '#B6802A', display: 'grid', placeItems: 'center' }}>
                        <ScheduleIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Pendiente</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#B6802A' }}>{formatBs(RESUMEN_PAGOS_PERSONAL.pendiente)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {RESUMEN_PAGOS_PERSONAL.empleadosPendientes} {RESUMEN_PAGOS_PERSONAL.empleadosPendientes === 1 ? 'empleado' : 'empleados'}
                        </Typography>
                    </Box>
                </Paper>
                <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#E4EEF5', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                        <DescriptionIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Comprobantes</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>{RESUMEN_PAGOS_PERSONAL.comprobantes} emitidos</Typography>
                        <Typography variant="caption" color="text.secondary">PDF disponibles</Typography>
                    </Box>
                </Paper>
            </Box>

            {/* Filtros */}
            <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <Box sx={{ flex: 2, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Buscar</Typography>
                        <TextField fullWidth size="small" placeholder="Buscar empleado o N.º de pago"
                            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                                    )
                                }
                            }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 160 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                        <Select fullWidth size="small" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                            {PERIODOS_PAGOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </Select>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 140 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Estado</Typography>
                        <Select fullWidth size="small" value={estado} onChange={(e) => setEstado(e.target.value)}>
                            {ESTADOS_PAGO_PERSONAL.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </Box>
                    <Button variant="contained" startIcon={<FilterListIcon />} onClick={filtrar}>
                        Filtrar
                    </Button>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportar}
                        sx={{ color: '#1a2733', borderColor: '#cdd8e3' }}>
                        Exportar historial
                    </Button>
                </Box>
            </Paper>

            {/* Tabla pagos registrados */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Pagos registrados</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {filas.length} {filas.length === 1 ? 'registro' : 'registros'}
                    </Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 900 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>N.º pago</strong></TableCell>
                                <TableCell><strong>Fecha</strong></TableCell>
                                <TableCell><strong>Empleado</strong></TableCell>
                                <TableCell><strong>Periodo</strong></TableCell>
                                <TableCell><strong>Concepto</strong></TableCell>
                                <TableCell><strong>Medio</strong></TableCell>
                                <TableCell><strong>Monto neto</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell align="center"><strong>Detalle</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                        Sin pagos para los filtros aplicados.
                                    </TableCell>
                                </TableRow>
                            ) : filas.map((f, idx) => (
                                <TableRow key={f.id || `pending-${f.empleadoId}-${idx}`}>
                                    <TableCell sx={{ fontWeight: 600, color: f.id ? 'primary.main' : 'text.secondary' }}>
                                        {f.id || '—'}
                                    </TableCell>
                                    <TableCell>{f.fecha || '—'}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{f.empleado}</TableCell>
                                    <TableCell>{f.periodo}</TableCell>
                                    <TableCell>{f.concepto}</TableCell>
                                    <TableCell>{f.medio || '—'}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{formatBs(f.montoNeto)}</TableCell>
                                    <TableCell><Chip label={f.estado} size="small" sx={estadoChipSx(f.estado)} /></TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" color="primary" onClick={() => verDetalle(f)}>
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>

                {/* Nota de coherencia con la planilla */}
                <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', mt: 2 }}>
                    <Typography variant="body2">
                        Los totales coinciden con los conceptos calculados en la planilla.
                    </Typography>
                </Alert>
            </Paper>

            <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: '100%' }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </DashboardLayout>
    );
}