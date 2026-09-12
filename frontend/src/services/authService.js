import api from './api';

// Llama al backend. Se espera que devuelva { token, user }.
export async function login(usuario, password) {
  const { data } = await api.post('/auth/login', { usuario, password });
  return data;
}
