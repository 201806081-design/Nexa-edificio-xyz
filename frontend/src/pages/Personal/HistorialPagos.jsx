import { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Chip, Select, MenuItem, TextField,
    Table, TableHead, TableBody, TableRow, TableCell, IconButton, InputAdornment, Alert, Snackbar,
    Dialog, DialogTitle, DialogContent, DialogActions, Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DescriptionIcon from '@mui/icons-material/Description';
import PaidIcon from '@mui/icons-material/Paid';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    PAGOS_PERSONAL_MOCK, PLANILLA_MOCK, RESUMEN_PAGOS_PERSONAL, RESUMEN_PLANILLA,
    ESTADOS_PAGO_PERSONAL, EMPLEADOS_MOCK, MEDIOS_PAGO_PERSONAL, CONCEPTOS_PAGO,
    nombreEmpleado, cargoEmpleado,
} from '../../constants/personalMock';
import { PERIODOS, formatBs } from '../../constants/finanzasMock';

const PERIODOS_PAGOS = ['Noviembre 2026', ...PERIODOS.filter((p) => p !== 'Noviembre 2026')];

const estadoChipSx = (estado) => {
    if (estado === 'Pagado') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Pendiente') return { bgcolor: '#FDF0D5', color: '#B6802A' };
    return { bgcolor: '#FBEAE9', color: '#D9534F' };
};

// Normalizadores de periodo entre "Nov. 2026" (en PAGOS) y "Noviembre 2026" (en PLANILLA)
const MESES_LARGOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_CORTOS = {
    Enero: 'Ene.', Febrero: 'Feb.', Marzo: 'Mar.', Abril: 'Abr.', Mayo: 'May.',
    Junio: 'Jun.', Julio: 'Jul.', Agosto: 'Ago.', Septiembre: 'Sep.', Octubre: 'Oct.',
    Noviembre: 'Nov.', Diciembre: 'Dic.'
};
const periodoCorto = (p) => {
    if (!p) return '';
    const [mes, anio] = p.split(' ');
    return `${MESES_CORTOS[mes] || mes} ${anio}`;
};
const periodoLargo = (p) => {
    if (!p) return '';
    const [mes, anio] = p.split(' ');
    const corto = Object.keys(MESES_CORTOS).find((k) => MESES_CORTOS[k] === mes);
    if (corto) return `${corto} ${anio}`;
    return p;
};

// Siguiente PE-XXXX
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

// Periodo "largo" segun la fecha del sistema (ej. "Noviembre 2027")
const periodoActualSistema = () => {
    const d = new Date();
    return `${MESES_LARGOS[d.getMonth()]} ${d.getFullYear()}`;
};

// Recalcula los resumenes globales
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

