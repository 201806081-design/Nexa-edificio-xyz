import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, Chip, Select, MenuItem, TextField,
    Checkbox, FormControlLabel, InputAdornment, Alert, Snackbar, Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import GroupsIcon from '@mui/icons-material/Groups';
import ScheduleIcon from '@mui/icons-material/Schedule';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SmsIcon from '@mui/icons-material/Sms';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    CANALES, PRIORIDADES, COMUNICADOS_MOCK,
    gruposDestinatarios, grupoPorId, canalPorId, canalEstaDisponible,
} from '../../constants/comunicadosMock';

const iconoCanal = (id) => {
    if (id === 'app') return <NotificationsActiveIcon />;
    if (id === 'correo') return <EmailIcon />;
    if (id === 'whatsapp') return <WhatsAppIcon />;
    if (id === 'sms') return <SmsIcon />;
    return <NotificationsActiveIcon />;
};

const prioridadChipSx = (p) => {
    if (p === 'Urgente') return { bgcolor: '#FBEAE9', color: '#D9534F' };
    if (p === 'Importante') return { bgcolor: '#FDF0D5', color: '#B6802A' };
    return { bgcolor: '#E4F4EE', color: '#2E9D78' };
};

const fechaHoyBonitaConHora = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// Siguiente CO-XXXX para los nuevos comunicados
const siguienteCodigo = () => {
    const nums = COMUNICADOS_MOCK.map((c) => Number(String(c.id).replace(/\D/g, '')) || 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `CO-${String(next).padStart(4, '0')}`;
};

export default function Elaborar() {
    const navigate = useNavigate();
    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    const [titulo, setTitulo] = useState('');
    const [destinatarioId, setDestinatarioId] = useState('todos');
    const [prioridad, setPrioridad] = useState('Importante');
    const [mensaje, setMensaje] = useState('');
    const [adjunto, setAdjunto] = useState(null);
    const [canalesSel, setCanalesSel] = useState({ app: true, correo: true, whatsapp: false, sms: false });
    const [programarAhora, setProgramarAhora] = useState('ahora'); // 'ahora' | 'programar'
    const [fechaProgramada, setFechaProgramada] = useState('');

    const grupos = useMemo(() => gruposDestinatarios(), []);
    const grupo = grupoPorId(destinatarioId);

    const canalesElegidos = Object.entries(canalesSel).filter(([, v]) => v).map(([k]) => k);
    const puedeEnviar = titulo.trim() && mensaje.trim() && canalesElegidos.length > 0 && (programarAhora === 'ahora' || fechaProgramada);

    const toggleCanal = (id) => {
        if (!canalEstaDisponible(id)) return;
        setCanalesSel((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const limpiarFormulario = () => {
        setTitulo(''); setDestinatarioId('todos'); setPrioridad('Importante'); setMensaje('');
        setAdjunto(null); setCanalesSel({ app: true, correo: true, whatsapp: false, sms: false });
        setProgramarAhora('ahora'); setFechaProgramada('');
    };

    const guardarBorrador = () => {
        if (!titulo.trim()) {
            setSnack({ open: true, msg: 'Agregale un titulo al borrador', sev: 'warning' });
            return;
        }
        setSnack({ open: true, msg: `Borrador "${titulo}" guardado`, sev: 'success' });
    };

    const abrirVistaPrevia = () => {
        if (!titulo.trim() || !mensaje.trim()) {
            setSnack({ open: true, msg: 'Completa titulo y mensaje para ver la vista previa', sev: 'warning' });
            return;
        }
        setSnack({ open: true, msg: 'Vista previa abierta (lateral derecho)', sev: 'success' });
    };

    const enviarComunicado = () => {
        if (!puedeEnviar) {
            setSnack({ open: true, msg: 'Completa titulo, mensaje y al menos un canal', sev: 'warning' });
            return;
        }
        const codigo = siguienteCodigo();
        const esProgramado = programarAhora === 'programar';
        const fechaParaMostrar = esProgramado ? fechaProgramada.replace('T', ' ') : fechaHoyBonitaConHora();
        COMUNICADOS_MOCK.unshift({
            id: codigo, fecha: fechaParaMostrar, titulo: titulo.trim(),
            mensaje: mensaje.trim(),
            destinatarioId, canalesIds: canalesElegidos,
            prioridad,
            entregados: esProgramado ? null : grupo.count,
            totalDestinatarios: grupo.count,
            estado: esProgramado ? 'Programado' : 'Enviado',
            adjunto: adjunto ? adjunto.name : null,
            autor: 'Administrador',
        });
        const msg = esProgramado
            ? `Comunicado ${codigo} programado para ${fechaParaMostrar}`
            : `Comunicado ${codigo} enviado a ${grupo.count} destinatarios`;
        setSnack({ open: true, msg, sev: 'success' });
        limpiarFormulario();
        setTimeout(() => navigate('/comunicados/enviados'), 1200);
    };

    const onAttach = (e) => {
        const f = e.target.files?.[0];
        if (f) setAdjunto(f);
    };

    return (
        <DashboardLayout>
            {/* Encabezado */}
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Elaborar comunicado</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Redacta, guarda o envia avisos por los canales disponibles.
            </Typography>

            {/* Dos columnas: contenido + canales/vista previa */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
                {/* COLUMNA IZQUIERDA — Contenido */}
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2 }}>
                        Contenido del comunicado
                    </Typography>

                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>
                        Titulo <span style={{ color: '#D9534F' }}>*</span>
                    </Typography>
                    <TextField fullWidth size="small" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Ej. Mantenimiento programado del ascensor" sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 220 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>
                                Destinatarios <span style={{ color: '#D9534F' }}>*</span>
                            </Typography>
                            <Select fullWidth size="small" value={destinatarioId} onChange={(e) => setDestinatarioId(e.target.value)}
                                startAdornment={<InputAdornment position="start"><GroupsIcon fontSize="small" /></InputAdornment>}>
                                {grupos.map((g) => (
                                    <MenuItem key={g.id} value={g.id} disabled={g.count === 0}>
                                        {g.etiqueta} <span style={{ opacity: 0.6, marginLeft: 6 }}>({g.count})</span>
                                    </MenuItem>
                                ))}
                            </Select>
                            {grupo && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    {grupo.descripcion}
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 180 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Prioridad</Typography>
                            <Select fullWidth size="small" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                                {PRIORIDADES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                            </Select>
                        </Box>
                    </Box>

                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>
                        Mensaje <span style={{ color: '#D9534F' }}>*</span>
                    </Typography>
                    <TextField fullWidth multiline minRows={6} value={mensaje} onChange={(e) => setMensaje(e.target.value)}
                        placeholder="Escribe el contenido del comunicado..."
                        slotProps={{ htmlInput: { maxLength: 800 } }}
                        sx={{ mb: 0.5 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mb: 2 }}>
                        {mensaje.length}/800
                    </Typography>

                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Archivo adjunto</Typography>
                    <Button variant="outlined" component="label" startIcon={<AttachFileIcon />}
                        sx={{ color: '#1a2733', borderColor: '#cdd8e3', mb: adjunto ? 0.5 : 2 }}>
                        Adjuntar archivo
                        <input hidden type="file" onChange={onAttach} />
                    </Button>
                    {adjunto && (
                        <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', mb: 2, mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{adjunto.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {(adjunto.size / 1024).toFixed(0)} KB
                            </Typography>
                            <Button size="small" onClick={() => setAdjunto(null)} sx={{ ml: 2 }}>Quitar</Button>
                        </Alert>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#E4EEF5' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <ScheduleIcon fontSize="small" sx={{ color: 'primary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>Programacion</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Enviar ahora o programar fecha y hora.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Select size="small" value={programarAhora} onChange={(e) => setProgramarAhora(e.target.value)}
                                sx={{ minWidth: 180, bgcolor: '#fff' }}>
                                <MenuItem value="ahora">Enviar ahora</MenuItem>
                                <MenuItem value="programar">Programar</MenuItem>
                            </Select>
                            {programarAhora === 'programar' && (
                                <TextField size="small" type="datetime-local" value={fechaProgramada}
                                    onChange={(e) => setFechaProgramada(e.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                    sx={{ bgcolor: '#fff' }} />
                            )}
                        </Box>
                    </Paper>
                </Paper>

                {/* COLUMNA DERECHA — Canales + Vista previa */}
                <Box>
                    <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                        <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2 }}>
                            Canales de envio
                        </Typography>
                        {CANALES.map((c) => {
                            const disp = c.estado === 'disponible';
                            const sel = canalesSel[c.id];
                            return (
                                <Box key={c.id} onClick={() => toggleCanal(c.id)}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 1.5,
                                        borderRadius: 2, cursor: disp ? 'pointer' : 'not-allowed',
                                        border: '1px solid',
                                        borderColor: sel ? 'primary.main' : (disp ? '#CFDCEA' : '#E4E7EB'),
                                        bgcolor: sel ? '#E4EEF5' : '#fff',
                                        opacity: disp ? 1 : 0.6,
                                    }}>
                                    <Checkbox checked={!!sel} disabled={!disp}
                                        onChange={() => toggleCanal(c.id)} onClick={(e) => e.stopPropagation()} />
                                    <Box sx={{ color: disp ? 'primary.main' : 'text.secondary' }}>
                                        {iconoCanal(c.id)}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.nombre}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {c.estado === 'disponible' && 'Disponible'}
                                            {c.estado === 'en integracion' && 'En integracion'}
                                            {c.estado === 'no configurado' && 'No configurado'}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}

                        {(!canalEstaDisponible('whatsapp') || !canalEstaDisponible('sms')) && (
                            <Alert severity="warning" icon={false} sx={{ bgcolor: '#FDF0D5', color: '#8A5A00' }}>
                                <Typography variant="caption">
                                    WhatsApp y SMS aparecen deshabilitados hasta que el servicio este configurado.
                                </Typography>
                            </Alert>
                        )}
                    </Paper>

                    {/* Vista previa */}
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2 }}>
                            Vista previa
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip label={prioridad} size="small" sx={prioridadChipSx(prioridad)} />
                            {canalesElegidos.map((cid) => (
                                <Chip key={cid} label={canalPorId(cid).etiqueta} size="small"
                                    sx={{ bgcolor: '#E4EEF5', color: 'primary.main', fontWeight: 600 }} />
                            ))}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {titulo.trim() || <span style={{ color: '#9CA3AF' }}>Titulo del comunicado</span>}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                            {mensaje.trim() || 'Aqui aparecera el mensaje del comunicado.'}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Destinatarios: <strong>{grupo?.etiqueta}</strong> ({grupo?.count})
                        </Typography>
                        {adjunto && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Adjunto: <strong>{adjunto.name}</strong>
                            </Typography>
                        )}
                    </Paper>
                </Box>
            </Box>

            {/* Botones de accion */}
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap', mt: 2 }}>
                <Button variant="outlined" startIcon={<SaveIcon />} onClick={guardarBorrador}
                    sx={{ color: '#1a2733', borderColor: '#cdd8e3', width: { xs: '100%', md: 'auto' } }}>
                    Guardar borrador
                </Button>
                <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={abrirVistaPrevia}
                    sx={{ color: '#1a2733', borderColor: '#cdd8e3', width: { xs: '100%', md: 'auto' } }}>
                    Vista previa
                </Button>
                <Button variant="contained" startIcon={<SendIcon />} onClick={enviarComunicado}
                    disabled={!puedeEnviar}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    {programarAhora === 'programar' ? 'Programar envio' : 'Enviar comunicado'}
                </Button>
            </Box>

            <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: '100%' }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </DashboardLayout>
    );
}