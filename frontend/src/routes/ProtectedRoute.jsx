import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermisos } from '../hooks/usePermisos';
import AccesoRestringido from '../pages/AccesoRestringido/AccesoRestringido';

// pantalla = clave de PANTALLAS (constants/permisos.js) que se necesita para entrar
export default function ProtectedRoute({ children, pantalla }) {
  const { autenticado } = useAuth();
  const { cargando, puede } = usePermisos();

  // Si no inicio sesion, al login
  if (!autenticado) return <Navigate to="/login" replace />;

  // Mientras llegan los permisos no se muestra nada (evita un parpadeo de "Acceso restringido")
  if (cargando) return null;

  // Si su rol no tiene permiso para esta pantalla, muestra "Acceso restringido" (CA-06)
  if (pantalla && !puede(pantalla)) return <AccesoRestringido />;

  return children;
}
