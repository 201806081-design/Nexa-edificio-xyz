import { Box, Typography, Paper, Button, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { formatBs } from '../../constants/finanzasMock';

export default function AnticipoRegistrado() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const d = state?.detalle;

    if (!d) {
        return (
            <DashboardLayout>
                <Typography>No hay un anticipo para mostrar.</Typography>
                <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/finanzas/pagos')}>
                    Volver a pagos
                </Button>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Anticipo registrado</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                El credito y el flujo de caja fueron actualizados
            </Typography>

            <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, maxWidth: 760, mx: 'auto' }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box sx={{ width: 84, height: 84, borderRadius: '50%', bgcolor: '#E4F4EE', display: 'grid', placeItems: 'center', mx: 'auto', mb: 2 }}>
                        <CheckCircleIcon sx={{ fontSize: 48, color: '#2E9D78' }} />
                    </Box>
                    <Typography variant="h3" sx={{ fontSize: '1.4rem', fontWeight: 700 }}>Pago anticipado registrado</Typography>
                    <Typography variant="body2" color="text.secondary">Comprobante interno {d.codigo}</Typography>
                </Box>

                <Box sx={{ border: '1px solid #CFDCEA', borderRadius: 2, p: 2, mb: 3, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Departamento</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{d.departamento}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Fecha</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{d.fecha}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Monto recibido</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(d.monto)}</Typography>
                    </Box>
                </Box>

                <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Nuevo credito disponible</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(d.nuevoCredito)}</Typography>
                </Box>

                <Box sx={{ bgcolor: '#E4F4EE', color: '#2E7D5B', borderRadius: 2, p: 2, mt: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>✓ Flujo de caja actualizado</Typography>
                    <Typography variant="body2">Cuando se aplique a una expensa, no se registrara un segundo ingreso.</Typography>
                </Box>

                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column-reverse', md: 'row' }, justifyContent: { md: 'flex-end' } }}>
                    <Button variant="outlined" onClick={() => navigate('/finanzas/estado-cuenta')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Ver estado de cuenta
                    </Button>
                    <Button variant="contained" onClick={() => navigate('/finanzas/pagos')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Volver a anticipos
                    </Button>
                </Box>
            </Paper>
        </DashboardLayout>
    );
}