import { useState, useMemo } from 'react';
import {
    Box, Typography, Select, MenuItem, Paper, Button, Chip, IconButton, TextField, InputAdornment,
    Table, TableHead, TableBody, TableRow, TableCell, Divider, Snackbar, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import TimelineIcon from '@mui/icons-material/Timeline';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    TIPOS_MOVIMIENTO, CATEGORIAS_FILTRO, libroDiario, resumenFinanciero, enPeriodo,
} from '../../constants/movimientosMock';
import { periodosConTodos, periodosAnuales } from '../../constants/periodos';
import { formatBs } from '../../constants/finanzasMock';
import { datosIngresosGastos, reporteIngresosGastos } from '../../constants/reportesMock';
import { exportarPDF, exportarExcel } from '../../utils/exportarReporte';
import CuadreFondos from '../../components/CuadreFondos';

// Ingresos y gastos: registro de movimientos y, a la vez, el reporte 8.5
// (totales por categoria del mes o del año, exportable a PDF y Excel).

// Totales de un tipo (ingresos o gastos) por categoria, con barra de porcentaje
function PorCategoria({ titulo, total, categorias, color, fondo }) {
    return (
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, minWidth: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 2 }}>
                <Typography sx={{ fontWeight: 700, color }}>{titulo}</Typography>
                <Typography sx={{ fontWeight: 700, color, whiteSpace: 'nowrap' }}>{formatBs(total)}</Typography>
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

const tipoChipSx = (tipo) => (tipo === 'Ingreso'
    ? { bgcolor: '#E4F4EE', color: '#2E9D78' }
    : { bgcolor: '#FBEAE9', color: '#D9534F' });

// Mismas cifras que el Resumen y los reportes (resumenFinanciero)
const RESUMEN = [
    { clave: 'ingresos', label: 'Ingresos del periodo', icon: <NorthIcon />, color: '#2E9D78', bg: '#E4F4EE',
        nota: (r) => `Expensas ${formatBs(r.cobrosExpensas)} · Anticipos ${formatBs(r.anticiposRecibidos)} · Otros ${formatBs(r.otrosIngresos)}` },
    { clave: 'gastos', label: 'Gastos del periodo', icon: <SouthIcon />, color: '#D9534F', bg: '#FBEAE9',
        nota: (r) => `Personal ${formatBs(r.gastosPersonal)} · Operativos ${formatBs(r.gastosOperativos)}` },
    { clave: 'balance', label: 'Balance', icon: <DragHandleIcon />, color: null, bg: '#E4EEF5', // color dinamico segun signo
        nota: () => 'Ingresos menos gastos del periodo' },
];

