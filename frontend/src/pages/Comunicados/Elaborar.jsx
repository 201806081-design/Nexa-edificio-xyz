import { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Chip, Select, MenuItem, TextField,
    Checkbox, FormControlLabel, Radio, RadioGroup, InputAdornment, Alert,
    Snackbar, Divider, Collapse, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions,
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
import DeleteIcon from '@mui/icons-material/Delete';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
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

// Texto del radio "enviar a todos" segun el grupo elegido (en lugar del generico "del grupo").
const etiquetaTodosGrupo = (grupo) => {
    if (!grupo) return 'Enviar a todos';
    const n = grupo.count;
    switch (grupo.id) {
        case 'todos': return `Enviar a los ${n} copropietarios`;
        case 'morosos': return n === 1 ? 'Enviar al moroso' : `Enviar a los ${n} morosos`;
        case 'personal': return `Enviar a todo el personal del edificio (${n})`;
        case 'directorio': return n === 1 ? 'Enviar al directorio' : `Enviar a los ${n} miembros del directorio`;
        case 'admins': return n === 1 ? 'Enviar al administrador del sistema' : `Enviar a los ${n} administradores del sistema`;
        default:
            if (grupo.id.startsWith('piso-')) return `Enviar a todos los del piso ${grupo.id.slice(5)} (${n})`;
            return `Enviar a todos los ${n} del grupo`;
    }
};

export default function Elaborar() {
    const navigate = useNavigate();
    const location = useLocation();

    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    // Si llegamos con un borrador cargado desde "Borradores", lo usamos como estado inicial.
    const borradorInicial = location.state?.borrador ?? null;

    // Si llegamos desde "Compartir QR" (RegistrarPago / RegistrarAnticipo), prefill con QR.
    const qrInicial = borradorInicial?.qrData || location.state?.qrData || '';
    const qrTituloInicial = borradorInicial?.qrTitulo || location.state?.qrTitulo || '';
    const deptoPreseleccionado = location.state?.deptoPreseleccionado ?? null;

    const [borradorId, setBorradorId] = useState(borradorInicial?.id ?? null);
    const [titulo, setTitulo] = useState(
        borradorInicial?.titulo ?? location.state?.titulo ?? ''
    );
    const [destinatarioId, setDestinatarioId] = useState(borradorInicial?.destinatarioId ?? 'todos');
    const [destinatariosEspecificos, setDestinatariosEspecificos] = useState(() => {
        if (borradorInicial?.destinatariosEspecificos) return borradorInicial.destinatariosEspecificos;
        if (deptoPreseleccionado) return [deptoPreseleccionado];
        return [];
    });
    const [mostrarGranular, setMostrarGranular] = useState(
        (borradorInicial?.destinatariosEspecificos ?? []).length > 0 || !!deptoPreseleccionado
    );
    const [prioridad, setPrioridad] = useState(
        borradorInicial?.prioridad ?? location.state?.prioridad ?? 'Importante'
    );
    const [mensaje, setMensaje] = useState(
        borradorInicial?.mensaje ?? location.state?.mensaje ?? ''
    );
    const [qrData, setQrData] = useState(qrInicial);
    const [qrTitulo, setQrTitulo] = useState(qrTituloInicial);
    // Si el borrador tenia un archivo adjunto, se recupera (vive en memoria mientras la pagina este abierta)
    const [adjunto, setAdjunto] = useState(borradorInicial?.adjunto?.file ?? null);
    const [previewAdjunto, setPreviewAdjunto] = useState(false);
    // Arranca solo con App tildado. Si venimos de un borrador, respetamos sus canales,
    // pero filtramos los que ya no son seleccionables (ej. correo si el backend lo deshabilita).
    const [canalesSel, setCanalesSel] = useState(() => {
        const base = { app: true, correo: false, whatsapp: false, sms: false };
        if (borradorInicial?.canalesIds) {
            // Resetear app a false si el borrador no lo tenia
            base.app = false;
            borradorInicial.canalesIds.forEach((c) => {
                if (canalEstaDisponible(c)) base[c] = true;
            });
        }
        return base;
    });
    const [programarAhora, setProgramarAhora] = useState(borradorInicial?.programarAhora ?? 'ahora');
    const [fechaProgramada, setFechaProgramada] = useState(borradorInicial?.fechaProgramada ?? '');

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

    // Al cambiar de grupo A MANO se limpia la seleccion granular (los IDs no aplican).
    // Se hace en el onChange y no con un useEffect: con <StrictMode> React ejecuta los
    // efectos dos veces al montar y borraba la persona preseleccionada desde el QR.
    const cambiarGrupo = (id) => {
        setDestinatarioId(id);
        setDestinatariosEspecificos([]);
    };

    // Limpiamos el location.state despues del primer render para que no re-aplique al refresh
    useEffect(() => {
        if (borradorInicial || deptoPreseleccionado || qrInicial || location.state?.titulo) {
            window.history.replaceState({}, '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        setQrData(''); setQrTitulo('');
        setCanalesSel({ app: true, correo: true, whatsapp: false, sms: false });
        setProgramarAhora('ahora'); setFechaProgramada('');
    };

    const quitarQR = () => {
        setQrData('');
        setQrTitulo('');
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
            qrData, qrTitulo, programarAhora, fechaProgramada,
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

            {qrData && (
                <Alert severity="success" icon={false} sx={{ mb: 2, bgcolor: '#E4F4EE', color: '#2E7D5B' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        ✓ Se incluira un QR de pago en este comunicado
                    </Typography>
                    <Typography variant="body2">
                        El destinatario lo recibira junto con el mensaje para efectuar el pago.
                    </Typography>
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
                    <Select fullWidth size="small" value={destinatarioId} onChange={(e) => cambiarGrupo(e.target.value)}
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

                    {/* Selector granular: siempre visible, con opcion "todos" o "especificos" */}
                    <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: '#F8FAFC' }}>
                        <RadioGroup
                            value={mostrarGranular ? 'especificos' : 'todos'}
                            onChange={(e) => {
                                const esEsp = e.target.value === 'especificos';
                                setMostrarGranular(esEsp);
                                if (!esEsp) setDestinatariosEspecificos([]);
                            }}
                        >
                            <FormControlLabel value="todos" control={<Radio size="small" />}
                                label={<Typography variant="body2">{etiquetaTodosGrupo(grupo)}</Typography>} />
                            <FormControlLabel value="especificos" control={<Radio size="small" />}
                                label={<Typography variant="body2">Seleccionar destinatarios especificos</Typography>} />
                        </RadioGroup>

                        <Collapse in={mostrarGranular}>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Seleccionados <strong>{destinatariosEspecificos.length}</strong> de {personas.length}
                                </Typography>
                                <Box>
                                    <Button size="small" onClick={seleccionarTodos}>Todos</Button>
                                    <Button size="small" onClick={seleccionarNinguno}>Ninguno</Button>
                                </Box>
                            </Box>
                            <Box sx={{ maxHeight: 220, overflowY: 'auto', bgcolor: '#fff', borderRadius: 1, border: '1px solid #E4E7EB' }}>
                                {personas.length === 0 && (
                                    <Typography variant="caption" color="text.secondary" sx={{ p: 1.5, display: 'block' }}>
                                        Este grupo no tiene miembros disponibles.
                                    </Typography>
                                )}
                                {personas.map((p) => {
                                    const marcado = destinatariosEspecificos.includes(p.id);
                                    return (
                                        <Box key={p.id} onClick={() => togglePersona(p.id)}
                                            sx={{
                                                display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5,
                                                cursor: 'pointer', borderBottom: '1px solid #F3F6FA',
                                                '&:last-child': { borderBottom: 0 },
                                                '&:hover': { bgcolor: '#F8FAFC' },
                                            }}>
                                            <Checkbox size="small" checked={marcado}
                                                onChange={() => togglePersona(p.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                sx={{ p: 0.5 }} />
                                            <Typography variant="body2" sx={{ flex: 1 }}>{p.nombre}</Typography>
                                            {p.detalle && (
                                                <Chip size="small" label={p.detalle}
                                                    sx={{ bgcolor: '#E4EEF5', color: 'primary.main', fontSize: 11 }} />
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Collapse>
                    </Paper>

                    {/* Prioridad (ahora va debajo de destinatarios) */}
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Prioridad</Typography>
                    <Select fullWidth size="small" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}
                        sx={{ mb: 2, maxWidth: 240 }}>
                        {PRIORIDADES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>

                    {/* QR del pago — bloque visual que se enviara junto con el comunicado */}
                    {qrData && (
                        <Box sx={{ mb: 2, bgcolor: '#F8FAFC', border: '1px solid #CFDCEA', borderRadius: 2, p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                                <QrCode2Icon sx={{ color: 'primary.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>
                                    QR de pago incluido en el comunicado
                                </Typography>
                                <IconButton size="small" onClick={quitarQR} aria-label="Quitar QR">
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            {qrTitulo && (
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', mb: 1.5 }}>
                                    {qrTitulo}
                                </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                <Box sx={{ bgcolor: '#fff', p: 1.5, borderRadius: 2, border: '1px solid #E4E7EB' }}>
                                    <QRCodeSVG value={qrData} size={180} level="M" />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 180 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                        El QR se adjuntara al mensaje. El destinatario podra escanearlo desde su app bancaria
                                        para efectuar el pago.
                                    </Typography>
                                    <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', fontSize: 12, mt: 1 }}>
                                        <Typography variant="caption">
                                            <strong>QR mock:</strong> no realiza el pago real. Cuando el backend integre la API bancaria,
                                            este QR se reemplazara por el dinamico del banco.
                                        </Typography>
                                    </Alert>
                                </Box>
                            </Box>
                        </Box>
                    )}

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
                            Los destinatarios recibiran el aviso por cada canal seleccionado.
                        </Alert>
                    </Paper>

                    {/* Resumen rapido */}
                    <Paper sx={{ p: 2, borderRadius: 2, mt: 2, bgcolor: '#F8FAFC' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#132B3E' }}>Resumen</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Llega a <strong>{cantidadFinal}</strong> destinatarios por {canalesElegidos.length} canal{canalesElegidos.length !== 1 ? 'es' : ''}.
                        </Typography>
                        {qrData && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                Incluye <strong>QR de pago</strong>.
                            </Typography>
                        )}
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