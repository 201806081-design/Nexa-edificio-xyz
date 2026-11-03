import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, Chip, TextField, Select, MenuItem,
    Table, TableHead, TableBody, TableRow, TableCell, InputAdornment, IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DashboardLayout from '../../layouts/DashboardLayout';
import { EMPLEADOS_MOCK, CARGOS, ESTADOS_EMPLEADO } from '../../constants/personalMock';
import { formatBs } from '../../constants/finanzasMock';

const estadoChipSx = (estado) => estado === 'Activo'
    ? { bgcolor: '#E4F4EE', color: '#2E9D78' }
    : { bgcolor: '#FBEAE9', color: '#D9534F' };

export default function Empleados() {
    const [busqueda, setBusqueda] = useState('');
    const [cargo, setCargo] = useState('Todos');
    const [estado, setEstado] = useState('Todos');

    const empleados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return EMPLEADOS_MOCK.filter((e) => {
            if (cargo !== 'Todos' && e.cargo !== cargo) return false;
            if (estado !== 'Todos' && e.estado !== estado) return false;
            if (q && !`${e.nombre} ${e.ci} ${e.cargo}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [busqueda, cargo, estado]);

    return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Box>
                    <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Empleados</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Catalogo del personal del edificio
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<PersonAddIcon />}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Nuevo empleado
                </Button>
            </Box>

            {/* Filtros */}
            <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField size="small" placeholder="Buscar por nombre, CI o cargo"
                        value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                        sx={{ flex: 1, minWidth: 220 }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                                )
                            }
                        }} />
                    <Select size="small" value={cargo} onChange={(e) => setCargo(e.target.value)} sx={{ minWidth: 170 }}>
                        <MenuItem value="Todos">Todos los cargos</MenuItem>
                        {CARGOS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                    <Select size="small" value={estado} onChange={(e) => setEstado(e.target.value)} sx={{ minWidth: 150 }}>
                        {ESTADOS_EMPLEADO.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                </Box>
            </Paper>

            {/* Tabla */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Personal registrado</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {empleados.length} {empleados.length === 1 ? 'empleado' : 'empleados'}
                    </Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 760 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Codigo</strong></TableCell>
                                <TableCell><strong>Nombre</strong></TableCell>
                                <TableCell><strong>CI</strong></TableCell>
                                <TableCell><strong>Cargo</strong></TableCell>
                                <TableCell><strong>Salario base</strong></TableCell>
                                <TableCell><strong>Fecha ingreso</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell align="center"><strong>Detalle</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {empleados.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                        No hay empleados que coincidan con los filtros.
                                    </TableCell>
                                </TableRow>
                            ) : empleados.map((e) => (
                                <TableRow key={e.id}>
                                    <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{e.id}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{e.nombre}</TableCell>
                                    <TableCell>{e.ci}</TableCell>
                                    <TableCell>{e.cargo}</TableCell>
                                    <TableCell>{formatBs(e.salarioBase)}</TableCell>
                                    <TableCell>{e.fechaIngreso}</TableCell>
                                    <TableCell><Chip label={e.estado} size="small" sx={estadoChipSx(e.estado)} /></TableCell>
                                    <TableCell align="center">
                                        <IconButton color="primary" size="small"><VisibilityIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            </Paper>
        </DashboardLayout>
    );
}