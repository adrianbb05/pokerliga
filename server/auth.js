const { createHash, createHmac, randomBytes, timingSafeEqual } = require('node:crypto');

const COOKIE_NAME = 'pokerliga_session';
const SESSION_SECONDS = 12 * 60 * 60;
const password = () => process.env.APP_PASSWORD || '';
const digest = (value) => createHash('sha256').update(value).digest();
const signature = (payload) => createHmac('sha256', password()).update(`pokerliga-session:${payload}`).digest('hex');

const matchesPassword = (candidate) => typeof candidate === 'string'
  && candidate.length <= 1024
  && Boolean(password())
  && timingSafeEqual(digest(candidate), digest(password()));

const createSession = () => {
  const payload = `${Math.floor(Date.now() / 1000) + SESSION_SECONDS}.${randomBytes(24).toString('hex')}`;
  return `${payload}.${signature(payload)}`;
};

const isAuthenticated = (req) => {
  if (!password()) return false;
  const cookie = (req.headers?.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return false;
  const token = cookie.slice(COOKIE_NAME.length + 1);
  if (!/^\d{10}\.[a-f0-9]{48}\.[a-f0-9]{64}$/.test(token)) return false;
  const [expires, nonce, suppliedSignature] = token.split('.');
  const now = Math.floor(Date.now() / 1000);
  if (Number(expires) <= now || Number(expires) > now + SESSION_SECONDS) return false;
  return timingSafeEqual(Buffer.from(suppliedSignature, 'hex'), Buffer.from(signature(`${expires}.${nonce}`), 'hex'));
};

const setSessionCookie = (res, token = '') => {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token ? SESSION_SECONDS : 0}${secure}`);
};

const isSameOrigin = (req) => {
  if (req.headers?.['sec-fetch-site'] === 'cross-site') return false;
  const origin = req.headers?.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
};

const requireAuth = (req, res) => {
  if (!password()) {
    res.status(503).json({ error: 'Falta APP_PASSWORD. Configura la contraseña en Vercel y vuelve a desplegar.' });
    return false;
  }
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Introduce la contraseña para acceder.' });
    return false;
  }
  if (req.method !== 'GET' && !isSameOrigin(req)) {
    res.status(403).json({ error: 'Origen no permitido.' });
    return false;
  }
  return true;
};

module.exports = { createSession, isAuthenticated, isSameOrigin, matchesPassword, password, requireAuth, setSessionCookie };
