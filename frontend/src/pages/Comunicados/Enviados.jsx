import { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Chip, TextField, Select, MenuItem,
    InputAdornment, IconButton, Menu, Dialog, DialogTitle, DialogContent,
    DialogActions, Divider, Snackbar, Alert, Table, TableHead, TableBody,
    TableRow, TableCell,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SendIcon from '@mui/icons-material/Send';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ErrorIcon from '@mui/icons-material/Error';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReplayIcon from '@mui/icons-material/Replay';
import CancelIcon from '@mui/icons-material/Cancel';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SmsIcon from '@mui/icons-material/Sms';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    COMUNICADOS_MOCK, ESTADOS_COMUNICADO, calcularResumenComunicados,
    grupoPorId, canalPorId,
} from '../../constants/comunicadosMock';

const estadoChipSx = (estado) => {
    if (estado === 'Enviado') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Programado') return { bgcolor: '#E4EEF5', color: '#1a73e8' };
    if (estado === 'Fallido') return { bgcolor: '#FBEAE9', color: '#D9534F' };
    return { bgcolor: '#E4E7EB', color: 'text.secondary' };
};

const prioridadChipSx = (p) => {
    if (p === 'Urgente') return { bgcolor: '#FBEAE9', color: '#D9534F' };
    if (p === 'Importante') return { bgcolor: '#FDF0D5', color: '#B6802A' };
    return { bgcolor: '#E4F4EE', color: '#2E9D78' };
};

const iconoCanal = (id) => {
    const sx = { fontSize: 18 };
    if (id === 'app') return <NotificationsActiveIcon sx={sx} />;
    if (id === 'correo') return <EmailIcon sx={sx} />;
    if (id === 'whatsapp') return <WhatsAppIcon sx={sx} />;
    if (id === 'sms') return <SmsIcon sx={sx} />;
    return null;
};

