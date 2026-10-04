import { useState } from 'react';
import { Box, Typography, Select, MenuItem, Paper, Chip, Divider } from '@mui/material';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ApartmentIcon from '@mui/icons-material/Apartment';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    PERIODO_ACTUAL, PERIODOS, RESUMEN_MOCK, INGRESOS_GASTOS_MOCK, ESTADO_EXPENSAS_MOCK,
    DEPARTAMENTOS_MORA_MOCK, MOVIMIENTOS_MOCK, formatBs, formatFechaCorta,
} from '../../constants/finanzasMock';

// KPIs (iconos y colores del design system, fieles al mockup)
const KPIS = [
    { clave: 'ingresos', label: 'Ingresos', icon: <NorthIcon />, color: 'success.main', bg: '#E4F4EE' },
    { clave: 'gastos', label: 'Gastos', icon: <SouthIcon />, color: 'error.main', bg: '#FBEAE9' },
    { clave: 'balance', label: 'Balance', icon: <DragHandleIcon />, color: 'primary.main', bg: '#E4EEF5' },
    { clave: 'saldoPendiente', label: 'Saldo pendiente', icon: <DescriptionOutlinedIcon />, color: 'primary.main', bg: '#E4EEF5' },
];

// Colores de los segmentos de la dona (paleta del design system)
const COLOR_ESTADO = { Pagadas: '#2E9D78', Pendientes: '#E5A33B', Vencidas: '#D9534F' };

export default function DashboardFinanciero() {
    const [periodo, setPeriodo] = useState(PERIODO_ACTUAL);

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Dashboard financiero</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Resumen del estado financiero del edificio
            </Typography>

            {/* Periodo */}
            <Box sx={{ maxWidth: 360, mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                    {PERIODOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
            </Box>

            {/* KPIs */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
                {KPIS.map((k) => (
                    <Paper key={k.clave} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: k.bg, color: k.color, display: 'grid', placeItems: 'center' }}>
                            {k.icon}
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">{k.label}</Typography>
                            <Typography variant="h3" sx={{ fontWeight: 700, color: k.color }}>{formatBs(RESUMEN_MOCK[k.clave])}</Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* Graficos */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h3" color="primary.main" sx={{ fontWeight: 600, mb: 2 }}>Ingresos vs. gastos</Typography>
                    <Box sx={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={INGRESOS_GASTOS_MOCK}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="mes" />
                                <YAxis />
                                <Tooltip formatter={(v) => formatBs(v)} />
                                <Legend />
                                <Bar dataKey="ingresos" name="Ingresos" fill="#2E9D78" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="gastos" name="Gastos" fill="#D9534F" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h3" color="primary.main" sx={{ fontWeight: 600, mb: 2 }}>Estado de expensas</Typography>
                    <Box sx={{ position: 'relative', height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={ESTADO_EXPENSAS_MOCK}
                                    dataKey="valor"
                                    nameKey="estado"
                                    innerRadius={75}
                                    outerRadius={110}
                                    paddingAngle={2}
                                    labelLine={false}
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                                        const RAD = Math.PI / 180;
                                        const r = innerRadius + (outerRadius - innerRadius) / 2;
                                        const x = cx + r * Math.cos(-midAngle * RAD);
                                        const y = cy + r * Math.sin(-midAngle * RAD);
                                        return (
                                            <text x={x} y={y} fill="#fff" fontSize={13} fontWeight={700}
                                                textAnchor="middle" dominantBaseline="central">
                                                {value}%
                                            </text>
                                        );
                                    }}
                                >
                                    {ESTADO_EXPENSAS_MOCK.map((e) => <Cell key={e.estado} fill={COLOR_ESTADO[e.estado]} />)}
                                </Pie>
                                <Tooltip formatter={(v) => `${v}%`} />
                                <Legend formatter={(value) => {
                                    const item = ESTADO_EXPENSAS_MOCK.find((e) => e.estado === value);
                                    return `${value}  ${item ? item.valor : ''}%`;
                                }} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Texto central de la dona */}
                        <Box sx={{
                            position: 'absolute', top: '42%', left: 0, right: 0, textAlign: 'center',
                            transform: 'translateY(-50%)', pointerEvents: 'none',
                        }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.4rem', color: 'text.primary' }}>100%</Typography>
                            <Typography variant="body2" color="text.secondary">Departamentos</Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* Listas: mora + movimientos */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h3" color="primary.main" sx={{ fontWeight: 600, mb: 1.5 }}>Departamentos con mora</Typography>
                    {DEPARTAMENTOS_MORA_MOCK.map((d, i) => (
                        <Box key={d.id}>
                            {i > 0 && <Divider />}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <ApartmentIcon sx={{ color: 'error.main' }} />
                                    <Typography sx={{ fontWeight: 600 }}>{d.departamento}</Typography>
                                    <Chip label={d.estado} size="small" sx={{ bgcolor: '#FBEAE9', color: 'error.main', fontWeight: 600 }} />
                                </Box>
                                <Typography sx={{ fontWeight: 700, color: 'error.main' }}>{formatBs(d.monto)}</Typography>
                            </Box>
                        </Box>
                    ))}
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h3" color="primary.main" sx={{ fontWeight: 600, mb: 1.5 }}>Ultimos movimientos</Typography>
                    {MOVIMIENTOS_MOCK.map((m, i) => {
                        const esIngreso = m.tipo === 'ingreso';
                        const color = esIngreso ? 'success.main' : 'error.main';
                        return (
                            <Box key={m.id}>
                                {i > 0 && <Divider />}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 1.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: esIngreso ? '#E4F4EE' : '#FBEAE9', color, display: 'grid', placeItems: 'center' }}>
                                            {esIngreso ? <NorthIcon fontSize="small" /> : <SouthIcon fontSize="small" />}
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontWeight: 600, color }}>
                                                {esIngreso ? '+' : '-'} {formatBs(m.monto)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">{m.descripcion}</Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">{formatFechaCorta(m.fecha)}</Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Paper>
            </Box>
        </DashboardLayout>
    );
}