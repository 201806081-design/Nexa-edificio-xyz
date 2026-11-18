import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper,
    Table, TableHead, TableBody, TableRow, TableCell,
    ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import DashboardLayout from '../../layouts/DashboardLayout';
import { formatBs } from '../../constants/finanzasMock';
import { periodosDeReporte, periodoAnual, anioDePeriodo, esPeriodoAnual } from '../../constants/periodos';
import { PAGOS_MOCK, HISTORIAL_ANTICIPOS } from '../../constants/pagosMock';
import { todosLosMovimientos, enPeriodo as fechaEnPeriodo } from '../../constants/movimientosMock';
import { fondosDelPeriodo } from '../../constants/cajaBancosMock';
import CuadreFondos from '../../components/CuadreFondos';
import { mesesDelPeriodo, reporteFlujoCaja } from '../../constants/reportesMock';
import { EncabezadoReporte, BarraFiltros, SelectorPeriodo, TablaDeslizable } from './componentesReporte';

const toggleSx = {
    bgcolor: '#fff',
    '& .MuiToggleButton-root': {
        textTransform: 'none', fontWeight: 600, color: '#1F5F8B', borderColor: '#cdd8e3', px: 2, py: 0.5,
    },
    '& .MuiToggleButton-root.Mui-selected': {
        bgcolor: '#1F5F8B', color: '#fff', '&:hover': { bgcolor: '#1C4E70' },
    },
};

const COLORES_INGRESOS = {
    'Pagos de expensas': '#2E9D78',
    'Pagos anticipados': '#1F5F8B',
    'Otros ingresos': '#8E6DD1',
};
const PALETA_EGRESOS = ['#D9534F', '#E5A33B', '#A05A2C', '#5B8DEF', '#C13584'];

