import { useState, useMemo } from 'react';
import { Box, Typography, Select, MenuItem, Paper, Button, Chip, Divider } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { usePermisos } from '../../hooks/usePermisos';
import { formatBs } from '../../constants/finanzasMock';
import { periodosConTodos } from '../../constants/periodos';
import { resumenFinanciero, libroDiario, enPeriodo } from '../../constants/movimientosMock';
import { saldoPendienteTotal, calcularDeudas, round2 } from '../../constants/deudasMock';
import CuadreFondos from '../../components/CuadreFondos';

// Accesos a sub-vistas (solo se muestran los que el rol tiene permitidos)
const ACCESOS = [
    { clave: 'finanzas.expensas', titulo: 'Expensas', desc: 'Genera y consulta las expensas mensuales', texto: 'Ir a expensas', icon: <DescriptionOutlinedIcon />, ruta: '/finanzas/expensas' },
    { clave: 'finanzas.pagos', titulo: 'Pagos', desc: 'Registra pagos y consulta el historial', texto: 'Ir a pagos', icon: <CreditCardOutlinedIcon />, ruta: '/finanzas/pagos' },
    { clave: 'finanzas.estadoCuenta', titulo: 'Estado de cuenta', desc: 'Consulta saldos por departamento', texto: 'Consultar estado', icon: <DescriptionOutlinedIcon />, ruta: '/finanzas/estado-cuenta' },
    { clave: 'finanzas.ingresosGastos', titulo: 'Ingresos y gastos', desc: 'Controla los movimientos economicos', texto: 'Ver movimientos', icon: <BarChartIcon />, ruta: '/finanzas/ingresos-gastos' },
    { clave: 'finanzas.cajaBancos', titulo: 'Caja y bancos', desc: 'Controla la caja, las cuentas bancarias y la conciliacion', texto: 'Ir a caja y bancos', icon: <AccountBalanceIcon />, ruta: '/finanzas/caja-bancos' },
    { clave: 'finanzas.mora', titulo: 'Mora e intereses', desc: 'Configura intereses y actualiza deudas vencidas', texto: 'Gestionar mora', icon: <AccessTimeIcon />, ruta: '/finanzas/mora' },
];

export default function GestionFinanciera() {
    const navigate = useNavigate();
    const { puede } = usePermisos();
    // Periodos: mes en curso + meses cerrados desde el inicio del sistema (periodos.js)
    // "Todos los periodos" (por defecto) muestra el acumulado; luego cada mes
    const periodos = useMemo(() => periodosConTodos(), []);
    const [periodo, setPeriodo] = useState(() => periodos[0] || '');

    // Calcula los KPIs en vivo desde los mocks reales (sincronizado con todo el sistema).
    // Ingresos y Gastos se filtran por el periodo seleccionado.
    // Saldo pendiente es un snapshot al dia de hoy (no se filtra por periodo: si todos pagan, llega a 0).
    const resumen = useMemo(() => {
        // INGRESOS y GASTOS DEL PERIODO: formula unica (resumenFinanciero),
        // la misma de Ingresos y gastos y de los reportes.
        const { ingresos, gastos, balance } = resumenFinanciero(periodo);

        // SALDO PENDIENTE = total que los residentes deben al edificio hoy
        //   (vencido con interes + no vencido). Calculo unico de deudasMock.
        const saldoPendiente = saldoPendienteTotal();

        // Departamentos con mora hoy (calculo unico de deudas, con interes)
        const porDepto = new Map();
        calcularDeudas().filter((d) => d.vencida).forEach((d) => {
            const g = porDepto.get(d.depto) ?? { depto: d.depto, monto: 0, meses: 0 };
            g.monto = round2(g.monto + d.pendiente);
            g.meses = Math.max(g.meses, d.meses);
            porDepto.set(d.depto, g);
        });
        const morosos = [...porDepto.values()].sort((a, b) => b.monto - a.monto);

        // Ultimos 5 movimientos del periodo (libro completo)
        const ultimos = libroDiario().filter((m) => enPeriodo(m.fecha, periodo)).slice(0, 5);

        return { ingresos, gastos, balance, saldoPendiente, morosos, ultimos };
    }, [periodo]);

    const KPIS = [
        { clave: 'ingresos', label: 'Ingresos del periodo', valor: resumen.ingresos, icon: <NorthIcon />, color: '#2E9D78', bg: '#E4F4EE' },
        { clave: 'gastos', label: 'Gastos del periodo', valor: resumen.gastos, icon: <SouthIcon />, color: '#D9534F', bg: '#FBEAE9' },
        // Balance = ingresos - gastos (verde si es positivo, rojo si es negativo)
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

            {/* Saldo de apertura + ingresos - gastos = disponible (caja + banco) */}
            <CuadreFondos periodo={periodo} />

            {/* Lo que hay que atender: departamentos con mora y ultimos movimientos */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2, mb: 2 }}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h3" color="primary.main" sx={{ fontWeight: 600 }}>Departamentos con mora</Typography>
                        {puede('finanzas.mora') && (
                            <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/finanzas/mora')}>Ver mora</Button>
                        )}
                    </Box>
                    {resumen.morosos.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Ningun departamento tiene deuda vencida.</Typography>
                    ) : resumen.morosos.map((d, i) => (
                        <Box key={d.depto}>
                            {i > 0 && <Divider />}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 1.25 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                                    <ApartmentIcon sx={{ color: 'error.main' }} />
                                    <Typography sx={{ fontWeight: 600 }}>Depto. {d.depto}</Typography>
                                    <Chip size="small" label={d.meses >= 2 ? `${d.meses} meses` : 'En mora'}
                                        sx={{ bgcolor: '#FBEAE9', color: 'error.main', fontWeight: 600 }} />
                                </Box>
                                <Typography sx={{ fontWeight: 700, color: 'error.main', whiteSpace: 'nowrap' }}>{formatBs(d.monto)}</Typography>
                            </Box>
                        </Box>
                    ))}
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h3" color="primary.main" sx={{ fontWeight: 600 }}>Ultimos movimientos</Typography>
                        {puede('finanzas.ingresosGastos') && (
                            <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/finanzas/ingresos-gastos')}>Ver todos</Button>
                        )}
                    </Box>
                    {resumen.ultimos.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Sin movimientos en {periodo}.</Typography>
                    ) : resumen.ultimos.map((m, i) => {
                        const esIngreso = m.tipo === 'Ingreso';
                        const color = esIngreso ? '#2E9D78' : '#D9534F';
                        return (
                            <Box key={m.id ?? i}>
                                {i > 0 && <Divider />}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 1.25 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                                        <Box sx={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', bgcolor: esIngreso ? '#E4F4EE' : '#FBEAE9', color, display: 'grid', placeItems: 'center' }}>
                                            {esIngreso ? <NorthIcon fontSize="small" /> : <SouthIcon fontSize="small" />}
                                        </Box>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography sx={{ fontWeight: 600, color }}>{esIngreso ? '+' : '−'} {formatBs(m.monto)}</Typography>
                                            <Typography variant="body2" color="text.secondary" noWrap>{m.descripcion}</Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>{m.fecha}</Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Paper>
            </Box>

            {/* Accesos a sub-vistas */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                {ACCESOS.filter((a) => puede(a.clave)).map((a) => (
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