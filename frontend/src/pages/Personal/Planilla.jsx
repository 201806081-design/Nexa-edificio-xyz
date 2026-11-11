import { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Chip, Select, MenuItem, TextField,
    Table, TableHead, TableBody, TableRow, TableCell, IconButton, InputAdornment, Alert, Snackbar,
    Dialog, DialogTitle, DialogContent, DialogActions, Menu, Divider, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import PaidIcon from '@mui/icons-material/Paid';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SavingsIcon from '@mui/icons-material/Savings';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    PLANILLA_MOCK, PAGOS_PERSONAL_MOCK, RESUMEN_PLANILLA, RESUMEN_PAGOS_PERSONAL,
    ESTADOS_PLANILLA, TIPOS_DESCUENTO,
    nombreEmpleado, cargoEmpleado,
    periodosDisponibles, periodoEnCurso, EMPLEADOS_MOCK, MEDIOS_PAGO_PERSONAL,
    previaPlanilla, generarPlanillaPeriodo, registrarNovedad, eliminarNovedad, novedadesDe,
} from '../../constants/personalMock';
import { formatBs } from '../../constants/finanzasMock';

const estadoChipSx = (estado) => {
    if (estado === 'Pagada') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Calculado') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Revisar') return { bgcolor: '#FDF0D5', color: '#B6802A' };
    return { bgcolor: '#FDF0D5', color: '#B6802A' }; // Borrador
};

