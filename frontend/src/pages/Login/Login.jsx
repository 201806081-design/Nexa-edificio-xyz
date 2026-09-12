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
        justifyContent: 'space-between',
        p:compacto ? 3 : 5,
        pb: compacto ? 0.5 : 5,
        height: '100%',
      }}
    >
      {/* GRUPO DE ARRIBA: logo + linea + titulo + descripcion, todos juntos */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: compacto ? 0.5 : 1.5, mt: 4, ml:4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ApartmentIcon sx={{ fontSize: compacto ? 34 : 48 }} />
          <Box>
            <Typography sx={{ fontWeight: 700, lineHeight: 1.1, fontSize: compacto ? '1rem' : '1.25rem' }}>
              EDIFICIO XYZ
            </Typography>
            <Typography sx={{ opacity: 0.85, fontSize: compacto ? '0.8rem' : '0.95rem' }}>
              Sistema de Gestion
            </Typography>
          </Box>
        </Box>

        <Box sx={{ width: 56, height: 4, bgcolor: '#fff', opacity: 0.6 }} />

        <Typography
          sx={{ fontSize: compacto ? '1.5rem' : '2.4rem', fontWeight: 700, lineHeight: 1.2 }}
        >
          Administracion<br />mas simple,<br />comunidades<br />mas conectadas
        </Typography>

        <Typography sx={{ opacity: 0.9, maxWidth: 340, fontSize: compacto ? '0.9rem' : '1.05rem', mt: compacto ? 0 : 0 }}>
          Gestion de propietarios, inquilinos<br /> y espacios en un solo lugar
        </Typography>
      </Box>

      {/* GRUPO DE ABAJO: pegado al fondo */}
      <Typography sx={{ opacity: 0.75, letterSpacing: 1.5, fontSize: compacto ? '0.72rem' : '0.9rem', ml:4, mt:3}}>
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
