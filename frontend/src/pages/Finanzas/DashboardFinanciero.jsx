import { useState } from 'react';
import { Box, Typography, Select, MenuItem, Paper } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import DescriptionIcon from '@mui/icons-material/Description';
import DashboardLayout from '../../layouts/DashboardLayout';
import { PERIODO_ACTUAL, PERIODOS, RESUMEN_MOCK, formatBs } from '../../constants/finanzasMock';

// Tarjetas de indicadores (KPIs) del dashboard
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
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
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
        </DashboardLayout>
    );
}