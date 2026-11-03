import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, Chip, Select, MenuItem, TextField,
    Table, TableHead, TableBody, TableRow, TableCell, IconButton, InputAdornment, Alert, Snackbar,
    Dialog, DialogTitle, DialogContent, DialogActions, Menu, Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import PaidIcon from '@mui/icons-material/Paid';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    PLANILLA_MOCK, PAGOS_PERSONAL_MOCK, RESUMEN_PLANILLA, RESUMEN_PAGOS_PERSONAL,
    ESTADOS_PLANILLA, EMPLEADOS_MOCK, MEDIOS_PAGO_PERSONAL,
    nombreEmpleado, cargoEmpleado, salarioDesdeCargo,
} from '../../constants/personalMock';
import { PERIODOS, formatBs } from '../../constants/finanzasMock';

const PERIODOS_PLANILLA = ['Noviembre 2026', ...PERIODOS.filter((p) => p !== 'Noviembre 2026')];

const estadoChipSx = (estado) => {
    if (estado === 'Pagada') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Calculado') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Revisar') return { bgcolor: '#FDF0D5', color: '#B6802A' };
    return { bgcolor: '#FDF0D5', color: '#B6802A' }; // Borrador
};

// "Noviembre 2026" -> "Nov. 2026" (para los pagos del historial)
const periodoCorto = (p) => {
    if (!p) return '';
    const abr = {
        Enero: 'Ene.', Febrero: 'Feb.', Marzo: 'Mar.', Abril: 'Abr.', Mayo: 'May.',
        Junio: 'Jun.', Julio: 'Jul.', Agosto: 'Ago.', Septiembre: 'Sep.', Octubre: 'Oct.',
        Noviembre: 'Nov.', Diciembre: 'Dic.'
    };
    const [mes, anio] = p.split(' ');
    return `${abr[mes] || mes} ${anio}`;
};

