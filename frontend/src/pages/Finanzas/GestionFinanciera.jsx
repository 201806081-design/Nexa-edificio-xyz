import { useState } from 'react';
import { Box, Typography, Select, MenuItem, Paper, Button } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { PERIODO_ACTUAL, PERIODOS, RESUMEN_MOCK, formatBs } from '../../constants/finanzasMock';

// KPIs (colores del design system)
const KPIS = [
    { clave: 'ingresos', label: 'Ingresos', icon: <NorthIcon />, color: 'success.main', bg: '#E4F4EE' },
    { clave: 'gastos', label: 'Gastos', icon: <SouthIcon />, color: 'error.main', bg: '#FBEAE9' },
    { clave: 'saldoPendiente', label: 'Saldo pendiente', icon: <DragHandleIcon />, color: 'primary.main', bg: '#E4EEF5' },
];

// Accesos a sub-vistas. habilitado=false: navega al placeholder pero mantiene el look del mockup.
const ACCESOS = [
    { titulo: 'Expensas', desc: 'Genera y consulta las expensas mensuales', texto: 'Ir a expensas', icon: <DescriptionOutlinedIcon />, ruta: '/finanzas/expensas' },
    { titulo: 'Pagos', desc: 'Registra pagos y consulta el historial', texto: 'Ir a pagos', icon: <CreditCardOutlinedIcon />, ruta: '/finanzas/pagos' },
    { titulo: 'Estado de cuenta', desc: 'Consulta saldos por departamento', texto: 'Consultar estado', icon: <DescriptionOutlinedIcon />, ruta: '/finanzas/estado-cuenta' },
    { titulo: 'Ingresos y gastos', desc: 'Controla los movimientos economicos', texto: 'Ver movimientos', icon: <BarChartIcon />, ruta: '/finanzas/ingresos-gastos' },
    { titulo: 'Mora y anticipos', desc: 'Gestiona vencimientos y saldos a favor', texto: 'Gestionar mora', icon: <AccessTimeIcon />, ruta: '/finanzas/mora' },
];

export default function GestionFinanciera() {
    const navigate = useNavigate();
    const [periodo, setPeriodo] = useState(PERIODO_ACTUAL);

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Gestion financiera</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Administra expensas, pagos y movimientos del edificio
            </Typography>

            {/* Periodo */}
            <Box sx={{ maxWidth: 360, mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                    {PERIODOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
            </Box>

            {/* KPIs */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                {KPIS.map((k) => (
                    <Paper key={k.clave} sx={{ p: 3, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: k.bg, color: k.color, display: 'grid', placeItems: 'center' }}>
                            {k.icon}
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">{k.label}</Typography>
                            <Typography variant="h2" sx={{ color: k.color }}>{formatBs(RESUMEN_MOCK[k.clave])}</Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* Accesos a sub-vistas */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                {ACCESOS.map((a) => (
                    <Paper key={a.titulo} sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: '#E4EEF5', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                            {a.icon}
                        </Box>
                        <Typography variant="h3" color="primary.main" sx={{ fontWeight: 600 }}>{a.titulo}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>{a.desc}</Typography>
                        <Button
                            fullWidth
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => navigate(a.ruta)}
                            sx={{ mt: 1, bgcolor: '#E4EEF5', color: 'primary.main', '&:hover': { bgcolor: '#D4E3EE' } }}
                        >
                            {a.texto}
                        </Button>
                    </Paper>
                ))}
            </Box>
        </DashboardLayout>
    );
}