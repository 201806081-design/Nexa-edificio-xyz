import { useState, useMemo } from 'react';
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
import { PERIODO_ACTUAL, PERIODOS, formatBs } from '../../constants/finanzasMock';
import { PAGOS_MOCK, HISTORIAL_ANTICIPOS, DEPARTAMENTOS_DEUDA } from '../../constants/pagosMock';
import { MOVIMIENTOS_LISTA } from '../../constants/movimientosMock';
import { DEUDAS_VENCIDAS, CONFIG_MORA } from '../../constants/moraMock';

// 'DD/MM/YYYY' -> {dia, mes, anio}
const parseFecha = (f) => {
    const [d, m, y] = (f || '').split('/').map(Number);
    return { dia: d || 0, mes: m || 0, anio: y || 0 };
};

const MESES_FULL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MES_IDX = Object.fromEntries(MESES_FULL.map((n, i) => [n, i + 1]));
const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const parsePeriodo = (p) => {
    const [mes, anio] = (p || '').toLowerCase().split(' ');
    return { mes: MES_IDX[mes] || 0, anio: Number(anio) || 0 };
};

// Devuelve los ultimos N meses (incluyendo el seleccionado), como [{label, mes, anio}]
const mesesPrevios = (mesSel, anioSel, n = 4) => {
    const out = [];
    let m = mesSel; let a = anioSel;
    for (let i = 0; i < n; i++) {
        out.unshift({ label: MESES_CORTO[m - 1], mes: m, anio: a });
        m--; if (m === 0) { m = 12; a--; }
    }
    return out;
};

// Colores del donut por estado
const COLOR_ESTADO = { Pagadas: '#2E9D78', Pendientes: '#E5A33B', Vencidas: '#D9534F' };

