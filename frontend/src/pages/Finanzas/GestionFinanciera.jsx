import { useState } from 'react';
import {
    Box, Typography, Select, MenuItem, Paper, Button, Chip,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import DescriptionIcon from '@mui/icons-material/Description';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BarChartIcon from '@mui/icons-material/BarChart';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { PERIODO_ACTUAL, PERIODOS, RESUMEN_MOCK, formatBs } from '../../constants/finanzasMock';

// KPIs de la fila superior
const KPIS = [
    { clave: 'ingresos', label: 'Ingresos', icon: <TrendingUpIcon />, color: '#2E9D78', bg: '#E6F6EF' },
    { clave: 'gastos', label: 'Gastos', icon: <TrendingDownIcon />, color: '#D64545', bg: '#FCECEC' },
    { clave: 'saldoPendiente', label: 'Saldo pendiente', icon: <DragHandleIcon />, color: '#1F5F8B', bg: '#E7F0F7' },
];

// Accesos a las sub-vistas. habilitado=false => se maqueta pero aun no navega.
const ACCESOS = [
    { titulo: 'Expensas', desc: 'Genera y consulta las expensas mensuales', texto: 'Ir a expensas', icon: <DescriptionIcon />, ruta: '/finanzas/expensas', habilitado: false },
    { titulo: 'Pagos', desc: 'Registra pagos y consulta el historial', texto: 'Ir a pagos', icon: <PaymentIcon />, ruta: '/finanzas/pagos', habilitado: false },
    { titulo: 'Estado de cuenta', desc: 'Consulta saldos por departamento', texto: 'Consultar estado', icon: <ReceiptLongIcon />, ruta: '/finanzas/estado-cuenta', habilitado: false },
    { titulo: 'Ingresos y gastos', desc: 'Controla los movimientos economicos', texto: 'Ver movimientos', icon: <BarChartIcon />, ruta: '/finanzas/ingresos-gastos', habilitado: false },
    { titulo: 'Mora y anticipos', desc: 'Gestiona vencimientos y saldos a favor', texto: 'Gestionar mora', icon: <ScheduleIcon />, ruta: '/finanzas/mora', habilitado: false },
];

export default function GestionFinanciera() {
    const navigate = useNavigate();
    const [periodo, setPeriodo] = useState(PERIODO_ACTUAL);

    return (
        <DashboardLayout>
            <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>Gestion financiera</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Administra expensas, pagos y movimientos del edificio
            </Typography>

            {/* Periodo */}
            <Box sx={{ maxWidth: 320, mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Periodo</Typography>
                <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                    {PERIODOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
            </Box>

            {/* KPIs */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
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

            {/* Accesos a sub-vistas */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                {ACCESOS.map((a) => (
                    <Paper key={a.titulo} sx={{ p: 3, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#E7F0F7', color: '#1F5F8B', display: 'grid', placeItems: 'center' }}>
                            {a.icon}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{a.titulo}</Typography>
                            {!a.habilitado && <Chip label="Proximamente" size="small" sx={{ bgcolor: '#EEF1F4', color: '#5A6B7B' }} />}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>{a.desc}</Typography>
                        <Button
                            variant="contained"
                            endIcon={<ArrowForwardIcon />}
                            disabled={!a.habilitado}
                            onClick={() => navigate(a.ruta)}
                            sx={{ alignSelf: 'flex-start', mt: 1 }}
                        >
                            {a.texto}
                        </Button>
                    </Paper>
                ))}
            </Box>
        </DashboardLayout>
    );
}