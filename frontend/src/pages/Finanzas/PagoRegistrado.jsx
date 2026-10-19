import {
    Box, Typography, Paper, Button, Divider,
    Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { formatBs } from '../../constants/finanzasMock';

export default function PagoRegistrado() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const d = state?.detalle;

    // Si se entra directo sin datos, volver al historial
    if (!d) {
        return (
            <DashboardLayout>
                <Typography>No hay un pago para mostrar.</Typography>
                <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/finanzas/pagos')}>
                    Volver al historial
                </Button>
            </DashboardLayout>
        );
    }

    const colorEstado = d.estado === 'Completo' ? '#2E9D78' : '#B6802A';

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Pago registrado</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                El pago fue aplicado y el estado de cuenta se actualizo correctamente
            </Typography>

            <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, maxWidth: 760, mx: 'auto' }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box sx={{ width: 84, height: 84, borderRadius: '50%', bgcolor: '#E4F4EE', display: 'grid', placeItems: 'center', mx: 'auto', mb: 2 }}>
                        <CheckCircleIcon sx={{ fontSize: 48, color: '#2E9D78' }} />
                    </Box>
                    <Typography variant="h3" sx={{ fontSize: '1.4rem', fontWeight: 700 }}>Pago registrado correctamente</Typography>
                    <Typography variant="body2" color="text.secondary">Comprobante interno {d.codigo}</Typography>
                </Box>

                {/* Resumen */}
                <Box sx={{ border: '1px solid #CFDCEA', borderRadius: 2, p: 2, mb: 3, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Departamento</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{d.departamento}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Fecha</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{d.fecha}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Monto pagado</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBs(d.monto)}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Estado</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: colorEstado }}>{d.estado}</Typography>
                    </Box>
                </Box>

                {/* Distribucion del pago */}
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Distribucion del pago</Typography>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 420 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Periodo</strong></TableCell>
                                <TableCell><strong>Monto aplicado</strong></TableCell>
                                <TableCell><strong>Saldo restante</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {d.distribucion.map((x) => (
                                <TableRow key={x.periodo}>
                                    <TableCell sx={{ fontWeight: 600 }}>{x.periodo}</TableCell>
                                    <TableCell sx={{ color: '#2E9D78', fontWeight: 600 }}>{formatBs(x.aplicado)}</TableCell>
                                    <TableCell sx={{ color: x.saldoRestante > 0 ? '#D9534F' : '#2E9D78', fontWeight: 600 }}>{formatBs(x.saldoRestante)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>

                <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 2, mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Nuevo saldo pendiente del departamento</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: d.nuevoSaldo > 0 ? '#D9534F' : '#2E9D78' }}>{formatBs(d.nuevoSaldo)}</Typography>
                </Box>

                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column-reverse', md: 'row' }, justifyContent: { md: 'flex-end' } }}>
                    <Button variant="outlined" onClick={() => navigate('/finanzas/estado-cuenta')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Ver estado de cuenta
                    </Button>
                    <Button variant="contained" onClick={() => navigate('/finanzas/pagos')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Volver al historial
                    </Button>
                </Box>
            </Paper>
        </DashboardLayout>
    );
}