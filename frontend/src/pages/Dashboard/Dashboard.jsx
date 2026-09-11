import { Box, Typography, Avatar, Chip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const rol = user?.rol ?? 'Consulta';

  return (
    <DashboardLayout>
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 3,
          p: 6,
          maxWidth: 700,
          mx: 'auto',
          textAlign: 'center',
          boxShadow: 1,
        }}
      >
        <Avatar sx={{ bgcolor: '#C5E0F2', color: '#1F5F8B', width: 80, height: 80, mx: 'auto', mb: 2 }}>
          <PersonIcon sx={{ fontSize: 44 }} />
        </Avatar>

        <Typography variant="h1" sx={{ fontSize: '2rem', mb: 1 }}>
          ¡Hola, {rol}!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Has iniciado sesion correctamente.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Las opciones disponibles se muestran segun tus permisos.
        </Typography>

        <Chip
          label={`Rol: ${rol}`}
          sx={{ bgcolor: '#C5E0F2', color: '#132B3E', fontWeight: 600, px: 1 }}
        />
      </Box>
    </DashboardLayout>
  );
}
