const RESOURCE_DEFAULTS = {
  players: { players: [] },
  matches: { matches: [] },
  settings: {},
};

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
  }

  return newData;
};
