import { useState } from 'react';
import {
    Box, Typography, Select, MenuItem, Paper, Button, Chip, Divider,
    Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircle';
import DashboardLayout from '../../layouts/DashboardLayout';
import { DEPARTAMENTOS_CUENTA, ESTADO_CUENTA_MOCK } from '../../constants/estadoCuentaMock';
import { formatBs } from '../../constants/finanzasMock';

const estadoChipSx = (estado) => (estado === 'Pagado'
    ? { bgcolor: '#E4F4EE', color: '#2E9D78' }
    : { bgcolor: '#FDF0D5', color: '#B6802A' });

export default function EstadoCuenta() {
    const [seleccion, setSeleccion] = useState('');
    const [consultado, setConsultado] = useState(null);

    const consultar = () => {
        if (seleccion) setConsultado(ESTADO_CUENTA_MOCK[seleccion]);
    };

    const RESUMEN = consultado ? [
        { label: 'Total generados', valor: consultado.resumen.totalGenerado, icon: <DescriptionOutlinedIcon />, color: 'primary.main', bg: '#E4EEF5' },
        { label: 'Saldo pendiente', valor: consultado.resumen.saldoPendiente, icon: <ScheduleIcon />, color: '#B6802A', bg: '#FDF0D5' },
        { label: 'Total pagado', valor: consultado.resumen.totalPagado, icon: <CheckCircleOutlineIcon />, color: '#2E9D78', bg: '#E4F4EE' },
    ] : [];

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Estado de cuenta por departamento</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Consulta las expensas, pagos y saldos de una unidad
            </Typography>

            {/* Selector + consultar */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' } }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Departamento</Typography>
                        <Select fullWidth displayEmpty value={seleccion} onChange={(e) => setSeleccion(e.target.value)}>
                            <MenuItem value=""><em>Seleccionar departamento</em></MenuItem>
                            {DEPARTAMENTOS_CUENTA.map((d) => <MenuItem key={d.id} value={d.id}>{d.etiqueta}</MenuItem>)}
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
                        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#E4EEF5', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                            <PeopleAltIcon />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700 }}>{consultado.departamento}</Typography>
                            <Typography variant="body2" color="text.secondary">Responsable: {consultado.responsable}</Typography>
                            <Typography variant="body2" color="text.secondary">Periodo consultado: {consultado.periodoConsultado}</Typography>
                        </Box>
                    </Paper>

                    {/* Tarjetas de resumen */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
                        {RESUMEN.map((r) => (
                            <Paper key={r.label} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: r.bg, color: r.color, display: 'grid', placeItems: 'center' }}>
                                    {r.icon}
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: r.color }}>{formatBs(r.valor)}</Typography>
                                </Box>
                            </Paper>
                        ))}
                    </Box>

                    {/* Expensas generadas */}
                    <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Expensas generadas</Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Periodo</strong></TableCell>
                                    <TableCell><strong>Monto</strong></TableCell>
                                    <TableCell><strong>Pagado</strong></TableCell>
                                    <TableCell><strong>Saldo</strong></TableCell>
                                    <TableCell><strong>Estado</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {consultado.expensas.map((e, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{e.periodo}</TableCell>
                                        <TableCell>{formatBs(e.monto)}</TableCell>
                                        <TableCell>{formatBs(e.pagado)}</TableCell>
                                        <TableCell>{formatBs(e.saldo)}</TableCell>
                                        <TableCell><Chip label={e.estado} size="small" sx={estadoChipSx(e.estado)} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>

                    {/* Historial de pagos */}
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Historial de pagos</Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Fecha</strong></TableCell>
                                    <TableCell><strong>Periodo</strong></TableCell>
                                    <TableCell><strong>Monto pagado</strong></TableCell>
                                    <TableCell><strong>Saldo restante</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {consultado.pagos.map((p, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{p.fecha}</TableCell>
                                        <TableCell>{p.periodo}</TableCell>
                                        <TableCell>{formatBs(p.montoPagado)}</TableCell>
                                        <TableCell>{formatBs(p.saldoRestante)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </Box>
            )}
        </DashboardLayout>
    );
}