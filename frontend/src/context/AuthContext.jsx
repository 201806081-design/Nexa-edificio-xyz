import { createContext, useState } from 'react';
import { login as loginService } from '../services/authService';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

// Lee la sesion guardada una sola vez, al iniciar (CA-07)
function leerSesionGuardada() {
  const token = localStorage.getItem('token');
  const userGuardado = localStorage.getItem('user');
  if (token && userGuardado) {
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
    const data = await loginService(usuario, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = { user, login, logout, autenticado: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
