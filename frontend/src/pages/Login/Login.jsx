import { Box, Typography } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LoginForm from './LoginForm';

export default function Login() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          color: '#fff',
          position: 'relative',
          backgroundImage: `linear-gradient(180deg, rgba(19,43,62,0.85), rgba(31,95,139,0.75)), url('/login-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ApartmentIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography sx={{ fontWeight: 700, lineHeight: 1 }}>EDIFICIO XYZ</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Sistema de Gestion</Typography>
          </Box>
        </Box>

        <Box>
          <Box sx={{ width: 48, height: 3, bgcolor: '#fff', opacity: 0.6, mb: 3 }} />
          <Typography variant="h1" sx={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.15, mb: 2 }}>
            Administracion<br />mas simple,<br />comunidades<br />mas conectadas
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 320 }}>
            Gestion de propietarios, inquilinos y espacios en un solo lugar
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ opacity: 0.7, letterSpacing: 1 }}>
          SEGURIDAD · ORGANIZACION · CONFIANZA
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, md: 6 } }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 3,
            p: { xs: 3, md: 5 },
            width: '100%',
            maxWidth: 460,
            boxShadow: { xs: 0, md: 3 },
          }}
        >
          <LoginForm />
        </Box>
      </Box>
    </Box>
  );
}
