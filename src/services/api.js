const RESOURCE_DEFAULTS = {
  players: { players: [] },
  matches: { matches: [] },
  settings: {},
};

<<<<<<< HEAD
const validateResource = (resourceName) => {
  if (!Object.prototype.hasOwnProperty.call(STORAGE_KEYS, resourceName)) {
    throw new Error(`Recurso desconocido: ${resourceName}`);
  }
};

const requestResource = async (resourceName, options = {}) => {
  let response;
  try {
    response = await fetch(`/api/data?resource=${resourceName}`, options);
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa la conexión y vuelve a intentarlo.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('El servidor no devolvió JSON. Despliega la función /api/data en Vercel o usa vercel dev.');
  }
  if (!response.ok) {
    if (response.status === 401) {
      clearLocalCache();
      window.dispatchEvent(new Event('pokerliga:unauthorized'));
    }
    throw new Error(data.error || `No se pudo acceder a ${resourceName} (HTTP ${response.status}).`);
  }
  return data;
};

export const isLocalMode = () => process.env.NODE_ENV !== 'production' && process.env.REACT_APP_USE_LOCAL_STORAGE === 'true';

export const clearLocalCache = () => {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage may be unavailable in private browsing.
  }
};

const getStoredData = (resourceName) => {
  const storageKey = STORAGE_KEYS[resourceName];
  if (typeof window === 'undefined' || !storageKey) {
=======
const getEnvValue = (...keys) => keys.find((key) => key !== undefined && key !== null && key !== '');

const getServerConfig = () => {
  const env = typeof process !== 'undefined' && process.env ? process.env : {};
  const readKey =
    getEnvValue(env.REACT_APP_JSONBIN_READ_KEY, env.REACT_APP_JSONBIN_ACCESS_KEY) ?? env.REACT_APP_JSONBIN_MASTER_KEY;
  const writeKey =
    getEnvValue(env.REACT_APP_JSONBIN_WRITE_KEY, env.REACT_APP_JSONBIN_ACCESS_KEY) ?? env.REACT_APP_JSONBIN_MASTER_KEY;
  const readKeyHeader =
    getEnvValue(env.REACT_APP_JSONBIN_READ_KEY, env.REACT_APP_JSONBIN_ACCESS_KEY) ? 'X-Access-Key' : 'X-Master-Key';
  const writeKeyHeader =
    getEnvValue(env.REACT_APP_JSONBIN_WRITE_KEY, env.REACT_APP_JSONBIN_ACCESS_KEY) ? 'X-Access-Key' : 'X-Master-Key';

  return {
    readKey,
    writeKey,
    readKeyHeader,
    writeKeyHeader,
    binIds: {
      matches: env.REACT_APP_BIN_MATCHES,
      players: env.REACT_APP_BIN_PLAYERS,
      settings: env.REACT_APP_BIN_SETTINGS,
    },
  };
};

const getAuthHeaders = (apiKey, headerName) => {
  if (!apiKey || !headerName) {
>>>>>>> master/master
    return null;
  }

  return {
    [headerName]: apiKey,
  };
};

const validateResourceConfig = (resourceName, binId, apiKey, keyHeader) => {
  if (!RESOURCE_DEFAULTS[resourceName]) {
    throw new Error(`Recurso no soportado: ${resourceName}`);
  }

  if (!binId) {
    throw new Error(`Falta configuración de bin para ${resourceName}.`);
  }

  if (!apiKey || !keyHeader) {
    throw new Error('Falta la clave de acceso de JSONBin.');
  }
};

export const fetchResource = async (resourceName) => {
<<<<<<< HEAD
  validateResource(resourceName);
  if (isLocalMode()) {
    return getStoredData(resourceName) ?? DEFAULT_DATA[resourceName];
  }

  const record = await requestResource(resourceName);
  return record;
};

export const updateResource = async (resourceName, newData) => {
  validateResource(resourceName);
  if (!isLocalMode()) {
    await requestResource(resourceName, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData),
    });
=======
  const { readKey, readKeyHeader, binIds } = getServerConfig();
  const binId = binIds[resourceName];
  validateResourceConfig(resourceName, binId, readKey, readKeyHeader);
  const authHeaders = getAuthHeaders(readKey, readKeyHeader);
  const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
    headers: {
      ...authHeaders,
      'X-Bin-Meta': 'false',
    },
  });

  if (!response.ok) {
    throw new Error(`JSONBin request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.record ?? data ?? RESOURCE_DEFAULTS[resourceName];
};

export const updateResource = async (resourceName, newData) => {
  const { writeKey, writeKeyHeader, binIds } = getServerConfig();
  const binId = binIds[resourceName];
  validateResourceConfig(resourceName, binId, writeKey, writeKeyHeader);
  const authHeaders = getAuthHeaders(writeKey, writeKeyHeader);

  const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(newData),
  });

  if (!response.ok) {
    throw new Error(`JSONBin update failed with status ${response.status}`);
>>>>>>> master/master
  }

  if (isLocalMode()) persistLocalData(resourceName, newData);
  return newData;
};
