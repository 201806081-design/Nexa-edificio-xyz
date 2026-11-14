import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, Chip, TextField, InputAdornment, IconButton, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert,
    Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DraftsIcon from '@mui/icons-material/Drafts';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ScheduleIcon from '@mui/icons-material/Schedule';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SmsIcon from '@mui/icons-material/Sms';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { BORRADORES_MOCK, eliminarBorrador, grupoPorId } from '../../constants/comunicadosMock';

// Mismos colores de prioridad que Enviados
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

// "Todos los copropietarios" o "Morosos · 1 seleccionado"
const textoDestinatarios = (b) => {
    const grupo = grupoPorId(b.destinatarioId);
    const etiqueta = grupo?.etiqueta ?? 'Sin grupo';
    const n = b.destinatariosEspecificos?.length ?? 0;
    if (n > 0) return `${etiqueta} · ${n} seleccionado${n === 1 ? '' : 's'}`;
    return `${etiqueta} (${grupo?.count ?? 0})`;
};

// Chips con lo que trae el borrador ademas del texto
function Extras({ b }) {
    return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
            {b.qrData && <Chip icon={<QrCode2Icon />} label="QR" size="small" variant="outlined" />}
            {b.adjunto && <Chip icon={<AttachFileIcon />} label={b.adjunto.name} size="small" variant="outlined" sx={{ maxWidth: 180 }} />}
            {b.programarAhora === 'programar' && b.fechaProgramada && (
                <Chip icon={<ScheduleIcon />} label={`Programado ${new Date(b.fechaProgramada).toLocaleString('es-BO')}`}
                    size="small" variant="outlined" />
            )}
        </Box>
    );
}

export default function Borradores() {
    const navigate = useNavigate();
    const [busqueda, setBusqueda] = useState('');
    const [aEliminar, setAEliminar] = useState(null);
    const [snack, setSnack] = useState({ open: false, msg: '' });
    const [tick, setTick] = useState(0);

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return BORRADORES_MOCK.filter((b) => !q
            || b.titulo.toLowerCase().includes(q)
            || (b.mensaje || '').toLowerCase().includes(q)
            || b.id.toLowerCase().includes(q));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [busqueda, tick]);

    // Abre Elaborar con todo el contenido del borrador (destinatarios, canales, QR, adjunto...)
    const continuar = (b) => navigate('/comunicados/elaborar', { state: { borrador: b } });

    const confirmarEliminar = () => {
        if (!aEliminar) return;
        eliminarBorrador(aEliminar.id);
        setSnack({ open: true, msg: `Borrador "${aEliminar.titulo}" eliminado` });
        setAEliminar(null);
        setTick((t) => t + 1);
    };

    const acciones = (b) => (
        <>
            <Tooltip title="Continuar editando">
                <IconButton color="primary" size="small" onClick={() => continuar(b)}><EditIcon fontSize="small" /></IconButton>
            </Tooltip>
            <Tooltip title="Eliminar borrador">
                <IconButton size="small" onClick={() => setAEliminar(b)} sx={{ color: '#D9534F' }}><DeleteIcon fontSize="small" /></IconButton>
            </Tooltip>
        </>
    );

    return (
        <DashboardLayout>
            {/* Encabezado (mismo patron que Enviados) */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Borradores</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Comunicados guardados sin enviar. Continua editandolos o eliminalos.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/comunicados/elaborar')}
                        sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Nuevo comunicado
                    </Button>
                </Box>
            </Box>

            {BORRADORES_MOCK.length === 0 ? (
                <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                    <DraftsIcon sx={{ fontSize: 48, color: '#CFDCEA', mb: 1 }} />
                    <Typography variant="h3" sx={{ mb: 0.5 }}>No tienes borradores guardados</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Al elaborar un comunicado usa "Guardar borrador" para terminarlo despues.
                    </Typography>
                </Paper>
            ) : (
                <>
                    {/* Buscador */}
                    <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#132B3E', display: 'block', mb: 0.5 }}>
                            Buscar
                        </Typography>
                        <TextField size="small" fullWidth placeholder="Por titulo, mensaje o codigo"
                            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
                    </Paper>

                    {/* Tabla (escritorio) */}
                    <Paper sx={{ borderRadius: 2, overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
                        <Table size="small" sx={{ minWidth: 820 }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#F3F6FA' }}>
                                    <TableCell sx={{ fontWeight: 700, color: '#132B3E' }}>Guardado</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#132B3E' }}>Titulo</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#132B3E' }}>Destinatarios</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#132B3E' }}>Canales</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#132B3E' }}>Prioridad</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: '#132B3E' }}>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtrados.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                            Ningun borrador coincide con la busqueda.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filtrados.map((b) => (
                                    <TableRow key={b.id} hover>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {b.fechaGuardado}
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{b.id}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 280 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{b.titulo}</Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                                                {b.mensaje || 'Sin mensaje'}
                                            </Typography>
                                            <Extras b={b} />
                                        </TableCell>
                                        <TableCell>{textoDestinatarios(b)}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.75, color: 'text.secondary' }}>
                                                {(b.canalesIds || []).length === 0 ? '—' : b.canalesIds.map((c) => <span key={c}>{iconoCanal(c)}</span>)}
                                            </Box>
                                        </TableCell>
                                        <TableCell><Chip label={b.prioridad} size="small" sx={prioridadChipSx(b.prioridad)} /></TableCell>
                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{acciones(b)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>

                    {/* Tarjetas (movil) */}
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                        {filtrados.length === 0 && (
                            <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center', color: 'text.secondary' }}>
                                Ningun borrador coincide con la busqueda.
                            </Paper>
                        )}
                        {filtrados.map((b) => (
                            <Paper key={b.id} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{b.titulo}</Typography>
                                        <Typography variant="caption" color="text.secondary">{b.id} · {b.fechaGuardado}</Typography>
                                    </Box>
                                    <Chip label={b.prioridad} size="small" sx={prioridadChipSx(b.prioridad)} />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{textoDestinatarios(b)}</Typography>
                                <Extras b={b} />
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>{acciones(b)}</Box>
                            </Paper>
                        ))}
                    </Box>
                </>
            )}

            {/* Confirmar eliminacion */}
            <Dialog open={!!aEliminar} onClose={() => setAEliminar(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Eliminar borrador</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        ¿Seguro que quieres eliminar el borrador <strong>{aEliminar?.titulo}</strong>? Esta accion no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button variant="outlined" onClick={() => setAEliminar(null)}>Cancelar</Button>
                    <Button variant="contained" color="error" onClick={confirmarEliminar}>Eliminar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ open: false, msg: '' })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity="success" variant="filled" onClose={() => setSnack({ open: false, msg: '' })}>{snack.msg}</Alert>
            </Snackbar>
        </DashboardLayout>
    );
}
