import { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Chip, Select, MenuItem, TextField,
    Checkbox, FormControlLabel, InputAdornment, Alert, Snackbar, Divider,
    Collapse, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    List, ListItemButton, ListItemIcon, ListItemText,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import GroupsIcon from '@mui/icons-material/Groups';
import ScheduleIcon from '@mui/icons-material/Schedule';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SmsIcon from '@mui/icons-material/Sms';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    CANALES, PRIORIDADES,
    gruposDestinatarios, grupoPorId, canalPorId, canalEstaDisponible,
    personasDeGrupo, enviarComunicado, programarComunicado,
    guardarBorrador, eliminarBorrador, BORRADORES_MOCK,
} from '../../constants/comunicadosMock';

const iconoCanal = (id) => {
    if (id === 'app') return <NotificationsActiveIcon />;
    if (id === 'correo') return <EmailIcon />;
    if (id === 'whatsapp') return <WhatsAppIcon />;
    if (id === 'sms') return <SmsIcon />;
    return <NotificationsActiveIcon />;
};

export default function Elaborar() {
    const navigate = useNavigate();
    const location = useLocation();

    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    // Si llegamos con un borrador cargado desde "Borradores", lo usamos como estado inicial.
    const borradorInicial = location.state?.borrador ?? null;

    const [borradorId, setBorradorId] = useState(borradorInicial?.id ?? null);
    const [titulo, setTitulo] = useState(borradorInicial?.titulo ?? '');
    const [destinatarioId, setDestinatarioId] = useState(borradorInicial?.destinatarioId ?? 'todos');
    const [destinatariosEspecificos, setDestinatariosEspecificos] = useState(borradorInicial?.destinatariosEspecificos ?? []);
    const [mostrarGranular, setMostrarGranular] = useState((borradorInicial?.destinatariosEspecificos ?? []).length > 0);
    const [prioridad, setPrioridad] = useState(borradorInicial?.prioridad ?? 'Importante');
    const [mensaje, setMensaje] = useState(borradorInicial?.mensaje ?? '');
    const [adjunto, setAdjunto] = useState(null);
    const [previewAdjunto, setPreviewAdjunto] = useState(false);
    const [canalesSel, setCanalesSel] = useState(() => {
        const base = { app: true, correo: false, whatsapp: false, sms: false };
        (borradorInicial?.canalesIds ?? []).forEach((c) => { base[c] = true; });
        return borradorInicial ? base : { app: true, correo: true, whatsapp: false, sms: false };
    });
    const [programarAhora, setProgramarAhora] = useState('ahora');
    const [fechaProgramada, setFechaProgramada] = useState('');

    // URL del adjunto para preview (se regenera cuando cambia el archivo)
    const adjuntoUrl = useMemo(() => (adjunto ? URL.createObjectURL(adjunto) : null), [adjunto]);
    useEffect(() => () => { if (adjuntoUrl) URL.revokeObjectURL(adjuntoUrl); }, [adjuntoUrl]);

    const grupos = useMemo(() => gruposDestinatarios(), []);
    const grupo = grupoPorId(destinatarioId);
    const personas = useMemo(() => personasDeGrupo(destinatarioId), [destinatarioId]);

    const canalesElegidos = Object.entries(canalesSel).filter(([, v]) => v).map(([k]) => k);
    const puedeEnviar = titulo.trim() && mensaje.trim() && canalesElegidos.length > 0
        && (programarAhora === 'ahora' || fechaProgramada);
    const cantidadFinal = destinatariosEspecificos.length > 0 ? destinatariosEspecificos.length : (grupo?.count ?? 0);

    // Si el usuario cambia de grupo, reseteamos la seleccion granular (los IDs no aplican).
    useEffect(() => {
        setDestinatariosEspecificos([]);
    }, [destinatarioId]);

    const toggleCanal = (id) => {
        if (!canalEstaDisponible(id)) return;
        setCanalesSel((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const togglePersona = (idP) => {
        setDestinatariosEspecificos((prev) =>
            prev.includes(idP) ? prev.filter((x) => x !== idP) : [...prev, idP]
        );
    };
    const seleccionarTodos = () => setDestinatariosEspecificos(personas.map((p) => p.id));
    const seleccionarNinguno = () => setDestinatariosEspecificos([]);

    const limpiarFormulario = () => {
        setBorradorId(null);
        setTitulo(''); setDestinatarioId('todos'); setDestinatariosEspecificos([]);
        setMostrarGranular(false);
        setPrioridad('Importante'); setMensaje(''); setAdjunto(null);
        setCanalesSel({ app: true, correo: true, whatsapp: false, sms: false });
        setProgramarAhora('ahora'); setFechaProgramada('');
    };

    const onGuardarBorrador = () => {
        if (!titulo.trim()) {
            setSnack({ open: true, msg: 'Agregale un titulo al borrador', sev: 'warning' });
            return;
        }
        const b = guardarBorrador({
            id: borradorId, titulo: titulo.trim(), mensaje: mensaje.trim(),
            destinatarioId, destinatariosEspecificos,
            canalesIds: canalesElegidos, prioridad, adjunto,
        });
        setBorradorId(b.id);
        setSnack({ open: true, msg: `Borrador "${b.titulo}" guardado (${b.id})`, sev: 'success' });
    };

    const onEnviar = () => {
        if (!puedeEnviar) {
            setSnack({ open: true, msg: 'Completa titulo, mensaje y al menos un canal', sev: 'warning' });
            return;
        }
        const esProgramado = programarAhora === 'programar';
        const data = {
            titulo: titulo.trim(), mensaje: mensaje.trim(),
            destinatarioId, destinatariosEspecificos,
            canalesIds: canalesElegidos, prioridad, adjunto,
        };
        let c;
        if (esProgramado) {
            c = programarComunicado({ ...data, fechaProgramada: new Date(fechaProgramada).toISOString() });
        } else {
            c = enviarComunicado(data);
        }
        // Si venia de un borrador, lo eliminamos.
        if (borradorId) eliminarBorrador(borradorId);

        const msg = esProgramado
            ? `Comunicado ${c.id} programado para ${new Date(fechaProgramada).toLocaleString('es-BO')}`
            : `Comunicado ${c.id} enviado a ${cantidadFinal} destinatarios`;
        setSnack({ open: true, msg, sev: 'success' });
        limpiarFormulario();
        setTimeout(() => navigate('/comunicados/enviados'), 1200);
    };

    const onAttach = (e) => {
        const f = e.target.files?.[0];
        if (f) setAdjunto(f);
    };
    const quitarAdjunto = () => setAdjunto(null);

    const esPDF = adjunto?.type === 'application/pdf';
    const esImg = adjunto?.type?.startsWith('image/');
    const puedePreview = esPDF || esImg;

    return (
        <DashboardLayout>
            {/* Encabezado */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                    <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Elaborar comunicado</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Redacta, guarda o envia avisos por los canales disponibles.
                    </Typography>
                </Box>
                {BORRADORES_MOCK.length > 0 && (
                    <Button variant="outlined" onClick={() => navigate('/comunicados/borradores')}
                        sx={{ color: '#1a2733', borderColor: '#cdd8e3' }}>
                        Ver borradores ({BORRADORES_MOCK.length})
                    </Button>
                )}
            </Box>

            {borradorId && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Estas editando el borrador <strong>{borradorId}</strong>. Al enviarlo se eliminara del listado de borradores.
                </Alert>
            )}

            {/* Dos columnas: formulario (ancho) + canales (angosta) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
                {/* COLUMNA IZQUIERDA — Contenido */}
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2 }}>
                        Contenido del comunicado
                    </Typography>

                    {/* Titulo */}
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>
                        Titulo <span style={{ color: '#D9534F' }}>*</span>
                    </Typography>
                    <TextField fullWidth size="small" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Ej. Mantenimiento programado del ascensor" sx={{ mb: 2 }} />

                    {/* Destinatarios (dropdown principal) */}
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>
                        Destinatarios <span style={{ color: '#D9534F' }}>*</span>
                    </Typography>
                    <Select fullWidth size="small" value={destinatarioId} onChange={(e) => setDestinatarioId(e.target.value)}
                        startAdornment={<InputAdornment position="start"><GroupsIcon fontSize="small" /></InputAdornment>}
                        sx={{ mb: 0.5 }}>
                        {grupos.map((g) => (
                            <MenuItem key={g.id} value={g.id} disabled={g.count === 0}>
                                {g.etiqueta} <span style={{ opacity: 0.6, marginLeft: 6 }}>({g.count})</span>
                            </MenuItem>
                        ))}
                    </Select>
                    {grupo && (
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            {grupo.descripcion}
                        </Typography>
                    )}

                    {/* Toggle "Elegir destinatarios especificos" + lista granular */}
                    <Button size="small" onClick={() => setMostrarGranular((v) => !v)}
                        endIcon={mostrarGranular ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        sx={{ mb: 1, color: 'primary.main' }}>
                        {mostrarGranular ? 'Ocultar seleccion por persona' : 'Elegir destinatarios especificos'}
                    </Button>
                    <Collapse in={mostrarGranular}>
                        <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: '#F8FAFC' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {destinatariosEspecificos.length === 0
                                        ? `Se enviara a los ${grupo?.count ?? 0} del grupo completo`
                                        : `Seleccionados ${destinatariosEspecificos.length} de ${personas.length}`}
                                </Typography>
                                <Box>
                                    <Button size="small" onClick={seleccionarTodos}>Todos</Button>
                                    <Button size="small" onClick={seleccionarNinguno}>Ninguno</Button>
                                </Box>
                            </Box>
                            <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
                                {personas.length === 0 && (
                                    <Typography variant="caption" color="text.secondary" sx={{ p: 1 }}>
                                        Este grupo no tiene miembros disponibles.
                                    </Typography>
                                )}
                                {personas.map((p) => {
                                    const marcado = destinatariosEspecificos.includes(p.id);
                                    return (
                                        <FormControlLabel key={p.id}
                                            control={<Checkbox size="small" checked={marcado} onChange={() => togglePersona(p.id)} />}
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2">{p.nombre}</Typography>
                                                    {p.detalle && <Chip size="small" label={p.detalle} sx={{ bgcolor: '#E4EEF5', color: 'primary.main', fontSize: 11 }} />}
                                                </Box>
                                            }
                                            sx={{ display: 'block', ml: 0 }}
                                        />
                                    );
                                })}
                            </Box>
                        </Paper>
                    </Collapse>

                    {/* Prioridad (ahora va debajo de destinatarios) */}
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Prioridad</Typography>
                    <Select fullWidth size="small" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}
                        sx={{ mb: 2, maxWidth: 240 }}>
                        {PRIORIDADES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>

                    {/* Mensaje */}
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

                    {/* Adjunto con preview */}
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Archivo adjunto</Typography>
                    {!adjunto && (
                        <Button variant="outlined" component="label" startIcon={<AttachFileIcon />}
                            sx={{ color: '#1a2733', borderColor: '#cdd8e3', mb: 2 }}>
                            Adjuntar archivo
                            <input hidden type="file" onChange={onAttach} />
                        </Button>
                    )}
                    {adjunto && (
                        <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <AttachFileIcon color="primary" />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {adjunto.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {(adjunto.size / 1024).toFixed(0)} KB · {adjunto.type || 'tipo desconocido'}
                                </Typography>
                            </Box>
                            {puedePreview && (
                                <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setPreviewAdjunto(true)}>
                                    Ver
                                </Button>
                            )}
                            <IconButton size="small" onClick={quitarAdjunto} aria-label="Quitar adjunto">
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Paper>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Programacion */}
                    <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#E4EEF5' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <ScheduleIcon fontSize="small" sx={{ color: 'primary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>Programacion</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Enviar ahora o programar fecha y hora. El sistema revisa los programados cada 10 segundos.
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

                {/* COLUMNA DERECHA — Canales (solo) */}
                <Box>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2 }}>
                            Canales de envio
                        </Typography>
                        {CANALES.map((c) => {
                            const disp = canalEstaDisponible(c.id);
                            const sel = canalesSel[c.id];
                            const esFuncional = c.estado === 'disponible';
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
                                        <Typography variant="caption" color={esFuncional ? '#2E9D78' : 'text.secondary'}>
                                            {esFuncional && 'Activo'}
                                            {c.estado === 'pendiente-backend' && 'Pendiente de backend'}
                                            {c.estado === 'no configurado' && 'No configurado'}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                        <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', fontSize: 12 }}>
                            Hoy solo el canal <strong>App</strong> envia de verdad (campanita in-app). Correo y WhatsApp se activaran cuando el equipo backend los integre.
                        </Alert>
                    </Paper>

                    {/* Resumen rapido */}
                    <Paper sx={{ p: 2, borderRadius: 2, mt: 2, bgcolor: '#F8FAFC' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#132B3E' }}>Resumen</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Llega a <strong>{cantidadFinal}</strong> destinatarios por {canalesElegidos.length} canal{canalesElegidos.length !== 1 ? 'es' : ''}.
                        </Typography>
                        {programarAhora === 'programar' && fechaProgramada && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Programado para <strong>{new Date(fechaProgramada).toLocaleString('es-BO')}</strong>
                            </Typography>
                        )}
                    </Paper>
                </Box>
            </Box>

            {/* Botones de accion */}
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap', mt: 2 }}>
                <Button variant="outlined" startIcon={<SaveIcon />} onClick={onGuardarBorrador}
                    sx={{ color: '#1a2733', borderColor: '#cdd8e3', width: { xs: '100%', md: 'auto' } }}>
                    Guardar borrador
                </Button>
                <Button variant="contained" startIcon={<SendIcon />} onClick={onEnviar}
                    disabled={!puedeEnviar}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    {programarAhora === 'programar' ? 'Programar envio' : 'Enviar comunicado'}
                </Button>
            </Box>

            {/* Modal de preview del adjunto */}
            <Dialog open={previewAdjunto} onClose={() => setPreviewAdjunto(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Vista previa — {adjunto?.name}
                    <IconButton onClick={() => setPreviewAdjunto(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ minHeight: 500, p: 0 }}>
                    {esPDF && adjuntoUrl && (
                        <iframe src={adjuntoUrl} title="preview" style={{ width: '100%', height: '70vh', border: 0 }} />
                    )}
                    {esImg && adjuntoUrl && (
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                            <img src={adjuntoUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '70vh' }} />
                        </Box>
                    )}
                    {!puedePreview && (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                No hay vista previa disponible para este tipo de archivo.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewAdjunto(false)}>Cerrar</Button>
                </DialogActions>
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