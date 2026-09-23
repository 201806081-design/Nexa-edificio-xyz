import { useState } from 'react';
import {
    Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
    Button, Chip, Paper, IconButton, Divider, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HistoryIcon from '@mui/icons-material/History';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PlaceIcon from '@mui/icons-material/Place';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { UNIDADES_MOCK } from '../../constants/unidadesMock';
import { COPROPIETARIOS_MOCK, nombreCompleto } from '../../constants/copropietariosMock';

const PESTANAS = ['Todas', 'Departamentos', 'Parqueos', 'Bauleras'];
const PESTANA_A_TIPO = { Departamentos: 'Departamento', Parqueos: 'Parqueo', Bauleras: 'Baulera' };

// Color del chip segun el tipo de unidad
function chipSx(tipo) {
    if (tipo === 'Departamento') return { bgcolor: '#D6F0E4', color: '#2E9D78' };
    if (tipo === 'Parqueo') return { bgcolor: '#C5E0F2', color: '#1F5F8B' };
    return { bgcolor: '#EEF1F4', color: '#5A6B7B' }; // Baulera
}

const tipoDepto = (u) => (u.tipo === 'Departamento' ? u.tipoDepartamento : 'No aplica');
const ubicacion = (u) => (u.tipo === 'Departamento' ? `Piso ${u.piso}` : u.nivel);

// Nombre del copropietario asociado (o texto por defecto si no tiene)
function personaAsociada(personaId) {
    const p = COPROPIETARIOS_MOCK.find((c) => c.id === personaId);
    return p ? nombreCompleto(p) : 'Sin asociación';
}

export default function Unidades() {
    const navigate = useNavigate();
    const location = useLocation();
    const mensaje = location.state?.mensaje; // alerta tras registrar
    const [pestana, setPestana] = useState('Todas');

    const unidades = pestana === 'Todas'
        ? UNIDADES_MOCK
        : UNIDADES_MOCK.filter((u) => u.tipo === PESTANA_A_TIPO[pestana]);

    const verHistorial = (id) => navigate(`/unidades/historial?departamento=${id}`);
    const verDetalle = (id) => navigate(`/unidades/${id}`);

    return (
        <DashboardLayout>
            <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>
                Unidades del edificio
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Consulta los departamentos, parqueos y bauleras registrados
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, mb: 2 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/unidades/registrar')}
                    sx={{ width: { xs: '100%', md: 'auto' } }}
                >
                    Registrar unidad
                </Button>
            </Box>

            {mensaje && <Alert severity="success" sx={{ mb: 2 }}>{mensaje}</Alert>}

            {/* Pestañas de filtro por tipo */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {PESTANAS.map((p) => (
                    <Button
                        key={p}
                        onClick={() => setPestana(p)}
                        variant={pestana === p ? 'contained' : 'outlined'}
                        size="small"
                        sx={{ borderRadius: 999, textTransform: 'none' }}
                    >
                        {p}
                    </Button>
                ))}
            </Box>

            {/* VISTA ESCRITORIO: tabla */}
            <Paper sx={{ p: 2, borderRadius: 3, display: { xs: 'none', md: 'block' } }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Tipo</strong></TableCell>
                            <TableCell><strong>Identificador</strong></TableCell>
                            <TableCell><strong>Tipo de dpto</strong></TableCell>
                            <TableCell><strong>Ubicacion</strong></TableCell>
                            <TableCell><strong>Persona asociada</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {unidades.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell><Chip label={u.tipo} size="small" sx={chipSx(u.tipo)} /></TableCell>
                                <TableCell>{u.identificador}</TableCell>
                                <TableCell>{tipoDepto(u)}</TableCell>
                                <TableCell>{ubicacion(u)}</TableCell>
                                <TableCell>{personaAsociada(u.personaId)}</TableCell>
                                <TableCell align="center">
                                    <IconButton color="primary" onClick={() => verDetalle(u.id)}>
                                        <VisibilityIcon />
                                    </IconButton>
                                    {u.tipo === 'Departamento' && (
                                        <IconButton color="primary" onClick={() => verHistorial(u.id)} title="Ver historial de ocupantes">
                                            <HistoryIcon />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Mostrando {unidades.length} unidades
                </Typography>
            </Paper>

            {/* VISTA MOVIL: tarjetas */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {unidades.map((u) => (
                    <Paper key={u.id} sx={{ p: 2, borderRadius: 3, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography sx={{ fontWeight: 700 }}>{u.identificador}</Typography>
                            <Chip label={u.tipo} size="small" sx={chipSx(u.tipo)} />
                        </Box>
                        {u.tipo === 'Departamento' && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: 'text.secondary' }}>
                                <ApartmentIcon fontSize="small" color="primary" />
                                <Typography variant="body2">{u.tipoDepartamento}</Typography>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: 'text.secondary' }}>
                            <PlaceIcon fontSize="small" color="primary" />
                            <Typography variant="body2">{ubicacion(u)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'text.secondary' }}>
                            <PersonIcon fontSize="small" color="primary" />
                            <Typography variant="body2">{personaAsociada(u.personaId)}</Typography>
                        </Box>
                        <Divider sx={{ mb: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                            <IconButton color="primary" onClick={() => verDetalle(u.id)}>
                                <VisibilityIcon />
                            </IconButton>
                            {u.tipo === 'Departamento' && (
                                <IconButton color="primary" onClick={() => verHistorial(u.id)} title="Ver historial de ocupantes">
                                    <HistoryIcon />
                                </IconButton>
                            )}
                        </Box>
                    </Paper>
                ))}
                <Typography variant="body2" color="text.secondary">
                    Mostrando {unidades.length} unidades
                </Typography>
            </Box>
        </DashboardLayout>
    );
}