import { useState } from 'react';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, Drawer, IconButton, AppBar, Toolbar,
} from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import ShieldIcon from '@mui/icons-material/Shield';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import DomainIcon from '@mui/icons-material/Domain';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MENU_POR_ROL } from '../constants/permisos';

const ANCHO = 260;

const OPCIONES = {
  Inicio: { icon: <HomeIcon />, ruta: '/dashboard' },
  'Usuarios y roles': { icon: <GroupIcon />, ruta: '/usuarios' },
  'Permisos por rol': { icon: <ShieldIcon />, ruta: '/permisos' },
  Copropietarios: { icon: <PeopleIcon />, ruta: '/copropietarios' },
  Unidades: { icon: <DomainIcon />, ruta: '/unidades' },
};

// Contenido del menu (se usa tanto en escritorio como en el drawer movil)
function ContenidoMenu({ onNavegar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const rol = user?.rol ?? 'Consulta';
  const opciones = MENU_POR_ROL[rol] ?? ['Inicio'];

  const ir = (ruta) => {
    navigate(ruta);
    if (onNavegar) onNavegar();
  };

  return (
    <Box sx={{ bgcolor: '#132B3E', color: '#fff', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, mb: 2 }}>
        <ApartmentIcon sx={{ fontSize: 36 }} />
        <Box>
          <Typography sx={{ fontWeight: 700, lineHeight: 1.1 }}>EDIFICIO XYZ</Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>Sistema de Gestion</Typography>
        </Box>
      </Box>

      {/* Opciones (crecen para empujar el bloque de abajo al fondo) */}
      <List sx={{ flexGrow: 1 }}>
        {opciones.map((nombre) => {
          const opcion = OPCIONES[nombre];
          const activo = location.pathname === opcion.ruta;
          return (
            <ListItemButton
              key={nombre}
              onClick={() => ir(opcion.ruta)}
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

      {/* Bloque de abajo: usuario + cerrar sesion, juntos */}
      <Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mb: 1 }} />
        <ListItemButton sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}><AccountCircleIcon /></ListItemIcon>
          <ListItemText primary={rol} />
        </ListItemButton>
        <ListItemButton onClick={logout} sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Cerrar sesion" />
        </ListItemButton>
      </Box>
    </Box>
  );
}

export default function Sidebar() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      {/* ESCRITORIO: sidebar fijo */}
      <Box sx={{ width: ANCHO, flexShrink: 0, display: { xs: 'none', md: 'block' } }}>
        <ContenidoMenu />
      </Box>

      {/* MOVIL: barra superior con boton hamburguesa */}
      <AppBar position="fixed" sx={{ display: { xs: 'block', md: 'none' }, bgcolor: '#132B3E' }}>
        <Toolbar>
          <ApartmentIcon sx={{ mr: 1 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: '0.95rem' }}>EDIFICIO XYZ</Typography>
            <Typography sx={{ opacity: 0.8, fontSize: '0.7rem' }}>Sistema de Gestion</Typography>
          </Box>
          <IconButton color="inherit" onClick={() => setAbierto(true)}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* MOVIL: menu desplegable */}
      <Drawer
        anchor="left"
        open={abierto}
        onClose={() => setAbierto(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
        slotProps={{ paper: { sx: { width: ANCHO } } }}
      >
        <ContenidoMenu onNavegar={() => setAbierto(false)} />
      </Drawer>
    </>
  );
}