import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import ShieldIcon from '@mui/icons-material/Shield';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MENU_POR_ROL } from '../constants/permisos';

const OPCIONES = {
  Inicio: { icon: <HomeIcon />, ruta: '/dashboard' },
  'Usuarios y roles': { icon: <GroupIcon />, ruta: '/usuarios' },
  'Permisos por rol': { icon: <ShieldIcon />, ruta: '/permisos' },
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const rol = user?.rol ?? 'Consulta';
  const opciones = MENU_POR_ROL[rol] ?? ['Inicio'];

  return (
    <Box
      sx={{
        width: 260,
        bgcolor: '#132B3E',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, mb: 2 }}>
        <ApartmentIcon sx={{ fontSize: 36 }} />
        <Box>
          <Typography sx={{ fontWeight: 700, lineHeight: 1.1 }}>EDIFICIO XYZ</Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>Sistema de Gestion</Typography>
        </Box>
      </Box>

      <List sx={{ flexGrow: 1 }}>
        {opciones.map((nombre) => {
          const opcion = OPCIONES[nombre];
          const activo = location.pathname === opcion.ruta;
          return (
            <ListItemButton
              key={nombre}
              onClick={() => navigate(opcion.ruta)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                bgcolor: activo ? '#1F5F8B' : 'transparent',
                '&:hover': { bgcolor: activo ? '#1F5F8B' : 'rgba(255,255,255,0.08)' },
              }}
            >
              <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}>{opcion.icon}</ListItemIcon>
              <ListItemText primary={nombre} />
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', my: 1 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1 }}>
        <AccountCircleIcon />
        <Typography variant="body2">{rol}</Typography>
      </Box>
      <ListItemButton onClick={logout} sx={{ borderRadius: 2 }}>
        <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}><LogoutIcon /></ListItemIcon>
        <ListItemText primary="Cerrar sesion" />
      </ListItemButton>
    </Box>
  );
}
