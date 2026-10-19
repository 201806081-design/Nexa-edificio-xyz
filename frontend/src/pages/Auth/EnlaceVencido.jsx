import { Box, Typography, Button } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';

export default function EnlaceVencido() {
    const navigate = useNavigate();
    return (
        <AuthLayout>
            <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ width: 84, height: 84, borderRadius: '50%', bgcolor: '#FBEEDD', display: 'grid', placeItems: 'center', mx: 'auto', mb: 2 }}>
                    <LinkIcon sx={{ fontSize: 44, color: '#E5A33B' }} />
                </Box>
                <Typography variant="h1" sx={{ fontSize: '1.7rem', mb: 1 }}>Enlace vencido</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Este enlace ya no es valido
                </Typography>
                <Button fullWidth variant="contained" size="large" onClick={() => navigate('/recuperar-contrasena')} sx={{ py: 1.2 }}>
                    Solicitar un nuevo enlace
                </Button>
            </Box>
        </AuthLayout>
    );
}