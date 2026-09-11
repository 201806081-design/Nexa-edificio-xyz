import { Box, Typography } from '@mui/material';
import Sidebar from '../components/Sidebar';

// Formatea la fecha de hoy en espanol: "Lunes, 1 de Septiembre de 2026"
function fechaHoy() {
  const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const texto = new Date().toLocaleDateString('es-ES', opciones);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function DashboardLayout({ children }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header con la fecha */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 3 }}>
          <Typography variant="body2" color="text.secondary">{fechaHoy()}</Typography>
        </Box>

        {/* Aqui se muestra cada pantalla */}
        <Box sx={{ px: 4, pb: 4, flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
