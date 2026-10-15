import { useState } from 'react';
import {
    Box, Typography, Select, MenuItem, Paper, Button, Chip, Alert,
    Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PercentIcon from '@mui/icons-material/Percent';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    DEPARTAMENTOS_CUENTA, PERIODOS_CUENTA, ESTADO_CUENTA_MOCK,
} from '../../constants/estadoCuentaMock';
import { formatBs } from '../../constants/finanzasMock';

// Color del chip segun el estado del periodo
const estadoChipSx = (estado) => {
    if (estado === 'Pagado') return { bgcolor: '#E4F4EE', color: '#2E9D78' };
    if (estado === 'Vencido') return { bgcolor: '#FBEAE9', color: '#D9534F' };
    return { bgcolor: '#FDF0D5', color: '#B6802A' }; // Pendiente
};

export default function EstadoCuenta() {
    const [seleccion, setSeleccion] = useState('');
    const [periodo, setPeriodo] = useState(PERIODOS_CUENTA[0]);
    const [consultado, setConsultado] = useState(null);

    const consultar = () => {
        if (seleccion) setConsultado(ESTADO_CUENTA_MOCK[seleccion]);
    };

    // Tarjetas de resumen (4). bg = fondo de la tarjeta; color = icono y monto.
    const RESUMEN = consultado ? [
        { label: 'Expensas generados', valor: consultado.resumen.totalGenerado, icon: <DescriptionOutlinedIcon />, color: 'primary.main', bg: '#E4EEF5' },
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

            {/* Selector: departamento + periodo + consultar */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' } }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Departamento</Typography>
                        <Select fullWidth displayEmpty value={seleccion} onChange={(e) => setSeleccion(e.target.value)}>
                            <MenuItem value=""><em>Seleccionar departamento</em></MenuItem>
                            {DEPARTAMENTOS_CUENTA.map((d) => <MenuItem key={d.id} value={d.id}>{d.etiqueta}</MenuItem>)}
                        </Select>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                        <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                            {PERIODOS_CUENTA.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </Select>
                    </Box>
                    <Button variant="contained" startIcon={<SearchIcon />} onClick={consultar}
                        sx={{ width: { xs: '100%', md: 'auto' }, height: { md: 56 } }}>
                        Consultar estado
                    </Button>
                </Box>
            </Paper>

            {/* Estado vacio */}
            {!consultado && (
                <Paper sx={{ p: 8, borderRadius: 2, textAlign: 'center', color: 'text.secondary' }}>
                    <ApartmentIcon sx={{ fontSize: 72, color: '#9aa8b6', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Seleccione un departamento</Typography>
                    <Typography variant="body2">Elige una unidad para consultar su informacion financiera</Typography>
                </Paper>
            )}

            {/* Detalle del estado de cuenta */}
            {consultado && (
                <Box>
                    {/* Encabezado del departamento */}
                    <Paper sx={{ p: 2.5, borderRadius: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flexShrink: 0, width: 48, height: 48, borderRadius: '50%', bgcolor: '#FDF0D5', color: '#B6802A', display: 'grid', placeItems: 'center' }}>
                            <PeopleAltIcon />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700 }}>{consultado.departamento}</Typography>
                            <Typography variant="body2" color="text.secondary">Responsable: {consultado.responsable}</Typography>
                            <Typography variant="body2" color="text.secondary">Periodo consultado: {consultado.periodoConsultado}</Typography>
                        </Box>
                    </Paper>

                    {/* Tarjetas de resumen (4) con fondo de color */}
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

                    {/* Historial financiero */}
                    <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Historial financiero</Typography>
                            <Typography variant="body2" color="text.secondary">{consultado.historial.length} periodos</Typography>
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
                                    {consultado.historial.map((h) => {
                                        const total = h.base + h.agua + h.mora;
                                        const saldo = total - h.pagado;
                                        return (
                                            <TableRow key={h.periodo}>
                                                <TableCell>{h.periodo}</TableCell>
                                                <TableCell>{formatBs(h.base)}</TableCell>
                                                <TableCell>{formatBs(h.agua)}</TableCell>
                                                <TableCell sx={{ color: h.mora > 0 ? '#D9534F' : 'text.primary', fontWeight: h.mora > 0 ? 600 : 400 }}>
                                                    {formatBs(h.mora)}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>{formatBs(total)}</TableCell>
                                                <TableCell>{formatBs(h.pagado)}</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: saldo > 0 ? '#D9534F' : '#2E9D78' }}>{formatBs(saldo)}</TableCell>
                                                <TableCell><Chip label={h.estado} size="small" sx={estadoChipSx(h.estado)} /></TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>
                    </Paper>

                    {/* Detalle de mora */}
                    <Alert severity="warning" icon={false} sx={{ bgcolor: '#FDF0D5', color: '#8A5A00', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Detalle de mora</Typography>
                        <Typography variant="body2">{consultado.detalleMora}</Typography>
                    </Alert>

                    {/* Descargar estado */}
                    <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                        <Button variant="contained" startIcon={<DownloadIcon />} sx={{ width: { xs: '100%', md: 'auto' } }}>
                            Descargar estado
                        </Button>
                    </Box>
                </Box>
            )}
        </DashboardLayout>
    );
}