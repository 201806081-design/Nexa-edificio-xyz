import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, TextField, InputAdornment, Select, MenuItem, IconButton, Tooltip, Chip,
    Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { datosMorosos, reporteMorosos } from '../../constants/reportesMock';
import { periodosDeReporte } from '../../constants/periodos';
import { CATEGORIAS_DEPTO } from '../../constants/edificioMock';
import { formatBs } from '../../constants/finanzasMock';
import {
    EncabezadoReporte, KpiReporte, GrillaKpis, BarraFiltros, SelectorPeriodo, CampoFiltro, TablaDeslizable,
} from './componentesReporte';

// 8.4 Lista de morosos: departamentos con deuda vencida a la fecha de corte del periodo.

export default function ListaMorosos() {
    const navigate = useNavigate();
    const periodos = useMemo(() => periodosDeReporte(), []);
    const [periodo, setPeriodo] = useState(() => periodos[0] || '');
    const [busqueda, setBusqueda] = useState('');
    const [tipo, setTipo] = useState('Todos');

    const d = useMemo(() => datosMorosos(periodo), [periodo]);
    const filas = d.filas.filter((f) =>
        (tipo === 'Todos' || f.tipo === tipo)
        && `${f.depto} ${f.responsable}`.toLowerCase().includes(busqueda.trim().toLowerCase()));
    const total = (campo) => Math.round(filas.reduce((s, f) => s + f[campo], 0) * 100) / 100;

    const verHistorial = (depto) => navigate('/reportes/historial-departamento', { state: { depto } });

    return (
        <DashboardLayout>
            <EncabezadoReporte
                titulo="Lista de morosos"
                descripcion="Departamentos con deuda vencida, meses de atraso y mora acumulada"
                crearReporte={() => reporteMorosos(d, filas)}
            />

            <BarraFiltros>
                <CampoFiltro etiqueta="Buscar" flex={2} minWidth={220}>
                    <TextField fullWidth placeholder="Departamento o responsable" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} />
                </CampoFiltro>
                <SelectorPeriodo etiqueta="Deuda al cierre de" valor={periodo} opciones={periodos} onChange={setPeriodo} />
                <CampoFiltro etiqueta="Tipo de departamento" minWidth={160}>
                    <Select fullWidth value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        <MenuItem value="Todos">Todos los tipos</MenuItem>
                        {CATEGORIAS_DEPTO.map((c) => <MenuItem key={c} value={c}>Tipo {c}</MenuItem>)}
                    </Select>
                </CampoFiltro>
            </BarraFiltros>

            <GrillaKpis columnas={3}>
                <KpiReporte etiqueta="Departamentos morosos" valor={`${d.cantidad} departamento${d.cantidad !== 1 ? 's' : ''}`}
                    nota={`${d.porcentajeEdificio} % del edificio`} icono={<PersonOffOutlinedIcon />} color="#D9534F" fondo="#FBEAE9" />
                <KpiReporte etiqueta="Capital vencido" valor={formatBs(d.capital)} nota="Sin incluir la mora"
                    icono={<AccountBalanceWalletOutlinedIcon />} color="#B6802A" fondo="#FDF0D5" />
                <KpiReporte etiqueta="Mora acumulada" valor={formatBs(d.mora)} nota="Segun la regla de mora vigente"
                    icono={<ScheduleIcon />} />
            </GrillaKpis>

            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 700 }}>Morosidad por departamento · al {d.corte}</Typography>
                    {filas.length > 0 && <Chip size="small" label="Critico" sx={{ bgcolor: '#FBEAE9', color: '#D9534F', fontWeight: 600 }} />}
                </Box>
                <TablaDeslizable minWidth={860}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Tipo</strong></TableCell>
                                <TableCell><strong>Dpto.</strong></TableCell>
                                <TableCell><strong>Responsable</strong></TableCell>
                                <TableCell align="center"><strong>Meses vencidos</strong></TableCell>
                                <TableCell align="right"><strong>Capital</strong></TableCell>
                                <TableCell align="right"><strong>Mora</strong></TableCell>
                                <TableCell align="right"><strong>Total deuda</strong></TableCell>
                                <TableCell><strong>Ultimo pago</strong></TableCell>
                                <TableCell align="center"><strong>Detalle</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 3, color: '#2E9D78', fontWeight: 600 }}>
                                        {d.filas.length === 0 ? `Ningun departamento tenia deuda vencida al ${d.corte}.` : 'Ningun moroso coincide con los filtros.'}
                                    </TableCell>
                                </TableRow>
                            ) : filas.map((f) => (
                                <TableRow key={f.depto} hover>
                                    <TableCell>{f.tipo}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{f.depto}</TableCell>
                                    <TableCell>{f.responsable}</TableCell>
                                    <TableCell align="center">{f.meses}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatBs(f.capital)}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: '#D9534F' }}>{formatBs(f.mora)}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: '#D9534F', fontWeight: 700 }}>{formatBs(f.total)}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{f.ultimoPago}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Ver historial del departamento">
                                            <IconButton size="small" color="primary" onClick={() => verHistorial(f.depto)}>
                                                <VisibilityOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TablaDeslizable>
                {filas.length > 0 && (
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: '#FBEAE9' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#D9534F' }}>
                            Total del reporte: capital {formatBs(total('capital'))} + mora {formatBs(total('mora'))} = {formatBs(total('total'))}
                        </Typography>
                    </Box>
                )}
            </Paper>
        </DashboardLayout>
    );
}
