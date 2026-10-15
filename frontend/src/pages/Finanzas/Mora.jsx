import { useState } from 'react';
import {
    Box, Typography, Paper, Button, Chip, IconButton, TextField, Select, MenuItem, Alert,
    Table, TableHead, TableBody, TableRow, TableCell, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    TASA_MORA, CONFIG_MORA, APLICAR_DESPUES, TIPOS_CALCULO, REGLA_MORA, DEUDAS_VENCIDAS,
} from '../../constants/moraMock';
import { formatBs } from '../../constants/finanzasMock';

// Estilo de la barra segmentada (tabs) del design system
const tabGroupSx = {
    mb: 3, bgcolor: '#fff',
    '& .MuiToggleButton-root': {
        textTransform: 'none', fontWeight: 600, color: '#1F5F8B', borderColor: '#cdd8e3', px: 3, py: 1,
    },
    '& .MuiToggleButton-root.Mui-selected': {
        bgcolor: '#1F5F8B', color: '#fff', '&:hover': { bgcolor: '#1C4E70' },
    },
};

export default function Mora() {
    const [tab, setTab] = useState('mora');
    const [config, setConfig] = useState(CONFIG_MORA);
    // Meses vencidos editables por deuda
    const [meses, setMeses] = useState(
        Object.fromEntries(DEUDAS_VENCIDAS.map((d) => [d.id, d.meses])),
    );

    const cambiarConfig = (campo, valor) => setConfig((c) => ({ ...c, [campo]: valor }));
    const cambiarMeses = (id, valor) => setMeses((m) => ({ ...m, [id]: valor }));

    // deuda actual = deuda original * (1 + tasa)^meses ; interes = diferencia
    const filas = DEUDAS_VENCIDAS.map((d) => {
        const n = Math.max(0, Number(meses[d.id]) || 0);
        const deudaActual = d.deudaOriginal * (1 + TASA_MORA) ** n;
        return { ...d, mesesVal: n, interes: deudaActual - d.deudaOriginal, deudaActual };
    });
    const totalVencido = filas.reduce((acc, f) => acc + f.deudaActual, 0);

    const titulo = tab === 'mora' ? 'Mora e intereses' : 'Mora y pagos anticipados';
    const subtitulo = tab === 'mora'
        ? 'Configurar el porcentaje mensual y actualiza las deudas vencidas'
        : 'Gestiona deudas vencidas y saldos a favor de los departamentos';

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>{titulo}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{subtitulo}</Typography>

            {/* Tabs */}
            <ToggleButtonGroup exclusive value={tab} onChange={(e, v) => v && setTab(v)} sx={tabGroupSx}>
                <ToggleButton value="mora">Mora e intereses</ToggleButton>
                <ToggleButton value="anticipos">Pagos anticipados</ToggleButton>
            </ToggleButtonGroup>

            {/* TAB: Mora e intereses */}
            {tab === 'mora' && (
                <Box>
                    {/* Configuracion de mora */}
                    <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Configuracion de mora</Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' } }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Interes mensual</Typography>
                                <TextField fullWidth value={config.interesMensual} onChange={(e) => cambiarConfig('interesMensual', e.target.value)} />
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
                            <Button variant="contained" sx={{ width: { xs: '100%', md: 'auto' }, height: { md: 56 } }}>Guardar</Button>
                        </Box>
                    </Paper>

                    {/* Regla aplicada */}
                    <Alert severity="warning" icon={false} sx={{ bgcolor: '#FDF0D5', color: '#8A5A00', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Regla aplicada</Typography>
                        <Typography variant="body2">{REGLA_MORA.texto}</Typography>
                        <Typography variant="body2">{REGLA_MORA.ejemplo}</Typography>
                    </Alert>

                    {/* Deudas vencidas */}
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
                                            <TableCell>
                                                <TextField size="small" type="number" value={meses[f.id]}
                                                    onChange={(e) => cambiarMeses(f.id, e.target.value)}
                                                    sx={{ width: 80 }} />
                                            </TableCell>
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

                    {/* Total de la deuda vencida */}
                    <Paper sx={{ p: 2.5, borderRadius: 2, mb: 2, bgcolor: '#FBEAE9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 700, color: '#D9534F' }}>Total de la deuda vencida</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#D9534F' }}>{formatBs(totalVencido)}</Typography>
                    </Paper>

                    {/* Actualizar intereses */}
                    <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                        <Button variant="contained" startIcon={<RefreshIcon />} sx={{ width: { xs: '100%', md: 'auto' } }}>
                            Actualizar intereses
                        </Button>
                    </Box>
                </Box>
            )}

            {/* TAB: Pagos anticipados (se implementa en el commit 2) */}
            {tab === 'anticipos' && (
                <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="body2">Pagos anticipados (en construccion)</Typography>
                </Paper>
            )}
        </DashboardLayout>
    );
}