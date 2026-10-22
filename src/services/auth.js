import { isLocalMode } from './api';

const request = async (options = {}) => {
  let response;
  try {
    response = await fetch('/api/auth', { credentials: 'same-origin', ...options });
  } catch {
    throw new Error('No se pudo conectar. Revisa la conexión y vuelve a intentarlo.');
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('No se pudo comprobar el acceso. Despliega las funciones en Vercel o usa vercel dev.');
  }
  if (!response.ok) throw new Error(data.error || 'No se pudo comprobar el acceso.');
  return data;
};

export const checkSession = () => isLocalMode() ? Promise.resolve({ authenticated: true }) : request();
export const login = (password) => request({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password }),
});
export const logout = () => request({ method: 'DELETE' });
