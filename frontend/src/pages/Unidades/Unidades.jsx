import { useState } from 'react';
import {
    Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
    Button, Chip, Paper, IconButton, Divider, Alert, Tooltip,
    ToggleButton, ToggleButtonGroup,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HistoryIcon from '@mui/icons-material/History';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PlaceIcon from '@mui/icons-material/Place';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { UNIDADES_MOCK, CATEGORIAS_DEPTO, eliminarUnidad } from '../../constants/unidadesMock';
import { nombreCompleto } from '../../constants/copropietariosMock';
import {
    TIPO_DEPTO_POR_CATEGORIA, tipoDeptoDe, renombrarTiposDepartamento, personaPorId, estadoDepto,
    estadoAnexo, usuarioDeAnexo,
} from '../../constants/edificioMock';
import { EXPENSA_BASE } from '../../constants/configuracionMock';
import { formatBs } from '../../constants/finanzasMock';

const PESTANAS = ['Todas', 'Departamentos', 'Parqueos', 'Bauleras'];
const PESTANA_A_TIPO = { Departamentos: 'Departamento', Parqueos: 'Parqueo', Bauleras: 'Baulera' };

// Color del chip segun el tipo de unidad
function chipSx(tipo) {
    if (tipo === 'Departamento') return { bgcolor: '#D6F0E4', color: '#2E9D78' };
    if (tipo === 'Parqueo') return { bgcolor: '#C5E0F2', color: '#1F5F8B' };
    return { bgcolor: '#FCE7CB', color: '#C06E00' }; // Baulera (naranja)
}

const tipoDepto = (u) => (u.tipo === 'Departamento' ? `Tipo ${u.categoria} · ${tipoDeptoDe(u)}` : 'No aplica');
const ubicacion = (u) => (u.tipo === 'Departamento' ? `Piso ${u.piso}` : u.nivel);

// Asociacion: en deptos el propietario y el inquilino; en parqueos y bauleras su depto y quien lo usa
function personaAsociada(u) {
    if (u.tipo !== 'Departamento') {
        const depto = UNIDADES_MOCK.find((d) => d.id === u.deptoId);
        if (!depto) return 'Sin asociación';
        const usuario = usuarioDeAnexo(u);
        return usuario ? `${depto.identificador} · ${nombreCompleto(usuario)}` : depto.identificador;
    }
    const partes = [
        u.propietarioId && `${nombreCompleto(personaPorId(u.propietarioId))} (propietario)`,
        u.inquilinoId && `${nombreCompleto(personaPorId(u.inquilinoId))} (inquilino)`,
    ].filter(Boolean);
    return partes.length ? partes.join(' · ') : 'Sin asociación';
}

// Estado debajo de la asociacion: "Alquilado", "Disponible para alquilar", "En uso", "Libre"...
function Asociacion({ unidad }) {
    return (
        <>
            <Typography variant="body2">{personaAsociada(unidad)}</Typography>
            <Typography variant="caption" color="text.secondary">
                {unidad.tipo === 'Departamento' ? estadoDepto(unidad) : estadoAnexo(unidad)}
            </Typography>
        </>
    );
}

export default function Unidades() {
    const navigate = useNavigate();
    const location = useLocation();
    const [aviso, setAviso] = useState(() => (location.state?.mensaje ? { tipo: 'success', texto: location.state.mensaje } : null));
    const [pestana, setPestana] = useState('Todas');
    const [, setTick] = useState(0);
    const refrescar = () => setTick((t) => t + 1);

    const unidades = pestana === 'Todas'
        ? UNIDADES_MOCK
        : UNIDADES_MOCK.filter((u) => u.tipo === PESTANA_A_TIPO[pestana]);

    const verHistorial = (id) => navigate(`/unidades/historial?departamento=${id}`);
    const verDetalle = (id) => navigate(`/unidades/${id}`);
    const editar = (id) => navigate(`/unidades/${id}/editar`);

    // --- Eliminar unidad ---
    const [eliminando, setEliminando] = useState(null);
    const confirmarEliminar = () => {
        // MOCK: se elimina de la lista. Con backend, aqui iria el DELETE.
        const error = eliminarUnidad(eliminando.id);
        setAviso(error ? { tipo: 'error', texto: error } : { tipo: 'success', texto: `${eliminando.identificador} fue eliminada` });
        setEliminando(null);
        refrescar();
    };

    // --- Tipos de departamento: las categorias A/B/C son fijas, solo se cambia su nombre ---
    const [tiposAbierto, setTiposAbierto] = useState(false);
    const [nombresTipo, setNombresTipo] = useState({});
    const [errorTipo, setErrorTipo] = useState('');
    const abrirTipos = () => { setNombresTipo({ ...TIPO_DEPTO_POR_CATEGORIA }); setErrorTipo(''); setTiposAbierto(true); };
    const guardarTipos = () => {
        const error = renombrarTiposDepartamento(nombresTipo);
        if (error) { setErrorTipo(error); return; }
        setTiposAbierto(false);
        setAviso({ tipo: 'success', texto: 'Tipos de departamento actualizados' });
        refrescar();
    };

    return (
        <DashboardLayout>
            <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>
                Unidades del edificio
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Consulta los departamentos, parqueos y bauleras registrados
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexDirection: { xs: 'column', md: 'row' }, mb: 2 }}>
                <Button variant="outlined" startIcon={<CategoryIcon />} onClick={abrirTipos}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Tipos de departamento
                </Button>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/unidades/registrar')}
                    sx={{ width: { xs: '100%', md: 'auto' } }}
                >
                    Registrar unidad
                </Button>
            </Box>

            {aviso && <Alert severity={aviso.tipo} onClose={() => setAviso(null)} sx={{ mb: 2 }}>{aviso.texto}</Alert>}

            {/* Pestañas de filtro por tipo: barra segmentada (como el mockup) */}
            <ToggleButtonGroup
                exclusive
                fullWidth
                value={pestana}
                onChange={(e, v) => v && setPestana(v)}
                sx={{
                    mb: 2,
                    bgcolor: '#fff',
                    '& .MuiToggleButton-root': {
                        textTransform: 'none',
                        fontWeight: 600,
                        color: '#1F5F8B',
                        borderColor: '#cdd8e3',
                        py: 1.1,
                        px: { xs: 0.5, md: 1 },
                        fontSize: { xs: '0.72rem', md: '0.85rem' },
                    },
                    '& .MuiToggleButton-root.Mui-selected': {
                        bgcolor: '#1F5F8B',
                        color: '#fff',
                        '&:hover': { bgcolor: '#1C4E70' },
                    },
                }}
            >
                {PESTANAS.map((p) => (
                    <ToggleButton key={p} value={p}>{p}</ToggleButton>
                ))}
            </ToggleButtonGroup>

            {/* VISTA ESCRITORIO: tabla */}
            <Paper sx={{ p: 2, borderRadius: 3, display: { xs: 'none', md: 'block' } }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Tipo</strong></TableCell>
                            <TableCell><strong>Identificador</strong></TableCell>
                            <TableCell><strong>Tipo de dpto</strong></TableCell>
                            <TableCell><strong>Ubicacion</strong></TableCell>
                            <TableCell><strong>Persona asociada</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {unidades.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell><Chip label={u.tipo} size="small" sx={chipSx(u.tipo)} /></TableCell>
                                <TableCell>{u.identificador}</TableCell>
                                <TableCell>{tipoDepto(u)}</TableCell>
                                <TableCell>{ubicacion(u)}</TableCell>
                                <TableCell><Asociacion unidad={u} /></TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Ver detalle">
                                        <IconButton color="primary" onClick={() => verDetalle(u.id)}>
                                            <VisibilityIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Editar">
                                        <IconButton color="primary" onClick={() => editar(u.id)}>
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    {u.tipo === 'Departamento' && (
                                        <IconButton color="primary" onClick={() => verHistorial(u.id)} title="Ver historial de ocupantes">
                                            <HistoryIcon />
                                        </IconButton>
                                    )}
                                    <Tooltip title="Eliminar">
                                        <IconButton color="error" onClick={() => setEliminando(u)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Mostrando {unidades.length} unidades
                </Typography>
            </Paper>

            {/* VISTA MOVIL: tarjetas */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {unidades.map((u) => (
                    <Paper key={u.id} sx={{ p: 2, borderRadius: 3, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography sx={{ fontWeight: 700 }}>{u.identificador}</Typography>
                            <Chip label={u.tipo} size="small" sx={chipSx(u.tipo)} />
                        </Box>
                        {u.tipo === 'Departamento' && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: 'text.secondary' }}>
                                <ApartmentIcon fontSize="small" color="primary" />
                                <Typography variant="body2">{tipoDepto(u)}</Typography>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: 'text.secondary' }}>
                            <PlaceIcon fontSize="small" color="primary" />
                            <Typography variant="body2">{ubicacion(u)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'text.secondary' }}>
                            <PersonIcon fontSize="small" color="primary" />
                            <Box><Asociacion unidad={u} /></Box>
                        </Box>
                        <Divider sx={{ mb: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                            <IconButton color="primary" onClick={() => verDetalle(u.id)} title="Ver detalle">
                                <VisibilityIcon />
                            </IconButton>
                            <IconButton color="primary" onClick={() => editar(u.id)} title="Editar">
                                <EditIcon />
                            </IconButton>
                            {u.tipo === 'Departamento' && (
                                <IconButton color="primary" onClick={() => verHistorial(u.id)} title="Ver historial de ocupantes">
                                    <HistoryIcon />
                                </IconButton>
                            )}
                            <IconButton color="error" onClick={() => setEliminando(u)} title="Eliminar">
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    </Paper>
                ))}
                <Typography variant="body2" color="text.secondary">
                    Mostrando {unidades.length} unidades
                </Typography>
            </Box>

            {/* Dialogo: tipos de departamento (solo se edita el nombre) */}
            <Dialog open={tiposAbierto} onClose={() => setTiposAbierto(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Tipos de departamento</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Hay tres tipos, uno por cada categoria de expensa. La categoria define cuanto paga el
                        departamento cada mes; aqui solo puedes cambiar el nombre de cada tipo.
                    </Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F3F6FA' }}>
                                <TableCell><strong>Categoria</strong></TableCell>
                                <TableCell><strong>Nombre del tipo</strong></TableCell>
                                <TableCell align="right"><strong>Expensa base</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {CATEGORIAS_DEPTO.map((c) => (
                                <TableRow key={c}>
                                    <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Tipo {c}</TableCell>
                                    <TableCell>
                                        <TextField size="small" fullWidth value={nombresTipo[c] ?? ''}
                                            slotProps={{ htmlInput: { maxLength: 40, 'aria-label': `Nombre del tipo ${c}` } }}
                                            onChange={(e) => { setNombresTipo((n) => ({ ...n, [c]: e.target.value })); setErrorTipo(''); }} />
                                    </TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatBs(EXPENSA_BASE[c] ?? 0)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {errorTipo && <Alert severity="error" sx={{ mt: 2 }}>{errorTipo}</Alert>}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setTiposAbierto(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={guardarTipos}>Guardar nombres</Button>
                </DialogActions>
            </Dialog>

            {/* Confirmar eliminar unidad */}
            <Dialog open={!!eliminando} onClose={() => setEliminando(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Eliminar unidad</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2">
                        Se eliminara <strong>{eliminando?.identificador}</strong>. Esta accion no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setEliminando(null)}>Cancelar</Button>
                    <Button variant="contained" color="error" onClick={confirmarEliminar}>Eliminar</Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}