export default function DashboardFinanciero() {
    const [periodo, setPeriodo] = useState(PERIODO_ACTUAL);

    const datos = useMemo(() => {
        const { mes, anio } = parsePeriodo(periodo);
        const enMes = (fecha, m, a) => {
            const p = parseFecha(fecha); return p.mes === m && p.anio === a;
        };

        // --- KPIs del periodo (sincronizados con Resumen) ---
        const sumPagos = PAGOS_MOCK.filter((p) => enMes(p.fecha, mes, anio)).reduce((s, p) => s + (p.monto || 0), 0);
        const sumAnticipos = HISTORIAL_ANTICIPOS.filter((a) => enMes(a.fecha, mes, anio)).reduce((s, a) => s + (a.recibido || 0), 0);
        const sumOtros = MOVIMIENTOS_LISTA.filter((m) => m.tipo === 'Ingreso' && enMes(m.fecha, mes, anio)).reduce((s, m) => s + (m.monto || 0), 0);
        const ingresos = sumPagos + sumAnticipos + sumOtros;
        const gastos = MOVIMIENTOS_LISTA
            .filter((m) => (m.tipo === 'Gasto' || m.tipo === 'Egreso') && enMes(m.fecha, mes, anio))
            .reduce((s, m) => s + (m.monto || 0), 0);
        const balance = ingresos - gastos;

        // Saldo pendiente (snapshot, no se filtra por periodo)
        const saldoActivo = DEPARTAMENTOS_DEUDA.reduce((s, d) => s + (d.saldoPendiente || 0), 0);
        const saldoVencido = DEUDAS_VENCIDAS.reduce((s, d) => s + (d.deudaOriginal || 0), 0);
        const saldoPendiente = saldoActivo + saldoVencido;

        // --- Grafico "Ingresos vs Gastos" (4 meses hacia atras desde el periodo) ---
        const trend = mesesPrevios(mes, anio, 4).map(({ label, mes: mm, anio: aa }) => {
            const ing = PAGOS_MOCK.filter((p) => enMes(p.fecha, mm, aa)).reduce((s, p) => s + (p.monto || 0), 0)
                + HISTORIAL_ANTICIPOS.filter((a) => enMes(a.fecha, mm, aa)).reduce((s, a) => s + (a.recibido || 0), 0)
                + MOVIMIENTOS_LISTA.filter((m) => m.tipo === 'Ingreso' && enMes(m.fecha, mm, aa)).reduce((s, m) => s + (m.monto || 0), 0);
            const gas = MOVIMIENTOS_LISTA
                .filter((m) => (m.tipo === 'Gasto' || m.tipo === 'Egreso') && enMes(m.fecha, mm, aa))
                .reduce((s, m) => s + (m.monto || 0), 0);
            return { mes: label, ingresos: ing, gastos: gas };
        });

        // --- Donut "Estado de expensas" (por monto, con interes sobre vencidas) ---
        const tasa = (Number(CONFIG_MORA.interesMensual) || 0) / 100;
        const vencidasConInteres = DEUDAS_VENCIDAS.reduce((s, d) => {
            const deuda = CONFIG_MORA.tipoCalculo === 'Simple'
                ? d.deudaOriginal * (1 + tasa * d.meses)
                : d.deudaOriginal * (1 + tasa) ** d.meses;
            return s + deuda;
        }, 0);
        const estadoExpensas = [
            { estado: 'Pagadas', valor: sumPagos },                 // lo pagado este periodo
            { estado: 'Pendientes', valor: saldoActivo },               // deuda del mes
            { estado: 'Vencidas', valor: vencidasConInteres },        // deudas vencidas + mora
        ];
        const totalEstado = estadoExpensas.reduce((s, e) => s + e.valor, 0);

        // --- Departamentos con mora (desde DEUDAS_VENCIDAS, con interes aplicado) ---
        const departamentosMora = DEUDAS_VENCIDAS.map((d) => {
            const deudaActual = CONFIG_MORA.tipoCalculo === 'Simple'
                ? d.deudaOriginal * (1 + tasa * d.meses)
                : d.deudaOriginal * (1 + tasa) ** d.meses;
            return {
                id: d.id,
                departamento: `Depto. ${d.depto}`,
                monto: deudaActual,
                estado: d.meses >= 2 ? 'Vencido' : 'En mora',
            };
        }).sort((a, b) => b.monto - a.monto);

        // --- Ultimos movimientos (unificado, top 5) ---
        const unificado = [
            ...PAGOS_MOCK.map((p) => ({ fecha: p.fecha, descripcion: `Pago ${p.id} — Dpto. ${p.depto}`, tipo: 'ingreso', monto: p.monto })),
            ...HISTORIAL_ANTICIPOS.map((a) => ({ fecha: a.fecha, descripcion: `Anticipo ${a.id} — Dpto. ${a.depto}`, tipo: 'ingreso', monto: a.recibido })),
            ...MOVIMIENTOS_LISTA.map((m) => ({ fecha: m.fecha, descripcion: m.descripcion, tipo: m.tipo === 'Ingreso' ? 'ingreso' : 'egreso', monto: m.monto })),
        ].sort((a, b) => {
            const fa = parseFecha(a.fecha); const fb = parseFecha(b.fecha);
            return (fb.anio - fa.anio) || (fb.mes - fa.mes) || (fb.dia - fa.dia);
        }).slice(0, 5);

        return { ingresos, gastos, balance, saldoPendiente, trend, estadoExpensas, totalEstado, departamentosMora, ultimos: unificado };
    }, [periodo]);

    const KPIS = [
        { clave: 'ingresos', label: 'Ingresos del periodo', valor: datos.ingresos, icon: <NorthIcon />, color: '#2E9D78', bg: '#E4F4EE' },
        { clave: 'gastos', label: 'Gastos del periodo', valor: datos.gastos, icon: <SouthIcon />, color: '#D9534F', bg: '#FBEAE9' },
        { clave: 'balance', label: 'Balance', valor: datos.balance, icon: <DragHandleIcon />, color: datos.balance >= 0 ? '#2E9D78' : '#D9534F', bg: '#E4EEF5' },
        { clave: 'saldoPendiente', label: 'Saldo pendiente', valor: datos.saldoPendiente, icon: <DescriptionOutlinedIcon />, color: '#1F5F8B', bg: '#E4EEF5' },
    ];

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
                            <Typography variant="h3" sx={{ fontWeight: 700, color: k.color }}>{formatBs(k.valor)}</Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* Graficos */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h3" color="primary.main" sx={{ fontWeight: 600, mb: 0.5 }}>Ingresos vs. gastos</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        Tendencia de los ultimos 4 meses (segun lo registrado en el sistema)
                    </Typography>
                    <Box sx={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={datos.trend}>
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
                    <Typography variant="h3" color="primary.main" sx={{ fontWeight: 600, mb: 0.5 }}>Estado de expensas (por monto)</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        Cobrado del periodo vs. pendiente actual vs. vencidas (con interes)
                    </Typography>
                    {datos.totalEstado === 0 ? (
                        <Box sx={{ height: 280, display: 'grid', placeItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">Sin datos para mostrar</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ position: 'relative', height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={datos.estadoExpensas}
                                        dataKey="valor"
                                        nameKey="estado"
                                        innerRadius={75}
                                        outerRadius={110}
                                        paddingAngle={2}
                                        labelLine={false}
                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                            if (percent < 0.05) return null;
                                            const RAD = Math.PI / 180;
                                            const r = innerRadius + (outerRadius - innerRadius) / 2;
                                            const x = cx + r * Math.cos(-midAngle * RAD);
                                            const y = cy + r * Math.sin(-midAngle * RAD);
                                            return (
                                                <text x={x} y={y} fill="#fff" fontSize={13} fontWeight={700}
                                                    textAnchor="middle" dominantBaseline="central">
                                                    {(percent * 100).toFixed(0)}%
                                                </text>
                                            );
                                        }}
                                    >
                                        {datos.estadoExpensas.map((e) => <Cell key={e.estado} fill={COLOR_ESTADO[e.estado]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v) => formatBs(v)} />
                                    <Legend formatter={(value) => {
                                        const item = datos.estadoExpensas.find((e) => e.estado === value);
                                        const pct = item && datos.totalEstado > 0 ? Math.round((item.valor / datos.totalEstado) * 100) : 0;
                                        return `${value}  ${pct}%`;
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <Box sx={{
                                position: 'absolute', top: '42%', left: 0, right: 0, textAlign: 'center',
                                transform: 'translateY(-50%)', pointerEvents: 'none',
                            }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary' }}>{formatBs(datos.totalEstado)}</Typography>
                                <Typography variant="caption" color="text.secondary">Total</Typography>
                            </Box>
                        </Box>
                    )}
                </Paper>
            </Box>

            {/* Listas: mora + movimientos */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h3" color="primary.main" sx={{ fontWeight: 600, mb: 1.5 }}>Departamentos con mora</Typography>
                    {datos.departamentosMora.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Sin departamentos en mora.</Typography>
                    ) : datos.departamentosMora.map((d, i) => (
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
                    {datos.ultimos.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Sin movimientos recientes.</Typography>
                    ) : datos.ultimos.map((m, i) => {
                        const esIngreso = m.tipo === 'ingreso';
                        const color = esIngreso ? 'success.main' : 'error.main';
                        return (
                            <Box key={i}>
                                {i > 0 && <Divider />}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 1.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                                        <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: esIngreso ? '#E4F4EE' : '#FBEAE9', color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                            {esIngreso ? <NorthIcon fontSize="small" /> : <SouthIcon fontSize="small" />}
                                        </Box>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography sx={{ fontWeight: 600, color }}>
                                                {esIngreso ? '+' : '-'} {formatBs(m.monto)}
                                            </Typography>
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
        </DashboardLayout>
    );
}