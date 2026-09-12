import { createContext, useState } from 'react';
import { USUARIOS_MOCK } from '../constants/usuariosMock';

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

  // MOCK: valida contra usuarios de prueba. Se reemplazara por la llamada al backend.
  const login = async (usuario, password) => {
    const encontrado = USUARIOS_MOCK.find(
      (u) => u.usuario === usuario && u.password === password
    );
    if (!encontrado) {
      throw new Error('Credenciales incorrectas');
    }
    const datosUsuario = { usuario: encontrado.usuario, rol: encontrado.rol, nombre: encontrado.nombre };
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
