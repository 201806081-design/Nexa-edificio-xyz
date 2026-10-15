import { useState } from 'react';
import {
    Box, Typography, Paper, Button, Select, MenuItem, TextField, Alert, InputAdornment,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    EXPENSA_BASE, CONFIG_AGUA, APLICAR_MINIMO_OPCIONES,
    REGLAS_PERIODO, DIAS_VENCIMIENTO, MONEDAS, CONFIG_VIGENTE_DESDE,
} from '../../constants/configuracionMock';

// Tarjeta de un tipo de departamento con su monto base editable
function TarjetaTipo({ tipo, valor, onChange }) {
    return (
        <Box sx={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: '#E4EEF5', color: 'primary.main', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                {tipo}
            </Box>
            <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Departamento tipo {tipo}</Typography>
                <TextField fullWidth value={valor} onChange={(e) => onChange(e.target.value)}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> } }} />
            </Box>
        </Box>
    );
}

export default function ConfiguracionFinanciera() {
    const navigate = useNavigate();
    const [base, setBase] = useState(EXPENSA_BASE);
    const [agua, setAgua] = useState(CONFIG_AGUA);
    const [reglas, setReglas] = useState(REGLAS_PERIODO);

    const cambiarBase = (tipo, valor) => setBase((b) => ({ ...b, [tipo]: valor }));
    const cambiarAgua = (campo, valor) => setAgua((a) => ({ ...a, [campo]: valor }));
    const cambiarReglas = (campo, valor) => setReglas((r) => ({ ...r, [campo]: valor }));

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Configuracion financiera</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Define los valores que se utilizaran al generar cada periodo
            </Typography>

            {/* Aviso: montos fijos */}
            <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', mb: 3 }}>
                <strong>Los montos A, B y C son fijos por tipo de departamentos.</strong><br />
                Solo cambian cuando el administrador actualiza esta configuracion; no se escriben nuevamente cada mes.
            </Alert>

            {/* Expensa base por tipo */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 0.5 }}>
                    Expensa base por tipo de departamento
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configure el monto mensual vigente para cada tipo de departamento.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TarjetaTipo tipo="A" valor={base.A} onChange={(v) => cambiarBase('A', v)} />
                    <TarjetaTipo tipo="B" valor={base.B} onChange={(v) => cambiarBase('B', v)} />
                    <TarjetaTipo tipo="C" valor={base.C} onChange={(v) => cambiarBase('C', v)} />
                </Box>
            </Paper>

            {/* Agua + Reglas del periodo */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                {/* Configuracion del agua */}
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 0.5 }}>
                        Configuracion del agua
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        El consumo se obtiene de la diferencia entre lecturas
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 160 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Precio por m3</Typography>
                            <TextField fullWidth value={agua.precioM3} onChange={(e) => cambiarAgua('precioM3', e.target.value)}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> } }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 160 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Tarifa minima de agua</Typography>
                            <TextField fullWidth value={agua.tarifaMinima} onChange={(e) => cambiarAgua('tarifaMinima', e.target.value)}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> } }} />
                        </Box>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Aplicar tarifa minima cuando</Typography>
                    <Select fullWidth value={agua.aplicarMinimo} onChange={(e) => cambiarAgua('aplicarMinimo', e.target.value)}>
                        {APLICAR_MINIMO_OPCIONES.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                    </Select>
                </Paper>

                {/* Reglas del periodo */}
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 2 }}>
                        Reglas del periodo
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 160 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Dia de vencimiento</Typography>
                            <Select fullWidth value={reglas.diaVencimiento} onChange={(e) => cambiarReglas('diaVencimiento', e.target.value)}>
                                {DIAS_VENCIMIENTO.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                            </Select>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 160 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Moneda</Typography>
                            <Select fullWidth value={reglas.moneda} onChange={(e) => cambiarReglas('moneda', e.target.value)}>
                                {MONEDAS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                            </Select>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#E4F4EE', borderRadius: 2, p: 2 }}>
                        <CheckCircleIcon sx={{ color: '#2E9D78' }} />
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2E9D78' }}>Configuracion vigente</Typography>
                            <Typography variant="body2" color="text.secondary">Se aplicara desde {CONFIG_VIGENTE_DESDE}</Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* Botones */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column-reverse', md: 'row' }, justifyContent: { md: 'flex-end' } }}>
                <Button variant="outlined" onClick={() => navigate('/finanzas/expensas')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Cancelar
                </Button>
                <Button variant="contained" onClick={() => navigate('/finanzas/expensas')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Guardar configuracion
                </Button>
            </Box>
        </DashboardLayout>
    );
}