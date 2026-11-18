import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import BalanceIcon from '@mui/icons-material/Balance';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import CuadreFondos from '../../components/CuadreFondos';
import { datosEstadoFinanciero, reporteEstadoFinanciero } from '../../constants/reportesMock';
import { periodosDeReporte } from '../../constants/periodos';
import { formatBs } from '../../constants/finanzasMock';
import {
    EncabezadoReporte, KpiReporte, GrillaKpis, BarraFiltros, SelectorPeriodo, ChipEstado, TablaDeslizable,
} from './componentesReporte';

// 8.1 Estado financiero: resultado del periodo, fondos al cierre y validacion de totales.

const COLOR_INGRESO = '#2E9D78';
const COLOR_GASTO = '#E5A33B';

export default function EstadoFinanciero() {
    const periodos = useMemo(() => periodosDeReporte(), []);
    const location = useLocation();
    // Se puede abrir desde Finanzas con el mismo periodo elegido
    const [periodo, setPeriodo] = useState(() => (
        periodos.includes(location.state?.periodo) ? location.state.periodo : periodos[0] || ''
    ));
    const d = useMemo(() => datosEstadoFinanciero(periodo), [periodo]);

    const totalComposicion = Math.max(1, ...d.composicion.map((c) => c.monto));
    const positivo = d.resultado >= 0;

    return (
        <DashboardLayout>
            <EncabezadoReporte
                titulo="Estado financiero"
                descripcion="Consulta el resultado del periodo, los fondos al cierre y verifica los totales contra sus registros"
                crearReporte={() => reporteEstadoFinanciero(d)}
                bloqueado={d.exportable ? '' : 'Hay totales que no coinciden con sus registros fuente. Revisa la validacion antes de exportar.'}
            />

            <BarraFiltros>
                <SelectorPeriodo valor={periodo} opciones={periodos} onChange={setPeriodo} />
                <Typography variant="body2" color="text.secondary" sx={{ pb: 1.5 }}>Corte al {d.corte}</Typography>
            </BarraFiltros>

            <GrillaKpis>
                <KpiReporte etiqueta="Ingresos" valor={formatBs(d.ingresos)} nota="Pagos y otros ingresos" icono={<NorthIcon />} color="#2E9D78" fondo="#E4F4EE" />
                <KpiReporte etiqueta="Gastos" valor={formatBs(d.gastos)} nota="Operativos y personal" icono={<SouthIcon />} color="#D9534F" fondo="#FBEAE9" />
                <KpiReporte etiqueta="Resultado del periodo" valor={`${positivo ? '+ ' : '− '}${formatBs(Math.abs(d.resultado))}`}
                    nota={positivo ? 'Entro mas de lo que salio' : 'Salio mas de lo que entro'} icono={<BalanceIcon />}
                    color={positivo ? '#2E9D78' : '#D9534F'} fondo={positivo ? '#E4F4EE' : '#FBEAE9'} />
                <KpiReporte etiqueta="Cuentas por cobrar" valor={formatBs(d.porCobrar)} nota={`${d.deptosConDeuda} departamentos`}
                    icono={<ScheduleIcon />} color="#B6802A" fondo="#FDF0D5" />
            </GrillaKpis>

            <CuadreFondos periodo={periodo} />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' }, gap: 2, mb: 2 }}>
                <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, mb: 1 }}>Evolucion mensual</Typography>
                    <Box sx={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={d.evolucion} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="mes" />
                                <YAxis width={56} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                                <Tooltip formatter={(v) => formatBs(v)} />
                                <Legend />
                                <Bar dataKey="ingresos" name="Ingresos" fill={COLOR_INGRESO} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="gastos" name="Gastos" fill={COLOR_GASTO} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>

                <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, mb: 2 }}>Composicion del periodo</Typography>
                    {d.composicion.map((c) => (
                        <Box key={c.concepto} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">{c.concepto}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBs(c.monto)}</Typography>
                            </Box>
                            <Box sx={{ height: 8, bgcolor: '#E8ECEF', borderRadius: 1 }}>
                                <Box sx={{
                                    height: '100%', borderRadius: 1, width: `${(c.monto / totalComposicion) * 100}%`,
                                    bgcolor: c.tipo === 'Ingreso' ? COLOR_INGRESO : COLOR_GASTO,
                                }} />
                            </Box>
                        </Box>
                    ))}
                </Paper>
            </Box>

            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Validacion contra registros fuente</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    Cada total se vuelve a calcular directamente desde sus registros. Si alguno no coincide, no se puede exportar.
                </Typography>
                <TablaDeslizable minWidth={620}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Total</strong></TableCell>
                                <TableCell><strong>Se calcula con</strong></TableCell>
                                <TableCell align="right"><strong>Reporte</strong></TableCell>
                                <TableCell align="right"><strong>Registros</strong></TableCell>
                                <TableCell align="center"><strong>Estado</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {d.validacion.map((v) => (
                                <TableRow key={v.concepto}>
                                    <TableCell sx={{ fontWeight: 600 }}>{v.concepto}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>{v.fuente}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatBs(v.reporte)}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatBs(v.calculado)}</TableCell>
                                    <TableCell align="center"><ChipEstado estado={v.coincide ? 'Coincide' : 'No coincide'} /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TablaDeslizable>
            </Paper>
        </DashboardLayout>
    );
}
