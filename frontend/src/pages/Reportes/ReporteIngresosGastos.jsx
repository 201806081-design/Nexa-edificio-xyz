import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, TextField, InputAdornment, Select, MenuItem, Chip,
    Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import BalanceIcon from '@mui/icons-material/Balance';
import DashboardLayout from '../../layouts/DashboardLayout';
import { datosIngresosGastos, reporteIngresosGastos } from '../../constants/reportesMock';
import { periodosDeReporte } from '../../constants/periodos';
import { formatBs } from '../../constants/finanzasMock';
import {
    EncabezadoReporte, KpiReporte, GrillaKpis, BarraFiltros, SelectorPeriodo, CampoFiltro, TablaDeslizable,
} from './componentesReporte';

// 8.5 Reporte de ingresos y gastos: totales por categoria y detalle del periodo (mensual o anual).

function Categorias({ titulo, total, categorias, color, fondo }) {
    return (
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, minWidth: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 2 }}>
                <Typography sx={{ fontWeight: 700, color }}>{titulo}</Typography>
                <Typography sx={{ fontWeight: 700, color }}>{formatBs(total)}</Typography>
            </Box>
            {categorias.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Sin movimientos en este periodo.</Typography>
            ) : categorias.map((c) => (
                <Box key={c.categoria} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" sx={{ minWidth: 0 }} noWrap>
                            {c.categoria}
                            <Typography component="span" variant="caption" color="text.secondary"> · {c.cantidad} mov.</Typography>
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {formatBs(c.monto)} <Typography component="span" variant="caption" color="text.secondary">({c.porcentaje} %)</Typography>
                        </Typography>
                    </Box>
                    <Box sx={{ height: 8, bgcolor: fondo, borderRadius: 1 }}>
                        <Box sx={{ height: '100%', width: `${c.porcentaje}%`, bgcolor: color, borderRadius: 1 }} />
                    </Box>
                </Box>
            ))}
        </Paper>
    );
}

export default function ReporteIngresosGastos() {
    const periodos = useMemo(() => periodosDeReporte(), []);
    const [periodo, setPeriodo] = useState(() => periodos[0] || '');
    const [tipo, setTipo] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');

    const d = useMemo(() => datosIngresosGastos(periodo), [periodo]);
    const movimientos = d.movimientos.filter((m) =>
        (tipo === 'Todos' || (tipo === 'Ingreso' ? m.tipo === 'Ingreso' : m.tipo !== 'Ingreso'))
        && `${m.descripcion} ${m.categoria}`.toLowerCase().includes(busqueda.trim().toLowerCase()));
    const positivo = d.resultado >= 0;

    return (
        <DashboardLayout>
            <EncabezadoReporte
                titulo="Reporte de ingresos y gastos"
                descripcion="Movimientos del periodo clasificados por categoria. Elige un mes o el año completo"
                crearReporte={() => reporteIngresosGastos(d)}
            />

            <BarraFiltros>
                <SelectorPeriodo valor={periodo} opciones={periodos} onChange={setPeriodo} />
                <CampoFiltro etiqueta="Tipo" minWidth={150}>
                    <Select fullWidth value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        <MenuItem value="Todos">Ingresos y gastos</MenuItem>
                        <MenuItem value="Ingreso">Solo ingresos</MenuItem>
                        <MenuItem value="Gasto">Solo gastos</MenuItem>
                    </Select>
                </CampoFiltro>
                <CampoFiltro etiqueta="Buscar" flex={2} minWidth={220}>
                    <TextField fullWidth placeholder="Descripcion o categoria" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} />
                </CampoFiltro>
            </BarraFiltros>

            <GrillaKpis columnas={3}>
                <KpiReporte etiqueta="Ingresos" valor={formatBs(d.ingresos)} icono={<NorthIcon />} color="#2E9D78" fondo="#E4F4EE" />
                <KpiReporte etiqueta="Gastos" valor={formatBs(d.gastos)} icono={<SouthIcon />} color="#D9534F" fondo="#FBEAE9" />
                <KpiReporte etiqueta="Resultado" valor={`${positivo ? '+ ' : '− '}${formatBs(Math.abs(d.resultado))}`}
                    icono={<BalanceIcon />} color={positivo ? '#2E9D78' : '#D9534F'} fondo={positivo ? '#E4F4EE' : '#FBEAE9'} />
            </GrillaKpis>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <Categorias titulo="Ingresos por categoria" total={d.ingresos} categorias={d.ingresosPorCategoria} color="#2E9D78" fondo="#E4F4EE" />
                <Categorias titulo="Gastos por categoria" total={d.gastos} categorias={d.gastosPorCategoria} color="#D9534F" fondo="#FBEAE9" />
            </Box>

            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Detalle de movimientos ({movimientos.length})</Typography>
                <TablaDeslizable minWidth={820}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Fecha</strong></TableCell>
                                <TableCell><strong>Tipo</strong></TableCell>
                                <TableCell><strong>Categoria</strong></TableCell>
                                <TableCell><strong>Descripcion</strong></TableCell>
                                <TableCell><strong>Medio / cuenta</strong></TableCell>
                                <TableCell align="right"><strong>Monto</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {movimientos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>No hay movimientos con estos filtros.</TableCell>
                                </TableRow>
                            ) : movimientos.map((m) => {
                                const ingreso = m.tipo === 'Ingreso';
                                return (
                                    <TableRow key={m.id} hover>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{m.fecha}</TableCell>
                                        <TableCell>
                                            <Chip size="small" label={ingreso ? 'Ingreso' : 'Gasto'}
                                                sx={ingreso ? { bgcolor: '#E4F4EE', color: '#2E9D78' } : { bgcolor: '#FBEAE9', color: '#D9534F' }} />
                                        </TableCell>
                                        <TableCell>{m.categoria}</TableCell>
                                        <TableCell>{m.descripcion}</TableCell>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {m.medio}
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{m.cuenta}</Typography>
                                        </TableCell>
                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 700, color: ingreso ? '#2E9D78' : '#D9534F' }}>
                                            {ingreso ? '+' : '−'} {formatBs(m.monto)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TablaDeslizable>
            </Paper>
        </DashboardLayout>
    );
}