export default function IngresosGastos() {
    const navigate = useNavigate();
    // Periodos: acumulado, cada mes desde el inicio del sistema y cada año (periodos.js)
    const periodos = useMemo(() => [...periodosConTodos(), ...periodosAnuales()], []);
    const [periodo, setPeriodo] = useState(() => periodos[0] || '');
    const [tipo, setTipo] = useState('Todos');
    const [categoria, setCategoria] = useState('Todas');
    const [busqueda, setBusqueda] = useState('');
    const [aviso, setAviso] = useState(null);

    // Movimientos filtrados por periodo + filtros adicionales
    // Libro completo: cobros de expensas, anticipos, otros ingresos y gastos (incluye personal)
    const movimientos = useMemo(() => libroDiario().filter((m) =>
        enPeriodo(m.fecha, periodo) &&
        (tipo === 'Todos' || m.tipo === tipo) &&
        (categoria === 'Todas' || m.categoria === categoria) &&
        m.descripcion.toLowerCase().includes(busqueda.toLowerCase())),
        [periodo, tipo, categoria, busqueda]);

    // KPIs y totales por categoria del periodo (sin los filtros de tipo, categoria y busqueda)
    const resumen = useMemo(() => resumenFinanciero(periodo), [periodo]);
    const reporte = useMemo(() => datosIngresosGastos(periodo), [periodo]);

    // Exporta el periodo completo: totales por categoria y detalle de movimientos
    const exportar = (formato) => {
        try {
            const nombre = (formato === 'pdf' ? exportarPDF : exportarExcel)(reporteIngresosGastos(reporte));
            setAviso({ sev: 'success', msg: `Archivo descargado: ${nombre}` });
        } catch {
            setAviso({ sev: 'error', msg: 'No se pudo generar el archivo. Intenta de nuevo.' });
        }
    };

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Ingresos y gastos</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Todo el dinero que entra y sale del edificio. Los cobros de expensas y anticipos vienen de <strong>Pagos</strong>,
                y los pagos al personal de <strong>Personal</strong>; aqui se registran los demas ingresos y gastos.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'stretch', md: 'flex-end' }, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: 'auto' } }}>
                    <Button variant="outlined" startIcon={<PictureAsPdfOutlinedIcon />} onClick={() => exportar('pdf')}
                        sx={{ flex: { xs: 1, md: 'none' }, color: '#1a2733', borderColor: '#cdd8e3' }}>
                        PDF
                    </Button>
                    <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={() => exportar('excel')}
                        sx={{ flex: { xs: 1, md: 'none' }, color: '#1a2733', borderColor: '#cdd8e3' }}>
                        Excel
                    </Button>
                </Box>
                <Button variant="outlined" startIcon={<TimelineIcon />}
                    onClick={() => navigate('/reportes/flujo-caja')}
                    sx={{ color: '#1a2733', borderColor: '#cdd8e3', width: { xs: '100%', md: 'auto' } }}>
                    Ver flujo de caja
                </Button>
                <Button variant="contained" startIcon={<AddIcon />}
                    onClick={() => navigate('/finanzas/ingresos-gastos/registrar')}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Registrar movimiento
                </Button>
            </Box>

            {/* Filtros */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Box sx={{ flex: 1, minWidth: 160 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                    <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                        {periodos.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 160 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Tipo</Typography>
                    <Select fullWidth value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        {TIPOS_MOVIMIENTO.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 160 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Categoria</Typography>
                    <Select fullWidth value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                        <MenuItem value="Todas">Todas</MenuItem>
                        {CATEGORIAS_FILTRO.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                </Box>
                <Box sx={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'flex-end' }}>
                    <TextField fullWidth placeholder="Buscar movimiento" value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} />
                </Box>
            </Box>

            {/* Tarjetas de resumen (en vivo, filtradas por el periodo seleccionado) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
                {RESUMEN.map((r) => {
                    const valor = resumen[r.clave];
                    // Color dinamico para el "Balance": rojo si negativo, verde si positivo
                    const colorFinal = r.color || (valor < 0 ? '#D9534F' : '#2E9D78');
                    return (
                        <Paper key={r.clave} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: r.bg, color: colorFinal, display: 'grid', placeItems: 'center' }}>
                                {r.icon}
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 700, color: colorFinal }}>{formatBs(valor)}</Typography>
                                <Typography variant="caption" color="text.secondary">{r.nota(resumen)}</Typography>
                            </Box>
                        </Paper>
                    );
                })}
            </Box>

            {/* Saldo de apertura + ingresos - gastos = disponible (mismas cifras que Caja y bancos) */}
            <CuadreFondos periodo={periodo} />

            {/* Totales por categoria del periodo (lo mismo que se exporta) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2, mb: 3 }}>
                <PorCategoria titulo="Ingresos por categoria" total={reporte.ingresos} categorias={reporte.ingresosPorCategoria}
                    color="#2E9D78" fondo="#E4F4EE" />
                <PorCategoria titulo="Gastos por categoria" total={reporte.gastos} categorias={reporte.gastosPorCategoria}
                    color="#D9534F" fondo="#FBEAE9" />
            </Box>

            {/* VISTA ESCRITORIO: tabla */}
            <Paper sx={{ p: 2, borderRadius: 2, display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Movimientos ({movimientos.length})</Typography>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Fecha</strong></TableCell>
                            <TableCell><strong>Tipo</strong></TableCell>
                            <TableCell><strong>Categoria</strong></TableCell>
                            <TableCell><strong>Descripcion</strong></TableCell>
                            <TableCell><strong>Monto</strong></TableCell>
                            <TableCell><strong>Medio / cuenta</strong></TableCell>
                            <TableCell><strong>Comprobante</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {movimientos.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                    No hay movimientos registrados para {periodo}.
                                </TableCell>
                            </TableRow>
                        )}
                        {movimientos.map((m) => {
                            const esIngreso = m.tipo === 'Ingreso';
                            return (
                                <TableRow key={m.id}>
                                    <TableCell>{m.fecha}</TableCell>
                                    <TableCell><Chip label={m.tipo} size="small" sx={tipoChipSx(m.tipo)} /></TableCell>
                                    <TableCell>{m.categoria}</TableCell>
                                    <TableCell>{m.descripcion}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: esIngreso ? '#2E9D78' : '#D9534F' }}>
                                        {esIngreso ? '+' : '-'}{formatBs(m.monto)}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{m.medio || '—'}</Typography>
                                        <Typography variant="caption" color="text.secondary">{m.cuenta || ''}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                            <DescriptionOutlinedIcon fontSize="small" />
                                            <Typography variant="body2">{m.comprobante}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton color="primary" onClick={() => navigate(`/finanzas/ingresos-gastos/${m.id}`)}>
                                            <VisibilityIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Paper>

            {/* VISTA MOVIL: tarjetas */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {movimientos.length === 0 && (
                    <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center', color: 'text.secondary' }}>
                        No hay movimientos registrados para {periodo}.
                    </Paper>
                )}
                {movimientos.map((m) => {
                    const esIngreso = m.tipo === 'Ingreso';
                    return (
                        <Paper key={m.id} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">{m.fecha}</Typography>
                                <Chip label={m.tipo} size="small" sx={tipoChipSx(m.tipo)} />
                            </Box>
                            <Typography sx={{ fontWeight: 600 }}>{m.categoria}</Typography>
                            <Typography variant="body2" color="text.secondary">{m.descripcion}</Typography>
                            <Typography sx={{ fontWeight: 700, color: esIngreso ? '#2E9D78' : '#D9534F', my: 0.5 }}>
                                {esIngreso ? '+' : '-'}{formatBs(m.monto)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                <DescriptionOutlinedIcon fontSize="small" />
                                <Typography variant="body2">{m.comprobante}</Typography>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <IconButton color="primary" onClick={() => navigate(`/finanzas/ingresos-gastos/${m.id}`)}>
                                    <VisibilityIcon />
                                </IconButton>
                            </Box>
                        </Paper>
                    );
                })}
            </Box>

            <Snackbar open={!!aviso} autoHideDuration={3000} onClose={() => setAviso(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                {aviso ? (
                    <Alert severity={aviso.sev} onClose={() => setAviso(null)} sx={{ width: '100%' }}>{aviso.msg}</Alert>
                ) : <span />}
            </Snackbar>
        </DashboardLayout>
    );
}