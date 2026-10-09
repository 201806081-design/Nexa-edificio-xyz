import { useState } from 'react';
import {
    Box, Typography, Paper, Button, Select, MenuItem, TextField,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PieChartOutlineIcon from '@mui/icons-material/PieChartOutline';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { DEPARTAMENTOS_ANTICIPO, MESES_APLICA } from '../../constants/moraMock';
import { formatBs } from '../../constants/finanzasMock';

export default function RegistrarAnticipo() {
    const navigate = useNavigate();
    const [deptoId, setDeptoId] = useState('');
    const [fecha, setFecha] = useState('');
    const [monto, setMonto] = useState('');
    const [aplicaDesde, setAplicaDesde] = useState(MESES_APLICA[0]);

    const depto = DEPARTAMENTOS_ANTICIPO.find((d) => d.id === deptoId);
    const expensa = depto ? depto.expensaMensual : 0;
    // Distribucion: cuantos periodos cubre el anticipo
    const periodos = expensa > 0 ? Math.floor(Number(monto) / expensa) : 0;
    const desdeIndex = MESES_APLICA.indexOf(aplicaDesde);
    const cubiertos = MESES_APLICA.slice(desdeIndex, desdeIndex + periodos);

    const guardar = () => {
        navigate('/finanzas/mora/anticipo/1', { state: { mensaje: 'Pago anticipado registrado correctamente' } });
    };

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Registro de pago anticipado</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Finanzas / Mora y anticipos / Pago anticipado
            </Typography>

            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Registra un saldo a favor para cubrir expensas futuras
                </Typography>

                {/* Departamento */}
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Departamento</Typography>
                <Select fullWidth displayEmpty value={deptoId} onChange={(e) => setDeptoId(e.target.value)} sx={{ mb: 2 }}>
                    <MenuItem value=""><em>Seleccione un departamento</em></MenuItem>
                    {DEPARTAMENTOS_ANTICIPO.map((d) => <MenuItem key={d.id} value={d.id}>{d.etiqueta}</MenuItem>)}
                </Select>

                {/* Responsable */}
                {depto && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#F1F5F9', borderRadius: 2, p: 1.5, mb: 2 }}>
                        <PersonIcon sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2">Responsable actual: {depto.responsable}</Typography>
                    </Box>
                )}

                {/* Fecha + Monto */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Fecha de pago</Typography>
                        <TextField fullWidth type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} InputLabelProps={{ shrink: true }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Monto anticipado (Bs)</Typography>
                        <TextField fullWidth type="number" placeholder="0" value={monto} onChange={(e) => setMonto(e.target.value)} />
                    </Box>
                </Box>

                {/* Expensa mensual + Aplica desde */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Expensa mensual estimada</Typography>
                        <TextField fullWidth value={expensa ? formatBs(expensa) : ''} placeholder="Bs 0,00" InputProps={{ readOnly: true }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Aplica desde</Typography>
                        <Select fullWidth value={aplicaDesde} onChange={(e) => setAplicaDesde(e.target.value)}>
                            {MESES_APLICA.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                        </Select>
                    </Box>
                </Box>

                {/* Distribucion del anticipo */}
                {periodos > 0 && (
                    <Box sx={{ bgcolor: '#E4F4EE', borderRadius: 2, p: 2.5, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PieChartOutlineIcon sx={{ color: '#2E9D78' }} />
                            <Typography sx={{ fontWeight: 700, color: '#2E9D78' }}>Distribucion del anticipo</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2">Periodos cubiertos:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{cubiertos.join(', ')}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2">Cantidad de periodos:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{periodos}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2">Saldo a favor registro:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatBs(Number(monto))}</Typography>
                        </Box>
                    </Box>
                )}

                {/* Botones */}
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column-reverse', md: 'row' }, justifyContent: { md: 'flex-end' } }}>
                    <Button variant="outlined" onClick={() => navigate('/finanzas/mora')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Cancelar
                    </Button>
                    <Button variant="contained" onClick={guardar} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Registrar anticipo
                    </Button>
                </Box>
            </Paper>
        </DashboardLayout>
    );
}