import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Select, MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    datosHistorialDepto, reporteHistorialDepto, periodosHistorial, TODO_EL_HISTORIAL,
} from '../../constants/reportesMock';
import { numerosDepto, responsableDe } from '../../constants/edificioMock';
import { formatBs } from '../../constants/finanzasMock';
import {
    EncabezadoReporte, KpiReporte, GrillaKpis, BarraFiltros, SelectorPeriodo, CampoFiltro, ChipEstado, TablaDeslizable,
} from './componentesReporte';

// 8.6 Historial por departamento: cargos, pagos, mora y saldo de cada expensa.

export default function HistorialDepartamento() {
    const location = useLocation();
    const deptos = useMemo(() => numerosDepto(), []);
    // Se puede abrir desde la Lista de morosos con el departamento ya elegido
    const [depto, setDepto] = useState(() => (deptos.includes(location.state?.depto) ? location.state.depto : deptos[0] ?? ''));
    const periodos = useMemo(() => periodosHistorial(), []);
    const [periodo, setPeriodo] = useState(TODO_EL_HISTORIAL);

    const d = useMemo(() => datosHistorialDepto(depto, periodo), [depto, periodo]);
    const conDeuda = d.saldo >= 0.01;

    return (
        <DashboardLayout>
            <EncabezadoReporte
                titulo="Historial por departamento"
                descripcion="Consulta los cargos, pagos, mora y saldo de un departamento"
                crearReporte={() => reporteHistorialDepto(d)}
            />

            <BarraFiltros>
                <CampoFiltro etiqueta="Departamento" flex={2} minWidth={240}>
                    <Select fullWidth value={depto} onChange={(e) => setDepto(e.target.value)}>
                        {deptos.map((n) => <MenuItem key={n} value={n}>{n} — {responsableDe(n)}</MenuItem>)}
                    </Select>
                </CampoFiltro>
                <SelectorPeriodo valor={periodo} opciones={periodos} onChange={setPeriodo} />
            </BarraFiltros>

            <GrillaKpis>
                <KpiReporte etiqueta="Cargos generados" valor={formatBs(d.cargos)} nota="Con agua, extras y mora"
                    icono={<ReceiptLongIcon />} />
                <KpiReporte etiqueta="Pagos realizados" valor={formatBs(d.pagado)} nota={`${d.cantidadPagos} pago${d.cantidadPagos !== 1 ? 's' : ''}`}
                    icono={<TaskAltIcon />} color="#2E9D78" fondo="#E4F4EE" />
                <KpiReporte etiqueta="Saldo pendiente" valor={formatBs(d.saldo)} nota="Incluye mora"
                    icono={<ScheduleIcon />} color={conDeuda ? '#D9534F' : '#2E9D78'} fondo={conDeuda ? '#FBEAE9' : '#E4F4EE'} />
                <KpiReporte etiqueta="Responsable" valor={d.responsable.split(' · ')[0]}
                    nota={`${d.responsable.split(' · ')[1] ?? ''}${d.tipo ? ` · Tipo ${d.tipo}` : ''}`} icono={<PersonOutlinedIcon />}
                    color="#132B3E" fondo="#F1F5FA" />
            </GrillaKpis>

            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 700 }}>Historial financiero · Depto. {depto}</Typography>
                    <ChipEstado estado={conDeuda ? 'Vencido' : 'Pagado'} />
                </Box>
                <TablaDeslizable minWidth={880}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Periodo</strong></TableCell>
                                <TableCell align="right"><strong>Expensa</strong></TableCell>
                                <TableCell align="right"><strong>Agua</strong></TableCell>
                                <TableCell align="right"><strong>Extras</strong></TableCell>
                                <TableCell align="right"><strong>Mora</strong></TableCell>
                                <TableCell align="right"><strong>Total</strong></TableCell>
                                <TableCell align="right"><strong>Pagado</strong></TableCell>
                                <TableCell align="right"><strong>Saldo</strong></TableCell>
                                <TableCell align="center"><strong>Estado</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {d.filas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        El departamento no tiene expensas en este periodo.
                                    </TableCell>
                                </TableRow>
                            ) : d.filas.map((f) => (
                                <TableRow key={f.periodo} hover>
                                    <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{f.periodo}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatBs(f.base)}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatBs(f.agua)}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatBs(f.extras)}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: f.mora > 0 ? '#D9534F' : 'inherit' }}>{formatBs(f.mora)}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>{formatBs(f.total)}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: '#2E9D78' }}>{formatBs(f.pagado)}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 700, color: f.saldo > 0 ? '#D9534F' : 'inherit' }}>{formatBs(f.saldo)}</TableCell>
                                    <TableCell align="center"><ChipEstado estado={f.estado} /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TablaDeslizable>
                <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: '#E4EEF5' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        Saldo calculado: cargos {formatBs(d.cargos)} − pagos {formatBs(d.pagado)} = {formatBs(d.saldo)}
                    </Typography>
                </Box>
            </Paper>
        </DashboardLayout>
    );
}
