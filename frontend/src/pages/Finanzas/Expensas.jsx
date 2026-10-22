import { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Select, MenuItem, Paper, Button, Chip, IconButton,
    Table, TableHead, TableBody, TableRow, TableCell, InputAdornment, TextField, Divider,
    Dialog, DialogTitle, DialogContent, Snackbar, Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircle';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    PERIODOS, ESTADOS_EXPENSA, EXPENSAS_MOCK,
} from '../../constants/expensasMock';
import { PAGOS_MOCK } from '../../constants/pagosMock';
import { formatBs } from '../../constants/finanzasMock';

// Color del chip segun el estado de la expensa
const estadoChipSx = (estado) => (estado === 'Pagado'
    ? { bgcolor: '#E4F4EE', color: '#2E9D78' }
    : { bgcolor: '#FDF0D5', color: '#B6802A' });

// Helper: ¿el periodoAplicado (ej "Octubre 2026") corresponde al periodo seleccionado?
const periodoCoincide = (periodoAplicado, periodoSel) => {
    const p = (periodoAplicado || '').toLowerCase();
    const [mesSel, anioSel] = (periodoSel || '').toLowerCase().split(' ');
    const corto = (mesSel || '').slice(0, 3); // 'oct' para 'octubre'
    return (p.includes(mesSel) || p.includes(corto)) && p.includes(anioSel || '');
};

export default function Expensas() {
    const navigate = useNavigate();
    const location = useLocation();
    const [periodo, setPeriodo] = useState(PERIODOS[0]);
    const [estado, setEstado] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');
    const [detalle, setDetalle] = useState(null);
    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    // Si venimos de "Generar expensas" con mensaje, mostrarlo
    useEffect(() => {
        if (location.state?.mensaje) {
            setSnack({ open: true, msg: location.state.mensaje, sev: 'success' });
            // Limpia el state para que no reaparezca al refrescar
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location, navigate]);

    // KPIs calculados en vivo desde los mocks (sincronizados con Pagos)
    const resumen = useMemo(() => {
        const expensasPeriodo = EXPENSAS_MOCK.filter((e) => e.periodo === periodo);
        const totalGenerado = expensasPeriodo.reduce((s, e) => s + (e.monto || 0), 0);
        const pagado = PAGOS_MOCK
            .filter((p) => periodoCoincide(p.periodoAplicado, periodo))
            .reduce((s, p) => s + (p.monto || 0), 0);
        const pendiente = Math.max(0, totalGenerado - pagado);
        return { totalGenerado, pagado, pendiente };
    }, [periodo]);

    const RESUMEN = [
        { clave: 'totalGenerado', label: 'Total generado', valor: resumen.totalGenerado, icon: <DescriptionOutlinedIcon />, color: '#1F5F8B', bg: '#E4EEF5' },
        { clave: 'pendiente', label: 'Pendiente', valor: resumen.pendiente, icon: <ScheduleIcon />, color: '#B6802A', bg: '#FDF0D5' },
        { clave: 'pagado', label: 'Pagado', valor: resumen.pagado, icon: <CheckCircleOutlineIcon />, color: '#2E9D78', bg: '#E4F4EE' },
    ];

    // Lista filtrada por periodo + estado + busqueda
    const expensas = EXPENSAS_MOCK.filter((e) =>
        e.periodo === periodo &&
        (estado === 'Todos' || e.estado === estado) &&
        e.departamento.toLowerCase().includes(busqueda.toLowerCase()));

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Expensas mensuales</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Consulta y gestiona las expensas de los departamentos
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'stretch', md: 'flex-end' }, mb: 2 }}>
                <Button variant="outlined" startIcon={<SettingsIcon />}
                    onClick={() => navigate('/finanzas/configuracion')}
                    sx={{ color: '#1a2733', borderColor: '#cdd8e3', width: { xs: '100%', md: 'auto' } }}>
                    Configuracion interes
                </Button>
                <Button variant="contained" startIcon={<AddIcon />}
                    onClick={() => navigate('/finanzas/expensas/generar')}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Generar expensa
                </Button>
            </Box>

            {/* Filtros */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                    <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                        {PERIODOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Estado</Typography>
                    <Select fullWidth value={estado} onChange={(e) => setEstado(e.target.value)}>
                        {ESTADOS_EXPENSA.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'flex-end' }}>
                    <TextField fullWidth placeholder="Buscar departamento" value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} />
                </Box>
            </Box>

            {/* Tarjetas de resumen (en vivo desde mocks) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
                {RESUMEN.map((r) => (
                    <Paper key={r.clave} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: r.bg, color: r.color, display: 'grid', placeItems: 'center' }}>
                            {r.icon}
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                            <Typography variant="h3" sx={{ fontWeight: 700, color: r.color }}>{formatBs(r.valor)}</Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* VISTA ESCRITORIO: tabla */}
            <Paper sx={{ p: 2, borderRadius: 2, display: { xs: 'none', md: 'block' } }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                            <TableCell><strong>Departamento</strong></TableCell>
                            <TableCell><strong>Periodo</strong></TableCell>
                            <TableCell><strong>Monto</strong></TableCell>
                            <TableCell><strong>Estado</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {expensas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                    No hay expensas generadas para {periodo}.
                                </TableCell>
                            </TableRow>
                        ) : expensas.map((e) => (
                            <TableRow key={e.id}>
                                <TableCell sx={{ fontWeight: 600 }}>{e.departamento}</TableCell>
                                <TableCell>{e.periodo}</TableCell>
                                <TableCell>{formatBs(e.monto)}</TableCell>
                                <TableCell><Chip label={e.estado} size="small" sx={estadoChipSx(e.estado)} /></TableCell>
                                <TableCell align="center">
                                    <IconButton color="primary" onClick={() => setDetalle(e)}><VisibilityIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* VISTA MOVIL: tarjetas */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {expensas.length === 0 ? (
                    <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center', color: 'text.secondary' }}>
                        No hay expensas generadas para {periodo}.
                    </Paper>
                ) : expensas.map((e) => (
                    <Paper key={e.id} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography sx={{ fontWeight: 700 }}>{e.departamento}</Typography>
                            <Chip label={e.estado} size="small" sx={estadoChipSx(e.estado)} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">{e.periodo}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{formatBs(e.monto)}</Typography>
                        <Divider sx={{ mb: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <IconButton color="primary" onClick={() => setDetalle(e)}><VisibilityIcon /></IconButton>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* Modal: detalle de la expensa */}
            <Dialog open={!!detalle} onClose={() => setDetalle(null)} fullWidth maxWidth="sm">
                {detalle && (
                    <>
                        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                            Detalle de la expensa
                            <IconButton onClick={() => setDetalle(null)}><CloseIcon /></IconButton>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Typography sx={{ fontWeight: 700 }}>{detalle.departamento}</Typography>
                                <Chip label={detalle.estado} size="small" sx={estadoChipSx(detalle.estado)} />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Periodo</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{detalle.periodo}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Tipo de departamento</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{detalle.tipo}</Typography>
                            </Box>
                            <Divider sx={{ my: 1.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Expensa base</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatBs(detalle.base)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Agua</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2E9D78' }}>{formatBs(detalle.agua)}</Typography>
                            </Box>
                            <Divider sx={{ my: 1.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>Total</Typography>
                                <Typography variant="h3" color="primary.main" sx={{ fontWeight: 700 }}>{formatBs(detalle.monto)}</Typography>
                            </Box>
                        </DialogContent>
                    </>
                )}
            </Dialog>

            {/* Snackbar de confirmacion */}
            <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: '100%' }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </DashboardLayout>
    );
}