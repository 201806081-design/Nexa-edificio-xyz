import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AccesoRestringido from '../pages/AccesoRestringido/AccesoRestringido';

export default function ProtectedRoute({ children, rolesPermitidos }) {
  const { autenticado, user } = useAuth();

  // Si no inicio sesion, al login
  if (!autenticado) return <Navigate to="/login" replace />;

  // Si la ruta exige roles y el usuario no lo tiene, muestra "Acceso restringido" (CA-06)
  if (rolesPermitidos && !rolesPermitidos.includes(user?.rol)) {
    return <AccesoRestringido />;
  }

  return children;
}
