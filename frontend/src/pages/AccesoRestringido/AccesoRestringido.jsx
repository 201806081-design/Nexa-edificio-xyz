import { Box, Typography, Button } from '@mui/material';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';

export default function AccesoRestringido() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 3,
            p: 6,
            maxWidth: 560,
            width: '100%',
            textAlign: 'center',
            boxShadow: 1,
          }}
        >
          {/* Escudo de contorno + candado encima (como el mockup) */}
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
            <ShieldOutlinedIcon sx={{ fontSize: 90, color: 'error.main' }} />
            <LockIcon
              sx={{
                fontSize: 30,
                color: 'error.main',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -58%)',
              }}
            />
          </Box>

          <Typography variant="h1" sx={{ fontSize: '1.75rem', mb: 1 }}>
            Acceso restringido
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
            No tienes permisos para acceder a esta funcionalidad.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Contacta al administrador si necesitas acceso.
          </Typography>

          <Button variant="contained" size="large" onClick={() => navigate('/dashboard')}>
            Volver al inicio
          </Button>
        </Box>
      </Box>
    </DashboardLayout>
  );
}