// "Noviembre 2026" -> "Nov. 2026" (formato de PAGOS_PERSONAL_MOCK)
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
    const navigate = useNavigate();

    // Periodos dinamicos: salen de la fecha del sistema. El default es el mas reciente.
    const [tick, setTick] = useState(0);
    const periodos = useMemo(() => periodosDisponibles(), [tick]);
    const [periodo, setPeriodo] = useState(() => periodosDisponibles()[0] || '');
    const periodoActualEnCurso = periodoEnCurso();

    const [estado, setEstado] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');
    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    // Menu de acciones por fila
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [filaSel, setFilaSel] = useState(null);
    const abrirMenu = (e, f) => { setMenuAnchor(e.currentTarget); setFilaSel(f); };
    const cerrarMenu = () => setMenuAnchor(null);

    // Modales
    const [anticipoAbierto, setAnticipoAbierto] = useState(false);
    const [anticipoDraft, setAnticipoDraft] = useState({ monto: 0, motivo: '' });

    const [descAbierto, setDescAbierto] = useState(false);
    const [descDraft, setDescDraft] = useState({ monto: 0, tipo: 'Rotura/dano', motivo: '' });

    const [detalleAbierto, setDetalleAbierto] = useState(false);

    // Cada 5s refresca la UI (por si cambia la fecha del sistema y aparece un mes nuevo).
    // La planilla NO se genera sola: la genera el administrador con "Generar planilla"
    // cuando el mes termina (igual que las expensas).
    useEffect(() => {
        const h = setInterval(() => setTick((t) => t + 1), 5000);
        return () => clearInterval(h);
    }, []);

    // Si el periodo seleccionado deja de estar disponible (el usuario retrocedio
    // la fecha del sistema), caemos al mas reciente valido.
    useEffect(() => {
        if (periodos.length > 0 && !periodos.includes(periodo)) {
            setPeriodo(periodos[0]);
        }
    }, [periodos, periodo]);

    // Filas filtradas (reactivas al tick tras mutaciones del mock)
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

    // Totales reactivos al periodo seleccionado
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

    // --- Generar planilla: vista previa con salarios fijos y novedades del mes ---
    const [generarAbierto, setGenerarAbierto] = useState(false);
    const periodosGenerables = periodosDisponibles().filter((p) => !PLANILLA_MOCK.some((x) => x.periodo === p));
    const [periodoGen, setPeriodoGen] = useState('');
    const abrirGenerar = () => {
        setPeriodoGen(periodosGenerables[0] || '');
        setGenerarAbierto(true);
    };
    const previa = periodoGen ? previaPlanilla(periodoGen) : [];
    const confirmarGenerar = () => {
        const n = generarPlanillaPeriodo(periodoGen);
        recalcularResumenes();
        setGenerarAbierto(false);
        setPeriodo(periodoGen);
        setTick((t) => t + 1);
        setSnack({ open: true, msg: `Planilla de ${periodoGen} generada con ${n} empleados`, sev: 'success' });
    };

    // --- Anticipos y descuentos del mes en curso (se aplican al generar la planilla) ---
    const periodoActual = periodoEnCurso();
    const NOV_VACIA = { tipo: 'Anticipo', empleadoId: '', subtipo: 'Rotura/dano', monto: '', motivo: '', medio: 'Efectivo' };
    const [novAbierto, setNovAbierto] = useState(false);
    const [nov, setNov] = useState(NOV_VACIA);
    const [novError, setNovError] = useState('');
    const cambiarNov = (campo, valor) => { setNov((n) => ({ ...n, [campo]: valor })); setNovError(''); };
    const guardarNov = () => {
        const err = registrarNovedad({ ...nov, periodo: periodoActual });
        if (err) { setNovError(err); return; }
        setNov((n) => ({ ...NOV_VACIA, tipo: n.tipo }));
        setTick((t) => t + 1);
        setSnack({ open: true, msg: `${nov.tipo} registrado: se descontara en la planilla de ${periodoActual}`, sev: 'success' });
    };
    const quitarNov = (id) => { eliminarNovedad(id); setTick((t) => t + 1); };
    const novedadesMes = novedadesDe(periodoActual);

    // --- Exportar a PDF (jsPDF + autoTable) ---
    const exportar = () => {
        if (filas.length === 0) {
            setSnack({ open: true, msg: 'No hay filas para exportar en este periodo', sev: 'warning' });
            return;
        }
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.setTextColor(19, 43, 62);
        doc.text(`Planilla de personal - ${periodo}`, 14, 18);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Edificio XYZ - Sistema de Gestion`, 14, 25);
        doc.text(`Generado el ${new Date().toLocaleDateString('es-BO')} ${new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}`, 14, 30);

        autoTable(doc, {
            startY: 36,
            head: [['Empleado', 'Cargo', 'Salario', 'Bonos', 'Anticipos', 'Otros', 'Neto', 'Estado']],
            body: filas.map((f) => [
                f.empleado, f.cargo,
                formatBs(f.salarioBase),
                f.bonos > 0 ? `+ ${formatBs(f.bonos)}` : formatBs(0),
                f.anticipos > 0 ? `- ${formatBs(f.anticipos)}` : formatBs(0),
                f.otrosDesc > 0 ? `- ${formatBs(f.otrosDesc)}` : formatBs(0),
                formatBs(f.neto),
                f.estado,
            ]),
            foot: [['', '', '', '', '', 'Total neto', formatBs(totalNeto), '']],
            headStyles: { fillColor: [31, 95, 139], textColor: 255, fontStyle: 'bold' },
            footStyles: { fillColor: [228, 238, 245], textColor: [19, 43, 62], fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' },
                5: { halign: 'right' }, 6: { halign: 'right' },
            },
        });

        const nombreArchivo = `planilla-${periodo.toLowerCase().replace(/\s/g, '-')}.pdf`;
        doc.save(nombreArchivo);
        setSnack({ open: true, msg: `PDF descargado: ${nombreArchivo}`, sev: 'success' });
    };

    // --- Pagar: redirige a HistorialPagos con precarga ---
    const irAPagar = () => {
        const f = filaSel;
        cerrarMenu();
        navigate('/personal/historial-pagos', {
            state: {
                registrarPrecargado: {
                    empleadoId: f.empleadoId,
                    empleado: f.empleado,
                    cargo: f.cargo,
                    periodo: periodoCorto(f.periodo),
                    periodoPlanilla: f.periodo,
                    concepto: 'Salario',
                    montoNeto: f.neto,
                },
            },
        });
    };

    // --- Registrar anticipo ---
    const abrirAnticipo = () => {
        cerrarMenu();
        const fp0 = PLANILLA_MOCK.find((p) => p.empleadoId === filaSel.empleadoId && p.periodo === filaSel.periodo);
        setAnticipoDraft({ monto: fp0?.anticipos || 0, motivo: '' });
        setAnticipoAbierto(true);
    };
    const confirmarAnticipo = () => {
        const monto = Number(anticipoDraft.monto) || 0;
        if (monto < 0) {
            setSnack({ open: true, msg: 'El anticipo no puede ser negativo', sev: 'warning' });
            return;
        }
        const fp = PLANILLA_MOCK.find((p) => p.empleadoId === filaSel.empleadoId && p.periodo === filaSel.periodo);
        if (!fp) return;
        fp.anticipos = monto; // se corrige el total de anticipos de este periodo
        fp.neto = (fp.salarioBase || 0) + (fp.bonos || 0) - (fp.anticipos || 0) - (fp.otrosDesc || 0);
        recalcularResumenes();
        setAnticipoAbierto(false);
        setTick((t) => t + 1);
        const motivoTxt = anticipoDraft.motivo.trim() ? ` (${anticipoDraft.motivo.trim()})` : '';
        setSnack({ open: true, msg: `Anticipos de ${filaSel.empleado} actualizados a ${formatBs(monto)}${motivoTxt}`, sev: 'success' });
    };

    // --- Registrar descuento ---
    const abrirDescuento = () => {
        cerrarMenu();
        const fp0 = PLANILLA_MOCK.find((p) => p.empleadoId === filaSel.empleadoId && p.periodo === filaSel.periodo);
        setDescDraft({ monto: fp0?.otrosDesc || 0, tipo: 'Rotura/dano', motivo: '' });
        setDescAbierto(true);
    };
    const confirmarDescuento = () => {
        const monto = Number(descDraft.monto) || 0;
        if (monto < 0) {
            setSnack({ open: true, msg: 'El descuento no puede ser negativo', sev: 'warning' });
            return;
        }
        if (!descDraft.motivo.trim()) {
            setSnack({ open: true, msg: 'El motivo del descuento es obligatorio', sev: 'warning' });
            return;
        }
        const fp = PLANILLA_MOCK.find((p) => p.empleadoId === filaSel.empleadoId && p.periodo === filaSel.periodo);
        if (!fp) return;
        fp.otrosDesc = monto; // se corrige el total de descuentos de este periodo
        fp.neto = (fp.salarioBase || 0) + (fp.bonos || 0) - (fp.anticipos || 0) - (fp.otrosDesc || 0);
        recalcularResumenes();
        setDescAbierto(false);
        setTick((t) => t + 1);
        setSnack({ open: true, msg: `Descuentos de ${filaSel.empleado} actualizados a ${formatBs(monto)} (${descDraft.tipo})`, sev: 'success' });
    };

    const verDetalle = () => {
        cerrarMenu();
        setDetalleAbierto(true);
    };

    const periodoYaGenerado = PLANILLA_MOCK.some((p) => p.periodo === periodo);

    return (
        <DashboardLayout>
            {/* Encabezado */}
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Planilla de personal</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Calcula salarios, bonos, anticipos y total neto del periodo. Los periodos aparecen a medida que terminan los meses.
            </Typography>

            {/* Aviso: el mes en curso todavia no esta disponible */}
            <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', mb: 2 }}>
                <Typography variant="body2">
                    El mes en curso (<strong>{periodoActualEnCurso}</strong>) aun no se puede pagar.
                    Aparecera como periodo disponible cuando termine.
                </Typography>
            </Alert>

            {/* Barra de acciones (al nivel de Expensas) */}
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap', mb: 2 }}>
                <Button variant="outlined" startIcon={<PlaylistAddIcon />} onClick={() => { setNov(NOV_VACIA); setNovError(''); setNovAbierto(true); }}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Anticipos y descuentos del mes
                </Button>
                <Button variant="contained" startIcon={<AddIcon />} onClick={abrirGenerar}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Generar planilla
                </Button>
            </Box>

            {/* Tarjetas de resumen (reactivas al periodo seleccionado) */}
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
                            {periodos.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
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
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportar}
                        sx={{ color: '#1a2733', borderColor: '#cdd8e3' }}>
                        Exportar PDF
                    </Button>
                </Box>
            </Paper>

            {/* Tabla detalle de planilla */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Detalle de la planilla — {periodo}</Typography>
                    <Chip label={periodoYaGenerado ? 'Generada' : 'Sin generar'} size="small" sx={estadoChipSx('Calculado')} />
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

                <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 2, mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Total neto a pagar — {periodo}</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatBs(totalNeto)}</Typography>
                </Box>
            </Paper>

            {/* Menu de acciones por fila */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={cerrarMenu}>
                <MenuItem onClick={verDetalle}>
                    <VisibilityIcon fontSize="small" sx={{ mr: 1, color: '#1F5F8B' }} />
                    Ver detalle
                </MenuItem>
                {filaSel?.estado !== 'Pagada' && (
                    <MenuItem onClick={abrirAnticipo}>
                        <SavingsIcon fontSize="small" sx={{ mr: 1, color: '#B6802A' }} />
                        Editar anticipo
                    </MenuItem>
                )}
                {filaSel?.estado !== 'Pagada' && (
                    <MenuItem onClick={abrirDescuento}>
                        <ReceiptLongIcon fontSize="small" sx={{ mr: 1, color: '#D9534F' }} />
                        Editar descuento
                    </MenuItem>
                )}
                {filaSel?.estado !== 'Pagada' && (
                    <MenuItem onClick={irAPagar}>
                        <PaidIcon fontSize="small" sx={{ mr: 1, color: '#2E9D78' }} />
                        Pagar
                    </MenuItem>
                )}
                {filaSel?.estado === 'Pagada' && (
                    <MenuItem disabled>
                        Esta planilla ya fue pagada
                    </MenuItem>
                )}
            </Menu>

            {/* ============================================================ */}
            {/* Dialog: Registrar anticipo                                   */}
            {/* ============================================================ */}
            <Dialog open={anticipoAbierto} onClose={() => setAnticipoAbierto(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#FDF0D5', color: '#B6802A', display: 'grid', placeItems: 'center' }}>
                        <SavingsIcon fontSize="small" />
                    </Box>
                    Editar anticipo
                </DialogTitle>
                <DialogContent dividers>
                    {filaSel && (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                El anticipo se descuenta del neto de <strong>{filaSel.empleado}</strong> ({filaSel.cargo})
                                en el periodo <strong>{filaSel.periodo}</strong>.
                            </Typography>

                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Total de anticipos del periodo</Typography>
                            <TextField fullWidth size="small" type="number" value={anticipoDraft.monto}
                                onChange={(e) => setAnticipoDraft((p) => ({ ...p, monto: e.target.value }))}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> } }}
                                sx={{ mb: 2 }} />

                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Motivo (opcional)</Typography>
                            <TextField fullWidth size="small" value={anticipoDraft.motivo}
                                onChange={(e) => setAnticipoDraft((p) => ({ ...p, motivo: e.target.value }))}
                                placeholder="Ej. Urgencia familiar" sx={{ mb: 2 }} />

                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: '#E4EEF5', borderRadius: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>Nuevo neto a pagar</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    {formatBs((Number(filaSel.salarioBase) || 0) + (Number(filaSel.bonos) || 0) - (Number(anticipoDraft.monto) || 0) - (Number(filaSel.otrosDesc) || 0))}
                                </Typography>
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setAnticipoAbierto(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={confirmarAnticipo}>Guardar anticipo</Button>
                </DialogActions>
            </Dialog>

            {/* ============================================================ */}
            {/* Dialog: Registrar descuento                                  */}
            {/* ============================================================ */}
            <Dialog open={descAbierto} onClose={() => setDescAbierto(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#FBEAE9', color: '#D9534F', display: 'grid', placeItems: 'center' }}>
                        <ReceiptLongIcon fontSize="small" />
                    </Box>
                    Editar descuento
                </DialogTitle>
                <DialogContent dividers>
                    {filaSel && (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                El descuento se aplica a <strong>{filaSel.empleado}</strong> ({filaSel.cargo})
                                en el periodo <strong>{filaSel.periodo}</strong>. El motivo es obligatorio.
                            </Typography>

                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Tipo de descuento</Typography>
                            <Select fullWidth size="small" value={descDraft.tipo}
                                onChange={(e) => setDescDraft((p) => ({ ...p, tipo: e.target.value }))}
                                sx={{ mb: 2 }}>
                                {TIPOS_DESCUENTO.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </Select>

                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Monto del descuento</Typography>
                            <TextField fullWidth size="small" type="number" value={descDraft.monto}
                                onChange={(e) => setDescDraft((p) => ({ ...p, monto: e.target.value }))}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> } }}
                                sx={{ mb: 2 }} />

                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Motivo (obligatorio)</Typography>
                            <TextField fullWidth size="small" value={descDraft.motivo}
                                onChange={(e) => setDescDraft((p) => ({ ...p, motivo: e.target.value }))}
                                placeholder="Ej. Rotura de equipo de limpieza por descuido"
                                multiline minRows={2}
                                sx={{ mb: 2 }} />

                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: '#E4EEF5', borderRadius: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>Nuevo neto a pagar</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    {formatBs((Number(filaSel.salarioBase) || 0) + (Number(filaSel.bonos) || 0) - (Number(filaSel.anticipos) || 0) - (Number(descDraft.monto) || 0))}
                                </Typography>
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setDescAbierto(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={confirmarDescuento}>Aplicar descuento</Button>
                </DialogActions>
            </Dialog>

            {/* ============================================================ */}
            {/* Dialog: Ver detalle de la fila                               */}
            {/* ============================================================ */}
            <Dialog open={detalleAbierto} onClose={() => setDetalleAbierto(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#E4EEF5', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                        <VisibilityIcon fontSize="small" />
                    </Box>
                    Detalle de la planilla
                </DialogTitle>
                <DialogContent dividers>
                    {filaSel && (
                        <>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                                <Box sx={{ bgcolor: '#E4EEF5', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Empleado</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{filaSel.empleado}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#E4EEF5', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Cargo</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{filaSel.cargo}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#E4EEF5', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Periodo</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{filaSel.periodo}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#E4EEF5', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Estado</Typography>
                                    <Chip label={filaSel.estado} size="small" sx={{ ...estadoChipSx(filaSel.estado), mt: 0.5 }} />
                                </Box>
                            </Box>

                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Composicion del neto</Typography>
                            <Box sx={{ bgcolor: '#F8FAFC', border: '1px solid #CFDCEA', borderRadius: 2, p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">Salario base</Typography>
                                    <Typography variant="body2">{formatBs(filaSel.salarioBase)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">+ Bonos</Typography>
                                    <Typography variant="body2" sx={{ color: '#2E9D78' }}>{formatBs(filaSel.bonos || 0)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">− Anticipos</Typography>
                                    <Typography variant="body2" sx={{ color: '#D9534F' }}>{formatBs(filaSel.anticipos || 0)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">− Otros descuentos</Typography>
                                    <Typography variant="body2" sx={{ color: '#D9534F' }}>{formatBs(filaSel.otrosDesc || 0)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderTop: '1px dashed #CFDCEA', mt: 0.5, pt: 0.75 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Neto a pagar</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBs(filaSel.neto)}</Typography>
                                </Box>
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="contained" onClick={() => setDetalleAbierto(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: '100%' }}>
                    {snack.msg}
                </Alert>
            </Snackbar>

            {/* ============================================================ */}
            {/* Dialog: Generar planilla (vista previa)                      */}
            {/* ============================================================ */}
            <Dialog open={generarAbierto} onClose={() => setGenerarAbierto(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Generar planilla</DialogTitle>
                <DialogContent dividers>
                    {periodosGenerables.length === 0 ? (
                        <Alert severity="info">
                            Todas las planillas de los meses cerrados ya estan generadas. La de {periodoActual} se podra
                            generar cuando el mes termine.
                        </Alert>
                    ) : (
                        <>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                            <Select size="small" value={periodoGen} onChange={(e) => setPeriodoGen(e.target.value)} sx={{ minWidth: 220, mb: 2 }}>
                                {periodosGenerables.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                            </Select>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                Salario fijo de cada cargo, menos los anticipos y descuentos registrados durante el mes.
                                Los bonos se agregan despues desde Historial de pagos.
                            </Typography>
                            <Box sx={{ overflowX: 'auto' }}>
                                <Table size="small" sx={{ minWidth: 620 }}>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#F3F6FA' }}>
                                            <TableCell><strong>Empleado</strong></TableCell>
                                            <TableCell><strong>Cargo</strong></TableCell>
                                            <TableCell align="right"><strong>Salario base</strong></TableCell>
                                            <TableCell align="right"><strong>Anticipos</strong></TableCell>
                                            <TableCell align="right"><strong>Descuentos</strong></TableCell>
                                            <TableCell align="right"><strong>Neto</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {previa.map((f) => (
                                            <TableRow key={f.empleadoId}>
                                                <TableCell sx={{ fontWeight: 600 }}>{f.empleado}</TableCell>
                                                <TableCell>{f.cargo}</TableCell>
                                                <TableCell align="right">{formatBs(f.salarioBase)}</TableCell>
                                                <TableCell align="right" sx={{ color: f.anticipos ? '#B6802A' : 'text.secondary' }}>
                                                    {f.anticipos ? `- ${formatBs(f.anticipos)}` : '—'}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: f.otrosDesc ? '#D9534F' : 'text.secondary' }}>
                                                    {f.otrosDesc ? `- ${formatBs(f.otrosDesc)}` : '—'}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatBs(f.neto)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, p: 1.5, bgcolor: '#E4EEF5', borderRadius: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>Total neto ({previa.length} empleados)</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    {formatBs(previa.reduce((t, f) => t + f.neto, 0))}
                                </Typography>
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setGenerarAbierto(false)}>Cancelar</Button>
                    <Button variant="contained" disabled={!periodoGen || previa.length === 0} onClick={confirmarGenerar}>
                        Generar planilla
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ============================================================ */}
            {/* Dialog: Anticipos y descuentos del mes en curso              */}
            {/* ============================================================ */}
            <Dialog open={novAbierto} onClose={() => setNovAbierto(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlaylistAddIcon sx={{ color: '#1F5F8B' }} /> Anticipos y descuentos de {periodoActual}
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Registra lo que ocurre durante el mes. Cuando el mes termine y generes la planilla de
                        <strong> {periodoActual}</strong>, se descontara del neto de cada empleado. Un <strong>anticipo</strong> es
                        dinero que se entrega hoy (queda como pago y gasto); un <strong>descuento</strong> no mueve dinero (rotura, ajuste...).
                    </Typography>
                    <ToggleButtonGroup exclusive size="small" value={nov.tipo} sx={{ mb: 2 }}
                        onChange={(_, v) => { if (v) cambiarNov('tipo', v); }}>
                        <ToggleButton value="Anticipo">Anticipo</ToggleButton>
                        <ToggleButton value="Descuento">Descuento</ToggleButton>
                    </ToggleButtonGroup>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Box sx={{ flex: 2, minWidth: 220 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Empleado</Typography>
                            <Select fullWidth size="small" displayEmpty value={nov.empleadoId} onChange={(e) => cambiarNov('empleadoId', e.target.value)}>
                                <MenuItem value=""><em>Elige un empleado</em></MenuItem>
                                {EMPLEADOS_MOCK.filter((e) => e.estado === 'Activo').map((e) => (
                                    <MenuItem key={e.id} value={e.id}>{e.nombre} · {e.cargo}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                        {nov.tipo === 'Descuento' ? (
                            <Box sx={{ flex: 1, minWidth: 170 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Tipo de descuento</Typography>
                                <Select fullWidth size="small" value={nov.subtipo} onChange={(e) => cambiarNov('subtipo', e.target.value)}>
                                    {TIPOS_DESCUENTO.filter((t) => t !== 'Anticipo salarial').map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                </Select>
                            </Box>
                        ) : (
                            <Box sx={{ flex: 1, minWidth: 170 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Medio de entrega</Typography>
                                <Select fullWidth size="small" value={nov.medio} onChange={(e) => cambiarNov('medio', e.target.value)}>
                                    {MEDIOS_PAGO_PERSONAL.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                </Select>
                            </Box>
                        )}
                        <Box sx={{ flex: 1, minWidth: 140 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Monto</Typography>
                            <TextField fullWidth size="small" type="number" placeholder="0" value={nov.monto}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> }, htmlInput: { min: 0, step: 0.01 } }}
                                onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                                onChange={(e) => cambiarNov('monto', e.target.value)} />
                        </Box>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Motivo</Typography>
                    <TextField fullWidth size="small" value={nov.motivo}
                        placeholder={nov.tipo === 'Anticipo' ? 'Ej. Urgencia familiar' : 'Ej. Rotura de vidrio en porteria'}
                        slotProps={{ htmlInput: { maxLength: 150 } }}
                        onChange={(e) => cambiarNov('motivo', e.target.value)} sx={{ mb: 2 }} />
                    {novError && <Alert severity="error" sx={{ mb: 2 }}>{novError}</Alert>}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={guardarNov}>Registrar {nov.tipo.toLowerCase()}</Button>
                    </Box>

                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Pendientes de {periodoActual}</Typography>
                    {novedadesMes.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">Todavia no hay anticipos ni descuentos este mes.</Typography>
                    ) : (
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 600 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F3F6FA' }}>
                                        <TableCell><strong>Fecha</strong></TableCell>
                                        <TableCell><strong>Empleado</strong></TableCell>
                                        <TableCell><strong>Tipo</strong></TableCell>
                                        <TableCell><strong>Motivo</strong></TableCell>
                                        <TableCell align="right"><strong>Monto</strong></TableCell>
                                        <TableCell align="center"><strong>Quitar</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {novedadesMes.map((n) => (
                                        <TableRow key={n.id}>
                                            <TableCell>{n.fecha}</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{nombreEmpleado(n.empleadoId)}</TableCell>
                                            <TableCell>{n.tipo === 'Anticipo' ? 'Anticipo' : n.subtipo}</TableCell>
                                            <TableCell>{n.motivo}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>{formatBs(n.monto)}</TableCell>
                                            <TableCell align="center">
                                                <IconButton size="small" onClick={() => quitarNov(n.id)} sx={{ color: '#D9534F' }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setNovAbierto(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}