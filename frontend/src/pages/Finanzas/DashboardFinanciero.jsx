import { useState } from 'react';
import { Box, Typography, Select, MenuItem, Paper, Chip, Divider } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import DescriptionIcon from '@mui/icons-material/Description';
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

const KPIS = [
    { clave: 'ingresos', label: 'Ingresos', icon: <TrendingUpIcon />, color: '#2E9D78', bg: '#E6F6EF' },
    { clave: 'gastos', label: 'Gastos', icon: <TrendingDownIcon />, color: '#D64545', bg: '#FCECEC' },
    { clave: 'balance', label: 'Balance', icon: <DragHandleIcon />, color: '#1F5F8B', bg: '#E7F0F7' },
    { clave: 'saldoPendiente', label: 'Saldo pendiente', icon: <DescriptionIcon />, color: '#1F5F8B', bg: '#E7F0F7' },
];

export default function DashboardFinanciero() {
    const [periodo, setPeriodo] = useState(PERIODO_ACTUAL);

    return (
        <DashboardLayout>
            <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>Dashboard financiero</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Resumen del estado financiero del edificio
            </Typography>

            {/* Periodo */}
            <Box sx={{ maxWidth: 320, mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Periodo</Typography>
                <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                    {PERIODOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
            </Box>

            {/* KPIs */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                {KPIS.map((k) => (
                    <Paper key={k.clave} sx={{ p: 2.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: k.bg, color: k.color, display: 'grid', placeItems: 'center' }}>
                            {k.icon}
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">{k.label}</Typography>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.4rem', color: k.color }}>
                                {formatBs(RESUMEN_MOCK[k.clave])}
                            </Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* Graficos: barras (ingresos vs gastos) + dona (estado de expensas) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 2 }}>Ingresos vs. gastos</Typography>
                    <Box sx={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={INGRESOS_GASTOS_MOCK}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="mes" />
                                <YAxis />
                                <Tooltip formatter={(v) => formatBs(v)} />
                                <Legend />
                                <Bar dataKey="ingresos" name="Ingresos" fill="#2E9D78" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="gastos" name="Gastos" fill="#D64545" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 2 }}>Estado de expensas</Typography>
                    <Box sx={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={ESTADO_EXPENSAS_MOCK} dataKey="valor" nameKey="estado" innerRadius={70} outerRadius={110} paddingAngle={2}>
                                    {ESTADO_EXPENSAS_MOCK.map((e) => <Cell key={e.estado} fill={e.color} />)}
                                </Pie>
                                <Tooltip formatter={(v) => `${v}%`} />
                                <Legend formatter={(value) => {
                                    const item = ESTADO_EXPENSAS_MOCK.find((e) => e.estado === value);
                                    return `${value}  ${item ? item.valor : ''}%`;
                                }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>
            </Box>

            {/* Listas: departamentos con mora + ultimos movimientos */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 1.5 }}>Departamentos con mora</Typography>
                    {DEPARTAMENTOS_MORA_MOCK.map((d, i) => (
                        <Box key={d.id}>
                            {i > 0 && <Divider />}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <ApartmentIcon sx={{ color: '#D64545' }} />
                                    <Typography sx={{ fontWeight: 600 }}>{d.departamento}</Typography>
                                    <Chip label={d.estado} size="small" sx={{ bgcolor: '#FCECEC', color: '#D64545', fontWeight: 600 }} />
                                </Box>
                                <Typography sx={{ fontWeight: 700, color: '#D64545' }}>{formatBs(d.monto)}</Typography>
                            </Box>
                        </Box>
                    ))}
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 1.5 }}>Ultimos movimientos</Typography>
                    {MOVIMIENTOS_MOCK.map((m, i) => {
                        const esIngreso = m.tipo === 'ingreso';
                        const color = esIngreso ? '#2E9D78' : '#D64545';
                        return (
                            <Box key={m.id}>
                                {i > 0 && <Divider />}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 1.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: esIngreso ? '#E6F6EF' : '#FCECEC', color, display: 'grid', placeItems: 'center' }}>
                                            {esIngreso ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
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