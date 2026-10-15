import { useState } from 'react';
import {
    Box, Typography, Paper, Button, IconButton, TextField, Select, MenuItem, Alert, Chip,
    InputAdornment, Table, TableHead, TableBody, TableRow, TableCell, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    TASA_MORA, CONFIG_MORA, APLICAR_DESPUES, TIPOS_CALCULO, REGLA_MORA, DEUDAS_VENCIDAS,
    DEPARTAMENTOS_ANTICIPO, HISTORIAL_ANTICIPOS,
} from '../../constants/moraMock';
import { formatBs } from '../../constants/finanzasMock';

// Estilo de la barra segmentada (tabs) del design system
const tabGroupSx = {
    bgcolor: '#fff',
    '& .MuiToggleButton-root': {
        textTransform: 'none', fontWeight: 600, color: '#1F5F8B', borderColor: '#cdd8e3', px: 3, py: 1,
    },
    '& .MuiToggleButton-root.Mui-selected': {
        bgcolor: '#1F5F8B', color: '#fff', '&:hover': { bgcolor: '#1C4E70' },
    },
};

const ANTICIPO_VACIO = { departamento: '', fecha: '2026-10-13', monto: '', descripcion: '' };

export default function Mora() {
    const [tab, setTab] = useState('mora');
    const [config, setConfig] = useState(CONFIG_MORA);

    // Formulario de anticipo
    const [form, setForm] = useState(ANTICIPO_VACIO);
    const [errores, setErrores] = useState({});
    const [exito, setExito] = useState(false);

    const cambiarConfig = (campo, valor) => setConfig((c) => ({ ...c, [campo]: valor }));
    const cambiarForm = (campo, valor) => {
        setForm((f) => ({ ...f, [campo]: valor }));
        setErrores((e) => ({ ...e, [campo]: '' }));
        setExito(false);
    };

    // deuda actual = deuda original * (1 + tasa)^meses ; interes = diferencia.
    // Los meses los calcula el sistema (vienen en los datos), no se editan.
    const filas = DEUDAS_VENCIDAS.map((d) => {
        const deudaActual = d.deudaOriginal * (1 + TASA_MORA) ** d.meses;
        return { ...d, interes: deudaActual - d.deudaOriginal, deudaActual };
    });
    const totalVencido = filas.reduce((acc, f) => acc + f.deudaActual, 0);

    // Resumen del anticipo
    const deptoSel = DEPARTAMENTOS_ANTICIPO.find((d) => d.id === form.departamento);
    const saldoActual = deptoSel ? deptoSel.saldoActual : 0;
    const nuevoSaldo = saldoActual + (Number(form.monto) || 0);

    const registrar = () => {
        const err = {};
        if (!form.departamento) err.departamento = 'Seleccione un departamento';
        if (!form.fecha.trim()) err.fecha = 'Ingrese la fecha de pago';
        if (!(Number(form.monto) > 0)) err.monto = 'Ingrese un monto valido';
        setErrores(err);
        if (Object.keys(err).length > 0) { setExito(false); return; }
        // MOCK: aqui iria el POST al backend.
        setExito(true);
    };

    const titulo = tab === 'mora' ? 'Mora e intereses' : 'Mora y pagos anticipados';
    const subtitulo = tab === 'mora'
        ? 'Configurar el porcentaje mensual y actualiza las deudas vencidas'
        : 'Gestiona deudas vencidas y saldos a favor de los departamentos';

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>{titulo}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{subtitulo}</Typography>

            {/* Tabs dentro de un card blanco */}
            <Paper sx={{ p: 1.5, borderRadius: 2, mb: 3 }}>
                <ToggleButtonGroup exclusive value={tab} onChange={(e, v) => v && setTab(v)} sx={tabGroupSx}>
                    <ToggleButton value="mora">Mora e intereses</ToggleButton>
                    <ToggleButton value="anticipos">Pagos anticipados</ToggleButton>
                </ToggleButtonGroup>
            </Paper>

            {/* TAB: Mora e intereses */}
            {tab === 'mora' && (
                <Box>
                    <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Configuracion de mora</Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' } }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Interes mensual</Typography>
                                <TextField fullWidth type="number" value={config.interesMensual}
                                    onChange={(e) => cambiarConfig('interesMensual', e.target.value)}
                                    slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Aplicar despues de</Typography>
                                <Select fullWidth value={config.aplicarDespuesDe} onChange={(e) => cambiarConfig('aplicarDespuesDe', e.target.value)}>
                                    {APLICAR_DESPUES.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                                </Select>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Tipo de calculo</Typography>
                                <Select fullWidth value={config.tipoCalculo} onChange={(e) => cambiarConfig('tipoCalculo', e.target.value)}>
                                    {TIPOS_CALCULO.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                </Select>
                            </Box>
                            <Button variant="contained" sx={{ width: { xs: '100%', md: 'auto' }, height: { md: 56 }, px: { md: 5 }, minWidth: { md: 150 } }}>Guardar</Button>
                        </Box>
                    </Paper>

                    <Alert severity="warning" icon={false} sx={{ bgcolor: '#FDF0D5', color: '#8A5A00', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Regla aplicada</Typography>
                        <Typography variant="body2">{REGLA_MORA.texto}</Typography>
                        <Typography variant="body2">{REGLA_MORA.ejemplo}</Typography>
                    </Alert>

                    <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Deudas vencidas</Typography>
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 780 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                        <TableCell><strong>Depto</strong></TableCell>
                                        <TableCell><strong>Periodo</strong></TableCell>
                                        <TableCell><strong>Deuda original</strong></TableCell>
                                        <TableCell><strong>Meses</strong></TableCell>
                                        <TableCell><strong>Tasa</strong></TableCell>
                                        <TableCell><strong>Interes</strong></TableCell>
                                        <TableCell><strong>Deuda actual</strong></TableCell>
                                        <TableCell align="center"><strong>Accion</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filas.map((f) => (
                                        <TableRow key={f.id}>
                                            <TableCell>{f.depto}</TableCell>
                                            <TableCell>{f.periodo}</TableCell>
                                            <TableCell>{formatBs(f.deudaOriginal)}</TableCell>
                                            <TableCell>{f.meses}</TableCell>
                                            <TableCell>{(TASA_MORA * 100).toFixed(0)} %</TableCell>
                                            <TableCell sx={{ color: '#D9534F', fontWeight: 600 }}>{formatBs(f.interes)}</TableCell>
                                            <TableCell sx={{ color: '#D9534F', fontWeight: 700 }}>{formatBs(f.deudaActual)}</TableCell>
                                            <TableCell align="center">
                                                <IconButton color="primary"><VisibilityIcon /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Paper>

                    <Paper sx={{ p: 2.5, borderRadius: 2, mb: 2, bgcolor: '#FBEAE9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 700, color: '#D9534F' }}>Total de la deuda vencida</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#D9534F' }}>{formatBs(totalVencido)}</Typography>
                    </Paper>

                    <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                        <Button variant="contained" startIcon={<RefreshIcon />} sx={{ width: { xs: '100%', md: 'auto' } }}>
                            Actualizar intereses
                        </Button>
                    </Box>
                </Box>
            )}

            {/* TAB: Pagos anticipados */}
            {tab === 'anticipos' && (
                <Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2, mb: 2 }}>
                        {/* Registrar pago anticipado */}
                        <Paper sx={{ p: 3, borderRadius: 2, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Registrar pago anticipado</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                El importe quedara como saldo a favor para futuras expensas.
                            </Typography>

                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Departamento *</Typography>
                            <Select fullWidth displayEmpty value={form.departamento}
                                onChange={(e) => cambiarForm('departamento', e.target.value)}
                                error={!!errores.departamento} sx={{ mb: errores.departamento ? 0.5 : 2 }}>
                                <MenuItem value=""><em>Seleccionar departamento</em></MenuItem>
                                {DEPARTAMENTOS_ANTICIPO.map((d) => <MenuItem key={d.id} value={d.id}>{d.etiqueta}</MenuItem>)}
                            </Select>
                            {errores.departamento && <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1.5 }}>{errores.departamento}</Typography>}

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                                <Box sx={{ flex: 1, minWidth: 160 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Fecha de pago *</Typography>
                                    <TextField fullWidth type="date" value={form.fecha} onChange={(e) => cambiarForm('fecha', e.target.value)}
                                        error={!!errores.fecha} helperText={errores.fecha}
                                        slotProps={{ inputLabel: { shrink: true } }} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 160 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Monto anticipado *</Typography>
                                    <TextField fullWidth type="number" placeholder="Bs 720,00" value={form.monto}
                                        onChange={(e) => cambiarForm('monto', e.target.value)}
                                        error={!!errores.monto} helperText={errores.monto} />
                                </Box>
                            </Box>

                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Descripcion</Typography>
                            <TextField fullWidth placeholder="Pago adelantado para proximas expensas" value={form.descripcion}
                                onChange={(e) => cambiarForm('descripcion', e.target.value)} sx={{ mb: 2 }} />

                            {exito && <Alert severity="success" sx={{ mb: 2 }}>Pago anticipado registrado correctamente</Alert>}

                            <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                                <Button variant="contained" onClick={registrar} sx={{ width: { xs: '100%', md: 'auto' } }}>
                                    Registrar pago anticipado
                                </Button>
                            </Box>
                        </Paper>

                        {/* Resumen del departamento */}
                        <Paper sx={{ p: 3, borderRadius: 2, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Resumen del departamento</Typography>
                            <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 2, mb: 1.5 }}>
                                <Typography variant="body2" color="text.secondary">Saldo a favor</Typography>
                                <Typography sx={{ fontWeight: 700 }}>{formatBs(saldoActual)}</Typography>
                            </Box>
                            <Box sx={{ bgcolor: '#E4F4EE', borderRadius: 2, p: 2, mb: 1.5 }}>
                                <Typography variant="body2" color="text.secondary">Nuevo saldo a favor</Typography>
                                <Typography sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(nuevoSaldo)}</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Aplicacion automatica</Typography>
                            <Typography variant="body2" color="text.secondary">
                                El credito se descontara de las siguientes expensas generadas hasta agotarse
                            </Typography>
                        </Paper>
                    </Box>

                    {/* Historial de anticipos */}
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Historial de anticipos</Typography>
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 620 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                        <TableCell><strong>Departamento</strong></TableCell>
                                        <TableCell><strong>Fecha</strong></TableCell>
                                        <TableCell><strong>Monto</strong></TableCell>
                                        <TableCell><strong>Saldo disponible</strong></TableCell>
                                        <TableCell><strong>Estado</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {HISTORIAL_ANTICIPOS.map((a) => (
                                        <TableRow key={a.id}>
                                            <TableCell>{a.departamento}</TableCell>
                                            <TableCell>{a.fecha}</TableCell>
                                            <TableCell>{formatBs(a.monto)}</TableCell>
                                            <TableCell>{formatBs(a.saldoDisponible)}</TableCell>
                                            <TableCell><Chip label={a.estado} size="small" sx={{ bgcolor: '#E4F4EE', color: '#2E9D78' }} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Paper>
                </Box>
            )}
        </DashboardLayout>
    );
}