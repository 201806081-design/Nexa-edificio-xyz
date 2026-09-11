import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, rolesPermitidos }) {
  const { autenticado, user } = useAuth();

  // Si no inicio sesion, al login
  if (!autenticado) return <Navigate to="/login" replace />;

  // Si la ruta exige roles y el usuario no lo tiene, al dashboard (CA-05)
  if (rolesPermitidos && !rolesPermitidos.includes(user?.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
