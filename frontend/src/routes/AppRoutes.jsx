import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login/Login';
import Dashboard from '../pages/Dashboard/Dashboard';
import Usuarios from '../pages/Usuarios/Usuarios';
import Permisos from '../pages/Permisos/Permisos';
import Copropietarios from '../pages/Copropietarios/Copropietarios';
import RegistrarPersona from '../pages/Copropietarios/RegistrarPersona';
import DetallePersona from '../pages/Copropietarios/DetallePersona';
import EditarPersona from '../pages/Copropietarios/EditarPersona';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute rolesPermitidos={['Administrador']}><Usuarios /></ProtectedRoute>} />
      <Route path="/permisos" element={<ProtectedRoute rolesPermitidos={['Administrador']}><Permisos /></ProtectedRoute>} />

      <Route path="/copropietarios" element={<ProtectedRoute><Copropietarios /></ProtectedRoute>} />
      <Route path="/copropietarios/registrar" element={<ProtectedRoute><RegistrarPersona /></ProtectedRoute>} />
      <Route path="/copropietarios/:id" element={<ProtectedRoute><DetallePersona /></ProtectedRoute>} />
      <Route path="/copropietarios/:id/editar" element={<ProtectedRoute><EditarPersona /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
