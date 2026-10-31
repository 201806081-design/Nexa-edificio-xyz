import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, TextField, Select, MenuItem, Alert,
    InputAdornment, IconButton, Table, TableHead, TableBody, TableRow, TableCell,
    Dialog, DialogTitle, DialogContent, DialogActions, Divider, CircularProgress, Snackbar,
    Menu,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import PercentIcon from '@mui/icons-material/Percent';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventIcon from '@mui/icons-material/Event';
import CalculateIcon from '@mui/icons-material/Calculate';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PaidIcon from '@mui/icons-material/Paid';
import RestoreIcon from '@mui/icons-material/Restore';
import ScienceIcon from '@mui/icons-material/Science';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    CONFIG_MORA, APLICAR_MORA_DESDE, TIPOS_CALCULO, PERIODO_ACTUAL_MORA,
    REGLA_MORA, DEUDAS_VENCIDAS,
} from '../../constants/moraMock';
import { REGLAS_PERIODO, DIAS_VENCIMIENTO } from '../../constants/configuracionMock';
import { formatBs } from '../../constants/finanzasMock';

// Helpers de conversion mes "YYYY-MM" <-> "Octubre 2026"
const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const textoToYyyyMm = (texto) => {
    if (!texto) return '';
    const [mes, y] = String(texto).split(' ');
    const idx = MESES_ES.indexOf(mes);
    if (idx < 0 || !y) return '';
    return `${y}-${String(idx + 1).padStart(2, '0')}`;
};
const yyyyMmToTexto = (yyyyMm) => {
    if (!yyyyMm) return '';
    const [y, m] = yyyyMm.split('-');
    return `${MESES_ES[Number(m) - 1]} ${y}`;
};

// Fecha de hoy real en formato YYYY-MM-DD (para el modo simulacion)
const hoyIso = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Cuenta cuantas fechas de vencimiento (dia X de cada mes) pasaron desde que
// vencio por primera vez la deuda de ese periodo hasta la fecha de referencia.
// Ejemplo: deuda de "Septiembre 2026" con dia venc 10 vence el 10/oct/2026.
// Si fechaHoy = 30/oct/2026 -> 1 mes vencido. Si fechaHoy = 15/dic/2026 -> 3 meses.
const calcularMesesVencidos = (periodoTexto, fechaHoy, diaVenc) => {
    if (!periodoTexto || !fechaHoy) return 0;
    const [mesNombre, anio] = periodoTexto.split(' ');
    const idxMes = MESES_ES.indexOf(mesNombre);
    if (idxMes < 0 || !anio) return 0;
    // Primera fecha de vencimiento = dia diaVenc del mes siguiente al periodo
    const anioV = idxMes === 11 ? Number(anio) + 1 : Number(anio);
    const mesV = idxMes === 11 ? 0 : idxMes + 1;
    const fechaVenc = new Date(anioV, mesV, Number(diaVenc) || 10);
    if (fechaHoy < fechaVenc) return 0;
    let count = 0;
    const f = new Date(fechaVenc);
    while (f <= fechaHoy) {
        count++;
        f.setMonth(f.getMonth() + 1);
    }
    return count;
};

