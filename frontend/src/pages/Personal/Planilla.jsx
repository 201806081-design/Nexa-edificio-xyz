import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, Chip, Select, MenuItem, TextField,
    Table, TableHead, TableBody, TableRow, TableCell, IconButton, InputAdornment, Alert, Snackbar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PaidIcon from '@mui/icons-material/Paid';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    PLANILLA_MOCK, RESUMEN_PLANILLA, ESTADOS_PLANILLA,
    nombreEmpleado, cargoEmpleado,
} from '../../constants/personalMock';
import { PERIODOS, formatBs } from '../../constants/finanzasMock';

const PERIODOS_PLANILLA = ['Noviembre 2026', ...PERIODOS.filter((p) => p !== 'Noviembre 2026')];

const estadoChipSx = (estado) => {
    if (estado === 'Pagada') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Calculado') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Revisar') return { bgcolor: '#FDF0D5', color: '#B6802A' };
    return { bgcolor: '#FDF0D5', color: '#B6802A' }; // Borrador
};

export default function Planilla() {
    const [periodo, setPeriodo] = useState('Noviembre 2026');
    const [estado, setEstado] = useState('Borrador');
    const [busqueda, setBusqueda] = useState('');
    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    const filas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return PLANILLA_MOCK
            .filter((p) => p.periodo === periodo)
            .filter((p) => estado === 'Todos' || p.estado === estado || estado === 'Borrador')
            .map((p) => ({
                ...p,
                empleado: nombreEmpleado(p.empleadoId),
                cargo: cargoEmpleado(p.empleadoId),
            }))
            .filter((p) => !q || `${p.empleado} ${p.cargo}`.toLowerCase().includes(q));
    }, [periodo, estado, busqueda]);

    const totalNeto = filas.reduce((s, f) => s + (f.neto || 0), 0);

    const generarPlanilla = () => {
        setSnack({ open: true, msg: `Planilla de ${periodo} generada en borrador`, sev: 'success' });
    };
    const exportar = () => {
        setSnack({ open: true, msg: 'Planilla exportada a Excel (simulado)', sev: 'success' });
    };
    const filtrar = () => {
        // los filtros ya se aplican reactivamente; esto solo refresca y confirma al usuario
        setSnack({ open: true, msg: `${filas.length} empleados coinciden con los filtros`, sev: 'success' });
    };
    const editarFila = (f) => {
        setSnack({ open: true, msg: `Editar planilla de ${f.empleado} (pronto)`, sev: 'success' });
    };

    return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', mb: 0.5 }}>
                <Box>
                    <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Planilla de personal</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Calcula salarios, bonos, anticipos y total neto del periodo.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={generarPlanilla}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Generar planilla
                </Button>
            </Box>

            {/* Tarjetas de resumen */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#E4EEF5', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                        <PaidIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Total planilla</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatBs(RESUMEN_PLANILLA.totalPlanilla)}</Typography>
                        <Typography variant="caption" color="text.secondary">{RESUMEN_PLANILLA.periodo}</Typography>
                    </Box>
                </Paper>
                <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#E4F4EE', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, color: '#2E9D78', display: 'grid', placeItems: 'center' }}>
                        <AddCircleIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Bonos</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(RESUMEN_PLANILLA.bonos)}</Typography>
                        <Typography variant="caption" color="text.secondary">{RESUMEN_PLANILLA.conceptosAplicados} conceptos aplicados</Typography>
                    </Box>
                </Paper>
                <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#FDF0D5', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, color: '#B6802A', display: 'grid', placeItems: 'center' }}>
                        <RemoveCircleIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Anticipos descontados</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#B6802A' }}>{formatBs(RESUMEN_PLANILLA.anticiposDescontados)}</Typography>
                        <Typography variant="caption" color="text.secondary">{RESUMEN_PLANILLA.empleadosAnticipos} empleados</Typography>
                    </Box>
                </Paper>
            </Box>

            {/* Filtros */}
            <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <Box sx={{ flex: 1, minWidth: 160 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                        <Select fullWidth size="small" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                            {PERIODOS_PLANILLA.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </Select>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 140 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Estado</Typography>
                        <Select fullWidth size="small" value={estado} onChange={(e) => setEstado(e.target.value)}>
                            {ESTADOS_PLANILLA.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </Box>
                    <Box sx={{ flex: 2, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Buscar</Typography>
                        <TextField fullWidth size="small" placeholder="Nombre, cargo o documento"
                            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                                    )
                                }
                            }} />
                    </Box>
                    <Button variant="contained" startIcon={<FilterListIcon />} onClick={filtrar}>
                        Filtrar
                    </Button>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportar}
                        sx={{ color: '#1a2733', borderColor: '#cdd8e3' }}>
                        Exportar
                    </Button>
                </Box>
            </Paper>

            {/* Tabla detalle de planilla */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Detalle de la planilla</Typography>
                    <Chip label="Borrador" size="small" sx={estadoChipSx('Borrador')} />
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 900 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Empleado</strong></TableCell>
                                <TableCell><strong>Cargo</strong></TableCell>
                                <TableCell><strong>Salario base</strong></TableCell>
                                <TableCell><strong>Bonos</strong></TableCell>
                                <TableCell><strong>Anticipos</strong></TableCell>
                                <TableCell><strong>Otros desc.</strong></TableCell>
                                <TableCell><strong>Neto a pagar</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell align="center"><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                        Sin empleados que coincidan con los filtros aplicados.
                                    </TableCell>
                                </TableRow>
                            ) : filas.map((f) => (
                                <TableRow key={f.empleadoId}>
                                    <TableCell sx={{ fontWeight: 600 }}>{f.empleado}</TableCell>
                                    <TableCell>{f.cargo}</TableCell>
                                    <TableCell>{formatBs(f.salarioBase)}</TableCell>
                                    <TableCell sx={{ color: f.bonos > 0 ? '#2E9D78' : 'text.primary' }}>
                                        {f.bonos > 0 ? `+ ${formatBs(f.bonos)}` : formatBs(0)}
                                    </TableCell>
                                    <TableCell sx={{ color: f.anticipos > 0 ? '#D9534F' : 'text.primary' }}>
                                        {f.anticipos > 0 ? `− ${formatBs(f.anticipos)}` : formatBs(0)}
                                    </TableCell>
                                    <TableCell sx={{ color: f.otrosDesc > 0 ? '#D9534F' : 'text.primary' }}>
                                        {f.otrosDesc > 0 ? `− ${formatBs(f.otrosDesc)}` : formatBs(0)}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{formatBs(f.neto)}</TableCell>
                                    <TableCell><Chip label={f.estado} size="small" sx={estadoChipSx(f.estado)} /></TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" onClick={() => editarFila(f)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>

                {/* Total neto a pagar */}
                <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 2, mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Total neto a pagar</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatBs(totalNeto)}</Typography>
                </Box>
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