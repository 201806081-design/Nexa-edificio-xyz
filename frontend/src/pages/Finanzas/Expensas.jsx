import { useState } from 'react';
import {
    Box, Typography, Select, MenuItem, Paper, Button, Chip, IconButton,
    Table, TableHead, TableBody, TableRow, TableCell, InputAdornment, TextField, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    PERIODOS, ESTADOS_EXPENSA, RESUMEN_EXPENSAS, EXPENSAS_MOCK,
} from '../../constants/expensasMock';
import { formatBs } from '../../constants/finanzasMock';

// Color del chip segun el estado de la expensa
const estadoChipSx = (estado) => (estado === 'Pagado'
    ? { bgcolor: '#E4F4EE', color: '#2E9D78' }
    : { bgcolor: '#FDF0D5', color: '#B6802A' });

// Tarjetas de resumen (total / pendiente / pagado)
const RESUMEN = [
    { clave: 'totalGenerado', label: 'Total generados', icon: <DescriptionOutlinedIcon />, color: 'primary.main', bg: '#E4EEF5' },
    { clave: 'pendiente', label: 'Pendiente', icon: <ScheduleIcon />, color: '#B6802A', bg: '#FDF0D5' },
    { clave: 'pagado', label: 'Pagado', icon: <CheckCircleOutlineIcon />, color: '#2E9D78', bg: '#E4F4EE' },
];

export default function Expensas() {
    const navigate = useNavigate();
    const [periodo, setPeriodo] = useState(PERIODOS[0]);
    const [estado, setEstado] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');

    const expensas = EXPENSAS_MOCK.filter((e) =>
        (estado === 'Todos' || e.estado === estado) &&
        e.departamento.toLowerCase().includes(busqueda.toLowerCase()));

    return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <Box>
                    <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Expensas mensuales</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Consulta y gestiona las expensas de los departamentos
                    </Typography>
                </Box>
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
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
                </Box>
            </Box>

            {/* Tarjetas de resumen */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
                {RESUMEN.map((r) => (
                    <Paper key={r.clave} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: r.bg, color: r.color, display: 'grid', placeItems: 'center' }}>
                            {r.icon}
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                            <Typography variant="h3" sx={{ fontWeight: 700, color: r.color }}>{formatBs(RESUMEN_EXPENSAS[r.clave])}</Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* VISTA ESCRITORIO: tabla */}
            <Paper sx={{ p: 2, borderRadius: 2, display: { xs: 'none', md: 'block' } }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Departamento</strong></TableCell>
                            <TableCell><strong>Periodo</strong></TableCell>
                            <TableCell><strong>Monto</strong></TableCell>
                            <TableCell><strong>Estado</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {expensas.map((e) => (
                            <TableRow key={e.id}>
                                <TableCell sx={{ fontWeight: 600 }}>{e.departamento}</TableCell>
                                <TableCell>{e.periodo}</TableCell>
                                <TableCell>{formatBs(e.monto)}</TableCell>
                                <TableCell><Chip label={e.estado} size="small" sx={estadoChipSx(e.estado)} /></TableCell>
                                <TableCell align="center">
                                    <IconButton color="primary"><VisibilityIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* VISTA MOVIL: tarjetas */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {expensas.map((e) => (
                    <Paper key={e.id} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography sx={{ fontWeight: 700 }}>{e.departamento}</Typography>
                            <Chip label={e.estado} size="small" sx={estadoChipSx(e.estado)} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">{e.periodo}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{formatBs(e.monto)}</Typography>
                        <Divider sx={{ mb: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <IconButton color="primary"><VisibilityIcon /></IconButton>
                        </Box>
                    </Paper>
                ))}
            </Box>
        </DashboardLayout>
    );
}