export default function HistorialPagos() {
    const location = useLocation();
    const [periodo, setPeriodo] = useState('Noviembre 2026');
    const [estado, setEstado] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');
    const [tick, setTick] = useState(0);
    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    // Tick cada 5s para que si cambian la fecha del sistema, el "periodo actual"
    // y los calculos derivados se refresquen solos (mismo patron que Mora.jsx).
    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 5000);
        return () => clearInterval(id);
    }, []);

    // Modales
    const [registrarAbierto, setRegistrarAbierto] = useState(false);
    const [pagoDraft, setPagoDraft] = useState({
        empleadoId: '', concepto: 'Salario', periodo: 'Noviembre 2026',
        monto: 0, fecha: fechaHoyBonita(),
        medio: 'Transferencia', referencia: '', motivo: '',
    });

    const [detalleAbierto, setDetalleAbierto] = useState(false);
    const [detalleSel, setDetalleSel] = useState(null);

    // Autocarga desde Planilla: viene con location.state.registrarPrecargado
    useEffect(() => {
        const s = location.state;
        if (s?.registrarPrecargado) {
            const pre = s.registrarPrecargado;
            // Si trae su periodo (largo), lo usamos para filtrar la vista tambien
            if (pre.periodoPlanilla) setPeriodo(pre.periodoPlanilla);
            setPagoDraft({
                empleadoId: pre.empleadoId || '',
                concepto: pre.concepto || 'Salario',
                periodo: pre.periodoPlanilla || periodoLargo(pre.periodo) || 'Noviembre 2026',
                monto: pre.montoNeto || 0,
                fecha: fechaHoyBonita(),
                medio: 'Transferencia',
                referencia: '',
                motivo: '',
            });
            setRegistrarAbierto(true);
            window.history.replaceState({}, '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Lista derivada del periodo: pagos reales + pendientes de la planilla
    // sin pago asociado (asi los "generar planilla" aparecen al toque como pendientes).
    const filas = useMemo(() => {
        const periodoCort = periodoCorto(periodo);
        // 1) Pagos reales (pagados o pendientes) del periodo
        const pagosDelPeriodo = PAGOS_PERSONAL_MOCK.filter((p) => p.periodo === periodoCort);
        // 2) Empleados en planilla del periodo que no tienen pago asociado -> pendientes derivados
        const idsConPago = new Set(pagosDelPeriodo.map((p) => p.empleadoId));
        const pendientesPlanilla = PLANILLA_MOCK
            .filter((pl) => pl.periodo === periodo && pl.estado !== 'Pagada' && !idsConPago.has(pl.empleadoId))
            .map((pl) => ({
                id: null, fecha: null, empleadoId: pl.empleadoId,
                empleado: nombreEmpleado(pl.empleadoId), periodo: periodoCort,
                concepto: 'Salario', medio: null, referencia: null,
                montoNeto: pl.neto, estado: 'Pendiente',
            }));
        const combinadas = [...pagosDelPeriodo, ...pendientesPlanilla];
        // 3) Filtros de UI
        const q = busqueda.trim().toLowerCase();
        return combinadas
            .filter((p) => estado === 'Todos' || p.estado === estado)
            .filter((p) => !q || `${p.empleado || ''} ${p.id || ''}`.toLowerCase().includes(q));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periodo, estado, busqueda, tick]);

    // Resumen reactivo al periodo
    const resumenPeriodo = useMemo(() => {
        const periodoCort = periodoCorto(periodo);
        const pagosDelPeriodo = PAGOS_PERSONAL_MOCK.filter((p) => p.periodo === periodoCort);
        const idsConPago = new Set(pagosDelPeriodo.map((p) => p.empleadoId));
        const pendientesPlanilla = PLANILLA_MOCK
            .filter((pl) => pl.periodo === periodo && pl.estado !== 'Pagada' && !idsConPago.has(pl.empleadoId));
        const pagados = pagosDelPeriodo.filter((p) => p.estado === 'Pagado');
        const pendientesPagos = pagosDelPeriodo.filter((p) => p.estado === 'Pendiente');
        return {
            pagadoEnMes: pagados.reduce((s, p) => s + (p.montoNeto || 0), 0),
            pagosConfirmados: pagados.length,
            pendiente: pendientesPagos.reduce((s, p) => s + (p.montoNeto || 0), 0)
                + pendientesPlanilla.reduce((s, p) => s + (p.neto || 0), 0),
            empleadosPendientes: pendientesPagos.length + pendientesPlanilla.length,
            comprobantes: pagados.length,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periodo, tick]);

    const periodoHoy = periodoActualSistema();

    // --- Registrar pago ---
    const abrirRegistrar = () => {
        setPagoDraft({
            empleadoId: '', concepto: 'Salario', periodo,
            monto: 0, fecha: fechaHoyBonita(),
            medio: 'Transferencia', referencia: '', motivo: '',
        });
        setRegistrarAbierto(true);
    };
    const cambiarEmpleadoDraft = (empleadoId) => {
        // Al elegir empleado, si concepto=Salario y hay planilla del periodo, precargar monto
        setPagoDraft((prev) => {
            let monto = prev.monto;
            if (prev.concepto === 'Salario') {
                const fp = PLANILLA_MOCK.find((p) => p.empleadoId === empleadoId && p.periodo === prev.periodo);
                monto = fp ? fp.neto : 0;
            }
            return { ...prev, empleadoId, monto };
        });
    };
    const cambiarConceptoDraft = (concepto) => {
        setPagoDraft((prev) => {
            let monto = prev.monto;
            if (concepto === 'Salario' && prev.empleadoId) {
                const fp = PLANILLA_MOCK.find((p) => p.empleadoId === prev.empleadoId && p.periodo === prev.periodo);
                monto = fp ? fp.neto : 0;
            } else if (concepto !== 'Salario') {
                monto = 0;
            }
            return { ...prev, concepto, monto };
        });
    };
    const cambiarPeriodoDraft = (nuevoPeriodo) => {
        setPagoDraft((prev) => {
            let monto = prev.monto;
            if (prev.concepto === 'Salario' && prev.empleadoId) {
                const fp = PLANILLA_MOCK.find((p) => p.empleadoId === prev.empleadoId && p.periodo === nuevoPeriodo);
                monto = fp ? fp.neto : 0;
            }
            return { ...prev, periodo: nuevoPeriodo, monto };
        });
    };

    // Guard: ¿el empleado seleccionado ya tiene un pago (concepto Salario) para
    // este periodo? Si si, no se permite registrar otro pago (evita duplicados).
    const yaPagadoSalario = useMemo(() => {
        if (!pagoDraft.empleadoId || pagoDraft.concepto !== 'Salario') return null;
        const periodoCortoStr = periodoCorto(pagoDraft.periodo);
        return PAGOS_PERSONAL_MOCK.find(
            (p) => p.empleadoId === pagoDraft.empleadoId
                && p.periodo === periodoCortoStr
                && p.estado === 'Pagado'
                && p.concepto === 'Salario'
        ) || null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagoDraft, tick]);
    const confirmarRegistrar = () => {
        const { empleadoId, concepto, periodo: periodoDraft, monto, fecha, medio, referencia, motivo } = pagoDraft;
        const montoNum = Number(monto) || 0;
        if (!empleadoId) {
            setSnack({ open: true, msg: 'Selecciona un empleado', sev: 'warning' });
            return;
        }
        if (montoNum <= 0) {
            setSnack({ open: true, msg: 'Ingresa un monto valido', sev: 'warning' });
            return;
        }
        if (medio !== 'Efectivo' && !referencia.trim()) {
            setSnack({ open: true, msg: `Falta la referencia (N.º de ${medio.toLowerCase()})`, sev: 'warning' });
            return;
        }
        if ((concepto === 'Anticipo' || concepto === 'Bono') && !motivo.trim()) {
            setSnack({ open: true, msg: `El motivo del ${concepto.toLowerCase()} es obligatorio`, sev: 'warning' });
            return;
        }

        // Guard anti-doble-pago: si ya hay un Salario pagado para este empleado+periodo, abortar
        if (concepto === 'Salario') {
            const yaExiste = PAGOS_PERSONAL_MOCK.find(
                (p) => p.empleadoId === empleadoId
                    && p.periodo === periodoCorto(periodoDraft)
                    && p.estado === 'Pagado'
                    && p.concepto === 'Salario'
            );
            if (yaExiste) {
                setSnack({
                    open: true,
                    msg: `${nombreEmpleado(empleadoId)} ya tiene su salario pagado (${yaExiste.id}) en ${periodoDraft}`,
                    sev: 'error',
                });
                return;
            }
        }

        const codigo = siguienteCodigoPago();
        const empleadoNombre = nombreEmpleado(empleadoId);
        const periodoCortoStr = periodoCorto(periodoDraft);

        // Si concepto = Salario y hay fila pendiente en PAGOS_PERSONAL_MOCK, reemplazar;
        // si no, agregar nuevo.
        const pagoExistente = PAGOS_PERSONAL_MOCK.find(
            (p) => p.empleadoId === empleadoId && p.periodo === periodoCortoStr
                && p.estado === 'Pendiente' && p.concepto === 'Salario'
        );
        if (concepto === 'Salario' && pagoExistente) {
            pagoExistente.id = codigo;
            pagoExistente.fecha = fecha;
            pagoExistente.medio = medio;
            pagoExistente.referencia = referencia || null;
            pagoExistente.montoNeto = montoNum;
            pagoExistente.estado = 'Pagado';
        } else {
            PAGOS_PERSONAL_MOCK.push({
                id: codigo, fecha, empleadoId, empleado: empleadoNombre,
                periodo: periodoCortoStr, concepto,
                medio, referencia: referencia || null,
                montoNeto: montoNum, estado: 'Pagado',
                motivo: motivo || null,
            });
        }

        // Si concepto = Salario, marcar la planilla como Pagada
        if (concepto === 'Salario') {
            const fp = PLANILLA_MOCK.find((p) => p.empleadoId === empleadoId && p.periodo === periodoDraft);
            if (fp) fp.estado = 'Pagada';
        }
        // Si concepto = Anticipo, sumar al campo anticipos de la planilla (reduce el neto)
        if (concepto === 'Anticipo') {
            const fp = PLANILLA_MOCK.find((p) => p.empleadoId === empleadoId && p.periodo === periodoDraft);
            if (fp) {
                fp.anticipos = (fp.anticipos || 0) + montoNum;
                fp.neto = (fp.salarioBase || 0) + (fp.bonos || 0) - (fp.anticipos || 0) - (fp.otrosDesc || 0);
            }
        }
        // Si concepto = Bono, sumar al campo bonos de la planilla (aumenta el neto)
        if (concepto === 'Bono') {
            const fp = PLANILLA_MOCK.find((p) => p.empleadoId === empleadoId && p.periodo === periodoDraft);
            if (fp) {
                fp.bonos = (fp.bonos || 0) + montoNum;
                fp.neto = (fp.salarioBase || 0) + (fp.bonos || 0) - (fp.anticipos || 0) - (fp.otrosDesc || 0);
            }
        }

        recalcularResumenes();
        setRegistrarAbierto(false);
        setTick((t) => t + 1);
        setSnack({ open: true, msg: `Pago ${codigo} registrado (${concepto}) para ${empleadoNombre}`, sev: 'success' });
    };

    // --- Ver detalle ---
    const abrirDetalle = (p) => {
        setDetalleSel(p);
        setDetalleAbierto(true);
    };

    const exportar = () => {
        setSnack({ open: true, msg: `Historial de ${periodo} exportado (simulado)`, sev: 'success' });
    };

    const empleadosActivos = EMPLEADOS_MOCK.filter((e) => e.estado === 'Activo');
    const cargoDraft = pagoDraft.empleadoId ? cargoEmpleado(pagoDraft.empleadoId) : '';

    return (
        <DashboardLayout>
            {/* Encabezado */}
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Historial de pagos de empleados</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Consulta pagos realizados y abre el detalle de cada comprobante. Fecha actual del sistema: {periodoHoy}.
            </Typography>

            {/* Barra de acciones (al nivel de Planilla) */}
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={abrirRegistrar}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Registrar pago
                </Button>
            </Box>

            {/* Tarjetas de resumen (reactivas al periodo seleccionado) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#E4F4EE', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, color: '#2E9D78', display: 'grid', placeItems: 'center' }}>
                        <CheckCircleIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Pagado en {periodo}</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(resumenPeriodo.pagadoEnMes)}</Typography>
                        <Typography variant="caption" color="text.secondary">{resumenPeriodo.pagosConfirmados} pagos confirmados</Typography>
                    </Box>
                </Paper>
                <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#FDF0D5', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, color: '#B6802A', display: 'grid', placeItems: 'center' }}>
                        <ScheduleIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Pendiente</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#B6802A' }}>{formatBs(resumenPeriodo.pendiente)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {resumenPeriodo.empleadosPendientes} {resumenPeriodo.empleadosPendientes === 1 ? 'empleado' : 'empleados'}
                        </Typography>
                    </Box>
                </Paper>
                <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#E4EEF5', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                        <DescriptionIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Comprobantes de {periodo}</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>{resumenPeriodo.comprobantes} emitidos</Typography>
                        <Typography variant="caption" color="text.secondary">PDF disponibles</Typography>
                    </Box>
                </Paper>
            </Box>

            {/* Filtros (sin boton "Filtrar") */}
            <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <Box sx={{ flex: 2, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Buscar</Typography>
                        <TextField fullWidth size="small" placeholder="Buscar empleado o N.º de pago"
                            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                                    )
                                }
                            }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 160 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Periodo</Typography>
                        <Select fullWidth size="small" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                            {PERIODOS_PAGOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </Select>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 140 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Estado</Typography>
                        <Select fullWidth size="small" value={estado} onChange={(e) => setEstado(e.target.value)}>
                            {ESTADOS_PAGO_PERSONAL.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </Box>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportar}
                        sx={{ color: '#1a2733', borderColor: '#cdd8e3' }}>
                        Exportar historial
                    </Button>
                </Box>
            </Paper>

            {/* Tabla pagos registrados */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Pagos de {periodo}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {filas.length} {filas.length === 1 ? 'registro' : 'registros'}
                    </Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 900 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>N.º pago</strong></TableCell>
                                <TableCell><strong>Fecha</strong></TableCell>
                                <TableCell><strong>Empleado</strong></TableCell>
                                <TableCell><strong>Periodo</strong></TableCell>
                                <TableCell><strong>Concepto</strong></TableCell>
                                <TableCell><strong>Medio</strong></TableCell>
                                <TableCell><strong>Monto neto</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell align="center"><strong>Detalle</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                        Sin pagos para los filtros aplicados. Genera la planilla del periodo o registra un pago.
                                    </TableCell>
                                </TableRow>
                            ) : filas.map((f, idx) => (
                                <TableRow key={f.id || `pending-${f.empleadoId}-${idx}`}>
                                    <TableCell sx={{ fontWeight: 600, color: f.id ? 'primary.main' : 'text.secondary' }}>
                                        {f.id || '—'}
                                    </TableCell>
                                    <TableCell>{f.fecha || '—'}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{f.empleado}</TableCell>
                                    <TableCell>{f.periodo}</TableCell>
                                    <TableCell>{f.concepto}</TableCell>
                                    <TableCell>{f.medio || '—'}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{formatBs(f.montoNeto)}</TableCell>
                                    <TableCell><Chip label={f.estado} size="small" sx={estadoChipSx(f.estado)} /></TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" color="primary" onClick={() => abrirDetalle(f)}>
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>

                <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', mt: 2 }}>
                    <Typography variant="body2">
                        Los pendientes se derivan de la planilla no pagada. Si cambias la fecha del sistema a otro mes, los
                        pagos no realizados de meses anteriores quedan como deuda del empleado.
                    </Typography>
                </Alert>
            </Paper>

            {/* ============================================================ */}
            {/* Dialog: Registrar pago                                       */}
            {/* ============================================================ */}
            <Dialog open={registrarAbierto} onClose={() => setRegistrarAbierto(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#E4F4EE', color: '#2E9D78', display: 'grid', placeItems: 'center' }}>
                        <PaidIcon fontSize="small" />
                    </Box>
                    Registrar pago
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Registra un pago para un empleado. Si es salario, se marca su planilla como pagada.
                        Si es anticipo o bono, se refleja en la planilla del periodo correspondiente.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 220 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Empleado</Typography>
                            <Select fullWidth size="small" displayEmpty value={pagoDraft.empleadoId}
                                onChange={(e) => cambiarEmpleadoDraft(e.target.value)}>
                                <MenuItem value=""><em>Selecciona un empleado</em></MenuItem>
                                {empleadosActivos.map((e) => (
                                    <MenuItem key={e.id} value={e.id}>{e.id} — {e.nombre}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 160 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Cargo</Typography>
                            <TextField fullWidth size="small" value={cargoDraft} disabled />
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 160 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Concepto</Typography>
                            <Select fullWidth size="small" value={pagoDraft.concepto}
                                onChange={(e) => cambiarConceptoDraft(e.target.value)}>
                                {CONCEPTOS_PAGO.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                            </Select>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 160 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                            <Select fullWidth size="small" value={pagoDraft.periodo}
                                onChange={(e) => cambiarPeriodoDraft(e.target.value)}>
                                {PERIODOS_PAGOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                            </Select>
                        </Box>
                    </Box>

                    {/* Alerta: evitar doble pago de salario para el mismo periodo */}
                    {yaPagadoSalario && (
                        <Alert severity="error" icon={false} sx={{ bgcolor: '#FBEAE9', color: '#D9534F', mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                Este empleado ya cobro su salario de {pagoDraft.periodo}
                            </Typography>
                            <Typography variant="body2">
                                Pago registrado: <strong>{yaPagadoSalario.id}</strong> · {yaPagadoSalario.fecha} ·
                                {' '}{yaPagadoSalario.medio} · {formatBs(yaPagadoSalario.montoNeto)}.
                                No se puede registrar un segundo pago para el mismo periodo. Si queres cambiar algo,
                                cambia el periodo o elige otro empleado.
                            </Typography>
                        </Alert>
                    )}

                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {pagoDraft.concepto === 'Salario' ? 'Monto neto a pagar' : `Monto del ${pagoDraft.concepto.toLowerCase()}`}
                    </Typography>
                    <TextField fullWidth size="small" type="number" value={pagoDraft.monto}
                        onChange={(e) => setPagoDraft((p) => ({ ...p, monto: e.target.value }))}
                        disabled={pagoDraft.concepto === 'Salario' && !!pagoDraft.empleadoId}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> } }}
                        sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 140 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Fecha</Typography>
                            <TextField fullWidth size="small" value={pagoDraft.fecha}
                                onChange={(e) => setPagoDraft((p) => ({ ...p, fecha: e.target.value }))} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 160 }}>
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
                        placeholder={pagoDraft.medio === 'Efectivo' ? 'REC-00000' : '1234567890'}
                        sx={{ mb: 2 }} />

                    {(pagoDraft.concepto === 'Anticipo' || pagoDraft.concepto === 'Bono') && (
                        <>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                Motivo del {pagoDraft.concepto.toLowerCase()} (obligatorio)
                            </Typography>
                            <TextField fullWidth size="small" value={pagoDraft.motivo}
                                onChange={(e) => setPagoDraft((p) => ({ ...p, motivo: e.target.value }))}
                                placeholder={pagoDraft.concepto === 'Anticipo' ? 'Ej. Urgencia familiar' : 'Ej. Bono por buen desempeno'}
                                multiline minRows={2} />
                        </>
                    )}

                    {pagoDraft.concepto === 'Anticipo' && pagoDraft.monto > 0 && (
                        <Alert severity="warning" icon={false} sx={{ bgcolor: '#FDF0D5', color: '#8A5A00', mt: 2 }}>
                            <Typography variant="body2">
                                Se descontaran <strong>{formatBs(pagoDraft.monto)}</strong> del neto de la planilla de {pagoDraft.periodo}.
                            </Typography>
                        </Alert>
                    )}
                    {pagoDraft.concepto === 'Bono' && pagoDraft.monto > 0 && (
                        <Alert severity="success" icon={false} sx={{ bgcolor: '#E4F4EE', color: '#2E7D5B', mt: 2 }}>
                            <Typography variant="body2">
                                Se sumaran <strong>{formatBs(pagoDraft.monto)}</strong> al neto de la planilla de {pagoDraft.periodo}.
                            </Typography>
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setRegistrarAbierto(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={confirmarRegistrar} disabled={!!yaPagadoSalario}>
                        Confirmar pago
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ============================================================ */}
            {/* Dialog: Ver detalle del pago                                 */}
            {/* ============================================================ */}
            <Dialog open={detalleAbierto} onClose={() => setDetalleAbierto(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#E4EEF5', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                        <VisibilityIcon fontSize="small" />
                    </Box>
                    Detalle del pago {detalleSel?.id ? `· ${detalleSel.id}` : '· pendiente'}
                </DialogTitle>
                <DialogContent dividers>
                    {detalleSel && (
                        <>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                                <Box sx={{ bgcolor: '#E4EEF5', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Empleado</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{detalleSel.empleado}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#E4EEF5', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Periodo</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{detalleSel.periodo}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#E4EEF5', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Concepto</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{detalleSel.concepto}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#E4EEF5', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Estado</Typography>
                                    <Chip label={detalleSel.estado} size="small" sx={{ ...estadoChipSx(detalleSel.estado), mt: 0.5 }} />
                                </Box>
                                <Box sx={{ bgcolor: '#E4F4EE', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Monto neto</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(detalleSel.montoNeto)}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#FDF0D5', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Fecha</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#B6802A' }}>{detalleSel.fecha || '—'}</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Datos del pago</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Medio</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{detalleSel.medio || '—'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Referencia</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{detalleSel.referencia || '—'}</Typography>
                            </Box>
                            {detalleSel.motivo && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">Motivo</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right', maxWidth: 300 }}>{detalleSel.motivo}</Typography>
                                </Box>
                            )}

                            {detalleSel.estado === 'Pendiente' && (
                                <Alert severity="warning" icon={false} sx={{ bgcolor: '#FDF0D5', color: '#8A5A00', mt: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Pago pendiente</Typography>
                                    <Typography variant="body2">
                                        Usa el boton "Registrar pago" para ejecutarlo o entra desde la Planilla al menu de acciones.
                                    </Typography>
                                </Alert>
                            )}
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
        </DashboardLayout>
    );
}