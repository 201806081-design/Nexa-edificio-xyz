import { createContext, useState } from 'react';
import { login as autenticar } from '../services/authService';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

function leerSesionGuardada() {
  const userGuardado = localStorage.getItem('user');
  if (userGuardado) {
    try {
      return JSON.parse(userGuardado);
    } catch {
      return null;
    }
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(leerSesionGuardada);

  const login = async (usuario, password) => {
    const { token, user: datosUsuario } = await autenticar(usuario, password);
    if (!token || !datosUsuario) throw new Error('Respuesta de autenticación inválida');
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(datosUsuario));
    setUser(datosUsuario);
    return datosUsuario;
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = { user, login, logout, autenticado: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
