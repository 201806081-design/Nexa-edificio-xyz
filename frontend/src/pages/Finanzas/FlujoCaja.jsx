import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, Select, MenuItem, Chip,
    Table, TableHead, TableBody, TableRow, TableCell,
    ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import BarChartIcon from '@mui/icons-material/BarChart';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { PERIODOS, formatBs } from '../../constants/finanzasMock';
import { PAGOS_MOCK, HISTORIAL_ANTICIPOS } from '../../constants/pagosMock';
import { MOVIMIENTOS_LISTA } from '../../constants/movimientosMock';

// Semana del mes a partir del dia (1-7 S1, 8-14 S2, 15-21 S3, 22-fin S4)
const semanaMes = (dia) => {
    if (dia <= 7) return 'Sem. 1';
    if (dia <= 14) return 'Sem. 2';
    if (dia <= 21) return 'Sem. 3';
    return 'Sem. 4';
};

// 'DD/MM/YYYY' -> {dia, mes, anio}
const parseFecha = (f) => {
    const [d, m, y] = (f || '').split('/').map(Number);
    return { dia: d || 0, mes: m || 0, anio: y || 0 };
};

// 'Octubre 2026' -> {mes: 10, anio: 2026}
const MES_IDX = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};
const parsePeriodo = (p) => {
    const [mes, anio] = (p || '').toLowerCase().split(' ');
    return { mes: MES_IDX[mes] || 0, anio: Number(anio) || 0 };
};

const tipoChipSx = (tipo) => (tipo === 'Ingreso'
    ? { bgcolor: '#E4F4EE', color: '#2E9D78' }
    : { bgcolor: '#FBEAE9', color: '#D9534F' });

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

