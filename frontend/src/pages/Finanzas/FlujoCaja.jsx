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

// Parsea 'DD/MM/YYYY' -> {dia, mes, anio}
const parseFecha = (f) => {
    const [d, m, y] = (f || '').split('/').map(Number);
    return { dia: d || 0, mes: m || 0, anio: y || 0 };
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

// Paleta rotativa para las categorias de egresos
const PALETA_EGRESOS = ['#D9534F', '#E5A33B', '#A05A2C', '#8E6DD1', '#5B8DEF'];

export default function FlujoCaja() {
    const navigate = useNavigate();
    const [periodo, setPeriodo] = useState(PERIODOS[0]);
    const [vista, setVista] = useState('barras');

    // Agregacion desde los mocks reales del sistema (refleja todo lo registrado).
    // Si se registra un pago o movimiento, se recalcula en el proximo render.
    const flujo = useMemo(() => {
        // Ingresos por fuente
        const pagosExpensas = PAGOS_MOCK.reduce((acc, p) => acc + (p.monto || 0), 0);
        const anticipos = HISTORIAL_ANTICIPOS.reduce((acc, a) => acc + (a.recibido || 0), 0);
        const otrosIngresos = MOVIMIENTOS_LISTA
            .filter((m) => m.tipo === 'Ingreso')
            .reduce((acc, m) => acc + (m.monto || 0), 0);
        const totalIngresos = pagosExpensas + anticipos + otrosIngresos;

        // Egresos agrupados por categoria (desde MOVIMIENTOS_LISTA)
        const egresosPorCat = {};
        MOVIMIENTOS_LISTA
            .filter((m) => m.tipo === 'Gasto' || m.tipo === 'Egreso')
            .forEach((m) => {
                egresosPorCat[m.categoria] = (egresosPorCat[m.categoria] || 0) + (m.monto || 0);
            });
        const egresosList = Object.entries(egresosPorCat)
            .map(([cat, monto], i) => ({ name: cat, value: monto, color: PALETA_EGRESOS[i % PALETA_EGRESOS.length] }))
            .sort((a, b) => b.value - a.value);
        const totalEgresos = egresosList.reduce((acc, e) => acc + e.value, 0);

        const balance = totalIngresos - totalEgresos;

        // Composicion de ingresos (3 fuentes)
        const ingresosList = [
            { name: 'Pagos de expensas', value: pagosExpensas, color: COLORES_INGRESOS['Pagos de expensas'] },
            { name: 'Pagos anticipados', value: anticipos, color: COLORES_INGRESOS['Pagos anticipados'] },
            { name: 'Otros ingresos', value: otrosIngresos, color: COLORES_INGRESOS['Otros ingresos'] },
        ].filter((x) => x.value > 0);

        // Evolucion por semana del mes
        const sem = {
            'Sem. 1': { sem: 'Sem. 1', ingresos: 0, egresos: 0 },
            'Sem. 2': { sem: 'Sem. 2', ingresos: 0, egresos: 0 },
            'Sem. 3': { sem: 'Sem. 3', ingresos: 0, egresos: 0 },
            'Sem. 4': { sem: 'Sem. 4', ingresos: 0, egresos: 0 },
        };
        PAGOS_MOCK.forEach((p) => { sem[semanaMes(parseFecha(p.fecha).dia)].ingresos += p.monto || 0; });
        HISTORIAL_ANTICIPOS.forEach((a) => { sem[semanaMes(parseFecha(a.fecha).dia)].ingresos += a.recibido || 0; });
        MOVIMIENTOS_LISTA.forEach((m) => {
            const b = sem[semanaMes(parseFecha(m.fecha).dia)];
            if (m.tipo === 'Ingreso') b.ingresos += m.monto || 0;
            else b.egresos += m.monto || 0;
        });
        const evolucion = Object.values(sem);

        // Ultimos movimientos (unificado: pagos + anticipos + movimientos), orden desc, top 6
        const unificado = [
            ...PAGOS_MOCK.map((p) => ({ fecha: p.fecha, descripcion: `Pago ${p.id} — Dpto. ${p.depto}`, categoria: 'Pago de expensa', tipo: 'Ingreso', monto: p.monto })),
            ...HISTORIAL_ANTICIPOS.map((a) => ({ fecha: a.fecha, descripcion: `Anticipo ${a.id} — Dpto. ${a.depto}`, categoria: 'Pago anticipado', tipo: 'Ingreso', monto: a.recibido })),
            ...MOVIMIENTOS_LISTA.map((m) => ({ fecha: m.fecha, descripcion: m.descripcion, categoria: m.categoria, tipo: m.tipo === 'Ingreso' ? 'Ingreso' : 'Egreso', monto: m.monto })),
        ].sort((a, b) => {
            const fa = parseFecha(a.fecha); const fb = parseFecha(b.fecha);
            return (fb.anio - fa.anio) || (fb.mes - fa.mes) || (fb.dia - fa.dia);
        }).slice(0, 6);

        return { totalIngresos, totalEgresos, balance, ingresosList, egresosList, evolucion, ultimos: unificado };
    }, []);

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

            {/* Grafico (barras o 2 donas) + Composicion */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2, mb: 2 }}>
                <Paper sx={{ p: 3, borderRadius: 2, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {vista === 'barras' ? 'Evolucion semanal — ingresos vs egresos' : 'Composicion del periodo'}
                        </Typography>
                        <ToggleButtonGroup exclusive size="small" value={vista} onChange={(e, v) => v && setVista(v)} sx={toggleSx}>
                            <ToggleButton value="barras"><BarChartIcon fontSize="small" sx={{ mr: 0.5 }} /> Barras</ToggleButton>
                            <ToggleButton value="dona"><DonutLargeIcon fontSize="small" sx={{ mr: 0.5 }} /> Dona</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {vista === 'barras' ? (
                        <Box sx={{ height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={flujo.evolucion}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="sem" />
                                    <YAxis />
                                    <Tooltip formatter={(v) => formatBs(v)} />
                                    <Legend />
                                    <Bar dataKey="ingresos" name="Ingresos" fill="#2E9D78" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="egresos" name="Egresos" fill="#D9534F" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            {/* Dona Ingresos */}
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center', color: '#2E9D78', mb: 1 }}>Ingresos</Typography>
                                <Box sx={{ position: 'relative', height: 240 }}>
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
                                </Box>
                            </Box>
                            {/* Dona Egresos */}
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center', color: '#D9534F', mb: 1 }}>Egresos</Typography>
                                <Box sx={{ position: 'relative', height: 240 }}>
                                    {flujo.egresosList.length === 0 ? (
                                        <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">Sin egresos registrados</Typography>
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

                {/* Composicion (siempre muestra ingresos + egresos con progress bars) */}
                <Paper sx={{ p: 3, borderRadius: 2, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#2E9D78', mb: 1.5 }}>Composicion de ingresos</Typography>
                    {flujo.ingresosList.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">Sin ingresos registrados.</Typography>
                    ) : flujo.ingresosList.map((c) => {
                        const pct = flujo.totalIngresos > 0 ? (c.value / flujo.totalIngresos) * 100 : 0;
                        return (
                            <Box key={c.name} sx={{ mb: 1.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                                    <Typography variant="body2">{c.name}</Typography>
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
                                    <Typography variant="body2">{c.name}</Typography>
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
                            {flujo.ultimos.map((m, i) => {
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