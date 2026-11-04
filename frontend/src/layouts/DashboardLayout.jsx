import { Box, Typography, Toolbar } from '@mui/material';
import Sidebar from '../components/Sidebar';
import NotificacionesCampanita from '../components/NotificacionesCampanita';

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

        {/* Fecha + campanita: alineadas al mismo margen (px: 4) que el contenido */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, px: 4, pt: 2, pb: 0 }}>
          <NotificacionesCampanita />
          <Typography variant="body2" color="text.secondary">{fechaHoy()}</Typography>
        </Box>

        <Box sx={{ px: 4, pb: 4, pt: 1.5, flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
