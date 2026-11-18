import { useState } from 'react';
import {
    Box, Typography, Paper, Button, Select, MenuItem, Chip, Snackbar, Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { useNavigate } from 'react-router-dom';
import { exportarPDF, exportarExcel } from '../../utils/exportarReporte';

// Piezas comunes de las pantallas de Reportes.

// Encabezado: titulo, descripcion, volver al catalogo y exportar.
//   crearReporte -> () => definicion para exportar (utils/exportarReporte.js)
//   bloqueado    -> texto si la exportacion no esta permitida (ej. totales que no coinciden)
export function EncabezadoReporte({ titulo, descripcion, crearReporte, bloqueado = '' }) {
    const navigate = useNavigate();
    const [aviso, setAviso] = useState(null);

    const exportar = (formato) => {
        try {
            const nombre = (formato === 'pdf' ? exportarPDF : exportarExcel)(crearReporte());
            setAviso({ sev: 'success', msg: `Archivo descargado: ${nombre}` });
        } catch {
            setAviso({ sev: 'error', msg: 'No se pudo generar el archivo. Intenta de nuevo.' });
        }
    };

    const botones = (
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            <Button variant="outlined" startIcon={<PictureAsPdfOutlinedIcon />} disabled={!!bloqueado}
                onClick={() => exportar('pdf')} sx={{ flex: { xs: 1, sm: 'none' }, color: '#1a2733', borderColor: '#cdd8e3' }}>
                PDF
            </Button>
            <Button variant="contained" startIcon={<FileDownloadOutlinedIcon />} disabled={!!bloqueado}
                onClick={() => exportar('excel')} sx={{ flex: { xs: 1, sm: 'none' } }}>
                Excel
            </Button>
        </Box>
    );

    return (
        <>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>{titulo}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{descripcion}</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/reportes')}
                    sx={{ color: '#1a2733', borderColor: '#cdd8e3', width: { xs: '100%', sm: 'auto' } }}>
                    Volver a reportes
                </Button>
                {botones}
            </Box>
            {bloqueado && <Alert severity="warning" sx={{ mb: 2 }}>{bloqueado}</Alert>}
            <Snackbar open={!!aviso} autoHideDuration={3500} onClose={() => setAviso(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                {aviso ? <Alert severity={aviso.sev} onClose={() => setAviso(null)} sx={{ width: '100%' }}>{aviso.msg}</Alert> : undefined}
            </Snackbar>
        </>
    );
}

// Tarjeta de indicador
export function KpiReporte({ etiqueta, valor, nota, icono, color = '#1F5F8B', fondo = '#E4EEF5' }) {
    return (
        <Paper sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            <Box sx={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', bgcolor: fondo, color, display: 'grid', placeItems: 'center' }}>
                {icono}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary" noWrap>{etiqueta}</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color }} noWrap>{valor}</Typography>
                {nota && <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{nota}</Typography>}
            </Box>
        </Paper>
    );
}

// Grilla de indicadores: 1 columna en celular, 2 en tablet, n en escritorio
export function GrillaKpis({ children, columnas = 4 }) {
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: `repeat(${columnas}, 1fr)` }, gap: 2, mb: 2 }}>
            {children}
        </Box>
    );
}

// Filtro con etiqueta arriba
export function CampoFiltro({ etiqueta, children, flex = 1, minWidth = 180, maxWidth = 'none' }) {
    return (
        <Box sx={{ flex, minWidth: { xs: '100%', sm: minWidth }, maxWidth: { xs: '100%', sm: maxWidth } }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{etiqueta}</Typography>
            {children}
        </Box>
    );
}

export function SelectorPeriodo({ valor, opciones, onChange, etiqueta = 'Periodo' }) {
    return (
        <CampoFiltro etiqueta={etiqueta} maxWidth={320}>
            <Select fullWidth value={valor} onChange={(e) => onChange(e.target.value)}>
                {opciones.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
        </CampoFiltro>
    );
}

// Barra de filtros (se apila en celular)
export function BarraFiltros({ children }) {
    return (
        <Paper sx={{ p: 2, borderRadius: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {children}
        </Paper>
    );
}

const COLORES_ESTADO = {
    Pagado: { bgcolor: '#E4F4EE', color: '#2E9D78' },
    Coincide: { bgcolor: '#E4F4EE', color: '#2E9D78' },
    Parcial: { bgcolor: '#FDF0D5', color: '#B6802A' },
    Pendiente: { bgcolor: '#FDF0D5', color: '#B6802A' },
    Vencido: { bgcolor: '#FBEAE9', color: '#D9534F' },
    'No coincide': { bgcolor: '#FBEAE9', color: '#D9534F' },
    Critico: { bgcolor: '#FBEAE9', color: '#D9534F' },
};

export function ChipEstado({ estado }) {
    return <Chip size="small" label={estado} sx={{ ...(COLORES_ESTADO[estado] ?? {}), fontWeight: 600 }} />;
}

// Recuadro con desplazamiento horizontal propio: en celular solo se mueve la tabla, no la pagina
export function TablaDeslizable({ children, minWidth = 720 }) {
    return (
        <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', '& > table': { minWidth } }}>
            {children}
        </Box>
    );
}
