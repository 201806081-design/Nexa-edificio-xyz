import { Box, Typography } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LoginForm from './LoginForm';

function PanelBranding({ compacto = false }) {
  return (
    <Box
      sx={{
        color: '#fff',
        backgroundImage: `linear-gradient(180deg, rgba(19,43,62,0.55), rgba(31,95,139,0.45)), url('/login-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: compacto ? 'center' : 'space-between',
        p: compacto ? 3 : 5,
        gap: compacto ? 1.5 : 0,
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <ApartmentIcon sx={{ fontSize: compacto ? 30 : 38 }} />
        <Box>
          <Typography sx={{ fontWeight: 700, lineHeight: 1 }}>EDIFICIO XYZ</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>Sistema de Gestion</Typography>
        </Box>
      </Box>

      <Box>
        {!compacto && <Box sx={{ width: 48, height: 3, bgcolor: '#fff', opacity: 0.6, mb: 3 }} />}
        <Typography
          variant="h1"
          sx={{ fontSize: compacto ? '1.4rem' : '2rem', fontWeight: 700, lineHeight: 1.2, mb: compacto ? 1 : 2 }}
        >
          Administracion mas simple, comunidades mas conectadas
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 300 }}>
          Gestion de propietarios, inquilinos y espacios en un solo lugar
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ opacity: 0.75, letterSpacing: 1, fontSize: compacto ? '0.7rem' : '0.8rem' }}>
        SEGURIDAD · ORGANIZACION · CONFIANZA
      </Typography>
    </Box>
  );
}

export default function Login() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <PanelBranding compacto />
      </Box>

      <Box sx={{ flex: 39, display: { xs: 'none', md: 'block' } }}>
        <PanelBranding />
      </Box>

      <Box
        sx={{
          flex: 61,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, md: 6 },
        }}
      >
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 3,
            p: { xs: 3, md: 5 },
            width: '100%',
            maxWidth: 420,
            boxShadow: { xs: 0, md: 3 },
          }}
        >
          <LoginForm />
        </Box>
      </Box>
    </Box>
  );
}
