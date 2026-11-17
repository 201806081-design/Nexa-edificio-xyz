import { useEffect, useState } from 'react';
import { Box, Typography, Chip, Paper, ButtonBase } from '@mui/material';
import { keyframes } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DashboardLayout from '../../layouts/DashboardLayout';
import EdificioAnimado from './EdificioAnimado';
import { ICONO_PANTALLA, ICONO_GRUPO } from '../../components/iconosPantallas';
import { useAuth } from '../../hooks/useAuth';
import { usePermisos } from '../../hooks/usePermisos';
import { ROLES, armarMenu } from '../../constants/permisos';
import { UNIDADES } from '../../constants/edificioMock';

// Accesos rapidos: las mismas opciones del menu lateral (segun los permisos del rol)
// con una descripcion corta. Clave = pantalla o grupo con submenu.
const DESCRIPCIONES = {
  usuarios: 'Cuentas y roles del sistema',
  permisos: 'Que puede ver cada rol',
  copropietarios: 'Propietarios e inquilinos',
  unidades: 'Deptos, parqueos y bauleras',
  'finanzas.estadoCuenta': 'Expensas, pagos y deudas',
  Finanzas: 'Expensas, pagos y mora',
  Personal: 'Empleados y planilla',
  Comunicados: 'Avisos a los residentes',
};

const accesoDe = (m) => (m.tipo === 'grupo'
  ? { clave: m.grupo, titulo: m.grupo, icon: ICONO_GRUPO[m.grupo], ruta: m.pantallas[0].ruta }
  : { clave: m.pantalla.clave, titulo: m.pantalla.nombre, icon: ICONO_PANTALLA[m.pantalla.clave], ruta: m.pantalla.ruta });

const aparecer = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// Animacion de entrada escalonada (se desactiva si el usuario pide menos movimiento)
const entrada = (orden) => ({
  animation: `${aparecer} 0.5s ease-out both`,
  animationDelay: `${orden * 0.08}s`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});

function saludo() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function resumenEdificio() {
  const deptos = UNIDADES.filter((u) => u.tipo === 'Departamento');
  return [
    { etiqueta: 'Departamentos', valor: deptos.length },
    { etiqueta: 'Deptos ocupados', valor: deptos.filter((u) => u.personaId).length },
    { etiqueta: 'Parqueos', valor: UNIDADES.filter((u) => u.tipo === 'Parqueo').length },
    { etiqueta: 'Bauleras', valor: UNIDADES.filter((u) => u.tipo === 'Baulera').length },
  ];
}

// Numero que cuenta desde 0 hasta el valor final
function Contador({ valor }) {
  const [actual, setActual] = useState(0);

  useEffect(() => {
    let frame;
    const inicio = performance.now();
    const duracion = 900;
    const paso = (ahora) => {
      const progreso = Math.min((ahora - inicio) / duracion, 1);
      setActual(Math.round(valor * progreso));
      if (progreso < 1) frame = requestAnimationFrame(paso);
    };
    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [valor]);

  return actual;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { puede } = usePermisos();
  const rol = user?.rol ?? 'Consulta';
  const nombre = user?.nombre || rol;
  const esResidente = rol === ROLES.RESIDENTE;
  const accesos = armarMenu(puede)
    .map(accesoDe)
    .filter((a) => a.clave !== 'inicio');

  return (
    <DashboardLayout>
      {/* Banner de bienvenida */}
      <Box
        sx={{
          ...entrada(0),
          background: 'linear-gradient(120deg, #1F5F8B 0%, #338FC4 100%)',
          color: '#fff',
          borderRadius: 3,
          px: { xs: 3, md: 5 },
          py: { xs: 3, md: 4 },
          display: 'flex',
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography variant="body1" sx={{ opacity: 0.85, mb: 0.5 }}>
            {saludo()},
          </Typography>
          <Typography variant="h1" sx={{ mb: 1 }}>
            {nombre}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85, mb: 2, maxWidth: 420 }}>
            Bienvenido al Sistema Integral de Administración del Edificio XYZ.
          </Typography>
          <Chip
            label={`Rol: ${rol}${user?.tipoResidente ? ` · ${user.tipoResidente}` : ''}`}
            sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 600 }}
          />
        </Box>
        <EdificioAnimado />
      </Box>

      {/* Resumen del edificio (solo para el personal que lo administra) */}
      {!esResidente && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
            mt: 3,
          }}
        >
          {resumenEdificio().map((dato, i) => (
            <Paper key={dato.etiqueta} elevation={1} sx={{ ...entrada(i + 1), p: 2.5, borderRadius: 3 }}>
              <Typography variant="h2" color="primary.main">
                <Contador valor={dato.valor} />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dato.etiqueta}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Accesos rapidos segun los permisos del rol */}
      {accesos.length > 0 && (
        <Typography variant="h3" sx={{ mt: 4, mb: 2 }}>
          Accesos rápidos
        </Typography>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        {accesos.map(({ clave, titulo, icon, ruta }, i) => {
          const descripcion = DESCRIPCIONES[clave] ?? '';
          return (
            <Paper key={clave} elevation={1} sx={{ ...entrada(i + 5), borderRadius: 3, overflow: 'hidden' }}>
              <ButtonBase
                onClick={() => navigate(ruta)}
                sx={{
                  width: '100%',
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  textAlign: 'left',
                  transition: 'background-color 0.2s',
                  '& .flecha': { transition: 'transform 0.2s' },
                  '@media (hover: hover)': {
                    '&:hover': { bgcolor: 'background.default' },
                    '&:hover .flecha': { transform: 'translateX(4px)' },
                  },
                }}
              >
                <Box
                  sx={{
                    bgcolor: '#C5E0F2',
                    color: 'primary.main',
                    borderRadius: 2,
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {titulo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {descripcion}
                  </Typography>
                </Box>
                <ArrowForwardIcon className="flecha" sx={{ color: 'text.secondary' }} />
              </ButtonBase>
            </Paper>
          );
        })}
      </Box>
    </DashboardLayout>
  );
}
