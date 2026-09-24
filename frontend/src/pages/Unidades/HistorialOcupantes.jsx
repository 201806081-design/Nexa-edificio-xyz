import { useState } from 'react';
import {
    Box, Typography, Select, MenuItem, Button, Chip, Paper, Divider,
    Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    UNIDADES_MOCK, departamentos, ocupanteActual, ocupantesAnteriores, etiquetaUnidad,
} from '../../constants/unidadesMock';

// '2025-01-15' -> '15/01/2025'
function fmt(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

// Color del chip segun la relacion
const relChipSx = (tipo) => (tipo === 'Propietario'
    ? { bgcolor: '#D6F0E4', color: '#2E9D78' }
    : { bgcolor: '#C5E0F2', color: '#1F5F8B' });

export default function HistorialOcupantes() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const deptos = departamentos();

    // Preselecciona el departamento si viene por la URL (?departamento=id), desde el listado
    const [unidadId, setUnidadId] = useState(() => {
        const pid = Number(searchParams.get('departamento'));
        return deptos.some((d) => d.id === pid) ? pid : '';
    });

    const unidad = unidadId ? UNIDADES_MOCK.find((u) => u.id === unidadId) : null;
    const actual = unidadId ? ocupanteActual(unidadId) : null;
    const anteriores = unidadId ? ocupantesAnteriores(unidadId) : [];
    const total = (actual ? 1 : 0) + anteriores.length;
    const numero = unidad ? unidad.identificador.replace(/\D+/g, '') : '';

    return (
        <DashboardLayout>
            <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>Historial de ocupantes</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Consulta las personas que han ocupado un departamento
            </Typography>

            {/* Una sola tarjeta: selector arriba, contenido debajo */}
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: { xs: 2.5, md: 4 }, boxShadow: 1 }}>
                {/* Selector + volver */}
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' } }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Seleccione un departamento</Typography>
                        <Select fullWidth displayEmpty value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
                            <MenuItem value=""><em>Seleccionar departamento</em></MenuItem>
                            {deptos.map((u) => <MenuItem key={u.id} value={u.id}>{etiquetaUnidad(u)}</MenuItem>)}
                        </Select>
                    </Box>
                    <Button variant="outlined" onClick={() => navigate('/unidades')}
                        sx={{
                            width: { xs: '100%', md: 'auto' },
                            height: { md: 56 },
                            color: '#1a2733', borderColor: '#cdd8e3', textTransform: 'none', fontWeight: 600,
                            '&:hover': { borderColor: '#9aa8b6', bgcolor: '#f5f8fb' },
                        }}>
                        Volver a unidades
                    </Button>
                </Box>

                {/* Estado vacio: aun no se eligio departamento */}
                {!unidadId && (
                    <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                            <ApartmentIcon sx={{ fontSize: 80, color: '#9aa8b6' }} />
                            <ScheduleIcon sx={{
                                fontSize: 34, color: '#9aa8b6', bgcolor: 'background.paper', borderRadius: '50%',
                                position: 'absolute', right: -10, bottom: -2,
                            }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Seleccione un departamento</Typography>
                        <Typography variant="body2">El historial de ocupantes aparece en esta seccion</Typography>
                    </Box>
                )}

                {/* Departamento elegido */}
                {unidad && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
                            Departamento {numero}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Piso {unidad.piso}</Typography>

                        {/* ===== ESCRITORIO: tablas ===== */}
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Ocupante actual</Typography>
                            <Table sx={{ mb: 3 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Ocupante</TableCell>
                                        <TableCell>Relacion</TableCell>
                                        <TableCell>Periodo</TableCell>
                                        <TableCell>Estado</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {actual ? (
                                        <TableRow sx={{ bgcolor: '#F2FBF7' }}>
                                            <TableCell sx={{ fontWeight: 600 }}>{actual.nombre}</TableCell>
                                            <TableCell><Chip label={actual.tipo} size="small" sx={relChipSx(actual.tipo)} /></TableCell>
                                            <TableCell>Desde {fmt(actual.fechaInicio)}</TableCell>
                                            <TableCell><Chip label="Actual" size="small" sx={{ bgcolor: '#D6F0E4', color: '#2E9D78', fontWeight: 600 }} /></TableCell>
                                        </TableRow>
                                    ) : (
                                        <TableRow><TableCell colSpan={4} sx={{ color: 'text.secondary' }}>Sin ocupante actual.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Ocupantes anteriores</Typography>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Ocupante</TableCell>
                                        <TableCell>Relacion</TableCell>
                                        <TableCell>Periodo</TableCell>
                                        <TableCell>Estado</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {anteriores.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} sx={{ color: 'text.secondary' }}>Aun no hay ocupantes anteriores registrados.</TableCell></TableRow>
                                    ) : anteriores.map((o) => (
                                        <TableRow key={o.id}>
                                            <TableCell sx={{ fontWeight: 600 }}>{o.nombre}</TableCell>
                                            <TableCell><Chip label={o.tipo} size="small" sx={relChipSx(o.tipo)} /></TableCell>
                                            <TableCell>{fmt(o.fechaInicio)} - {fmt(o.fechaFin)}</TableCell>
                                            <TableCell><Chip label="Anterior" size="small" sx={{ bgcolor: '#EEF1F4', color: '#5A6B7B', fontWeight: 600 }} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>

                        {/* ===== MOVIL: tarjetas ===== */}
                        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Ocupante actual</Typography>
                            {actual ? (
                                <Paper elevation={0} sx={{ border: '1.5px solid #2E9D78', bgcolor: '#F2FBF7', borderRadius: 2, p: 2, mb: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <Typography sx={{ fontWeight: 700 }}>{actual.nombre}</Typography>
                                        <Chip label="Actual" size="small" sx={{ bgcolor: '#D6F0E4', color: '#2E9D78', fontWeight: 600 }} />
                                    </Box>
                                    <Chip label={actual.tipo} size="small" sx={{ ...relChipSx(actual.tipo), mb: 0.5 }} />
                                    <Typography variant="body2" color="text.secondary">Desde {fmt(actual.fechaInicio)}</Typography>
                                </Paper>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Sin ocupante actual.</Typography>
                            )}

                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Ocupantes anteriores</Typography>
                            {anteriores.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">Aun no hay ocupantes anteriores registrados.</Typography>
                            ) : anteriores.map((o) => (
                                <Paper key={o.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, mb: 1.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <Typography sx={{ fontWeight: 700 }}>{o.nombre}</Typography>
                                        <Chip label="Anterior" size="small" sx={{ bgcolor: '#EEF1F4', color: '#5A6B7B', fontWeight: 600 }} />
                                    </Box>
                                    <Chip label={o.tipo} size="small" sx={{ ...relChipSx(o.tipo), mb: 0.5 }} />
                                    <Typography variant="body2" color="text.secondary">{fmt(o.fechaInicio)} - {fmt(o.fechaFin)}</Typography>
                                </Paper>
                            ))}
                        </Box>

                        <Divider sx={{ my: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                            {total} {total === 1 ? 'ocupante registrado' : 'ocupantes registrados'}
                        </Typography>
                    </Box>
                )}
            </Box>
        </DashboardLayout>
    );
}