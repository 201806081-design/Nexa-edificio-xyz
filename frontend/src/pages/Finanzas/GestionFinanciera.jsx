import { useState, useMemo } from 'react';
import { Box, Typography, Select, MenuItem, Paper, Button } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { formatBs } from '../../constants/finanzasMock';
import { periodosConTodos } from '../../constants/periodos';
import { resumenFinanciero } from '../../constants/movimientosMock';
import { saldoPendienteTotal } from '../../constants/deudasMock';

// Accesos a sub-vistas
const ACCESOS = [
    { titulo: 'Expensas', desc: 'Genera y consulta las expensas mensuales', texto: 'Ir a expensas', icon: <DescriptionOutlinedIcon />, ruta: '/finanzas/expensas' },
    { titulo: 'Pagos', desc: 'Registra pagos y consulta el historial', texto: 'Ir a pagos', icon: <CreditCardOutlinedIcon />, ruta: '/finanzas/pagos' },
    { titulo: 'Estado de cuenta', desc: 'Consulta saldos por departamento', texto: 'Consultar estado', icon: <DescriptionOutlinedIcon />, ruta: '/finanzas/estado-cuenta' },
    { titulo: 'Ingresos y gastos', desc: 'Controla los movimientos economicos', texto: 'Ver movimientos', icon: <BarChartIcon />, ruta: '/finanzas/ingresos-gastos' },
    { titulo: 'Mora e intereses', desc: 'Configura intereses y actualiza deudas vencidas', texto: 'Gestionar mora', icon: <AccessTimeIcon />, ruta: '/finanzas/mora' },
];

export default function GestionFinanciera() {
    const navigate = useNavigate();
    // Periodos: mes en curso + meses cerrados desde el inicio del sistema (periodos.js)
    // "Todos los periodos" (por defecto) muestra el acumulado; luego cada mes
    const periodos = useMemo(() => periodosConTodos(), []);
    const [periodo, setPeriodo] = useState(() => periodos[0] || '');

    // Calcula los KPIs en vivo desde los mocks reales (sincronizado con todo el sistema).
    // Ingresos y Gastos se filtran por el periodo seleccionado.
    // Saldo pendiente es un snapshot al dia de hoy (no se filtra por periodo: si todos pagan, llega a 0).
    const resumen = useMemo(() => {
        // INGRESOS y GASTOS DEL PERIODO: formula unica (resumenFinanciero),
        // la misma del Dashboard financiero y de Ingresos y gastos.
        const { ingresos, gastos, balance } = resumenFinanciero(periodo);

        // SALDO PENDIENTE = total que los residentes deben al edificio hoy
        //   (vencido con interes + no vencido). Calculo unico de deudasMock.
        const saldoPendiente = saldoPendienteTotal();

        return { ingresos, gastos, balance, saldoPendiente };
    }, [periodo]);

    const KPIS = [
        { clave: 'ingresos', label: 'Ingresos del periodo', valor: resumen.ingresos, icon: <NorthIcon />, color: '#2E9D78', bg: '#E4F4EE' },
        { clave: 'gastos', label: 'Gastos del periodo', valor: resumen.gastos, icon: <SouthIcon />, color: '#D9534F', bg: '#FBEAE9' },
        // Balance = ingresos - gastos (verde si es positivo, rojo si es negativo); igual que el Dashboard
        {
            clave: 'balance', label: 'Balance del periodo', valor: resumen.balance, icon: <AccountBalanceWalletIcon />,
            color: resumen.balance < 0 ? '#D9534F' : '#2E9D78', bg: resumen.balance < 0 ? '#FBEAE9' : '#E4F4EE',
        },
        { clave: 'saldoPendiente', label: 'Saldo pendiente', valor: resumen.saldoPendiente, icon: <DragHandleIcon />, color: '#1F5F8B', bg: '#E4EEF5' },
    ];

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
                    {periodos.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
            </Box>

            {/* KPIs */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
                {KPIS.map((k) => (
                    <Paper key={k.clave} sx={{ p: 3, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: k.bg, color: k.color, display: 'grid', placeItems: 'center' }}>
                            {k.icon}
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">{k.label}</Typography>
                            <Typography variant="h2" sx={{ color: k.color }}>{formatBs(k.valor)}</Typography>
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