// Dato de la regla vigente (solo lectura, en recuadro con icono y color semantico)
function DatoRegla({ etiqueta, valor, icon, color, bg }) {
    return (
        <Box sx={{
            minWidth: 0,
            border: '1px solid #B8CDE0',
            boxShadow: '0 1px 3px rgba(19, 43, 62, 0.1), 0 4px 10px rgba(19, 43, 62, 0.08)',
            borderRadius: 2, p: 1.5, bgcolor: '#fff',
            display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
            <Box sx={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', bgcolor: bg, color, display: 'grid', placeItems: 'center' }}>
                {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary">{etiqueta}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color }}>{valor}</Typography>
            </Box>
        </Box>
    );
}

export default function Mora() {
    const navigate = useNavigate();
    const [config, setConfig] = useState({ ...CONFIG_MORA });
    // El dia de vencimiento es compartido con Configuracion financiera de Expensas.
    const [diaVencimiento, setDiaVencimiento] = useState(REGLAS_PERIODO.diaVencimiento);

    const [detalle, setDetalle] = useState(null);
    const [openConfig, setOpenConfig] = useState(false);
    const [cfgDraft, setCfgDraft] = useState({
        ...CONFIG_MORA,
        diaVencimiento: REGLAS_PERIODO.diaVencimiento,
        vigenciaMes: textoToYyyyMm(CONFIG_MORA.vigenteDesde),
    });
    const [openActualizar, setOpenActualizar] = useState(false);
    const [actualizando, setActualizando] = useState(false);
    const [exitoMsg, setExitoMsg] = useState('');

    // Fecha de referencia para calcular los meses vencidos. Por defecto, la fecha
    // real del sistema. El admin (o el docente en la demo) puede moverla hacia
    // adelante para simular como escalan las moras mes a mes sin esperar al tiempo real.
    const [fechaSimulada, setFechaSimulada] = useState(hoyIso());
    const esSimulacion = fechaSimulada !== hoyIso();

    // Menu de acciones por fila (ver detalle / registrar pago)
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [filaSel, setFilaSel] = useState(null);
    const abrirMenu = (e, f) => { setMenuAnchor(e.currentTarget); setFilaSel(f); };
    const cerrarMenu = () => setMenuAnchor(null);
    const verDetalle = () => { setDetalle(filaSel); cerrarMenu(); };
    const irARegistrarPago = () => {
        const f = filaSel;
        cerrarMenu();
        navigate('/finanzas/pagos/registrar', {
            state: {
                deptoPrecargado: f.depto,
                periodoPrecargado: f.periodo,
                montoPendiente: f.deudaActual, // incluye la mora acumulada ya calculada
            },
        });
    };

    // Calculo de la deuda segun la configuracion vigente Y la fecha simulada.
    // Al mover `fechaSimulada`, los meses vencidos de cada deuda se recalculan,
    // y la deuda actual escala segun CONFIG_MORA (compuesto o simple).
    const tasa = (Number(config.interesMensual) || 0) / 100;
    const filas = useMemo(() => {
        const refHoy = new Date(`${fechaSimulada}T12:00:00`);
        return DEUDAS_VENCIDAS.map((d) => {
            const meses = calcularMesesVencidos(d.periodo, refHoy, diaVencimiento);
            const deudaActual = config.tipoCalculo === 'Simple'
                ? d.deudaOriginal * (1 + tasa * meses)
                : d.deudaOriginal * (1 + tasa) ** meses;
            return { ...d, meses, interes: deudaActual - d.deudaOriginal, deudaActual };
        });
    }, [fechaSimulada, diaVencimiento, config.tipoCalculo, tasa]);
    const totalVencido = filas.reduce((acc, f) => acc + f.deudaActual, 0);

    const abrirConfig = () => {
        // Siempre leer el ultimo valor compartido (por si lo cambiaron en ConfiguracionFinanciera o v2)
        setCfgDraft({
            ...CONFIG_MORA,
            diaVencimiento: REGLAS_PERIODO.diaVencimiento,
            vigenciaMes: textoToYyyyMm(CONFIG_MORA.vigenteDesde),
        });
        setConfig({ ...CONFIG_MORA });
        setDiaVencimiento(REGLAS_PERIODO.diaVencimiento);
        setOpenConfig(true);
    };
    const guardarConfig = () => {
        const { diaVencimiento: nuevoDia, vigenciaMes, ...resto } = cfgDraft;
        const nuevoVigenteDesde = yyyyMmToTexto(vigenciaMes) || resto.vigenteDesde;
        const nuevaConfig = { ...resto, vigenteDesde: nuevoVigenteDesde };
        setConfig(nuevaConfig);
        // BUG FIX: mutar CONFIG_MORA para que sincronice con v2 y persista entre pantallas
        CONFIG_MORA.interesMensual = Number(nuevaConfig.interesMensual) || 0;
        CONFIG_MORA.aplicarMoraDesde = nuevaConfig.aplicarMoraDesde;
        CONFIG_MORA.tipoCalculo = nuevaConfig.tipoCalculo;
        CONFIG_MORA.vigenteDesde = nuevaConfig.vigenteDesde;
        // Sincroniza con la configuracion financiera (mutacion mock compartida)
        REGLAS_PERIODO.diaVencimiento = nuevoDia;
        setDiaVencimiento(nuevoDia);
        setOpenConfig(false);
        setExitoMsg('Configuracion de mora guardada y sincronizada');
    };
    const cambiarDraft = (campo, valor) => setCfgDraft((c) => ({ ...c, [campo]: valor }));

    const confirmarActualizacion = () => {
        setActualizando(true);
        setTimeout(() => {
            setActualizando(false);
            setOpenActualizar(false);
            setExitoMsg('Intereses actualizados correctamente');
        }, 1200);
    };

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Mora e intereses</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configura el porcentaje mensual y actualiza las deudas vencidas
            </Typography>

            {/* Regla de mora vigente (solo lectura) */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Regla de mora vigente</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, flex: 1, minWidth: 0 }}>
                        <DatoRegla etiqueta="Interes mensual" valor={`${config.interesMensual} %`}
                            icon={<PercentIcon />} color="#E5A33B" bg="#FDF0D5" />
                        <DatoRegla etiqueta="Aplicar desde" valor={config.aplicarMoraDesde}
                            icon={<EventIcon />} color="#1F5F8B" bg="#E4EEF5" />
                        <DatoRegla etiqueta="Tipo de calculo" valor={config.tipoCalculo}
                            icon={<CalculateIcon />} color="#8E6DD1" bg="#EFEAF8" />
                        <DatoRegla etiqueta="Dia de vencimiento" valor={`Dia ${diaVencimiento}`}
                            icon={<CalendarMonthIcon />} color="#2E9D78" bg="#E4F4EE" />
                    </Box>
                    <Button variant="outlined" startIcon={<SettingsIcon />} onClick={abrirConfig}
                        sx={{ color: '#1a2733', borderColor: '#cdd8e3', width: { xs: '100%', md: 'auto' }, flexShrink: 0 }}>
                        Configurar mora
                    </Button>
                </Box>
            </Paper>

            {/* Regla aplicada */}
            <Alert severity="warning" icon={false} sx={{ bgcolor: '#FDF0D5', color: '#8A5A00', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Regla aplicada</Typography>
                <Typography variant="body2">{REGLA_MORA.texto}</Typography>
                <Typography variant="body2">{REGLA_MORA.ejemplo}</Typography>
            </Alert>

            {/* Fecha de referencia (modo simulacion para demo) */}
            <Paper sx={{
                p: 2, borderRadius: 2, mb: 2,
                bgcolor: esSimulacion ? '#FDF0D5' : '#fff',
                border: esSimulacion ? '1px solid #E5A33B' : '1px solid #CFDCEA',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                        <Box sx={{
                            width: 40, height: 40, borderRadius: '50%',
                            bgcolor: esSimulacion ? '#F7E0B0' : '#E4EEF5',
                            color: esSimulacion ? '#8A5A00' : '#1F5F8B',
                            display: 'grid', placeItems: 'center', flexShrink: 0,
                        }}>
                            {esSimulacion ? <ScienceIcon /> : <CalendarMonthIcon />}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                Fecha de referencia {esSimulacion && '— modo simulacion'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {esSimulacion
                                    ? 'Las moras se recalculan con esta fecha. Util para simular como escalan los intereses mes a mes.'
                                    : 'Fecha actual del sistema. Cambialo para simular el paso del tiempo sin esperar.'}
                            </Typography>
                        </Box>
                    </Box>
                    <TextField type="date" size="small" value={fechaSimulada}
                        onChange={(e) => setFechaSimulada(e.target.value || hoyIso())}
                        sx={{ width: { xs: '100%', sm: 180 } }}
                        slotProps={{ inputLabel: { shrink: true } }} />
                    {esSimulacion && (
                        <Button variant="outlined" size="small" startIcon={<RestoreIcon />}
                            onClick={() => setFechaSimulada(hoyIso())}
                            sx={{ color: '#8A5A00', borderColor: '#E5A33B' }}>
                            Volver a hoy
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* Deudas vencidas */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Deudas vencidas</Typography>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 820 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Dpto.</strong></TableCell>
                                <TableCell><strong>Periodo</strong></TableCell>
                                <TableCell><strong>Deuda original</strong></TableCell>
                                <TableCell><strong>Meses</strong></TableCell>
                                <TableCell><strong>Tasa</strong></TableCell>
                                <TableCell><strong>Interes</strong></TableCell>
                                <TableCell><strong>Deuda actual</strong></TableCell>
                                <TableCell align="center"><strong>Accion</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filas.map((f) => (
                                <TableRow key={f.id}>
                                    <TableCell>{f.depto}</TableCell>
                                    <TableCell>{f.periodo}</TableCell>
                                    <TableCell>{formatBs(f.deudaOriginal)}</TableCell>
                                    <TableCell>{f.meses}</TableCell>
                                    <TableCell>{config.interesMensual} %</TableCell>
                                    <TableCell sx={{ color: '#D9534F', fontWeight: 600 }}>{formatBs(f.interes)}</TableCell>
                                    <TableCell sx={{ color: '#D9534F', fontWeight: 700 }}>{formatBs(f.deudaActual)}</TableCell>
                                    <TableCell align="center">
                                        <IconButton onClick={(e) => abrirMenu(e, f)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            </Paper>

            {/* Total de la deuda vencida */}
            <Paper sx={{ p: 2.5, borderRadius: 2, mb: 2, bgcolor: '#FBEAE9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 700, color: '#D9534F' }}>Total de deuda vencida</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#D9534F' }}>{formatBs(totalVencido)}</Typography>
            </Paper>

            {/* Actualizar intereses */}
            <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                <Button variant="contained" onClick={() => setOpenActualizar(true)} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Actualizar intereses
                </Button>
            </Box>

            {/* ===================== MODAL: CONFIGURAR MORA ===================== */}
            <Dialog open={openConfig} onClose={() => setOpenConfig(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#E4EEF5', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                        <SettingsIcon fontSize="small" />
                    </Box>
                    Configurar mora
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Define la regla que se aplicara a las deudas vencidas. Los valores se sincronizan
                        con <strong>Configuracion financiera v2</strong> y con <strong>Expensas v1</strong>.
                    </Typography>

                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Interes mensual (%)</Typography>
                    <TextField fullWidth type="number" value={cfgDraft.interesMensual}
                        onChange={(e) => cambiarDraft('interesMensual', e.target.value)} sx={{ mb: 2 }}
                        slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }} />

                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Aplicar mora desde</Typography>
                    <Select fullWidth value={cfgDraft.aplicarMoraDesde} onChange={(e) => cambiarDraft('aplicarMoraDesde', e.target.value)} sx={{ mb: 2 }}>
                        {APLICAR_MORA_DESDE.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                    </Select>

                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Dia de vencimiento</Typography>
                    <Select fullWidth value={cfgDraft.diaVencimiento} onChange={(e) => cambiarDraft('diaVencimiento', e.target.value)} sx={{ mb: 0.5 }}>
                        {DIAS_VENCIMIENTO.map((d) => <MenuItem key={d} value={d}>{`Dia ${d}`}</MenuItem>)}
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        Compartido con Configuracion financiera. Al cambiarlo aqui, tambien cambia alla.
                    </Typography>

                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Tipo de calculo</Typography>
                    <Select fullWidth value={cfgDraft.tipoCalculo} onChange={(e) => cambiarDraft('tipoCalculo', e.target.value)} sx={{ mb: 2 }}>
                        {TIPOS_CALCULO.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>

                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Vigente desde</Typography>
                    <TextField fullWidth type="month" value={cfgDraft.vigenciaMes || ''}
                        onChange={(e) => cambiarDraft('vigenciaMes', e.target.value)} sx={{ mb: 1 }} />
                    <Typography variant="caption" color="text.secondary">Los intereses ya aplicados conservaran la tasa anterior.</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setOpenConfig(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={guardarConfig}>Guardar configuracion</Button>
                </DialogActions>
            </Dialog>

            {/* ===================== MODAL: ACTUALIZAR INTERESES ===================== */}
            <Dialog open={openActualizar} onClose={() => !actualizando && setOpenActualizar(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#FBEAE9', color: '#D9534F', display: 'grid', placeItems: 'center' }}>
                        <PercentIcon fontSize="small" />
                    </Box>
                    Confirmar actualizacion de intereses
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Se calculara la mora pendiente del periodo actual.
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Resumen de la actualizacion</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2 }}>
                        <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 1.5 }}>
                            <Typography variant="body2" color="text.secondary">Periodo</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>{PERIODO_ACTUAL_MORA}</Typography>
                        </Box>
                        <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 1.5 }}>
                            <Typography variant="body2" color="text.secondary">Deudas por actualizar</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>{filas.length}</Typography>
                        </Box>
                        <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 1.5 }}>
                            <Typography variant="body2" color="text.secondary">Interes mensual</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>{config.interesMensual} %</Typography>
                        </Box>
                    </Box>
                    <Alert severity="warning" icon={false} sx={{ bgcolor: '#FDF0D5', color: '#8A5A00' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Calculo {config.tipoCalculo.toLowerCase()}</Typography>
                        <Typography variant="body2">Solo se aplicara el interes que aun no fue registrado. Presionar nuevamente no duplicara el cobro del mismo mes.</Typography>
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setOpenActualizar(false)} disabled={actualizando}>Cancelar</Button>
                    <Button variant="contained" onClick={confirmarActualizacion} disabled={actualizando}
                        startIcon={actualizando ? <CircularProgress size={16} color="inherit" /> : null}>
                        {actualizando ? 'Actualizando...' : 'Confirmar actualizacion'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ===================== MODAL: VER DETALLE DE DEUDA ===================== */}
            <Dialog open={!!detalle} onClose={() => setDetalle(null)} fullWidth maxWidth="sm">
                {detalle && (
                    <>
                        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                            Detalle de la deuda
                            <Button onClick={() => setDetalle(null)} sx={{ minWidth: 0, p: 0.5, color: 'text.secondary' }}><CloseIcon /></Button>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Departamento</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{detalle.depto}{detalle.tipo ? ` — Tipo ${detalle.tipo}` : ''}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Periodo</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{detalle.periodo}</Typography>
                            </Box>

                            {/* Desglose: expensa base + agua = deuda original */}
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Composicion de la deuda</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Expensa base {detalle.tipo ? `(Tipo ${detalle.tipo})` : ''}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatBs(detalle.expensaBase ?? 0)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Agua</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2E9D78' }}>{formatBs(detalle.agua ?? 0)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderTop: '1px dashed #CFDCEA', mt: 0.5, pt: 0.75 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>Deuda original</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBs(detalle.deudaOriginal)}</Typography>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Meses de atraso</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{detalle.meses}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Tasa mensual</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{config.interesMensual} %</Typography>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Interes mes a mes</Typography>
                            {Array.from({ length: detalle.meses }).map((_, i) => {
                                const prev = config.tipoCalculo === 'Simple'
                                    ? detalle.deudaOriginal * (1 + tasa * i)
                                    : detalle.deudaOriginal * (1 + tasa) ** i;
                                const actual = config.tipoCalculo === 'Simple'
                                    ? detalle.deudaOriginal * (1 + tasa * (i + 1))
                                    : detalle.deudaOriginal * (1 + tasa) ** (i + 1);
                                return (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">Mes {i + 1}</Typography>
                                        <Typography variant="body2">{formatBs(prev)} → <strong>{formatBs(actual)}</strong></Typography>
                                    </Box>
                                );
                            })}

                            <Divider sx={{ my: 1.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Interes acumulado</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#D9534F' }}>{formatBs(detalle.interes)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>Deuda actual</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 700, color: '#D9534F' }}>{formatBs(detalle.deudaActual)}</Typography>
                            </Box>
                        </DialogContent>
                    </>
                )}
            </Dialog>

            {/* Menu de acciones por fila (ver detalle / registrar pago) */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={cerrarMenu}>
                <MenuItem onClick={verDetalle}>
                    <VisibilityIcon fontSize="small" sx={{ mr: 1, color: '#1F5F8B' }} />
                    Ver detalle
                </MenuItem>
                <MenuItem onClick={irARegistrarPago}>
                    <PaidIcon fontSize="small" sx={{ mr: 1, color: '#2E9D78' }} />
                    Registrar pago
                </MenuItem>
            </Menu>

            <Snackbar open={!!exitoMsg} autoHideDuration={3000} onClose={() => setExitoMsg('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity="success" onClose={() => setExitoMsg('')} sx={{ width: '100%' }}>{exitoMsg}</Alert>
            </Snackbar>
        </DashboardLayout>
    );
}