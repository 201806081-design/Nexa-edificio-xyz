import { useState, useMemo } from 'react';
import {
    Box, Typography, Select, MenuItem, Paper, Button, Chip, Alert,
    Table, TableHead, TableBody, TableRow, TableCell, Snackbar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PercentIcon from '@mui/icons-material/Percent';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SavingsIcon from '@mui/icons-material/Savings';
import DashboardLayout from '../../layouts/DashboardLayout';
import { PERIODOS, formatBs } from '../../constants/finanzasMock';
import { EXPENSAS_MOCK } from '../../constants/expensasMock';
import { PAGOS_MOCK, HISTORIAL_ANTICIPOS, DEPARTAMENTOS_DEUDA } from '../../constants/pagosMock';
import { DEUDAS_VENCIDAS, CONFIG_MORA } from '../../constants/moraMock';

const MES_IDX = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};
const parsePeriodo = (p) => {
    const [mes, anio] = (p || '').toLowerCase().split(' ');
    return { mes: MES_IDX[mes] || 0, anio: Number(anio) || 0 };
};
const periodoCoincide = (periodoAplicado, periodoSel) => {
    const [mesSel, anioSel] = (periodoSel || '').toLowerCase().split(' ');
    const corto = (mesSel || '').slice(0, 3);
    const p = (periodoAplicado || '').toLowerCase();
    return (p.includes(mesSel) || p.includes(corto)) && p.includes(anioSel || '');
};

const PERIODOS_CUENTA = ['Todos los periodos', ...PERIODOS];

const estadoChipSx = (estado) => {
    if (estado === 'Pagado') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Vencido') return { bgcolor: '#FBEAE9', color: '#D9534F' };
    return { bgcolor: '#FDF0D5', color: '#B6802A' };
};