// Siguiente PE-XXXX para el historial
const siguienteCodigoPago = () => {
    const nums = PAGOS_PERSONAL_MOCK.map((p) => Number(String(p.id || '').replace(/\D/g, '')) || 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `PE-${String(next).padStart(4, '0')}`;
};
const fechaHoyBonita = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// Recalcula los resumenes globales (compartidos con HistorialPagos)
const recalcularResumenes = () => {
    RESUMEN_PLANILLA.totalPlanilla = PLANILLA_MOCK.reduce((s, p) => s + (p.neto || 0), 0);
    RESUMEN_PLANILLA.bonos = PLANILLA_MOCK.reduce((s, p) => s + (p.bonos || 0), 0);
    RESUMEN_PLANILLA.anticiposDescontados = PLANILLA_MOCK.reduce((s, p) => s + (p.anticipos || 0), 0);
    RESUMEN_PLANILLA.conceptosAplicados = PLANILLA_MOCK.filter((p) => (p.bonos || 0) > 0).length;
    RESUMEN_PLANILLA.empleadosAnticipos = PLANILLA_MOCK.filter((p) => (p.anticipos || 0) > 0).length;
    const pagados = PAGOS_PERSONAL_MOCK.filter((p) => p.estado === 'Pagado');
    const pendientes = PAGOS_PERSONAL_MOCK.filter((p) => p.estado === 'Pendiente');
    RESUMEN_PAGOS_PERSONAL.pagadoEnMes = pagados.reduce((s, p) => s + (p.montoNeto || 0), 0);
    RESUMEN_PAGOS_PERSONAL.pagosConfirmados = pagados.length;
    RESUMEN_PAGOS_PERSONAL.pendiente = pendientes.reduce((s, p) => s + (p.montoNeto || 0), 0);
    RESUMEN_PAGOS_PERSONAL.empleadosPendientes = pendientes.length;
    RESUMEN_PAGOS_PERSONAL.comprobantes = pagados.length;
};

export default function Planilla() {
    const [periodo, setPeriodo] = useState('Noviembre 2026');
    const [estado, setEstado] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');
    const [tick, setTick] = useState(0);
    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    // Menu de acciones por fila
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [filaSel, setFilaSel] = useState(null);
    const abrirMenu = (e, f) => { setMenuAnchor(e.currentTarget); setFilaSel(f); };
    const cerrarMenu = () => setMenuAnchor(null);

    // Modales
    const [pagarAbierto, setPagarAbierto] = useState(false);
    const [pagoDraft, setPagoDraft] = useState({ medio: 'Transferencia', referencia: '', fecha: '' });

    const [editarAbierto, setEditarAbierto] = useState(false);
    const [editarDraft, setEditarDraft] = useState({ bonos: 0, anticipos: 0, otrosDesc: 0 });

    // Filas filtradas: tick fuerza recomputo tras mutaciones
    const filas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return PLANILLA_MOCK
            .filter((p) => p.periodo === periodo)
            .filter((p) => estado === 'Todos' || p.estado === estado)
            .map((p) => ({
                ...p,
                empleado: nombreEmpleado(p.empleadoId),
                cargo: cargoEmpleado(p.empleadoId),
            }))
            .filter((p) => !q || `${p.empleado} ${p.cargo}`.toLowerCase().includes(q));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periodo, estado, busqueda, tick]);

    // Totales reactivos al periodo seleccionado (NO usamos RESUMEN_PLANILLA porque
    // ese se calcula una sola vez; aqui recalculamos para cualquier periodo).
    const resumenPeriodo = useMemo(() => {
        const filasPeriodo = PLANILLA_MOCK.filter((p) => p.periodo === periodo);
        return {
            totalPlanilla: filasPeriodo.reduce((s, p) => s + (p.neto || 0), 0),
            bonos: filasPeriodo.reduce((s, p) => s + (p.bonos || 0), 0),
            anticiposDescontados: filasPeriodo.reduce((s, p) => s + (p.anticipos || 0), 0),
            conceptosAplicados: filasPeriodo.filter((p) => (p.bonos || 0) > 0).length,
            empleadosAnticipos: filasPeriodo.filter((p) => (p.anticipos || 0) > 0).length,
            cantidadFilas: filasPeriodo.length,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periodo, tick]);

    const totalNeto = filas.reduce((s, f) => s + (f.neto || 0), 0);

    // --- Generar planilla (si el periodo no tiene filas, las crea para todos los empleados activos) ---
    const generarPlanilla = () => {
        const yaTiene = PLANILLA_MOCK.some((p) => p.periodo === periodo);
        if (yaTiene) {
            setSnack({ open: true, msg: `La planilla de ${periodo} ya existe`, sev: 'warning' });
            return;
        }
        const activos = EMPLEADOS_MOCK.filter((e) => e.estado === 'Activo');
        activos.forEach((e) => {
            PLANILLA_MOCK.push({
                empleadoId: e.id, periodo,
                salarioBase: salarioDesdeCargo(e.cargo),
                bonos: 0, anticipos: 0, otrosDesc: 0,
                neto: salarioDesdeCargo(e.cargo),
                estado: 'Calculado',
            });
        });
        recalcularResumenes();
        setTick((t) => t + 1);
        setSnack({ open: true, msg: `Planilla de ${periodo} generada con ${activos.length} empleados`, sev: 'success' });
    };

    const exportar = () => {
        setSnack({ open: true, msg: `Planilla de ${periodo} exportada a Excel (simulado)`, sev: 'success' });
    };
    const filtrar = () => {
        setSnack({ open: true, msg: `${filas.length} empleados coinciden con los filtros aplicados`, sev: 'success' });
    };

    // --- Pagar fila ---
    const abrirPagar = () => {
        cerrarMenu();
        setPagoDraft({ medio: 'Transferencia', referencia: '', fecha: fechaHoyBonita() });
        setPagarAbierto(true);
    };
    const confirmarPago = () => {
        if (pagoDraft.medio !== 'Efectivo' && !pagoDraft.referencia.trim()) {
            setSnack({ open: true, msg: `Falta la referencia (N.º de ${pagoDraft.medio.toLowerCase()})`, sev: 'warning' });
            return;
        }
        const codigo = siguienteCodigoPago();
        // 1) Buscar si ya hay una fila pendiente en el historial para ese empleado+periodo
        const pagoExistente = PAGOS_PERSONAL_MOCK.find(
            (p) => p.empleadoId === filaSel.empleadoId
                && periodoCorto(filaSel.periodo) === p.periodo
                && p.estado === 'Pendiente'
        );
        if (pagoExistente) {
            pagoExistente.id = codigo;
            pagoExistente.fecha = pagoDraft.fecha;
            pagoExistente.medio = pagoDraft.medio;
            pagoExistente.referencia = pagoDraft.referencia || null;
            pagoExistente.montoNeto = filaSel.neto;
            pagoExistente.estado = 'Pagado';
        } else {
            PAGOS_PERSONAL_MOCK.push({
                id: codigo, fecha: pagoDraft.fecha, empleadoId: filaSel.empleadoId,
                empleado: filaSel.empleado, periodo: periodoCorto(filaSel.periodo),
                concepto: 'Salario', medio: pagoDraft.medio, referencia: pagoDraft.referencia,
                montoNeto: filaSel.neto, estado: 'Pagado',
            });
        }
        // 2) Marcar la fila de la planilla como Pagada
        const fp = PLANILLA_MOCK.find((p) => p.empleadoId === filaSel.empleadoId && p.periodo === filaSel.periodo);
        if (fp) fp.estado = 'Pagada';

        recalcularResumenes();
        setPagarAbierto(false);
        setTick((t) => t + 1);
        setSnack({ open: true, msg: `Pago ${codigo} registrado para ${filaSel.empleado}`, sev: 'success' });
    };

    // --- Editar fila (bonos, anticipos, otros descuentos) ---
    const abrirEditar = () => {
        cerrarMenu();
        setEditarDraft({
            bonos: filaSel.bonos || 0,
            anticipos: filaSel.anticipos || 0,
            otrosDesc: filaSel.otrosDesc || 0,
        });
        setEditarAbierto(true);
    };
    const confirmarEditar = () => {
        const fp = PLANILLA_MOCK.find((p) => p.empleadoId === filaSel.empleadoId && p.periodo === filaSel.periodo);
        if (!fp) return;
        fp.bonos = Number(editarDraft.bonos) || 0;
        fp.anticipos = Number(editarDraft.anticipos) || 0;
        fp.otrosDesc = Number(editarDraft.otrosDesc) || 0;
        fp.neto = (fp.salarioBase || 0) + fp.bonos - fp.anticipos - fp.otrosDesc;
        recalcularResumenes();
        setEditarAbierto(false);
        setTick((t) => t + 1);
        setSnack({ open: true, msg: `Planilla de ${filaSel.empleado} actualizada`, sev: 'success' });
    };

    const periodoYaGenerado = PLANILLA_MOCK.some((p) => p.periodo === periodo);

    return (
        <DashboardLayout>
            {/* Encabezado */}
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Planilla de personal</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Calcula salarios, bonos, anticipos y total neto del periodo.
            </Typography>

            {/* Barra de acciones (al nivel de Expensas) */}
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={generarPlanilla}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Generar planilla
                </Button>
            </Box>

            {/* Tarjetas de resumen (REACTIVAS al periodo seleccionado) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#E4EEF5', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                        <PaidIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Total planilla</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatBs(resumenPeriodo.totalPlanilla)}</Typography>
                        <Typography variant="caption" color="text.secondary">{periodo}</Typography>
                    </Box>
                </Paper>
                <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#E4F4EE', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, color: '#2E9D78', display: 'grid', placeItems: 'center' }}>
                        <AddCircleIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Bonos de {periodo}</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(resumenPeriodo.bonos)}</Typography>
                        <Typography variant="caption" color="text.secondary">{resumenPeriodo.conceptosAplicados} conceptos aplicados</Typography>
                    </Box>
                </Paper>
                <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#FDF0D5', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, color: '#B6802A', display: 'grid', placeItems: 'center' }}>
                        <RemoveCircleIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Anticipos de {periodo}</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#B6802A' }}>{formatBs(resumenPeriodo.anticiposDescontados)}</Typography>
                        <Typography variant="caption" color="text.secondary">{resumenPeriodo.empleadosAnticipos} empleados</Typography>
                    </Box>
                </Paper>
            </Box>

            {/* Filtros */}
            <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <Box sx={{ flex: 1, minWidth: 160 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Periodo</Typography>
                        <Select fullWidth size="small" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                            {PERIODOS_PLANILLA.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </Select>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 140 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Estado</Typography>
                        <Select fullWidth size="small" value={estado} onChange={(e) => setEstado(e.target.value)}>
                            {ESTADOS_PLANILLA.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </Box>
                    <Box sx={{ flex: 2, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Buscar</Typography>
                        <TextField fullWidth size="small" placeholder="Nombre, cargo o documento"
                            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                                    )
                                }
                            }} />
                    </Box>
                    <Button variant="contained" startIcon={<FilterListIcon />} onClick={filtrar}>
                        Filtrar
                    </Button>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportar}
                        sx={{ color: '#1a2733', borderColor: '#cdd8e3' }}>
                        Exportar
                    </Button>
                </Box>
            </Paper>

            {/* Tabla detalle de planilla */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Detalle de la planilla — {periodo}</Typography>
                    <Chip label={periodoYaGenerado ? 'Borrador' : 'Sin generar'} size="small" sx={estadoChipSx('Borrador')} />
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 900 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Empleado</strong></TableCell>
                                <TableCell><strong>Cargo</strong></TableCell>
                                <TableCell><strong>Salario base</strong></TableCell>
                                <TableCell><strong>Bonos</strong></TableCell>
                                <TableCell><strong>Anticipos</strong></TableCell>
                                <TableCell><strong>Otros desc.</strong></TableCell>
                                <TableCell><strong>Neto a pagar</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell align="center"><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                        {periodoYaGenerado
                                            ? 'Sin empleados que coincidan con los filtros aplicados.'
                                            : `Aun no se genero planilla para ${periodo}. Usa el boton "Generar planilla".`}
                                    </TableCell>
                                </TableRow>
                            ) : filas.map((f) => (
                                <TableRow key={`${f.empleadoId}-${f.periodo}`}>
                                    <TableCell sx={{ fontWeight: 600 }}>{f.empleado}</TableCell>
                                    <TableCell>{f.cargo}</TableCell>
                                    <TableCell>{formatBs(f.salarioBase)}</TableCell>
                                    <TableCell sx={{ color: f.bonos > 0 ? '#2E9D78' : 'text.primary' }}>
                                        {f.bonos > 0 ? `+ ${formatBs(f.bonos)}` : formatBs(0)}
                                    </TableCell>
                                    <TableCell sx={{ color: f.anticipos > 0 ? '#D9534F' : 'text.primary' }}>
                                        {f.anticipos > 0 ? `− ${formatBs(f.anticipos)}` : formatBs(0)}
                                    </TableCell>
                                    <TableCell sx={{ color: f.otrosDesc > 0 ? '#D9534F' : 'text.primary' }}>
                                        {f.otrosDesc > 0 ? `− ${formatBs(f.otrosDesc)}` : formatBs(0)}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{formatBs(f.neto)}</TableCell>
                                    <TableCell><Chip label={f.estado} size="small" sx={estadoChipSx(f.estado)} /></TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" onClick={(ev) => abrirMenu(ev, f)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>

                {/* Total neto a pagar */}
                <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 2, mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Total neto a pagar — {periodo}</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatBs(totalNeto)}</Typography>
                </Box>
            </Paper>

            {/* Menu de acciones por fila */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={cerrarMenu}>
                {filaSel?.estado !== 'Pagada' && (
                    <MenuItem onClick={abrirPagar}>
                        <PaidIcon fontSize="small" sx={{ mr: 1, color: '#2E9D78' }} />
                        Pagar
                    </MenuItem>
                )}
                {filaSel?.estado !== 'Pagada' && (
                    <MenuItem onClick={abrirEditar}>
                        <EditIcon fontSize="small" sx={{ mr: 1, color: '#1F5F8B' }} />
                        Editar fila
                    </MenuItem>
                )}
                {filaSel?.estado === 'Pagada' && (
                    <MenuItem disabled>
                        Esta fila ya fue pagada
                    </MenuItem>
                )}
            </Menu>

            {/* ============================================================ */}
            {/* Dialog: Pagar fila                                           */}
            {/* ============================================================ */}
            <Dialog open={pagarAbierto} onClose={() => setPagarAbierto(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#E4F4EE', color: '#2E9D78', display: 'grid', placeItems: 'center' }}>
                        <PaidIcon fontSize="small" />
                    </Box>
                    Pagar planilla
                </DialogTitle>
                <DialogContent dividers>
                    {filaSel && (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Registra el pago del salario de <strong>{filaSel.empleado}</strong> ({filaSel.cargo})
                                correspondiente al periodo <strong>{filaSel.periodo}</strong>.
                            </Typography>

                            {/* Monto a pagar */}
                            <Box sx={{ bgcolor: '#E4F4EE', borderRadius: 2, p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Neto a pagar</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(filaSel.neto)}</Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                <Box sx={{ flex: 1, minWidth: 150 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Fecha de pago</Typography>
                                    <TextField fullWidth size="small" value={pagoDraft.fecha}
                                        onChange={(e) => setPagoDraft((p) => ({ ...p, fecha: e.target.value }))} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 150 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Medio de pago</Typography>
                                    <Select fullWidth size="small" value={pagoDraft.medio}
                                        onChange={(e) => setPagoDraft((p) => ({ ...p, medio: e.target.value, referencia: '' }))}>
                                        {MEDIOS_PAGO_PERSONAL.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                    </Select>
                                </Box>
                            </Box>

                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {pagoDraft.medio === 'Efectivo' ? 'N.º de recibo (opcional)' : `N.º de ${pagoDraft.medio.toLowerCase()}`}
                            </Typography>
                            <TextField fullWidth size="small" value={pagoDraft.referencia}
                                onChange={(e) => setPagoDraft((p) => ({ ...p, referencia: e.target.value }))}
                                placeholder={pagoDraft.medio === 'Efectivo' ? 'REC-00000' : '1234567890'} />
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setPagarAbierto(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={confirmarPago}>Confirmar pago</Button>
                </DialogActions>
            </Dialog>

            {/* ============================================================ */}
            {/* Dialog: Editar fila (bonos, anticipos, otros desc.)          */}
            {/* ============================================================ */}
            <Dialog open={editarAbierto} onClose={() => setEditarAbierto(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#E4EEF5', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                        <EditIcon fontSize="small" />
                    </Box>
                    Editar fila de planilla
                </DialogTitle>
                <DialogContent dividers>
                    {filaSel && (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Ajusta bonos, anticipos y otros descuentos de <strong>{filaSel.empleado}</strong> ({filaSel.cargo})
                                para el periodo <strong>{filaSel.periodo}</strong>. El neto se recalcula automaticamente.
                            </Typography>

                            <Box sx={{ bgcolor: '#F8FAFC', border: '1px solid #CFDCEA', borderRadius: 2, p: 2, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Salario base</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBs(filaSel.salarioBase)}</Typography>
                            </Box>

                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#2E9D78' }}>Bonos (+)</Typography>
                            <TextField fullWidth size="small" type="number" value={editarDraft.bonos}
                                onChange={(e) => setEditarDraft((p) => ({ ...p, bonos: e.target.value }))}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> } }}
                                sx={{ mb: 2 }} />

                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#D9534F' }}>Anticipos (−)</Typography>
                            <TextField fullWidth size="small" type="number" value={editarDraft.anticipos}
                                onChange={(e) => setEditarDraft((p) => ({ ...p, anticipos: e.target.value }))}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> } }}
                                sx={{ mb: 2 }} />

                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#D9534F' }}>Otros descuentos (−)</Typography>
                            <TextField fullWidth size="small" type="number" value={editarDraft.otrosDesc}
                                onChange={(e) => setEditarDraft((p) => ({ ...p, otrosDesc: e.target.value }))}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> } }}
                                sx={{ mb: 2 }} />

                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: '#E4EEF5', borderRadius: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>Neto resultante</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    {formatBs((Number(filaSel.salarioBase) || 0) + (Number(editarDraft.bonos) || 0)
                                        - (Number(editarDraft.anticipos) || 0) - (Number(editarDraft.otrosDesc) || 0))}
                                </Typography>
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setEditarAbierto(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={confirmarEditar}>Guardar cambios</Button>
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