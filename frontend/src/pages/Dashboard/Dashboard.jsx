import { Box, Typography, Button } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <Box sx={{ p: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Typography variant="h1" sx={{ fontSize: '2rem', mb: 1 }}>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Bienvenido, {user?.usuario ?? user?.nombre ?? 'usuario'}.
      </Typography>
      <Button variant="contained" color="error" onClick={logout}>
        Cerrar sesion
      </Button>
    </Box>
  );
}