// Lista unica de deptos del sistema (solo los que tienen expensa o deuda vencida)
function buildDeptosDelSistema() {
    const map = new Map();
    const ensure = (id, patch = {}) => {
        if (!map.has(id)) map.set(id, { id, etiqueta: `Depto. ${id}`, tipo: '', responsable: '' });
        const d = map.get(id);
        if (patch.tipo && !d.tipo) d.tipo = patch.tipo;
        if (patch.responsable && !d.responsable) d.responsable = patch.responsable;
    };
    EXPENSAS_MOCK.forEach((e) => {
        const id = e.departamento.replace('Depto. ', '');
        ensure(id, { tipo: e.tipo });
    });
    DEUDAS_VENCIDAS.forEach((d) => ensure(d.depto, { tipo: d.tipo }));
    // Enriquecer con responsables de otras fuentes (si el depto ya existe)
    PAGOS_MOCK.forEach((p) => { if (map.has(p.depto)) ensure(p.depto, { responsable: p.responsable }); });
    HISTORIAL_ANTICIPOS.forEach((a) => { if (map.has(a.depto)) ensure(a.depto, { responsable: a.responsable }); });
    DEPARTAMENTOS_DEUDA.forEach((d) => { if (map.has(d.id)) ensure(d.id, { responsable: d.responsable }); });

    map.forEach((d) => {
        const tipoTxt = d.tipo ? ` — Tipo ${d.tipo}` : '';
        d.etiqueta = `Depto. ${d.id}${tipoTxt}`;
    });

    return [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
}

// Total pagado para un depto en un periodo (sum de PAGOS_MOCK con periodoAplicado matching)
const pagadoParaPeriodo = (deptoId, periodo) => PAGOS_MOCK
    .filter((p) => p.depto === deptoId && periodoCoincide(p.periodoAplicado, periodo))
    .reduce((s, p) => s + (p.monto || 0), 0);

// Computa el historial financiero cruzando EXPENSAS + DEUDAS_VENCIDAS + PAGOS
function computeHistorial(deptoId) {
    const tasa = (Number(CONFIG_MORA.interesMensual) || 0) / 100;

    // Expensas del mes (sin mora)
    const desdeExpensas = EXPENSAS_MOCK
        .filter((e) => e.departamento === `Depto. ${deptoId}`)
        .map((e) => ({
            periodo: e.periodo, base: e.base, agua: e.agua, mora: 0,
            pagado: pagadoParaPeriodo(deptoId, e.periodo),
        }));

    // Deudas vencidas (con mora calculada segun CONFIG_MORA)
    const desdeMora = DEUDAS_VENCIDAS
        .filter((d) => d.depto === deptoId)
        .map((d) => {
            const deudaConMora = CONFIG_MORA.tipoCalculo === 'Simple'
                ? d.deudaOriginal * (1 + tasa * d.meses)
                : d.deudaOriginal * (1 + tasa) ** d.meses;
            const mora = Math.round((deudaConMora - d.deudaOriginal) * 100) / 100;
            return {
                periodo: d.periodo, base: d.expensaBase, agua: d.agua, mora,
                pagado: pagadoParaPeriodo(deptoId, d.periodo),
            };
        });

    // Dedup por periodo (si hay en ambos, DEUDAS_VENCIDAS gana — tiene mora)
    const porPeriodo = new Map();
    [...desdeExpensas, ...desdeMora].forEach((h) => {
        const prev = porPeriodo.get(h.periodo);
        if (!prev || h.mora > prev.mora) porPeriodo.set(h.periodo, h);
    });

    return [...porPeriodo.values()]
        .map((h) => {
            const total = h.base + h.agua + h.mora;
            const saldo = Math.max(0, total - h.pagado);
            let estado;
            if (h.pagado >= total && total > 0) estado = 'Pagado';
            else if (h.mora > 0) estado = 'Vencido';
            else estado = 'Pendiente';
            return { ...h, total, saldo, estado };
        })
        .sort((a, b) => {
            const pa = parsePeriodo(a.periodo); const pb = parsePeriodo(b.periodo);
            return (pb.anio - pa.anio) || (pb.mes - pa.mes);
        });
}

function computeEstadoCuenta(deptoId, deptos, periodoFiltro) {
    const depto = deptos.find((d) => d.id === deptoId);
    if (!depto) return null;

    let historial = computeHistorial(deptoId);
    if (periodoFiltro && periodoFiltro !== 'Todos los periodos') {
        historial = historial.filter((h) => h.periodo === periodoFiltro);
    }

    const totalGenerado = historial.reduce((s, h) => s + h.base + h.agua, 0);
    const totalPagado = historial.reduce((s, h) => s + h.pagado, 0);
    const interesAcumulado = historial.reduce((s, h) => s + h.mora, 0);
    const saldoPendiente = historial.reduce((s, h) => s + h.saldo, 0);

    const credito = HISTORIAL_ANTICIPOS
        .filter((a) => a.depto === deptoId)
        .reduce((s, a) => s + (a.credito || 0), 0);

    const vencidos = historial.filter((h) => h.mora > 0);
    const detalleMora = vencidos.length === 0
        ? 'Sin mora: el departamento no tiene periodos vencidos.'
        : vencidos
            .map((h) => `${h.periodo}: Bs ${(h.base + h.agua).toFixed(0)} vencido × ${CONFIG_MORA.interesMensual}% = Bs ${h.mora.toFixed(2)} de interes acumulado.`)
            .join(' ');

    return {
        departamento: `Depto. ${deptoId}`,
        responsable: depto.responsable || 'Sin responsable registrado',
        tipo: depto.tipo,
        periodoConsultado: periodoFiltro || 'Todo el historial',
        resumen: { totalGenerado, totalPagado, interesAcumulado, saldoPendiente, credito },
        historial,
        detalleMora,
    };
}

export default function EstadoCuenta() {
    const [seleccion, setSeleccion] = useState('');
    const [periodo, setPeriodo] = useState(PERIODOS_CUENTA[0]);
    const [consultado, setConsultado] = useState(null);
    const [snack, setSnack] = useState(false);

    const deptosDisponibles = useMemo(() => buildDeptosDelSistema(), []);

    const consultar = () => {
        if (seleccion) setConsultado(computeEstadoCuenta(seleccion, deptosDisponibles, periodo));
    };

    const RESUMEN = consultado ? [
        { label: 'Expensas generadas', valor: consultado.resumen.totalGenerado, icon: <DescriptionOutlinedIcon />, color: 'primary.main', bg: '#E4EEF5' },
        { label: 'Pagos realizados', valor: consultado.resumen.totalPagado, icon: <CheckCircleIcon />, color: '#2E9D78', bg: '#E4F4EE' },
        { label: 'Interes acumulado', valor: consultado.resumen.interesAcumulado, icon: <PercentIcon />, color: '#D9534F', bg: '#FBEAE9' },
        { label: 'Saldo pendiente', valor: consultado.resumen.saldoPendiente, icon: <ScheduleIcon />, color: '#B6802A', bg: '#FDF0D5' },
    ] : [];

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Estado de cuenta por departamento</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Consulta las expensas, pagos y saldos de una unidad
            </Typography>

            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' } }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Departamento</Typography>
                        <Select fullWidth displayEmpty value={seleccion} onChange={(e) => setSeleccion(e.target.value)}>
                            <MenuItem value=""><em>Seleccionar departamento</em></MenuItem>
                            {deptosDisponibles.map((d) => <MenuItem key={d.id} value={d.id}>{d.etiqueta}</MenuItem>)}
                        </Select>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                        <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                            {PERIODOS_CUENTA.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </Select>
                    </Box>
                    <Button variant="contained" startIcon={<SearchIcon />} onClick={consultar}
                        disabled={!seleccion}
                        sx={{ width: { xs: '100%', md: 'auto' }, height: { md: 56 } }}>
                        Consultar estado
                    </Button>
                </Box>
            </Paper>

            {!consultado && (
                <Paper sx={{ p: 8, borderRadius: 2, textAlign: 'center', color: 'text.secondary' }}>
                    <ApartmentIcon sx={{ fontSize: 72, color: '#9aa8b6', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Seleccione un departamento</Typography>
                    <Typography variant="body2">Elige una unidad para consultar su informacion financiera</Typography>
                </Paper>
            )}

            {consultado && (
                <Box>
                    {/* Encabezado del depto */}
                    <Paper sx={{ p: 2.5, borderRadius: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flexShrink: 0, width: 48, height: 48, borderRadius: '50%', bgcolor: '#FDF0D5', color: '#B6802A', display: 'grid', placeItems: 'center' }}>
                            <PeopleAltIcon />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700 }}>
                                {consultado.departamento}
                                {consultado.tipo && (
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                        Tipo {consultado.tipo}
                                    </Typography>
                                )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Responsable: {consultado.responsable}</Typography>
                            <Typography variant="body2" color="text.secondary">Periodo consultado: {consultado.periodoConsultado}</Typography>
                        </Box>
                        {consultado.resumen.credito > 0 && (
                            <Chip
                                icon={<SavingsIcon />}
                                label={`Credito a favor: ${formatBs(consultado.resumen.credito)}`}
                                sx={{ bgcolor: '#E4F4EE', color: '#2E9D78', fontWeight: 700, px: 1 }}
                            />
                        )}
                    </Paper>

                    {/* Tarjetas de resumen */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                        {RESUMEN.map((r) => (
                            <Paper key={r.label} sx={{ p: 2.5, borderRadius: 2, bgcolor: r.bg, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ flexShrink: 0, width: 48, height: 48, color: r.color, display: 'grid', placeItems: 'center' }}>
                                    {r.icon}
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: r.color }}>{formatBs(r.valor)}</Typography>
                                </Box>
                            </Paper>
                        ))}
                    </Box>

                    {/* Historial */}
                    <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Historial financiero</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {consultado.historial.length} {consultado.historial.length === 1 ? 'periodo' : 'periodos'}
                            </Typography>
                        </Box>
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 720 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                        <TableCell><strong>Periodo</strong></TableCell>
                                        <TableCell><strong>Base</strong></TableCell>
                                        <TableCell><strong>Agua</strong></TableCell>
                                        <TableCell><strong>Mora</strong></TableCell>
                                        <TableCell><strong>Total</strong></TableCell>
                                        <TableCell><strong>Pagado</strong></TableCell>
                                        <TableCell><strong>Saldo</strong></TableCell>
                                        <TableCell><strong>Estado</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {consultado.historial.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                                Sin movimientos para {consultado.departamento} en {consultado.periodoConsultado}.
                                            </TableCell>
                                        </TableRow>
                                    ) : consultado.historial.map((h) => (
                                        <TableRow key={h.periodo}>
                                            <TableCell>{h.periodo}</TableCell>
                                            <TableCell>{formatBs(h.base)}</TableCell>
                                            <TableCell>{formatBs(h.agua)}</TableCell>
                                            <TableCell sx={{ color: h.mora > 0 ? '#D9534F' : 'text.primary', fontWeight: h.mora > 0 ? 600 : 400 }}>
                                                {formatBs(h.mora)}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>{formatBs(h.total)}</TableCell>
                                            <TableCell sx={{ color: h.pagado > 0 ? '#2E9D78' : 'text.primary' }}>{formatBs(h.pagado)}</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: h.saldo > 0 ? '#D9534F' : '#2E9D78' }}>{formatBs(h.saldo)}</TableCell>
                                            <TableCell><Chip label={h.estado} size="small" sx={estadoChipSx(h.estado)} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Paper>

                    {/* Detalle de mora */}
                    <Alert severity={consultado.resumen.interesAcumulado > 0 ? 'warning' : 'success'} icon={false}
                        sx={{
                            bgcolor: consultado.resumen.interesAcumulado > 0 ? '#FDF0D5' : '#E4F4EE',
                            color: consultado.resumen.interesAcumulado > 0 ? '#8A5A00' : '#2E7D5B',
                            mb: 2,
                        }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Detalle de mora</Typography>
                        <Typography variant="body2">{consultado.detalleMora}</Typography>
                    </Alert>

                    <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                        <Button variant="contained" startIcon={<DownloadIcon />}
                            onClick={() => setSnack(true)}
                            sx={{ width: { xs: '100%', md: 'auto' } }}>
                            Descargar estado
                        </Button>
                    </Box>
                </Box>
            )}

            <Snackbar open={snack} autoHideDuration={2500} onClose={() => setSnack(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity="success" onClose={() => setSnack(false)} sx={{ width: '100%' }}>
                    Estado de cuenta descargado (simulado en mock)
                </Alert>
            </Snackbar>
        </DashboardLayout>
    );
}