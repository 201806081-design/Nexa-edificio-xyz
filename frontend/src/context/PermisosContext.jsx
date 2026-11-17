import { createContext, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { obtenerPermisos, guardarPermisosDeRol } from '../services/permisosService';

// eslint-disable-next-line react-refresh/only-export-components
export const PermisosContext = createContext(null);

// Carga los permisos de todos los roles al iniciar sesion y los comparte con
// el menu, las rutas y la pantalla "Permisos por rol". Al guardar, todo se
// actualiza al instante (sin recargar).
export function PermisosProvider({ children }) {
  const { user, autenticado } = useAuth();
  const [permisos, setPermisos] = useState(null); // null = cargando
  const [error, setError] = useState('');

  useEffect(() => {
    if (!autenticado) return undefined;
    let vigente = true;
    obtenerPermisos()
      .then((data) => { if (vigente) { setPermisos(data); setError(''); } })
      .catch(() => { if (vigente) { setPermisos({}); setError('No se pudieron cargar los permisos.'); } });
    return () => { vigente = false; };
  }, [autenticado]);

  // ¿El usuario que inicio sesion puede ver esta pantalla?
  const puede = useCallback(
    (clave) => !!user && (permisos?.[user.rol] ?? []).includes(clave),
    [permisos, user],
  );

  const guardarRol = async (rol, pantallas) => {
    const guardados = await guardarPermisosDeRol(rol, pantallas);
    setPermisos((p) => ({ ...p, [rol]: guardados }));
    return guardados;
  };

  const value = { permisos, cargando: autenticado && permisos === null, error, puede, guardarRol };

  return <PermisosContext.Provider value={value}>{children}</PermisosContext.Provider>;
}
