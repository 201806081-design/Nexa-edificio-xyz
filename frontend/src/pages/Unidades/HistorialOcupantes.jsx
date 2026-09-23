import { useState } from 'react';
import { Box, Typography, Select, MenuItem, Button, Chip, Divider } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    departamentos, ocupanteActual, ocupantesAnteriores, etiquetaUnidad,
} from '../../constants/unidadesMock';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// '2025-01-15' -> '15 de enero de 2025'
function formatFecha(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${Number(d)} de ${MESES[Number(m) - 1]} de ${y}`;
}

export default function HistorialOcupantes() {
    const navigate = useNavigate();
    const [unidadId, setUnidadId] = useState('');

    const deptos = departamentos();
    const id = Number(unidadId);
    const actual = unidadId ? ocupanteActual(id) : null;
    const anteriores = unidadId ? ocupantesAnteriores(id) : [];

    return (
        <DashboardLayout>
            <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>Historial de ocupantes</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Consulta las personas que han ocupado un departamento
            </Typography>

            {/* Selector + volver */}
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 3, boxShadow: 1, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' } }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Seleccione un departamento</Typography>
                        <Select fullWidth displayEmpty value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
                            <MenuItem value=""><em>Seleccionar departamento</em></MenuItem>
                            {deptos.map((u) => <MenuItem key={u.id} value={u.id}>{etiquetaUnidad(u)}</MenuItem>)}
                        </Select>
                    </Box>
                    <Button variant="outlined" onClick={() => navigate('/unidades')}
                        sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Volver a unidades
                    </Button>
                </Box>
            </Box>

            {/* Estado vacio: aun no se eligio departamento */}
            {!unidadId && (
                <Box sx={{
                    bgcolor: 'background.paper', borderRadius: 3, boxShadow: 1,
                    p: 6, textAlign: 'center', color: 'text.secondary',
                }}>
                    <ApartmentIcon sx={{ fontSize: 64, color: '#9aa8b6', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Seleccione un departamento</Typography>
                    <Typography variant="body2">El historial de ocupantes aparece en esta seccion</Typography>
                </Box>
            )}

            {/* Departamento elegido: ocupante actual + anteriores */}
            {unidadId && (
                <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 4, boxShadow: 1 }}>
                    {/* Ocupante actual */}
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Ocupante actual</Typography>
                    {actual ? (
                        <Box sx={{ border: '1.5px solid #2E9D78', bgcolor: '#F2FBF7', borderRadius: 2, p: 2.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography sx={{ fontWeight: 700 }}>{actual.nombre}</Typography>
                                <Chip label="Actual" size="small" sx={{ bgcolor: '#D6F0E4', color: '#2E9D78', fontWeight: 600 }} />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {actual.tipo} · Desde el {formatFecha(actual.fechaInicio)}
                            </Typography>
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            Esta unidad no tiene un ocupante actual.
                        </Typography>
                    )}

                    <Divider sx={{ my: 3 }} />

                    {/* Ocupantes anteriores (ordenados del mas reciente al mas antiguo) */}
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Ocupantes anteriores</Typography>
                    {anteriores.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            Aun no hay ocupantes anteriores registrados.
                        </Typography>
                    ) : (
                        anteriores.map((o) => (
                            <Box key={o.id} sx={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                gap: 1, py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
                            }}>
                                <Box>
                                    <Typography sx={{ fontWeight: 600 }}>{o.nombre}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {o.tipo} · {formatFecha(o.fechaInicio)} — {formatFecha(o.fechaFin)}
                                    </Typography>
                                </Box>
                                <Chip label="Anterior" size="small" sx={{ bgcolor: '#EEF1F4', color: '#5A6B7B', fontWeight: 600 }} />
                            </Box>
                        ))
                    )}
                </Box>
            )}
        </DashboardLayout>
    );
}