export default function FlujoCaja() {
    const navigate = useNavigate();
    const [periodo, setPeriodo] = useState(PERIODOS[0]);
    const [vista, setVista] = useState('barras');

    // Agregacion desde los mocks reales, FILTRADA por periodo (mes y anio)
    const flujo = useMemo(() => {
        const { mes, anio } = parsePeriodo(periodo);
        const enPeriodo = (f) => { const p = parseFecha(f); return p.mes === mes && p.anio === anio; };

        const pagos = PAGOS_MOCK.filter((p) => enPeriodo(p.fecha));
        const anticipos = HISTORIAL_ANTICIPOS.filter((a) => enPeriodo(a.fecha));
        const movimientos = MOVIMIENTOS_LISTA.filter((m) => enPeriodo(m.fecha));

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

        // Evolucion por semana — una columna por categoria (para barras apiladas)
        const sem = {
            'Sem. 1': { sem: 'Sem. 1' },
            'Sem. 2': { sem: 'Sem. 2' },
            'Sem. 3': { sem: 'Sem. 3' },
            'Sem. 4': { sem: 'Sem. 4' },
        };
        const addCat = (semana, cat, monto) => {
            sem[semana][cat] = (sem[semana][cat] || 0) + monto;
        };
        pagos.forEach((p) => addCat(semanaMes(parseFecha(p.fecha).dia), 'Pagos de expensas', p.monto || 0));
        anticipos.forEach((a) => addCat(semanaMes(parseFecha(a.fecha).dia), 'Pagos anticipados', a.recibido || 0));
        movimientos.forEach((m) => {
            const semana = semanaMes(parseFecha(m.fecha).dia);
            if (m.tipo === 'Ingreso') addCat(semana, 'Otros ingresos', m.monto || 0);
            else addCat(semana, m.categoria, m.monto || 0);
        });
        const evolucion = Object.values(sem);

        // Ultimos movimientos del periodo (unificado y ordenado desc)
        const ultimos = [
            ...pagos.map((p) => ({ fecha: p.fecha, descripcion: `Pago ${p.id} — Dpto. ${p.depto}`, categoria: 'Pago de expensa', tipo: 'Ingreso', monto: p.monto })),
            ...anticipos.map((a) => ({ fecha: a.fecha, descripcion: `Anticipo ${a.id} — Dpto. ${a.depto}`, categoria: 'Pago anticipado', tipo: 'Ingreso', monto: a.recibido })),
            ...movimientos.map((m) => ({ fecha: m.fecha, descripcion: m.descripcion, categoria: m.categoria, tipo: m.tipo === 'Ingreso' ? 'Ingreso' : 'Egreso', monto: m.monto })),
        ].sort((a, b) => {
            const fa = parseFecha(a.fecha); const fb = parseFecha(b.fecha);
            return (fb.anio - fa.anio) || (fb.mes - fa.mes) || (fb.dia - fa.dia);
        }).slice(0, 6);

        const sinDatos = totalIngresos === 0 && totalEgresos === 0;

        return { totalIngresos, totalEgresos, balance, ingresosList, egresosList, evolucion, ultimos, sinDatos };
    }, [periodo]);

    const RESUMEN = [
        { clave: 'ingresos', label: 'Total ingresos', valor: flujo.totalIngresos, icon: <NorthIcon />, color: '#2E9D78', bg: '#E4F4EE' },
        { clave: 'egresos', label: 'Total gastos', valor: flujo.totalEgresos, icon: <SouthIcon />, color: '#D9534F', bg: '#FBEAE9' },
        { clave: 'balance', label: 'Balance', valor: flujo.balance, icon: <DragHandleIcon />, color: flujo.balance >= 0 ? '#2E9D78' : '#D9534F', bg: '#E4EEF5' },
    ];

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Flujo de caja</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Analiza ingresos, egresos y anticipos del periodo
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'stretch', md: 'flex-end' }, mb: 2 }}>
                <Button variant="outlined" startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/finanzas/ingresos-gastos')}
                    sx={{ color: '#1a2733', borderColor: '#cdd8e3', width: { xs: '100%', md: 'auto' } }}>
                    Volver a movimientos
                </Button>
            </Box>

            {/* KPIs + Periodo */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr) 180px' }, gap: 2, mb: 3, alignItems: 'center' }}>
                {RESUMEN.map((r) => (
                    <Paper key={r.clave} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: r.bg, color: r.color, display: 'grid', placeItems: 'center' }}>
                            {r.icon}
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                            <Typography variant="h3" sx={{ fontWeight: 700, color: r.color }}>{formatBs(r.valor)}</Typography>
                        </Box>
                    </Paper>
                ))}
                <Select value={periodo} onChange={(e) => setPeriodo(e.target.value)} fullWidth size="small" sx={{ bgcolor: '#fff' }}>
                    {PERIODOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
            </Box>

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
                                                            innerRadius={55} outerRadius={85} paddingAngle={2}>
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
                                                            innerRadius={55} outerRadius={85} paddingAngle={2}>
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

            {/* Ultimos movimientos */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Ultimos movimientos del periodo</Typography>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 700 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Fecha</strong></TableCell>
                                <TableCell><strong>Descripcion</strong></TableCell>
                                <TableCell><strong>Categoria</strong></TableCell>
                                <TableCell><strong>Tipo</strong></TableCell>
                                <TableCell align="right"><strong>Monto</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {flujo.ultimos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                        Sin movimientos registrados en {periodo}.
                                    </TableCell>
                                </TableRow>
                            ) : flujo.ultimos.map((m, i) => {
                                const esIngreso = m.tipo === 'Ingreso';
                                return (
                                    <TableRow key={i}>
                                        <TableCell>{m.fecha}</TableCell>
                                        <TableCell>{m.descripcion}</TableCell>
                                        <TableCell>{m.categoria}</TableCell>
                                        <TableCell><Chip label={m.tipo} size="small" sx={tipoChipSx(m.tipo)} /></TableCell>
                                        <TableCell align="right" sx={{ color: esIngreso ? '#2E9D78' : '#D9534F', fontWeight: 700 }}>
                                            {esIngreso ? '+' : '-'} {formatBs(m.monto)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Box>
            </Paper>
        </DashboardLayout>
    );
}