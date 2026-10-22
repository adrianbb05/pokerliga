const { createSession, isAuthenticated, isSameOrigin, matchesPassword, password, setSessionCookie } = require('../server/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  if (req.method !== 'GET' && !isSameOrigin(req)) {
    return res.status(403).json({ error: 'Origen no permitido.' });
  }
  if (req.method === 'DELETE') {
    setSessionCookie(res);
    return res.status(200).json({ authenticated: false });
  }
  if (!password()) {
    return res.status(503).json({ error: 'Falta APP_PASSWORD. Configura la contraseña en Vercel y vuelve a desplegar.' });
  }
  if (req.method === 'GET') {
    return res.status(200).json({ authenticated: isAuthenticated(req) });
  }

  let body = req.body;
  try {
    if (typeof body === 'string') body = JSON.parse(body);
  } catch {
    return res.status(400).json({ error: 'JSON no válido.' });
  }
  if (!matchesPassword(body?.password)) {
    // Slow down password guessing without storing passwords or client identifiers.
    await new Promise((resolve) => setTimeout(resolve, 500));
    return res.status(401).json({ error: 'Contraseña incorrecta.' });
  }
  setSessionCookie(res, createSession());
  return res.status(200).json({ authenticated: true });
};
