import { Box, Typography, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';

export default function RevisaCorreo() {
    const navigate = useNavigate();
    return (
        <AuthLayout>
            <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ width: 84, height: 84, borderRadius: '50%', bgcolor: '#E4F4EE', display: 'grid', placeItems: 'center', mx: 'auto', mb: 2 }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: '#2E9D78' }} />
                </Box>
                <Typography variant="h1" sx={{ fontSize: '1.7rem', mb: 1 }}>Revisa tu correo</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Enviamos un enlace para restablecer tu contraseña
                </Typography>
                <Button fullWidth variant="contained" size="large" onClick={() => navigate('/login')} sx={{ py: 1.2 }}>
                    Volver a inicio de sesion
                </Button>
            </Box>
        </AuthLayout>
    );
}