// 8.3 Flujo de caja: de donde vino el dinero, en que se gasto y como cambio el saldo mes a mes.
export default function FlujoCaja() {
    // Cada mes y cada año desde el inicio del sistema (periodos.js)
    const periodos = useMemo(() => periodosDeReporte(), []);
    const [periodo, setPeriodo] = useState(() => periodos[0] || '');
    const [vista, setVista] = useState('barras');

    // Agregacion desde los mocks reales, FILTRADA por periodo (mes y anio)
    const flujo = useMemo(() => {
        const enPeriodo = (f) => fechaEnPeriodo(f, periodo);

        // Solo pagos con dinero nuevo: los cubiertos con credito ya entraron como anticipo
        const pagos = PAGOS_MOCK.filter((p) => enPeriodo(p.fecha) && (p.monto || 0) > 0);
        const anticipos = HISTORIAL_ANTICIPOS.filter((a) => enPeriodo(a.fecha));
        const movimientos = todosLosMovimientos().filter((m) => enPeriodo(m.fecha));

        const sumExp = pagos.reduce((s, p) => s + (p.monto || 0), 0);
        const sumAnt = anticipos.reduce((s, a) => s + (a.recibido || 0), 0);
        const sumOtros = movimientos.filter((m) => m.tipo === 'Ingreso').reduce((s, m) => s + (m.monto || 0), 0);
        const totalIngresos = sumExp + sumAnt + sumOtros;

        // Egresos agrupados por categoria
        const egresosPorCat = {};
        movimientos.filter((m) => m.tipo === 'Gasto' || m.tipo === 'Egreso')
            .forEach((m) => { egresosPorCat[m.categoria] = (egresosPorCat[m.categoria] || 0) + (m.monto || 0); });
        const egresosList = Object.entries(egresosPorCat)
            .map(([cat, monto], i) => ({ name: cat, value: monto, color: PALETA_EGRESOS[i % PALETA_EGRESOS.length] }))
            .sort((a, b) => b.value - a.value);
        const totalEgresos = egresosList.reduce((s, e) => s + e.value, 0);

        const balance = totalIngresos - totalEgresos;

        const ingresosList = [
            { name: 'Pagos de expensas', value: sumExp, color: COLORES_INGRESOS['Pagos de expensas'] },
            { name: 'Pagos anticipados', value: sumAnt, color: COLORES_INGRESOS['Pagos anticipados'] },
            { name: 'Otros ingresos', value: sumOtros, color: COLORES_INGRESOS['Otros ingresos'] },
        ].filter((x) => x.value > 0);

        const sinDatos = totalIngresos === 0 && totalEgresos === 0;

        return { totalIngresos, totalEgresos, balance, ingresosList, egresosList, sinDatos };
    }, [periodo]);

    // Flujo mes a mes del año del periodo elegido (saldo inicial -> saldo final).
    // Mismas cifras que el cuadre de fondos, Ingresos y gastos y Caja y bancos.
    const anio = periodoAnual(anioDePeriodo(periodo));
    const meses = useMemo(() => mesesDelPeriodo(anio).map((p) => ({ periodo: p, ...fondosDelPeriodo(p) })), [anio]);
    const total = useMemo(() => fondosDelPeriodo(anio), [anio]);

    // Exporta el periodo elegido: un mes o todos los meses del año
    const crearReporte = () => reporteFlujoCaja(
        periodo,
        esPeriodoAnual(periodo) ? meses : meses.filter((m) => m.periodo === periodo),
        fondosDelPeriodo(periodo),
    );

    return (
        <DashboardLayout>
            <EncabezadoReporte
                titulo="Flujo de caja"
                descripcion="De donde vino el dinero, en que se gasto y como cambio el saldo de caja y banco"
                crearReporte={crearReporte}
            />

            <BarraFiltros>
                <SelectorPeriodo valor={periodo} opciones={periodos} onChange={setPeriodo} />
            </BarraFiltros>

            {/* Saldo inicial + ingresos - gastos = saldo final */}
            <CuadreFondos periodo={periodo} />

            {flujo.sinDatos ? (
                <Paper sx={{ p: 4, borderRadius: 2, mb: 2, bgcolor: '#FDF0D5', color: '#8A5A00', textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontSize: '1.2rem', fontWeight: 700, mb: 1 }}>
                        Sin movimientos registrados en {periodo}
                    </Typography>
                    <Typography variant="body2">
                        Selecciona otro periodo o registra un pago, anticipo o movimiento para ver el flujo de caja.
                    </Typography>
                </Paper>
            ) : (

                /* Grafico + Composicion (solo cuando hay datos) */
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2, mb: 2 }}>
                    <Paper sx={{ p: 3, borderRadius: 2, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {vista === 'barras' ? 'Totales por categoria' : 'Composicion del periodo'}
                            </Typography>
                            <ToggleButtonGroup exclusive size="small" value={vista} onChange={(e, v) => v && setVista(v)} sx={toggleSx}>
                                <ToggleButton value="barras"><BarChartIcon fontSize="small" sx={{ mr: 0.5 }} /> Barras</ToggleButton>
                                <ToggleButton value="dona"><DonutLargeIcon fontSize="small" sx={{ mr: 0.5 }} /> Dona</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {vista === 'barras' ? (
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                {/* Barras Ingresos — una barra solita por categoria */}
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center', color: '#2E9D78', mb: 1 }}>Ingresos</Typography>
                                    <Box sx={{ height: 300 }}>
                                        {flujo.ingresosList.length === 0 ? (
                                            <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">Sin ingresos</Typography>
                                            </Box>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={flujo.ingresosList} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                                                    <YAxis />
                                                    <Tooltip formatter={(v) => formatBs(v)} />
                                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                        {flujo.ingresosList.map((e) => <Cell key={e.name} fill={e.color} />)}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </Box>
                                </Box>
                                {/* Barras Egresos — una barra solita por categoria */}
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center', color: '#D9534F', mb: 1 }}>Egresos</Typography>
                                    <Box sx={{ height: 300 }}>
                                        {flujo.egresosList.length === 0 ? (
                                            <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">Sin egresos</Typography>
                                            </Box>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={flujo.egresosList} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                                                    <YAxis />
                                                    <Tooltip formatter={(v) => formatBs(v)} />
                                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                        {flujo.egresosList.map((e) => <Cell key={e.name} fill={e.color} />)}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                {/* Dona Ingresos */}
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center', color: '#2E9D78', mb: 1 }}>Ingresos</Typography>
                                    <Box sx={{ position: 'relative', height: 240 }}>
                                        {flujo.ingresosList.length === 0 ? (
                                            <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">Sin ingresos</Typography>
                                            </Box>
                                        ) : (
                                            <>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={flujo.ingresosList} dataKey="value" nameKey="name"
                                                            innerRadius={55} outerRadius={85} paddingAngle={2}
                                                            labelLine={false}
                                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                                if (percent < 0.05) return null; // no mostrar % en porciones muy chicas
                                                                const RAD = Math.PI / 180;
                                                                const r = innerRadius + (outerRadius - innerRadius) / 2;
                                                                const x = cx + r * Math.cos(-midAngle * RAD);
                                                                const y = cy + r * Math.sin(-midAngle * RAD);
                                                                return (
                                                                    <text x={x} y={y} fill="#fff" fontSize={12} fontWeight={700}
                                                                        textAnchor="middle" dominantBaseline="central">
                                                                        {(percent * 100).toFixed(0)}%
                                                                    </text>
                                                                );
                                                            }}>
                                                            {flujo.ingresosList.map((e) => <Cell key={e.name} fill={e.color} />)}
                                                        </Pie>
                                                        <Tooltip formatter={(v) => formatBs(v)} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <Box sx={{ position: 'absolute', top: '38%', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
                                                    <Typography variant="caption" color="text.secondary">Total</Typography>
                                                    <Typography sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(flujo.totalIngresos)}</Typography>
                                                </Box>
                                            </>
                                        )}
                                    </Box>
                                </Box>
                                {/* Dona Egresos */}
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center', color: '#D9534F', mb: 1 }}>Egresos</Typography>
                                    <Box sx={{ position: 'relative', height: 240 }}>
                                        {flujo.egresosList.length === 0 ? (
                                            <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">Sin egresos</Typography>
                                            </Box>
                                        ) : (
                                            <>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={flujo.egresosList} dataKey="value" nameKey="name"
                                                            innerRadius={55} outerRadius={85} paddingAngle={2}
                                                            labelLine={false}
                                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                                if (percent < 0.05) return null; // no mostrar % en porciones muy chicas
                                                                const RAD = Math.PI / 180;
                                                                const r = innerRadius + (outerRadius - innerRadius) / 2;
                                                                const x = cx + r * Math.cos(-midAngle * RAD);
                                                                const y = cy + r * Math.sin(-midAngle * RAD);
                                                                return (
                                                                    <text x={x} y={y} fill="#fff" fontSize={12} fontWeight={700}
                                                                        textAnchor="middle" dominantBaseline="central">
                                                                        {(percent * 100).toFixed(0)}%
                                                                    </text>
                                                                );
                                                            }}>
                                                            {flujo.egresosList.map((e) => <Cell key={e.name} fill={e.color} />)}
                                                        </Pie>
                                                        <Tooltip formatter={(v) => formatBs(v)} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <Box sx={{ position: 'absolute', top: '38%', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
                                                    <Typography variant="caption" color="text.secondary">Total</Typography>
                                                    <Typography sx={{ fontWeight: 700, color: '#D9534F' }}>{formatBs(flujo.totalEgresos)}</Typography>
                                                </Box>
                                            </>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Paper>

                    {/* Composicion */}
                    <Paper sx={{ p: 3, borderRadius: 2, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#2E9D78', mb: 1.5 }}>Composicion de ingresos</Typography>
                        {flujo.ingresosList.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">Sin ingresos registrados.</Typography>
                        ) : flujo.ingresosList.map((c) => {
                            const pct = flujo.totalIngresos > 0 ? (c.value / flujo.totalIngresos) * 100 : 0;
                            return (
                                <Box key={c.name} sx={{ mb: 1.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            <Box sx={{ width: 10, height: 10, bgcolor: c.color, borderRadius: 0.5 }} />
                                            <Typography variant="body2">{c.name}</Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {formatBs(c.value)}
                                            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>({pct.toFixed(0)}%)</Typography>
                                        </Typography>
                                    </Box>
                                    <Box sx={{ height: 8, bgcolor: '#E8ECEF', borderRadius: 1 }}>
                                        <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: c.color, borderRadius: 1 }} />
                                    </Box>
                                </Box>
                            );
                        })}

                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#D9534F', mt: 2.5, mb: 1.5 }}>Composicion de egresos</Typography>
                        {flujo.egresosList.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">Sin egresos registrados en el periodo.</Typography>
                        ) : flujo.egresosList.map((c) => {
                            const pct = flujo.totalEgresos > 0 ? (c.value / flujo.totalEgresos) * 100 : 0;
                            return (
                                <Box key={c.name} sx={{ mb: 1.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            <Box sx={{ width: 10, height: 10, bgcolor: c.color, borderRadius: 0.5 }} />
                                            <Typography variant="body2">{c.name}</Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {formatBs(c.value)}
                                            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>({pct.toFixed(0)}%)</Typography>
                                        </Typography>
                                    </Box>
                                    <Box sx={{ height: 8, bgcolor: '#E8ECEF', borderRadius: 1 }}>
                                        <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: c.color, borderRadius: 1 }} />
                                    </Box>
                                </Box>
                            );
                        })}

                        <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 1.5, mt: 2 }}>
                            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }} display="block">
                                Los pagos anticipados cuentan al recibir el dinero;
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                al aplicarlos a una expensa no se registran otra vez.
                            </Typography>
                        </Box>
                    </Paper>
                </Box>
            )}

            {/* Flujo mes a mes (reporte mensual y acumulado) */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Flujo mes a mes · {anioDePeriodo(periodo)}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    Cada mes empieza con el saldo con el que cerro el anterior. El primero empieza con el saldo de apertura.
                </Typography>
                <TablaDeslizable minWidth={700}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Mes</strong></TableCell>
                                <TableCell align="right"><strong>Saldo inicial</strong></TableCell>
                                <TableCell align="right"><strong>Ingresos</strong></TableCell>
                                <TableCell align="right"><strong>Gastos</strong></TableCell>
                                <TableCell align="right"><strong>Flujo neto</strong></TableCell>
                                <TableCell align="right"><strong>Saldo final</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {meses.map((m) => {
                                const neto = m.ingresos - m.gastos;
                                return (
                                    <TableRow key={m.periodo} hover selected={m.periodo === periodo}
                                        onClick={() => setPeriodo(m.periodo)} sx={{ cursor: 'pointer' }}>
                                        <TableCell sx={{ fontWeight: 600 }}>{m.periodo}</TableCell>
                                        <TableCell align="right">
                                            {formatBs(m.saldoInicial)}
                                            {m.esApertura && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Apertura</Typography>}
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: '#2E9D78', fontWeight: 600 }}>{formatBs(m.ingresos)}</TableCell>
                                        <TableCell align="right" sx={{ color: '#D9534F', fontWeight: 600 }}>{formatBs(m.gastos)}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, color: neto < 0 ? '#D9534F' : '#2E9D78' }}>
                                            {neto > 0 ? '+ ' : neto < 0 ? '− ' : ''}{formatBs(Math.abs(neto))}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatBs(m.saldoFinal)}</TableCell>
                                    </TableRow>
                                );
                            })}
                            <TableRow sx={{ bgcolor: '#F1F5FA', '& td': { fontWeight: 700 } }}>
                                <TableCell>Total</TableCell>
                                <TableCell align="right">{formatBs(total.saldoInicial)}</TableCell>
                                <TableCell align="right" sx={{ color: '#2E9D78' }}>{formatBs(total.ingresos)}</TableCell>
                                <TableCell align="right" sx={{ color: '#D9534F' }}>{formatBs(total.gastos)}</TableCell>
                                <TableCell align="right" sx={{ color: total.ingresos - total.gastos < 0 ? '#D9534F' : '#2E9D78' }}>
                                    {total.ingresos - total.gastos < 0 ? '− ' : '+ '}{formatBs(Math.abs(total.ingresos - total.gastos))}
                                </TableCell>
                                <TableCell align="right">{formatBs(total.saldoFinal)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TablaDeslizable>
            </Paper>
        </DashboardLayout>
    );
}