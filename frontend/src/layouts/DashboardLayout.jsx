import { Box, Typography, Toolbar } from '@mui/material';
import Sidebar from '../components/Sidebar';

function fechaHoy() {
  const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const texto = new Date().toLocaleDateString('es-ES', opciones);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function DashboardLayout({ children }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Espaciador para la barra superior en movil */}
        <Toolbar sx={{ display: { xs: 'block', md: 'none' } }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 3, pb: 0 }}>
          <Typography variant="body2" color="text.secondary">{fechaHoy()}</Typography>
        </Box>

        <Box sx={{ px: 4, pb: 4, pt: 2, flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
