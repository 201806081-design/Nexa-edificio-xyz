import { useState } from 'react';
import {
    Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
    Button, Chip, Paper, IconButton, Divider, Alert, Tooltip,
    ToggleButton, ToggleButtonGroup,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HistoryIcon from '@mui/icons-material/History';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PlaceIcon from '@mui/icons-material/Place';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { UNIDADES_MOCK } from '../../constants/unidadesMock';
import { COPROPIETARIOS_MOCK, nombreCompleto } from '../../constants/copropietariosMock';
import { TIPOS_DEPARTAMENTO, CATEGORIA_POR_TIPO, registrarTipoDepartamento } from '../../constants/edificioMock';
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

const tipoDepto = (u) => (u.tipo === 'Departamento' ? u.tipoDepartamento : 'No aplica');
const ubicacion = (u) => (u.tipo === 'Departamento' ? `Piso ${u.piso}` : u.nivel);

// Nombre del copropietario asociado (o texto por defecto si no tiene)
function personaAsociada(personaId) {
    const p = COPROPIETARIOS_MOCK.find((c) => c.id === personaId);
    return p ? nombreCompleto(p) : 'Sin asociación';
}

export default function Unidades() {
    const navigate = useNavigate();
    const location = useLocation();
    const mensaje = location.state?.mensaje; // alerta tras registrar
    const [pestana, setPestana] = useState('Todas');

    const unidades = pestana === 'Todas'
        ? UNIDADES_MOCK
        : UNIDADES_MOCK.filter((u) => u.tipo === PESTANA_A_TIPO[pestana]);

    const verHistorial = (id) => navigate(`/unidades/historial?departamento=${id}`);
    const verDetalle = (id) => navigate(`/unidades/${id}`);
    const editar = (id) => navigate(`/unidades/${id}/editar`);

    // --- Tipos de departamento (el administrador puede registrar nuevos) ---
    const [tiposAbierto, setTiposAbierto] = useState(false);
    const [nuevoTipo, setNuevoTipo] = useState({ nombre: '', categoria: '' });
    const [errorTipo, setErrorTipo] = useState('');
    const [, setTick] = useState(0);
    const guardarTipo = () => {
        const err = registrarTipoDepartamento(nuevoTipo.nombre, nuevoTipo.categoria);
        if (err) { setErrorTipo(err); return; }
        setNuevoTipo({ nombre: '', categoria: '' });
        setErrorTipo('');
        setTick((t) => t + 1);
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
                <Button variant="outlined" startIcon={<CategoryIcon />} onClick={() => setTiposAbierto(true)}
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

            {mensaje && <Alert severity="success" sx={{ mb: 2 }}>{mensaje}</Alert>}

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
                                <TableCell>{personaAsociada(u.personaId)}</TableCell>
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
                                <Typography variant="body2">{u.tipoDepartamento}</Typography>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: 'text.secondary' }}>
                            <PlaceIcon fontSize="small" color="primary" />
                            <Typography variant="body2">{ubicacion(u)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'text.secondary' }}>
                            <PersonIcon fontSize="small" color="primary" />
                            <Typography variant="body2">{personaAsociada(u.personaId)}</Typography>
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
                        </Box>
                    </Paper>
                ))}
                <Typography variant="body2" color="text.secondary">
                    Mostrando {unidades.length} unidades
                </Typography>
            </Box>

            {/* Dialogo: tipos de departamento */}
            <Dialog open={tiposAbierto} onClose={() => setTiposAbierto(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Tipos de departamento</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Cada tipo se asocia a una categoria de expensa (A, B o C), que define cuanto paga el departamento cada mes.
                        Los tipos nuevos aparecen al registrar o editar una unidad.
                    </Typography>
                    <Table size="small" sx={{ mb: 3 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F3F6FA' }}>
                                <TableCell><strong>Tipo</strong></TableCell>
                                <TableCell><strong>Categoria</strong></TableCell>
                                <TableCell align="right"><strong>Expensa base</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {TIPOS_DEPARTAMENTO.map((t) => (
                                <TableRow key={t}>
                                    <TableCell>{t}</TableCell>
                                    <TableCell>Tipo {CATEGORIA_POR_TIPO[t]}</TableCell>
                                    <TableCell align="right">{formatBs(EXPENSA_BASE[CATEGORIA_POR_TIPO[t]] ?? 0)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Registrar nuevo tipo</Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                        <TextField size="small" fullWidth label="Nombre" placeholder="Ej. 3 dormitorios"
                            value={nuevoTipo.nombre} slotProps={{ htmlInput: { maxLength: 40 } }}
                            onChange={(e) => { setNuevoTipo((n) => ({ ...n, nombre: e.target.value })); setErrorTipo(''); }} />
                        <Select size="small" displayEmpty value={nuevoTipo.categoria} sx={{ minWidth: 200 }}
                            onChange={(e) => { setNuevoTipo((n) => ({ ...n, categoria: e.target.value })); setErrorTipo(''); }}>
                            <MenuItem value=""><em>Categoria de expensa</em></MenuItem>
                            {['A', 'B', 'C'].map((c) => (
                                <MenuItem key={c} value={c}>Tipo {c} · {formatBs(EXPENSA_BASE[c] ?? 0)}</MenuItem>
                            ))}
                        </Select>
                        <Button variant="contained" onClick={guardarTipo} sx={{ whiteSpace: 'nowrap' }}>Agregar</Button>
                    </Box>
                    {errorTipo && <Alert severity="error" sx={{ mt: 2 }}>{errorTipo}</Alert>}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setTiposAbierto(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}