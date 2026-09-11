import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login/Login';
import Dashboard from '../pages/Dashboard/Dashboard';
import Usuarios from '../pages/Usuarios/Usuarios';
import Permisos from '../pages/Permisos/Permisos';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute rolesPermitidos={['Administrador']}><Usuarios /></ProtectedRoute>} />
      <Route path="/permisos" element={<ProtectedRoute rolesPermitidos={['Administrador']}><Permisos /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
