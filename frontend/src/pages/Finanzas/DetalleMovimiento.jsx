import { Box, Typography, Paper, Button, Chip, Alert, Divider } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { MOVIMIENTOS_LISTA } from '../../constants/movimientosMock';
import { formatBs } from '../../constants/finanzasMock';

const tipoChipSx = (tipo) => (tipo === 'Ingreso'
    ? { bgcolor: '#E4F4EE', color: '#2E9D78' }
    : { bgcolor: '#FBEAE9', color: '#D9534F' });

// Fila etiqueta / valor
function Dato({ etiqueta, valor }) {
    return (
        <Box sx={{ display: 'flex', py: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ width: 180, flexShrink: 0 }}>{etiqueta}</Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>{valor}</Typography>
        </Box>
    );
}

export default function DetalleMovimiento() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const mensaje = location.state?.mensaje;
    const mov = MOVIMIENTOS_LISTA.find((m) => m.id === Number(id));

    if (!mov) {
        return (
            <DashboardLayout>
                <Typography>Movimiento no encontrado.</Typography>
                <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/finanzas/ingresos-gastos')}>
                    Volver a movimientos
                </Button>
            </DashboardLayout>
        );
    }

    const esIngreso = mov.tipo === 'Ingreso';

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Detalle del movimiento</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Finanzas / Ingresos y gastos / Detalle
            </Typography>

            {mensaje && <Alert severity="success" sx={{ mb: 3 }}>{mensaje}</Alert>}

            <Paper sx={{ p: 4, borderRadius: 2 }}>
                {/* Encabezado */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>{mov.categoria}</Typography>
                    <Chip label={mov.tipo} sx={tipoChipSx(mov.tipo)} />
                </Box>

                <Dato etiqueta="Tipo de movimiento" valor={mov.tipo} />
                <Dato etiqueta="Categoria" valor={mov.categoria} />
                <Dato etiqueta="Fecha" valor={mov.fecha} />
                <Dato etiqueta="Monto" valor={<Box component="span" sx={{ color: esIngreso ? '#2E9D78' : '#D9534F', fontWeight: 700 }}>{esIngreso ? '+' : '-'}{formatBs(mov.monto)}</Box>} />
                <Dato etiqueta="Descripcion" valor={mov.descripcion} />

                <Divider sx={{ my: 2 }} />

                {/* Comprobante */}
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Comprobante</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PictureAsPdfIcon sx={{ color: '#D9534F' }} />
                        <Typography>{mov.comprobante}</Typography>
                    </Box>
                    <Button variant="outlined" sx={{ color: '#1a2733', borderColor: '#cdd8e3' }}>Ver comprobante</Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Codigo */}
                <Box sx={{ bgcolor: '#F1F5F9', borderRadius: 2, p: 1.5, textAlign: 'center', mb: 3 }}>
                    <Typography variant="body2" color="text.secondary">Codigo: <strong>{mov.codigo}</strong></Typography>
                </Box>

                {/* Botones */}
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column-reverse', md: 'row' }, justifyContent: { md: 'flex-end' } }}>
                    <Button variant="outlined" onClick={() => navigate('/finanzas/ingresos-gastos')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Volver a movimientos
                    </Button>
                    <Button variant="contained" onClick={() => navigate('/finanzas/ingresos-gastos')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Ver todos los movimientos
                    </Button>
                </Box>
            </Paper>
        </DashboardLayout>
    );
}