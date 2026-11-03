import { useState } from 'react';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, Drawer, IconButton, AppBar, Toolbar, Collapse,
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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DescriptionIcon from '@mui/icons-material/Description';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BarChartIcon from '@mui/icons-material/BarChart';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WorkIcon from '@mui/icons-material/Work';
import BadgeIcon from '@mui/icons-material/Badge';
import PaidIcon from '@mui/icons-material/Paid';
import CampaignIcon from '@mui/icons-material/Campaign';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
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
  // Opciones con submenu desplegable (fieles al mockup).
  // 'prefijo' se usa para marcar la opcion como activa cuando la ruta actual
  // esta dentro de ese prefijo (ej: /finanzas/pagos -> Finanzas activo).
  Finanzas: {
    icon: <AccountBalanceWalletIcon />,
    prefijo: '/finanzas',
    subopciones: [
      { nombre: 'Resumen', icon: <DescriptionIcon />, ruta: '/finanzas' },
      { nombre: 'Dashboard', icon: <BarChartIcon />, ruta: '/finanzas/dashboard' },
      { nombre: 'Expensas', icon: <DescriptionIcon />, ruta: '/finanzas/expensas' },
      { nombre: 'Pagos', icon: <PaymentIcon />, ruta: '/finanzas/pagos' },
      { nombre: 'Estado de cuenta', icon: <ReceiptLongIcon />, ruta: '/finanzas/estado-cuenta' },
      { nombre: 'Ingresos y gastos', icon: <BarChartIcon />, ruta: '/finanzas/ingresos-gastos' },
      { nombre: 'Mora e intereses', icon: <ScheduleIcon />, ruta: '/finanzas/mora' },
    ],
  },
  Personal: {
    icon: <WorkIcon />,
    prefijo: '/personal',
    subopciones: [
      { nombre: 'Empleados', icon: <BadgeIcon />, ruta: '/personal/empleados' },
      { nombre: 'Planilla', icon: <PaidIcon />, ruta: '/personal/planilla' },
      { nombre: 'Historial de pagos', icon: <ScheduleIcon />, ruta: '/personal/historial-pagos' },
    ],
  },
  // HU-CO-01 Comunicados: elaborar + ver enviados (admin-only via MENU_POR_ROL)
  Comunicados: {
    icon: <CampaignIcon />,
    prefijo: '/comunicados',
    subopciones: [
      { nombre: 'Elaborar', icon: <EditIcon />, ruta: '/comunicados/elaborar' },
      { nombre: 'Enviados', icon: <SendIcon />, ruta: '/comunicados/enviados' },
    ],
  },
};

// Contenido del menu (se usa tanto en escritorio como en el drawer movil)
function ContenidoMenu({ onNavegar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const rol = user?.rol ?? 'Consulta';
  const opciones = MENU_POR_ROL[rol] ?? ['Inicio'];

  // Un unico diccionario de submenus abiertos (clave = nombre de la opcion).
  // Arranca abierto el submenu cuya ruta coincida con la URL actual.
  const [submenusAbiertos, setSubmenusAbiertos] = useState(() => {
    const inicial = {};
    Object.entries(OPCIONES).forEach(([nombre, cfg]) => {
      if (cfg.subopciones) inicial[nombre] = location.pathname.startsWith(cfg.prefijo);
    });
    return inicial;
  });
  const toggleSubmenu = (nombre) => setSubmenusAbiertos((prev) => ({ ...prev, [nombre]: !prev[nombre] }));

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
        {opciones.map((nombre) => {
          const opcion = OPCIONES[nombre];
          if (!opcion) return null;

          // Opcion con submenu (Finanzas, Personal, Comunicados...)
          if (opcion.subopciones) {
            const algunoActivo = location.pathname.startsWith(opcion.prefijo);
            const abierto = !!submenusAbiertos[nombre];
            return (
              <Box key={nombre}>
                <ListItemButton onClick={() => toggleSubmenu(nombre)} sx={estiloItem(algunoActivo && !abierto)}>
                  <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}>{opcion.icon}</ListItemIcon>
                  <ListItemText primary={nombre} />
                  {abierto ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={abierto} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 1 }}>
                    {opcion.subopciones.map((sub) => {
                      const activo = location.pathname === sub.ruta;
                      return (
                        <ListItemButton key={sub.nombre} onClick={(e) => ir(e, sub.ruta)} sx={estiloItem(activo)}>
                          <ListItemIcon sx={{ color: '#fff', minWidth: 36 }}>{sub.icon}</ListItemIcon>
                          <ListItemText primary={sub.nombre} primaryTypographyProps={{ fontSize: '0.9rem' }} />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </Box>
            );
          }

          // Opcion normal (un nivel)
          const activo = location.pathname === opcion.ruta || location.pathname.startsWith(`${opcion.ruta}/`);
          return (
            <ListItemButton
              key={nombre}
              aria-current={activo ? 'page' : undefined}
              onClick={(e) => ir(e, opcion.ruta)}
              sx={estiloItem(activo)}
            >
              <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}>{opcion.icon}</ListItemIcon>
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