import { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Chip, IconButton, Select, MenuItem, TextField, InputAdornment,
    Table, TableHead, TableBody, TableRow, TableCell, Menu, Dialog, DialogTitle, DialogContent,
    DialogActions, Snackbar, Alert, Divider, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import OpacityIcon from '@mui/icons-material/Opacity';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PaidIcon from '@mui/icons-material/Paid';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    PERIODOS, ESTADOS_V2, DEPARTAMENTOS_V2_FILTRO, EXPENSAS_V2_MOCK, DEPTOS_V2,
    CONFIG_AGUA_V2, calcularAgua, estadoV2ChipSx,
} from '../../constants/expensasV2Mock';
import { formatBs } from '../../constants/finanzasMock';

const PAGE_SIZE = 10;

export default function ExpensasV2() {
    const navigate = useNavigate();
    const location = useLocation();
    const [periodo, setPeriodo] = useState('Octubre 2026');
    const [departamento, setDepartamento] = useState('Todos');
    const [estado, setEstado] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');
    const [limite, setLimite] = useState(PAGE_SIZE);
    const [tick, setTick] = useState(0);

    const [menuAnchor, setMenuAnchor] = useState(null);
    const [filaSel, setFilaSel] = useState(null);
    const [detalleAbierto, setDetalleAbierto] = useState(false);

    const [aguaAbierto, setAguaAbierto] = useState(false);
    const [lecturaAnt, setLecturaAnt] = useState('');
    const [lecturaAct, setLecturaAct] = useState('');
    // Desbloqueo excepcional de la lectura anterior (medidor cambiado, danado, etc.)
    const [anteriorDesbloqueada, setAnteriorDesbloqueada] = useState(false);
    // Campo "Agua (Bs)" editable. Si el admin lo toca, queda dirty y deja de
    // recalcularse automaticamente cuando cambia la lectura actual.
    const [aguaInput, setAguaInput] = useState('');
    const [aguaDirty, setAguaDirty] = useState(false);

    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    // Snack desde navegacion (ej. al volver de GenerarExpensasV2)
    useEffect(() => {
        if (location.state?.snack) {
            setSnack(location.state.snack);
            window.history.replaceState({}, '');
        }
    }, [location.state]);

    const abrirMenu = (e, r) => { setMenuAnchor(e.currentTarget); setFilaSel(r); };
    const cerrarMenu = () => setMenuAnchor(null);
    const verDetalle = () => { setDetalleAbierto(true); cerrarMenu(); };

    const abrirAgua = (r) => {
        setFilaSel(r);
        // Lectura anterior: si la expensa ya tiene una guardada, usarla; sino, tomar la ultimaLectura del depto
        let lecAntInicial = r.lecturaAnt;
        if (lecAntInicial == null) {
            const d = DEPTOS_V2.find((x) => x.id === r.depto);
            lecAntInicial = d?.ultimaLectura ?? 0;
        }
        const lecActInicial = r.lecturaAct != null ? r.lecturaAct : lecAntInicial;
        setLecturaAnt(String(lecAntInicial));
        setLecturaAct(String(lecActInicial));
        setAnteriorDesbloqueada(false); // siempre arranca bloqueada
        // Agua inicial: si la expensa ya tenia, usarla (marcada como dirty); sino autocalcular
        if (r.agua && r.agua > 0) {
            setAguaInput(String(r.agua));
            setAguaDirty(true);
        } else {
            const consumoIni = Math.max(0, lecActInicial - lecAntInicial);
            setAguaInput(String(calcularAgua(consumoIni).agua));
            setAguaDirty(false);
        }
        setAguaAbierto(true);
        cerrarMenu();
    };

    const cerrarAgua = () => { setAguaAbierto(false); setFilaSel(null); };

    // Auto-recalcular el agua cuando cambia la lectura actual (si el admin no la edito a mano)
    useEffect(() => {
        if (!aguaAbierto || aguaDirty) return;
        const consumo = Math.max(0, (Number(lecturaAct) || 0) - (Number(lecturaAnt) || 0));
        setAguaInput(String(calcularAgua(consumo).agua));
    }, [lecturaAct, lecturaAnt, aguaDirty, aguaAbierto]);

    const handleAguaChange = (e) => {
        setAguaInput(e.target.value);
        setAguaDirty(true);
    };

    const recalcularAguaDesdeMedidor = () => {
        setAguaDirty(false);
        const consumo = Math.max(0, (Number(lecturaAct) || 0) - (Number(lecturaAnt) || 0));
        setAguaInput(String(calcularAgua(consumo).agua));
    };

    const confirmarAgua = () => {
        const idx = EXPENSAS_V2_MOCK.findIndex((e) => e.id === filaSel.id);
        if (idx < 0) return;
        const row = EXPENSAS_V2_MOCK[idx];
        const aguaFinal = Math.max(0, Number(aguaInput) || 0);
        const m3 = Math.max(0, (Number(lecturaAct) || 0) - (Number(lecturaAnt) || 0));
        row.agua = aguaFinal;
        row.total = row.base + aguaFinal;
        row.lecturaAnt = Number(lecturaAnt) || 0;
        row.lecturaAct = Number(lecturaAct) || 0;
        row.m3 = m3;
        row.estado = row.estado === 'Agua pendiente' ? 'Lista' : row.estado;
        row.fechaAgua = new Date().toLocaleDateString('es-BO');
        // Actualizar la ultimaLectura del depto para el proximo periodo
        const d = DEPTOS_V2.find((x) => x.id === row.depto);
        if (d) d.ultimaLectura = row.lecturaAct;
        const sufijo = aguaDirty ? ' (monto manual)' : '';
        setSnack({ open: true, msg: `Agua registrada en depto ${row.depto}: ${formatBs(aguaFinal)}${sufijo}. Expensa lista para cobrar.`, sev: 'success' });
        setTick((t) => t + 1);
        cerrarAgua();
    };

    const marcarPagada = () => {
        const idx = EXPENSAS_V2_MOCK.findIndex((e) => e.id === filaSel.id);
        if (idx >= 0) {
            EXPENSAS_V2_MOCK[idx].estado = 'Pagada';
            EXPENSAS_V2_MOCK[idx].pagado = EXPENSAS_V2_MOCK[idx].total;
            setSnack({ open: true, msg: `Pago registrado en depto ${filaSel.depto}: ${formatBs(filaSel.total)}.`, sev: 'success' });
            setTick((t) => t + 1);
        }
        cerrarMenu();
    };

    const nombreMes = (periodo || '').split(' ')[0] || 'periodo';

    // KPIs en Bs (alineados con v1) + conteo de pendientes
    const kpis = useMemo(() => {
        const delMes = EXPENSAS_V2_MOCK.filter((e) => e.periodo === periodo);
        const totalGenerado = delMes.reduce((s, e) => s + (e.total || 0), 0);
        const pendientesCount = delMes.filter((e) => e.estado === 'Agua pendiente').length;
        const pagado = delMes.filter((e) => e.estado === 'Pagada').reduce((s, e) => s + (e.total || 0), 0);
        const totalDeptos = delMes.length;
        return { totalGenerado, pendientesCount, pagado, totalDeptos };
    }, [periodo, tick]);

    const KPI_CARDS = [
        { label: `Total generado ${nombreMes}`, valor: formatBs(kpis.totalGenerado), nota: `${kpis.totalDeptos} depto${kpis.totalDeptos !== 1 ? 's' : ''}`, icon: <ReceiptLongIcon />, color: '#1F5F8B', bg: '#E4EEF5' },
        { label: 'Agua pendiente', valor: `${kpis.pendientesCount} depto${kpis.pendientesCount !== 1 ? 's' : ''}`, nota: 'Falta registrar agua', icon: <PendingActionsIcon />, color: '#B6802A', bg: '#FDF0D5' },
        { label: 'Pagado', valor: formatBs(kpis.pagado), nota: 'Cobrado del periodo', icon: <TaskAltIcon />, color: '#2E9D78', bg: '#E4F4EE' },
    ];

    const filas = useMemo(() => EXPENSAS_V2_MOCK.filter((e) =>
        e.periodo === periodo &&
        (departamento === 'Todos' || e.depto === departamento) &&
        (estado === 'Todos' || e.estado === estado) &&
        (e.depto + e.responsable).toLowerCase().includes(busqueda.toLowerCase())
    ), [periodo, departamento, estado, busqueda, tick]);

    const visibles = filas.slice(0, limite);
    const hayMas = filas.length > limite;

    // Para el modal: m3 preview y nota de minimo
    const m3Consumo = Math.max(0, (Number(lecturaAct) || 0) - (Number(lecturaAnt) || 0));
    const aplicaMinimo = aguaAbierto && m3Consumo <= CONFIG_AGUA_V2.minimoM3;

    return (
        <DashboardLayout>
            {/* Header igual al estilo v1 */}
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Expensas mensuales</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Consulta y gestiona las expensas de los departamentos
            </Typography>

            {/* Botones top-right: Configuracion intereses + Generar expensa */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'stretch', md: 'flex-end' }, mb: 2 }}>
                <Button variant="outlined" startIcon={<SettingsOutlinedIcon />}
                    onClick={() => navigate('/finanzas/expensas-v2/configuracion')}
                    sx={{ color: '#1a2733', borderColor: '#cdd8e3', width: { xs: '100%', md: 'auto' } }}>
                    Configuracion intereses
                </Button>
                <Button variant="contained" startIcon={<AddIcon />}
                    onClick={() => navigate('/finanzas/expensas-v2/generar')}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Generar expensa
                </Button>
            </Box>

            {/* KPIs */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                {KPI_CARDS.map((r) => (
                    <Paper key={r.label} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', bgcolor: r.bg, color: r.color, display: 'grid', placeItems: 'center' }}>
                            {r.icon}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                            <Typography variant="h3" sx={{ fontWeight: 700, color: r.color }}>{r.valor}</Typography>
                            <Typography variant="caption" sx={{ color: r.color }}>{r.nota}</Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* Filtros */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mb: 3 }}>
                <Box sx={{ flex: 2, minWidth: 200 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Buscar</Typography>
                    <TextField fullWidth placeholder="Departamento o responsable" value={busqueda}
                        onChange={(e) => { setBusqueda(e.target.value); setLimite(PAGE_SIZE); }}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 150 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                    <Select fullWidth value={periodo} onChange={(e) => { setPeriodo(e.target.value); setLimite(PAGE_SIZE); }}>
                        {PERIODOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 150 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Departamento</Typography>
                    <Select fullWidth value={departamento} onChange={(e) => { setDepartamento(e.target.value); setLimite(PAGE_SIZE); }}>
                        {DEPARTAMENTOS_V2_FILTRO.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 150 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Estado</Typography>
                    <Select fullWidth value={estado} onChange={(e) => { setEstado(e.target.value); setLimite(PAGE_SIZE); }}>
                        {ESTADOS_V2.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                </Box>
            </Box>

            {/* Tabla (sin columna N.º) */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Expensas de {periodo}</Typography>
                    <Typography variant="body2" color="text.secondary">{filas.length} {filas.length === 1 ? 'registro' : 'registros'}</Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 860 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Departamento</strong></TableCell>
                                <TableCell><strong>Tipo</strong></TableCell>
                                <TableCell><strong>Responsable</strong></TableCell>
                                <TableCell align="right"><strong>Expensa base</strong></TableCell>
                                <TableCell align="right"><strong>Agua</strong></TableCell>
                                <TableCell align="right"><strong>Total</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell align="center"><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visibles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                        No hay expensas para {periodo}. Genera para empezar.
                                    </TableCell>
                                </TableRow>
                            ) : visibles.map((r) => {
                                const pendiente = r.estado === 'Agua pendiente';
                                return (
                                    <TableRow key={r.id} sx={pendiente ? { bgcolor: '#FFF9EB' } : {}}>
                                        <TableCell sx={{ fontWeight: 600 }}>Depto. {r.depto}</TableCell>
                                        <TableCell>
                                            <Chip label={`Tipo ${r.tipo}`} size="small"
                                                sx={{ bgcolor: '#E4EEF5', color: '#1F5F8B', fontWeight: 600, height: 20 }} />
                                        </TableCell>
                                        <TableCell>{r.responsable}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatBs(r.base)}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, color: pendiente ? '#B6802A' : '#2E9D78' }}>
                                            {pendiente ? '—' : formatBs(r.agua)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: pendiente ? '#64748B' : '#1a2733' }}>
                                            {pendiente ? '—' : formatBs(r.total)}
                                        </TableCell>
                                        <TableCell><Chip label={r.estado} size="small" sx={estadoV2ChipSx(r.estado)} /></TableCell>
                                        <TableCell align="center">
                                            {pendiente ? (
                                                <Tooltip title="Registrar agua">
                                                    <Button size="small" variant="contained" startIcon={<OpacityIcon />}
                                                        onClick={() => abrirAgua(r)}
                                                        sx={{ bgcolor: '#1F5F8B', '&:hover': { bgcolor: '#1C4E70' }, py: 0.25, px: 1.25 }}>
                                                        Agua
                                                    </Button>
                                                </Tooltip>
                                            ) : (
                                                <IconButton size="small" onClick={(e) => abrirMenu(e, r)}>
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Mostrando {visibles.length} de {filas.length}
                    </Typography>
                    {hayMas && (
                        <Button variant="outlined" onClick={() => setLimite((l) => l + PAGE_SIZE)}
                            sx={{ color: '#1a2733', borderColor: '#cdd8e3' }}>
                            Ver mas
                        </Button>
                    )}
                </Box>

                {/* Leyenda */}
                <Box sx={{ bgcolor: '#F1F5FA', borderRadius: 2, p: 1.5, mt: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.75 }}>¿Que significa cada estado?</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                        <Chip label="Agua pendiente" size="small" sx={estadoV2ChipSx('Agua pendiente')} />
                        <Typography variant="caption" color="text.secondary">
                            falta registrar el agua del depto. <strong>El pago queda bloqueado</strong> hasta cargarla.
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                        <Chip label="Lista" size="small" sx={estadoV2ChipSx('Lista')} />
                        <Typography variant="caption" color="text.secondary">base + agua cargadas, lista para cobrar.</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label="Pagada" size="small" sx={estadoV2ChipSx('Pagada')} />
                        <Typography variant="caption" color="text.secondary">el depto ya pago el total del periodo.</Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Menu de acciones (solo cuando ya hay agua) */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={cerrarMenu}>
                <MenuItem onClick={verDetalle}>
                    <VisibilityOutlinedIcon fontSize="small" sx={{ mr: 1, color: '#1F5F8B' }} />
                    Ver detalle
                </MenuItem>
                <MenuItem onClick={() => abrirAgua(filaSel)}>
                    <OpacityIcon fontSize="small" sx={{ mr: 1, color: '#1F5F8B' }} />
                    Editar agua
                </MenuItem>
                {filaSel?.estado === 'Lista' && (
                    <MenuItem onClick={marcarPagada}>
                        <PaidIcon fontSize="small" sx={{ mr: 1, color: '#2E9D78' }} />
                        Marcar como pagada
                    </MenuItem>
                )}
            </Menu>

            {/* ============================================================ */}
            {/* Dialog: Registrar agua (unico modo: medidor)                 */}
            {/* ============================================================ */}
            <Dialog open={aguaAbierto} onClose={cerrarAgua} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <OpacityIcon sx={{ color: '#1F5F8B' }} />
                    Registrar agua — Depto {filaSel?.depto}
                    {filaSel?.tipo && (
                        <Chip label={`Tipo ${filaSel.tipo}`} size="small"
                            sx={{ bgcolor: '#E4EEF5', color: '#1F5F8B', fontWeight: 600, height: 20 }} />
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Button size="small" variant={anteriorDesbloqueada ? 'contained' : 'outlined'}
                        startIcon={<SettingsOutlinedIcon />}
                        onClick={() => setAnteriorDesbloqueada((v) => !v)}
                        sx={{
                            textTransform: 'none', fontSize: '0.75rem',
                            ...(anteriorDesbloqueada
                                ? { bgcolor: '#B6802A', '&:hover': { bgcolor: '#8E6318' } }
                                : { color: '#1a2733', borderColor: '#cdd8e3' }),
                        }}>
                        {anteriorDesbloqueada ? 'Bloquear anterior' : 'Ajustar anterior'}
                    </Button>
                </DialogTitle>
                <DialogContent dividers>
                    {filaSel && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {filaSel.responsable} · {filaSel.periodo} · Expensa base <strong>{formatBs(filaSel.base)}</strong>
                            </Typography>

                            {/* Cartel de advertencia cuando la anterior esta desbloqueada */}
                            {anteriorDesbloqueada && (
                                <Box sx={{ bgcolor: '#FDF0D5', borderRadius: 2, p: 1.25, mb: 1.5, border: '1px solid #F3DBAE' }}>
                                    <Typography variant="caption" sx={{ color: '#8E6318', display: 'block' }}>
                                        <strong>Modo excepcional:</strong> editar la lectura anterior solo si se cambio el medidor,
                                        se daño o la lectura previa quedo mal registrada.
                                    </Typography>
                                </Box>
                            )}

                            {/* Lecturas + agua editable (3 columnas) */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 1.5 }}>
                                <TextField label="Lectura anterior (m³)" type="number" fullWidth
                                    value={lecturaAnt}
                                    onChange={(e) => setLecturaAnt(e.target.value)}
                                    slotProps={{ input: { readOnly: !anteriorDesbloqueada } }}
                                    helperText={anteriorDesbloqueada ? 'Modificable (modo excepcional)' : 'No modificable (del ultimo registro)'}
                                    sx={{
                                        '& .MuiInputBase-root': { bgcolor: anteriorDesbloqueada ? '#FFF9EB' : '#F1F5FA' },
                                        '& .MuiInputBase-input': { color: '#1a2733', fontWeight: 700, WebkitTextFillColor: '#1a2733' },
                                        ...(anteriorDesbloqueada && { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#B6802A' } }),
                                    }} />
                                <TextField label="Lectura actual (m³)" type="number" fullWidth autoFocus
                                    value={lecturaAct} onChange={(e) => setLecturaAct(e.target.value)}
                                    helperText="Subir hasta la lectura del medidor"
                                    sx={{ '& .MuiInputBase-input': { fontWeight: 700 } }} />
                                <TextField label="Agua (Bs)" type="number" fullWidth
                                    value={aguaInput} onChange={handleAguaChange}
                                    helperText={aguaDirty ? 'Monto manual' : 'Autocalculado del medidor'}
                                    sx={{
                                        '& .MuiInputBase-input': { fontWeight: 700, color: aguaDirty ? '#B6802A' : '#2E9D78' },
                                    }} />
                            </Box>

                            {/* Boton para volver al calculo del medidor cuando el admin edito el monto a mano */}
                            {aguaDirty && (
                                <Box sx={{ mb: 1.5 }}>
                                    <Button size="small" variant="text" onClick={recalcularAguaDesdeMedidor}
                                        sx={{ color: '#1F5F8B', textTransform: 'none' }}>
                                        ↺ Recalcular desde el medidor
                                    </Button>
                                </Box>
                            )}

                            {/* Chips de referencia FIJOS */}
                            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Chip label={`Agua / m³ : ${formatBs(CONFIG_AGUA_V2.tarifaPorM3)}`} size="small"
                                    sx={{ bgcolor: '#E4EEF5', color: '#1F5F8B', fontWeight: 600 }} />
                                <Chip label={`Tarifa mínima agua : ${formatBs(CONFIG_AGUA_V2.minimoBs)}`} size="small"
                                    sx={{ bgcolor: '#FDF0D5', color: '#B6802A', fontWeight: 600 }} />
                            </Box>

                            {/* Preview: usa el agua final del input (editable), no la autocalculada */}
                            <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 2, border: '1px solid #CFDCEA' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>Vista previa</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="caption" color="text.secondary">Consumo</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            {m3Consumo} m³
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="caption" color="text.secondary">Agua</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: aguaDirty ? '#B6802A' : '#2E9D78' }}>{formatBs(Number(aguaInput) || 0)}</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="caption" color="text.secondary">Total expensa</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatBs(filaSel.base + (Number(aguaInput) || 0))}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={cerrarAgua}>Cancelar</Button>
                    <Button variant="contained" startIcon={<TaskAltIcon />} onClick={confirmarAgua}
                        disabled={!lecturaAct || (Number(lecturaAct) < Number(lecturaAnt))}>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ============================================================ */}
            {/* Dialog: Ver detalle                                          */}
            {/* ============================================================ */}
            <Dialog open={detalleAbierto} onClose={() => setDetalleAbierto(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Detalle expensa — Depto {filaSel?.depto}</DialogTitle>
                <DialogContent dividers>
                    {filaSel && (
                        <Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Departamento</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Depto. {filaSel.depto}</Typography>
                                        <Chip label={`Tipo ${filaSel.tipo}`} size="small"
                                            sx={{ bgcolor: '#E4EEF5', color: '#1F5F8B', fontWeight: 600, height: 20 }} />
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Responsable</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{filaSel.responsable}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Periodo</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{filaSel.periodo}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Estado</Typography>
                                    <Chip label={filaSel.estado} size="small" sx={{ mt: 0.5, ...estadoV2ChipSx(filaSel.estado) }} />
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Composicion</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 2 }}>
                                <Box sx={{ p: 1.5, bgcolor: '#E4EEF5', borderRadius: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">Expensa base</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1F5F8B' }}>{formatBs(filaSel.base)}</Typography>
                                </Box>
                                <Box sx={{ p: 1.5, bgcolor: '#E4F4EE', borderRadius: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">Agua</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(filaSel.agua)}</Typography>
                                </Box>
                                <Box sx={{ p: 1.5, bgcolor: '#F1F5FA', borderRadius: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">Consumo</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#64748B' }}>
                                        {filaSel.m3 != null ? `${filaSel.m3} m³` : '—'}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ p: 2, bgcolor: '#F1F5FA', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>Total expensa</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>{formatBs(filaSel.total)}</Typography>
                            </Box>

                            {filaSel.lecturaAnt != null && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                                    Lectura {filaSel.lecturaAnt} → {filaSel.lecturaAct} m³
                                    {filaSel.fechaAgua && <> · Registrado el {filaSel.fechaAgua}</>}
                                </Typography>
                            )}
                            {filaSel.aguaNota && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                    <strong>Nota:</strong> {filaSel.aguaNota}
                                </Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetalleAbierto(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: '100%' }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </DashboardLayout>
    );
}