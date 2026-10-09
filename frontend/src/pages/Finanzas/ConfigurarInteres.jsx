import { useState } from 'react';
import {
    Box, Typography, Paper, Button, Select, MenuItem, TextField, Switch,
    InputAdornment, Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { CONFIG_INTERES, TIPOS_INTERES, APLICAR_DESDE, SALDOS_VENCIDOS } from '../../constants/moraMock';
import { formatBs } from '../../constants/finanzasMock';

export default function ConfigurarInteres() {
    const navigate = useNavigate();
    const [config, setConfig] = useState(CONFIG_INTERES);

    const cambiar = (campo, valor) => setConfig((c) => ({ ...c, [campo]: valor }));

    // Vista previa sobre el primer saldo vencido del mock
    const ejemplo = SALDOS_VENCIDOS[0];
    const interes = Math.round(ejemplo.capital * (Number(config.porcentaje) / 100) * 100) / 100;
    const totalActualizado = ejemplo.capital + interes;

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Configurar interes por mora</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Finanzas / Mora y anticipos / Configuracion
            </Typography>

            <Paper sx={{ p: 4, borderRadius: 2 }}>
                {/* Activar calculo */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#E4EEF5', borderRadius: 2, p: 2, mb: 3 }}>
                    <Typography sx={{ fontWeight: 600 }}>Calculo de mora activo</Typography>
                    <Switch checked={config.activo} onChange={(e) => cambiar('activo', e.target.checked)} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Define la regla utilizando para calcular interes sobre saldos vencidos
                </Typography>

                {/* Tipo + Porcentaje */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Tipo de interes</Typography>
                        <Select fullWidth value={config.tipoInteres} onChange={(e) => cambiar('tipoInteres', e.target.value)}>
                            {TIPOS_INTERES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Porcentaje de interes</Typography>
                        <TextField fullWidth type="number" value={config.porcentaje} onChange={(e) => cambiar('porcentaje', e.target.value)}
                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
                    </Box>
                </Box>

                {/* Dias de gracia + Aplicar desde */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                    <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Dias de gracia</Typography>
                        <TextField fullWidth type="number" value={config.diasGracia} onChange={(e) => cambiar('diasGracia', e.target.value)}
                            InputProps={{ endAdornment: <InputAdornment position="end">dias</InputAdornment> }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Aplicar desde</Typography>
                        <Select fullWidth value={config.aplicarDesde} onChange={(e) => cambiar('aplicarDesde', e.target.value)}>
                            {APLICAR_DESDE.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                        </Select>
                    </Box>
                </Box>

                {/* Vista previa del calculo */}
                <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 2.5, mb: 3 }}>
                    <Typography sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Vista previa del calculo</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {ejemplo.departamento} -- {ejemplo.periodo}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography variant="body2">Capital vencido:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatBs(ejemplo.capital)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography variant="body2">Interes ({config.porcentaje}%):</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatBs(interes)}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Total pendiente actualizado:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatBs(totalActualizado)}</Typography>
                    </Box>
                </Box>

                {/* Botones */}
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column-reverse', md: 'row' }, justifyContent: { md: 'flex-end' } }}>
                    <Button variant="outlined" onClick={() => navigate('/finanzas/mora')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Cancelar
                    </Button>
                    <Button variant="contained" onClick={() => navigate('/finanzas/mora')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Guardar configuracion
                    </Button>
                </Box>
            </Paper>
        </DashboardLayout>
    );
}