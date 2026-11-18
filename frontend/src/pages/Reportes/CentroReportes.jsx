import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, TextField, InputAdornment, Select, MenuItem, Chip, Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import UpdateIcon from '@mui/icons-material/Update';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { usePermisos } from '../../hooks/usePermisos';
import { REPORTES, GRUPOS_REPORTE } from '../../constants/reportesMock';
import { ICONO_PANTALLA } from '../../components/iconosPantallas';
import { KpiReporte } from './componentesReporte';

// Centro de reportes: catalogo de los reportes que el rol puede abrir.

const horaActual = () => {
    const d = new Date();
    return `${d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit' })} · ${d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
};

function TarjetaReporte({ reporte, onAbrir }) {
    const critico = !!reporte.critico;
    return (
        <Paper sx={{ p: 2.5, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Box sx={{
                    flexShrink: 0, width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center',
                    bgcolor: critico ? '#FBEAE9' : '#E4EEF5', color: critico ? '#D9534F' : 'primary.main',
                }}>
                    {ICONO_PANTALLA[reporte.clave]}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <Typography sx={{ fontWeight: 700 }}>{reporte.titulo}</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {reporte.enFinanzas && <Chip size="small" label="En Finanzas" sx={{ bgcolor: '#E4EEF5', color: '#1F5F8B', fontWeight: 600 }} />}
                            {critico && <Chip size="small" label="Critico" sx={{ bgcolor: '#FBEAE9', color: '#D9534F', fontWeight: 600 }} />}
                        </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">{reporte.descripcion}</Typography>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
                <Button variant="outlined" size="small" startIcon={<VisibilityOutlinedIcon />} onClick={onAbrir}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}>
                    Abrir reporte
                </Button>
            </Box>
        </Paper>
    );
}

export default function CentroReportes() {
    const navigate = useNavigate();
    const { puede } = usePermisos();
    const [busqueda, setBusqueda] = useState('');
    const [grupo, setGrupo] = useState('Todos');
    const [actualizado, setActualizado] = useState(horaActual);

    const disponibles = useMemo(() => REPORTES.filter((r) => puede(r.clave)), [puede]);
    const visibles = disponibles.filter((r) =>
        (grupo === 'Todos' || r.grupo === grupo)
        && `${r.titulo} ${r.descripcion}`.toLowerCase().includes(busqueda.trim().toLowerCase()));
    const criticos = disponibles.filter((r) => r.critico).length;

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Reportes financieros</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Selecciona un reporte, aplica filtros y exporta sus resultados a PDF o Excel
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr) auto' }, gap: 2, mb: 2, alignItems: 'stretch' }}>
                <KpiReporte etiqueta="Reportes disponibles" valor={`${disponibles.length} reportes`}
                    nota={`${criticos} criticos`} icono={<AssessmentOutlinedIcon />} />
                <KpiReporte etiqueta="Datos actualizados" valor={actualizado} nota="Desde los registros del sistema"
                    icono={<UpdateIcon />} color="#2E9D78" fondo="#E4F4EE" />
                <KpiReporte etiqueta="Exportaciones" valor="PDF y Excel" nota="En cada reporte"
                    icono={<FileDownloadOutlinedIcon />} color="#8E6DD1" fondo="#EFEAF8" />
                <Button variant="contained" startIcon={<UpdateIcon />} onClick={() => setActualizado(horaActual())}
                    sx={{ alignSelf: 'center', whiteSpace: 'nowrap', px: 3, py: 1.5 }}>
                    Actualizar datos
                </Button>
            </Box>

            <Paper sx={{ p: 2, borderRadius: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField placeholder="Buscar reporte" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                    sx={{ flex: 2, minWidth: { xs: '100%', sm: 240 } }}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} />
                <Select value={grupo} onChange={(e) => setGrupo(e.target.value)} sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }}>
                    {GRUPOS_REPORTE.map((g) => <MenuItem key={g} value={g}>{g === 'Todos' ? 'Todos los tipos' : g}</MenuItem>)}
                </Select>
            </Paper>

            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1.5 }}>Catalogo de reportes</Typography>
            {visibles.length === 0 ? (
                <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center', color: 'text.secondary' }}>
                    No hay reportes que coincidan con la busqueda.
                </Paper>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mb: 2 }}>
                    {visibles.map((r) => <TarjetaReporte key={r.clave} reporte={r} onAbrir={() => navigate(r.ruta)} />)}
                </Box>
            )}

            <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', mt: 2 }}>
                En <strong>Finanzas</strong> se registra y se consulta el dia a dia; aqui estan esos mismos datos como documentos
                para presentar (asamblea, directorio, copropietarios) y exportar a PDF o Excel. Los totales salen de los registros
                del sistema: si alguno no coincide, el reporte no deja exportar hasta revisarlo.
            </Alert>
        </DashboardLayout>
    );
}
