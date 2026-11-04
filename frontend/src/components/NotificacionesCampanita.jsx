import { useState } from 'react';
import {
    Box, IconButton, Badge, Popover, Typography, Divider, List, ListItemButton,
    Button, Chip, Tooltip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CampaignIcon from '@mui/icons-material/Campaign';
import InfoIcon from '@mui/icons-material/Info';
import CircleIcon from '@mui/icons-material/Circle';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useNavigate } from 'react-router-dom';
import { useNotificaciones } from '../hooks/useNotificaciones';
import { tiempoRelativo } from '../constants/notificacionesMock';

const iconoNotificacion = (tipo) => {
    if (tipo === 'comunicado') return <CampaignIcon />;
    return <InfoIcon />;
};

const prioridadColor = (p) => {
    if (p === 'Urgente') return '#D9534F';
    if (p === 'Importante') return '#B6802A';
    return '#2E9D78';
};

export default function NotificacionesCampanita() {
    const navigate = useNavigate();
    const { notificaciones, noLeidas, marcarLeida, marcarTodas, usuario } = useNotificaciones();
    const [anchorEl, setAnchorEl] = useState(null);

    // Si no hay usuario logueado, la campanita no aparece.
    if (!usuario) return null;

    const abrir = (e) => setAnchorEl(e.currentTarget);
    const cerrar = () => setAnchorEl(null);
    const abierto = Boolean(anchorEl);

    const uid = usuario.id ?? usuario.nombre ?? usuario.rol;

    const onClickNoti = (n) => {
        marcarLeida(n.id);
        cerrar();
        if (n.ruta) {
            // Si la notificacion viene de un comunicado, pasamos su ID para que la pantalla
            // Enviados abra directamente el modal de detalle con el mensaje y el adjunto.
            const state = n.comunicadoId ? { verDetalle: n.comunicadoId } : undefined;
            navigate(n.ruta, { state });
        }
    };

    return (
        <>
            <Tooltip title="Notificaciones">
                <IconButton onClick={abrir} sx={{ color: 'text.secondary' }}>
                    <Badge badgeContent={noLeidas} color="error" overlap="circular">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Popover
                open={abierto}
                anchorEl={anchorEl}
                onClose={cerrar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                    paper: {
                        sx: {
                            width: { xs: '92vw', sm: 400 },
                            maxHeight: { xs: '70vh', sm: 500 },
                            borderRadius: 2,
                            mt: 1,
                        },
                    },
                }}
            >
                {/* Header */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#132B3E' }}>
                            Notificaciones
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {noLeidas > 0 ? `${noLeidas} sin leer` : 'Al dia'}
                        </Typography>
                    </Box>
                    {noLeidas > 0 && (
                        <Button size="small" startIcon={<DoneAllIcon />} onClick={marcarTodas}
                            sx={{ color: 'primary.main' }}>
                            Marcar todas
                        </Button>
                    )}
                </Box>
                <Divider />

                {/* Lista */}
                {notificaciones.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <NotificationsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            No tienes notificaciones nuevas.
                        </Typography>
                    </Box>
                ) : (
                    <List disablePadding sx={{ overflowY: 'auto', maxHeight: { xs: '55vh', sm: 400 } }}>
                        {notificaciones.map((n) => {
                            const leida = n.leidaPor.includes(uid);
                            return (
                                <ListItemButton key={n.id} onClick={() => onClickNoti(n)}
                                    sx={{
                                        alignItems: 'flex-start', py: 1.5, px: 2, gap: 1.5,
                                        bgcolor: leida ? 'transparent' : '#F3F8FC',
                                        '&:hover': { bgcolor: leida ? 'rgba(0,0,0,0.04)' : '#E4EEF5' },
                                    }}>
                                    {/* Icono */}
                                    <Box sx={{ color: prioridadColor(n.prioridad), mt: 0.5 }}>
                                        {iconoNotificacion(n.tipo)}
                                    </Box>
                                    {/* Contenido */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        {/* Titulo + punto no-leida */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Typography variant="body2" sx={{ fontWeight: leida ? 500 : 700, color: '#132B3E', flex: 1 }}>
                                                {n.titulo}
                                            </Typography>
                                            {!leida && <CircleIcon sx={{ fontSize: 8, color: '#1F5F8B' }} />}
                                        </Box>
                                        {/* Mensaje (hasta 2 lineas) */}
                                        <Typography variant="body2" sx={{
                                            color: 'text.secondary', fontSize: 13, lineHeight: 1.4, mb: 0.5,
                                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden', whiteSpace: 'normal',
                                        }}>
                                            {n.mensaje}
                                        </Typography>
                                        {/* Meta: tiempo + prioridad */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {tiempoRelativo(n.fecha)}
                                            </Typography>
                                            {n.prioridad && n.prioridad !== 'Normal' && (
                                                <Chip label={n.prioridad} size="small"
                                                    sx={{ bgcolor: '#FDF0D5', color: prioridadColor(n.prioridad), height: 18, fontSize: 10 }} />
                                            )}
                                        </Box>
                                    </Box>
                                </ListItemButton>
                            );
                        })}
                    </List>
                )}

                {notificaciones.length > 0 && (
                    <>
                        <Divider />
                        <Box sx={{ p: 1, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                                Las notificaciones se actualizan cada 10 segundos.
                            </Typography>
                        </Box>
                    </>
                )}
            </Popover>
        </>
    );
}