import { useState, useMemo } from 'react';
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
import { PERIODO_ACTUAL, PERIODOS, formatBs } from '../../constants/finanzasMock';
import { PAGOS_MOCK, HISTORIAL_ANTICIPOS, DEPARTAMENTOS_DEUDA } from '../../constants/pagosMock';
import { MOVIMIENTOS_LISTA } from '../../constants/movimientosMock';
import { DEUDAS_VENCIDAS } from '../../constants/moraMock';

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
    const [periodo, setPeriodo] = useState(PERIODO_ACTUAL);

    // Calcula los KPIs en vivo desde los mocks reales (sincronizado con todo el sistema).
    // Ingresos y Gastos se filtran por el periodo seleccionado.
    // Saldo pendiente es un snapshot al dia de hoy (no se filtra por periodo: si todos pagan, llega a 0).
    const resumen = useMemo(() => {
        const { mes, anio } = parsePeriodo(periodo);
        const enPeriodo = (f) => {
            const p = parseFecha(f);
            return p.mes === mes && p.anio === anio;
        };

        // INGRESOS DEL PERIODO = pagos de expensas + anticipos + otros ingresos
        const sumPagos = PAGOS_MOCK.filter((p) => enPeriodo(p.fecha)).reduce((s, p) => s + (p.monto || 0), 0);
        const sumAnticipos = HISTORIAL_ANTICIPOS.filter((a) => enPeriodo(a.fecha)).reduce((s, a) => s + (a.recibido || 0), 0);
        const sumOtros = MOVIMIENTOS_LISTA.filter((m) => m.tipo === 'Ingreso' && enPeriodo(m.fecha)).reduce((s, m) => s + (m.monto || 0), 0);
        const ingresos = sumPagos + sumAnticipos + sumOtros;

        // GASTOS DEL PERIODO = movimientos operativos tipo 'Gasto'
        const gastos = MOVIMIENTOS_LISTA
            .filter((m) => (m.tipo === 'Gasto' || m.tipo === 'Egreso') && enPeriodo(m.fecha))
            .reduce((s, m) => s + (m.monto || 0), 0);

        // SALDO PENDIENTE = total que los residentes deben al edificio hoy
        //   = deudas activas del mes (DEPARTAMENTOS_DEUDA) + deudas vencidas (DEUDAS_VENCIDAS)
        const saldoActivo = DEPARTAMENTOS_DEUDA.reduce((s, d) => s + (d.saldoPendiente || 0), 0);
        const saldoVencido = DEUDAS_VENCIDAS.reduce((s, d) => s + (d.deudaOriginal || 0), 0);
        const saldoPendiente = saldoActivo + saldoVencido;

        return { ingresos, gastos, saldoPendiente };
    }, [periodo]);

    const KPIS = [
        { clave: 'ingresos', label: 'Ingresos del periodo', valor: resumen.ingresos, icon: <NorthIcon />, color: '#2E9D78', bg: '#E4F4EE' },
        { clave: 'gastos', label: 'Gastos del periodo', valor: resumen.gastos, icon: <SouthIcon />, color: '#D9534F', bg: '#FBEAE9' },
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