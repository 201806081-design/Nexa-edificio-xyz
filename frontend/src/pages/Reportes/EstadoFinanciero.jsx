import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import BalanceIcon from '@mui/icons-material/Balance';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BarChartIcon from '@mui/icons-material/BarChart';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
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

// Tonos para la dona: cada concepto de ingreso en verdes y cada gasto en naranjas
const TONOS = { Ingreso: ['#2E9D78', '#5DBB97', '#9FD8C1'], Gasto: ['#E5A33B', '#C9741F'] };

const toggleSx = {
    '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, color: '#1F5F8B', borderColor: '#cdd8e3', px: 1.5, py: 0.25 },
    '& .MuiToggleButton-root.Mui-selected': { bgcolor: '#1F5F8B', color: '#fff', '&:hover': { bgcolor: '#1C4E70' } },
};

// Dona de un tipo (ingresos o gastos) con el total al centro y su leyenda
function Dona({ titulo, conceptos, total, color }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'center', color, mb: 0.5 }}>{titulo}</Typography>
            {conceptos.length === 0 ? (
                <Box sx={{ height: 170, display: 'grid', placeItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Sin movimientos</Typography>
                </Box>
            ) : (
                <>
                    <Box sx={{ position: 'relative', height: 170 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={conceptos} dataKey="monto" nameKey="concepto" innerRadius={48} outerRadius={72} paddingAngle={2}>
                                    {conceptos.map((c) => <Cell key={c.concepto} fill={c.color} />)}
                                </Pie>
                                <Tooltip formatter={(v) => formatBs(v)} />
                            </PieChart>
                        </ResponsiveContainer>
                        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color }}>{formatBs(total)}</Typography>
                        </Box>
                    </Box>
                    {conceptos.map((c) => (
                        <Box key={c.concepto} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Box sx={{ flexShrink: 0, width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
                            <Typography variant="caption" color="text.secondary" sx={{ flex: 1, minWidth: 0 }} noWrap>{c.concepto}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {total > 0 ? Math.round((c.monto / total) * 1000) / 10 : 0} %
                            </Typography>
                        </Box>
                    ))}
                </>
            )}
        </Box>
    );
}

export default function EstadoFinanciero() {
    const periodos = useMemo(() => periodosDeReporte(), []);
    const location = useLocation();
    // Se puede abrir desde Finanzas con el mismo periodo elegido
    const [periodo, setPeriodo] = useState(() => (
        periodos.includes(location.state?.periodo) ? location.state.periodo : periodos[0] || ''
    ));
    const d = useMemo(() => datosEstadoFinanciero(periodo), [periodo]);
    const [vista, setVista] = useState('barras');
    // Conceptos con monto, coloreados por tipo (para la dona)
    const conceptosDe = (tipo) => d.composicion
        .filter((c) => c.tipo === tipo && c.monto > 0)
        .map((c, i) => ({ ...c, color: TONOS[tipo][i % TONOS[tipo].length] }));

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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Typography sx={{ fontWeight: 700 }}>Composicion del periodo</Typography>
                        <ToggleButtonGroup exclusive size="small" value={vista} onChange={(e, v) => v && setVista(v)} sx={toggleSx}>
                            <ToggleButton value="barras"><BarChartIcon fontSize="small" sx={{ mr: 0.5 }} /> Barras</ToggleButton>
                            <ToggleButton value="dona"><DonutLargeIcon fontSize="small" sx={{ mr: 0.5 }} /> Dona</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                    {vista === 'dona' ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <Dona titulo="Ingresos" conceptos={conceptosDe('Ingreso')} total={d.ingresos} color={COLOR_INGRESO} />
                            <Dona titulo="Gastos" conceptos={conceptosDe('Gasto')} total={d.gastos} color={COLOR_GASTO} />
                        </Box>
                    ) : d.composicion.map((c) => (
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
