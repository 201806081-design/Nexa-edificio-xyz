import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { autenticado } = useAuth();

  if (!autenticado) return <Navigate to="/login" replace />;
  return children;
}
