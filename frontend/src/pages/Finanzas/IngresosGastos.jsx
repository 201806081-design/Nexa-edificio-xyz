import { useState } from 'react';
import {
    Box, Typography, Select, MenuItem, Paper, Button, Chip, IconButton, TextField, InputAdornment,
    Table, TableHead, TableBody, TableRow, TableCell, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    PERIODOS, TIPOS_MOVIMIENTO, CATEGORIAS, RESUMEN_MOVIMIENTOS, MOVIMIENTOS_LISTA,
} from '../../constants/movimientosMock';
import { formatBs } from '../../constants/finanzasMock';

const tipoChipSx = (tipo) => (tipo === 'Ingreso'
    ? { bgcolor: '#E4F4EE', color: '#2E9D78' }
    : { bgcolor: '#FBEAE9', color: '#D9534F' });

const RESUMEN = [
    { clave: 'totalIngresos', label: 'Total ingresos', icon: <NorthIcon />, color: '#2E9D78', bg: '#E4F4EE' },
    { clave: 'totalGastos', label: 'Total gastos', icon: <SouthIcon />, color: '#D9534F', bg: '#FBEAE9' },
    { clave: 'balance', label: 'Balance', icon: <DragHandleIcon />, color: 'primary.main', bg: '#E4EEF5' },
];

export default function IngresosGastos() {
    const navigate = useNavigate();
    const [periodo, setPeriodo] = useState(PERIODOS[0]);
    const [tipo, setTipo] = useState('Todos');
    const [categoria, setCategoria] = useState('Todas');
    const [busqueda, setBusqueda] = useState('');

    const movimientos = MOVIMIENTOS_LISTA.filter((m) =>
        (tipo === 'Todos' || m.tipo === tipo) &&
        (categoria === 'Todas' || m.categoria === categoria) &&
        m.descripcion.toLowerCase().includes(busqueda.toLowerCase()));

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Ingresos y gastos</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Consulta y registra los movimientos economicos del edificio
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />}
                    onClick={() => navigate('/finanzas/ingresos-gastos/registrar')}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Registrar movimiento
                </Button>
            </Box>

            {/* Filtros */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Box sx={{ flex: 1, minWidth: 160 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                    <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                        {PERIODOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 160 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Tipo</Typography>
                    <Select fullWidth value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        {TIPOS_MOVIMIENTO.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 160 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Categoria</Typography>
                    <Select fullWidth value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                        <MenuItem value="Todas">Todas</MenuItem>
                        {CATEGORIAS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'flex-end' }}>
                    <TextField fullWidth placeholder="Buscar movimiento" value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} />
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
                            <Typography variant="h3" sx={{ fontWeight: 700, color: r.color }}>{formatBs(RESUMEN_MOVIMIENTOS[r.clave])}</Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* VISTA ESCRITORIO: tabla */}
            <Paper sx={{ p: 2, borderRadius: 2, display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Movimientos ({movimientos.length})</Typography>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Fecha</strong></TableCell>
                            <TableCell><strong>Tipo</strong></TableCell>
                            <TableCell><strong>Categoria</strong></TableCell>
                            <TableCell><strong>Descripcion</strong></TableCell>
                            <TableCell><strong>Monto</strong></TableCell>
                            <TableCell><strong>Comprobante</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {movimientos.map((m) => {
                            const esIngreso = m.tipo === 'Ingreso';
                            return (
                                <TableRow key={m.id}>
                                    <TableCell>{m.fecha}</TableCell>
                                    <TableCell><Chip label={m.tipo} size="small" sx={tipoChipSx(m.tipo)} /></TableCell>
                                    <TableCell>{m.categoria}</TableCell>
                                    <TableCell>{m.descripcion}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: esIngreso ? '#2E9D78' : '#D9534F' }}>
                                        {esIngreso ? '+' : '-'}{formatBs(m.monto)}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                            <DescriptionOutlinedIcon fontSize="small" />
                                            <Typography variant="body2">{m.comprobante}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton color="primary" onClick={() => navigate(`/finanzas/ingresos-gastos/${m.id}`)}>
                                            <VisibilityIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Paper>

            {/* VISTA MOVIL: tarjetas */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {movimientos.map((m) => {
                    const esIngreso = m.tipo === 'Ingreso';
                    return (
                        <Paper key={m.id} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">{m.fecha}</Typography>
                                <Chip label={m.tipo} size="small" sx={tipoChipSx(m.tipo)} />
                            </Box>
                            <Typography sx={{ fontWeight: 600 }}>{m.categoria}</Typography>
                            <Typography variant="body2" color="text.secondary">{m.descripcion}</Typography>
                            <Typography sx={{ fontWeight: 700, color: esIngreso ? '#2E9D78' : '#D9534F', my: 0.5 }}>
                                {esIngreso ? '+' : '-'}{formatBs(m.monto)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                <DescriptionOutlinedIcon fontSize="small" />
                                <Typography variant="body2">{m.comprobante}</Typography>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <IconButton color="primary" onClick={() => navigate(`/finanzas/ingresos-gastos/${m.id}`)}>
                                    <VisibilityIcon />
                                </IconButton>
                            </Box>
                        </Paper>
                    );
                })}
            </Box>
        </DashboardLayout>
    );
}