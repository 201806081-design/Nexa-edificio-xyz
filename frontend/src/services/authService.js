import api from './api';
import { autenticarLocal } from '../constants/usuariosMock';

// Mismo formato de error que axios, para que LoginForm lo trate igual (401 / 403)
const errorDeLogin = (status) => Object.assign(new Error('Login rechazado'), { response: { status } });

// Devuelve { token, user }.
// Las cuentas creadas en el frontend (residentes, nuevos usuarios) se validan con el mock
// hasta que el backend las tenga; las del seed (usuario1..3) se validan en la API.
export async function login(usuario, password) {
  const local = autenticarLocal(usuario, password);
  if (local?.estado === 'inactivo') throw errorDeLogin(403);
  if (local?.estado === 'incorrecto') throw errorDeLogin(401);
  if (local?.estado === 'ok') return { token: `local-${local.user.id}`, user: local.user };

  const { data } = await api.post('/auth/login', { usuario, password });
  return data;
}
