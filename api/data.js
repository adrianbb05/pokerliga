const { requireAuth } = require('../server/auth');

const BIN_VARIABLES = {
  matches: 'BIN_MATCHES',
  players: 'BIN_PLAYERS',
  settings: 'BIN_SETTINGS',
};

const validRecord = (resource, data) => {
  if (resource === 'settings') {
    return data !== null && typeof data === 'object' && !Array.isArray(data);
  }
  return Array.isArray(data) || (data !== null && typeof data === 'object' && Array.isArray(data[resource]));
};

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET' && req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const resource = req.query.resource;
  if (typeof resource !== 'string' || !Object.prototype.hasOwnProperty.call(BIN_VARIABLES, resource)) {
    return res.status(400).json({ error: 'Recurso desconocido.' });
  }

  const masterKey = (process.env.JSONBIN_MASTER_KEY || '').trim();
  const operation = req.method === 'GET' ? 'READ' : 'WRITE';
  const accessKey = (process.env[`JSONBIN_${operation}_KEY`] || process.env.JSONBIN_ACCESS_KEY || '').trim();
  const apiKey = accessKey || masterKey;
  const binId = (process.env[BIN_VARIABLES[resource]] || '').trim();
  if (!apiKey || !binId) {
    const missing = !apiKey ? 'JSONBIN_MASTER_KEY' : BIN_VARIABLES[resource];
    return res.status(503).json({ error: `Falta ${missing}. Configura la variable en Vercel y vuelve a desplegar.` });
  }

  let body = req.body;
  if (req.method === 'PUT') {
    try {
      if (typeof body === 'string') body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'JSON no válido.' });
    }
    if (!validRecord(resource, body)) {
      return res.status(400).json({ error: `Formato no válido para ${resource}.` });
    }
  }

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(binId)}${req.method === 'GET' ? '/latest' : ''}`, {
      method: req.method,
      headers: {
        [accessKey ? 'X-Access-Key' : 'X-Master-Key']: apiKey,
        ...(req.method === 'GET' ? { 'X-Bin-Meta': 'false' } : { 'Content-Type': 'application/json' }),
      },
      ...(req.method === 'PUT' ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const reason = response.status === 401 || response.status === 403
        ? 'Revisa la clave y los permisos del bin.'
        : response.status === 404 ? 'Revisa el ID del bin.' : 'Vuelve a intentarlo.';
      return res.status(502).json({ error: `JSONBin rechazó la solicitud de ${resource} (HTTP ${response.status}). ${reason}` });
    }

    if (req.method === 'PUT') return res.status(200).json({ ok: true });
    const data = await response.json();
    const record = data?.record ?? data;
    if (!validRecord(resource, record)) {
      return res.status(502).json({ error: `El bin de ${resource} no tiene el formato esperado.` });
    }
    return res.status(200).json(record);
  } catch {
    // Never return upstream bodies or exception messages: they may include credentials.
    return res.status(502).json({ error: `No se pudo conectar con JSONBin para ${resource}. Vuelve a intentarlo.` });
  }
};
