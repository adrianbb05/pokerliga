const RESOURCE_DEFAULTS = {
  players: { players: [] },
  matches: { matches: [] },
  settings: {},
};

const STORAGE_KEYS = {
  players: 'pokerliaga-players',
  matches: 'pokerliaga-matches',
  settings: 'pokerliaga-settings',
};

export const isLocalMode = () => process.env.NODE_ENV !== 'production' && process.env.REACT_APP_USE_LOCAL_STORAGE === 'true';

export const clearLocalCache = () => {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage may be unavailable in private browsing.
  }
};

const validateResource = (resourceName) => {
  if (!Object.prototype.hasOwnProperty.call(RESOURCE_DEFAULTS, resourceName)) {
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
  if (response.status === 401) {
    clearLocalCache();
    window.dispatchEvent(new Event('pokerliga:unauthorized'));
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('El servidor no devolvió JSON. Despliega la función /api/data en Vercel o usa vercel dev.');
  }
  if (!response.ok) {
    throw new Error(data.error || `No se pudo acceder a ${resourceName} (HTTP ${response.status}).`);
  }
  return data;
};

export const fetchResource = async (resourceName) => {
  validateResource(resourceName);
  if (isLocalMode()) {
    const stored = window.localStorage.getItem(STORAGE_KEYS[resourceName]);
    return stored ? JSON.parse(stored) : RESOURCE_DEFAULTS[resourceName];
  }
  return requestResource(resourceName);
};

export const updateResource = async (resourceName, newData) => {
  validateResource(resourceName);
  if (isLocalMode()) {
    window.localStorage.setItem(STORAGE_KEYS[resourceName], JSON.stringify(newData));
  } else {
    await requestResource(resourceName, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData),
    });
  }
  return newData;
};