export default function Enviados() {
    const navigate = useNavigate();
    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    const [busqueda, setBusqueda] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('Todos');

    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuRow, setMenuRow] = useState(null);

    const [detalle, setDetalle] = useState(null);

    // Tick cada 5s: captura comunicados nuevos (enviados desde Elaborar),
    // programados que se disparan, cancelaciones, etc.
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const h = setInterval(() => setTick((t) => t + 1), 5000);
        return () => clearInterval(h);
    }, []);
    const forzarRefresh = () => setTick((t) => t + 1);

    const resumen = useMemo(() => calcularResumenComunicados(), [tick]);

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return COMUNICADOS_MOCK.filter((c) => {
            if (estadoFiltro !== 'Todos' && c.estado !== estadoFiltro) return false;
            if (!q) return true;
            return (
                c.titulo.toLowerCase().includes(q) ||
                c.mensaje.toLowerCase().includes(q) ||
                c.id.toLowerCase().includes(q)
            );
        });
    }, [busqueda, estadoFiltro, tick]);

    const abrirMenu = (e, row) => { setMenuAnchor(e.currentTarget); setMenuRow(row); };
    const cerrarMenu = () => { setMenuAnchor(null); setMenuRow(null); };

    const verDetalle = () => { setDetalle(menuRow); cerrarMenu(); };

    const fechaBonita = () => {
        const d = new Date();
        const p = (n) => String(n).padStart(2, '0');
        return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
    };

    const reenviar = () => {
        const row = menuRow;
        cerrarMenu();
        if (!row) return;
        row.estado = 'Enviado';
        row.entregados = row.totalDestinatarios;
        row.fecha = fechaBonita();
        forzarRefresh();
        setSnack({ open: true, msg: `Comunicado ${row.id} reenviado a ${row.totalDestinatarios} destinatarios`, sev: 'success' });
    };

    const cancelarProgramado = () => {
        const row = menuRow;
        cerrarMenu();
        if (!row || row.estado !== 'Programado') return;
        row.estado = 'Fallido';
        row.entregados = 0;
        forzarRefresh();
        setSnack({ open: true, msg: `Comunicado ${row.id} cancelado`, sev: 'warning' });
    };

    const Card = ({ titulo, valor, extra, icono, color }) => (
        <Paper sx={{ p: 2.5, borderRadius: 2, flex: 1, minWidth: 220 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#132B3E', fontWeight: 600 }}>{titulo}</Typography>
                <Box sx={{ color }}>{icono}</Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>{valor}</Typography>
            {extra && <Typography variant="caption" color="text.secondary">{extra}</Typography>}
        </Paper>
    );

    return (
        <DashboardLayout>
            {/* Encabezado: titulo + subtitulo; el boton va en su propia fila, mas abajo
          (mismo patron que Expensas / Personal) */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Comunicados enviados</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Historial de avisos del edificio.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/comunicados/elaborar')}>
                        Nuevo comunicado
                    </Button>
                </Box>
            </Box>

            {/* Cards resumen: Enviados, Programados, Fallidos (sin tasa de entrega) */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Card titulo="Enviados" valor={resumen.enviados} extra="Este mes"
                    icono={<SendIcon />} color="#2E9D78" />
                <Card titulo="Programados" valor={resumen.programados} extra="Pendientes de envio"
                    icono={<ScheduleIcon />} color="#1a73e8" />
                <Card titulo="Fallidos" valor={resumen.fallidos ?? 0} extra="Requieren revision"
                    icono={<ErrorIcon />} color="#D9534F" />
            </Box>

            {/* Filtros con labels arriba */}
            <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <Box sx={{ flex: 1, minWidth: 260 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#132B3E', display: 'block', mb: 0.5 }}>
                            Buscar
                        </Typography>
                        <TextField size="small" fullWidth placeholder="Por titulo, mensaje o codigo"
                            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
                    </Box>
                    <Box sx={{ minWidth: 200 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#132B3E', display: 'block', mb: 0.5 }}>
                            Categoria
                        </Typography>
                        <Select size="small" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}
                            sx={{ minWidth: 200 }}>
                            {ESTADOS_COMUNICADO.map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                        </Select>
                    </Box>
                </Box>
            </Paper>

            {/* Tabla (sin columna Entrega) */}
            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#F3F6FA' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#132B3E' }}>Fecha</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#132B3E' }}>Titulo</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#132B3E' }}>Destinatarios</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#132B3E' }}>Canales</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#132B3E' }}>Prioridad</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#132B3E' }}>Estado</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#132B3E' }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtrados.map((c) => {
                            const g = grupoPorId(c.destinatarioId);
                            return (
                                <TableRow key={c.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.fecha}</Typography>
                                        <Typography variant="caption" color="text.secondary">{c.id}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.titulo}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{
                                            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden', maxWidth: 280,
                                        }}>
                                            {c.mensaje}
                                        </Typography>
                                        {c.adjunto && (
                                            <Chip size="small" icon={<AttachFileIcon sx={{ fontSize: 14 }} />}
                                                label={c.adjunto} sx={{ mt: 0.5, bgcolor: '#E4EEF5', color: 'primary.main', fontSize: 11 }} />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{g?.etiqueta ?? '—'}</Typography>
                                        <Typography variant="caption" color="text.secondary">{c.totalDestinatarios} destinatarios</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            {c.canalesIds.map((cid) => (
                                                <Box key={cid} title={canalPorId(cid)?.nombre} sx={{ color: 'primary.main' }}>
                                                    {iconoCanal(cid)}
                                                </Box>
                                            ))}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip size="small" label={c.prioridad} sx={prioridadChipSx(c.prioridad)} />
                                    </TableCell>
                                    <TableCell>
                                        <Chip size="small" label={c.estado} sx={estadoChipSx(c.estado)} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={(e) => abrirMenu(e, c)}>
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filtrados.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No hay comunicados que coincidan con los filtros.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Paper>

            {/* Menu acciones (sin Duplicar) */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={cerrarMenu}>
                <MenuItem onClick={verDetalle}>
                    <VisibilityIcon fontSize="small" sx={{ mr: 1 }} /> Ver detalle
                </MenuItem>
                <MenuItem onClick={reenviar} disabled={menuRow?.estado === 'Programado'}>
                    <ReplayIcon fontSize="small" sx={{ mr: 1 }} /> Reenviar
                </MenuItem>
                {menuRow?.estado === 'Programado' && (
                    <MenuItem onClick={cancelarProgramado} sx={{ color: '#D9534F' }}>
                        <CancelIcon fontSize="small" sx={{ mr: 1 }} /> Cancelar envio
                    </MenuItem>
                )}
            </Menu>

            {/* Modal detalle (sin seccion Entrega) */}
            <Dialog open={Boolean(detalle)} onClose={() => setDetalle(null)} maxWidth="sm" fullWidth>
                {detalle && (
                    <>
                        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            {detalle.titulo}
                            <Chip size="small" label={detalle.estado} sx={estadoChipSx(detalle.estado)} />
                            <Chip size="small" label={detalle.prioridad} sx={prioridadChipSx(detalle.prioridad)} />
                        </DialogTitle>
                        <DialogContent dividers>
                            <Typography variant="caption" color="text.secondary">
                                {detalle.id} · {detalle.fecha} · {detalle.autor}
                            </Typography>
                            <Divider sx={{ my: 1.5 }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Mensaje</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                                {detalle.mensaje}
                            </Typography>

                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Destinatarios</Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                {grupoPorId(detalle.destinatarioId)?.etiqueta} ({detalle.totalDestinatarios})
                            </Typography>

                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Canales utilizados</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                {detalle.canalesIds.map((cid) => (
                                    <Chip key={cid} size="small" icon={iconoCanal(cid)} label={canalPorId(cid)?.etiqueta}
                                        sx={{ bgcolor: '#E4EEF5', color: 'primary.main', fontWeight: 600 }} />
                                ))}
                            </Box>

                            {detalle.adjunto && (
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Adjunto</Typography>
                                    <Chip icon={<AttachFileIcon sx={{ fontSize: 16 }} />} label={detalle.adjunto}
                                        sx={{ bgcolor: '#E4EEF5', color: 'primary.main' }} />
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDetalle(null)}>Cerrar</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: '100%' }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </DashboardLayout>
    );
}