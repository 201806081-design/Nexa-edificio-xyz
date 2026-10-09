import {
    Box, Typography, Paper, Button, Chip, Alert,
    Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { DETALLE_ANTICIPO } from '../../constants/moraMock';
import { formatBs } from '../../constants/finanzasMock';

function Dato({ etiqueta, valor, color }) {
    return (
        <Box>
            <Typography variant="body2" color="text.secondary">{etiqueta}</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color }}>{valor}</Typography>
        </Box>
    );
}

export default function DetalleAnticipo() {
    const navigate = useNavigate();
    const location = useLocation();
    const mensaje = location.state?.mensaje;
    const a = DETALLE_ANTICIPO;

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Detalle de pago anticipado</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Finanzas / Mora y anticipos / Detalle
            </Typography>

            {mensaje && <Alert severity="success" sx={{ mb: 3 }}>{mensaje}</Alert>}

            <Paper sx={{ p: 4, borderRadius: 2, mb: 2 }}>
                {/* Encabezado */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>Anticipo del {a.departamento}</Typography>
                        <Chip label="Saldo a favor" size="small" sx={{ bgcolor: '#E4F4EE', color: '#2E9D78' }} />
                    </Box>
                    <Box sx={{ bgcolor: '#F1F5F9', borderRadius: 1.5, px: 2, py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Codigo: <strong>{a.codigo}</strong></Typography>
                    </Box>
                </Box>

                {/* Datos en grilla */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 1 }}>
                    <Dato etiqueta="Fecha de pago" valor={a.fechaPago} />
                    <Dato etiqueta="Monto anticipado" valor={formatBs(a.montoAnticipado)} />
                    <Dato etiqueta="Deuda pendiente actual" valor={formatBs(a.deudaPendiente)} />
                    <Dato etiqueta="Saldo a favor disponible" valor={formatBs(a.saldoAFavor)} color="#2E9D78" />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Responsable: {a.responsable}</Typography>
            </Paper>

            {/* Aplicacion a expensas futuras */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Aplicacion a expensas futuras</Typography>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Periodo</strong></TableCell>
                            <TableCell><strong>Monto anticipado</strong></TableCell>
                            <TableCell><strong>Estado</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {a.aplicacion.map((p, i) => (
                            <TableRow key={i}>
                                <TableCell>{p.periodo}</TableCell>
                                <TableCell>{formatBs(p.monto)}</TableCell>
                                <TableCell><Chip label={p.estado} size="small" sx={{ bgcolor: '#E4F4EE', color: '#2E9D78' }} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Botones */}
                <Box sx={{ display: 'flex', gap: 2, mt: 3, flexDirection: { xs: 'column-reverse', md: 'row' }, justifyContent: { md: 'flex-end' } }}>
                    <Button variant="outlined" onClick={() => navigate('/finanzas/mora')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Volver a mora y anticipos
                    </Button>
                    <Button variant="contained" startIcon={<ReceiptLongIcon />} onClick={() => navigate('/finanzas/estado-cuenta')}
                        sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Volver al estado de cuenta
                    </Button>
                </Box>
            </Paper>
        </DashboardLayout>
    );
}