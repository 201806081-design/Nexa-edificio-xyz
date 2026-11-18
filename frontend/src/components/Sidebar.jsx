import { useState } from 'react';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, Drawer, IconButton, AppBar, Toolbar, Collapse,
} from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermisos } from '../hooks/usePermisos';
import { armarMenu } from '../constants/permisos';
import { ICONO_PANTALLA, ICONO_GRUPO } from './iconosPantallas';

const ANCHO = 260;

// Las opciones salen de PANTALLAS (constants/permisos.js) filtradas por los permisos del rol.
// Un submenu queda marcado como activo cuando la ruta actual esta dentro de su prefijo
// (ej: /finanzas/pagos/registrar -> Finanzas).
const prefijoDe = (pantallas) => `/${pantallas[0].ruta.split('/')[1]}`;

// Contenido del menu (se usa tanto en escritorio como en el drawer movil)
function ContenidoMenu({ onNavegar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { puede } = usePermisos();

  const rol = user?.rol ?? '';
  const menu = armarMenu(puede);

  // Submenus abiertos (clave = nombre del grupo). Arranca abierto el de la URL actual.
  const [submenusAbiertos, setSubmenusAbiertos] = useState({});
  const estaAbierto = (m) => submenusAbiertos[m.grupo] ?? location.pathname.startsWith(prefijoDe(m.pantallas));
  const toggleSubmenu = (m) => setSubmenusAbiertos((prev) => ({ ...prev, [m.grupo]: !estaAbierto(m) }));

  const ir = (e, ruta) => {
    // Soltar el focus para evitar que el estilo "activo" quede pegado en movil
    if (e?.currentTarget?.blur) e.currentTarget.blur();
    navigate(ruta);
    if (onNavegar) onNavegar();
  };

  const estiloItem = (activo) => ({
    borderRadius: 2,
    mb: 0.5,
    bgcolor: activo ? '#1F5F8B' : 'transparent',
    // Hover solo en dispositivos con cursor real (no en celular — evita que quede pegado)
    '@media (hover: hover)': {
      '&:hover': { bgcolor: activo ? '#1F5F8B' : 'rgba(255,255,255,0.08)' },
    },
  });

  return (
    <Box sx={{ bgcolor: '#132B3E', color: '#fff', minHeight: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2, overflowY: 'auto' }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, mb: 2 }}>
        <ApartmentIcon sx={{ fontSize: 36 }} />
        <Box>
          <Typography sx={{ fontWeight: 700, lineHeight: 1.1 }}>EDIFICIO XYZ</Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>Sistema de Gestion</Typography>
        </Box>
      </Box>

      {/* Opciones */}
      <List sx={{ flexGrow: 1 }}>
        {menu.map((m) => {
          // Opcion con submenu (Finanzas, Personal, Comunicados)
          if (m.tipo === 'grupo') {
            const algunoActivo = location.pathname.startsWith(prefijoDe(m.pantallas));
            const abierto = estaAbierto(m);
            return (
              <Box key={m.grupo}>
                <ListItemButton onClick={() => toggleSubmenu(m)} sx={estiloItem(algunoActivo && !abierto)}>
                  <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}>{ICONO_GRUPO[m.grupo]}</ListItemIcon>
                  <ListItemText primary={m.grupo} />
                  {abierto ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={abierto} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 1 }}>
                    {m.pantallas.map((sub) => {
                      const activo = location.pathname === sub.ruta;
                      return (
                        <ListItemButton key={sub.clave} onClick={(e) => ir(e, sub.ruta)} sx={estiloItem(activo)}>
                          <ListItemIcon sx={{ color: '#fff', minWidth: 36 }}>{ICONO_PANTALLA[sub.clave]}</ListItemIcon>
                          <ListItemText primary={sub.nombre} slotProps={{ primary: { sx: { fontSize: '0.9rem' } } }} />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </Box>
            );
          }

          // Opcion normal (un nivel)
          const { clave, nombre, ruta } = m.pantalla;
          const activo = location.pathname === ruta || location.pathname.startsWith(`${ruta}/`);
          return (
            <ListItemButton
              key={clave}
              aria-current={activo ? 'page' : undefined}
              onClick={(e) => ir(e, ruta)}
              sx={estiloItem(activo)}
            >
              <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}>{ICONO_PANTALLA[clave]}</ListItemIcon>
              <ListItemText primary={nombre} />
            </ListItemButton>
          );
        })}
      </List>

      {/* Bloque de abajo: usuario + cerrar sesion */}
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
          <IconButton color="inherit" onClick={(e) => { e.currentTarget.blur(); setAbierto(true); }}>
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
        slotProps={{ paper: { sx: { width: ANCHO, bgcolor: '#132B3E', color: '#fff' } } }}
      >
        <ContenidoMenu onNavegar={() => setAbierto(false)} />
      </Drawer>
    </>
  );
}