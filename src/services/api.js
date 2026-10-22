const DEFAULT_PLAYERS = [
  { id: 'p-1', name: 'Iván' },
  { id: 'p-2', name: 'Dani' },
  { id: 'p-3', name: 'Paco' },
  { id: 'p-4', name: 'Guille' },
  { id: 'p-5', name: 'Javi' },
  { id: 'p-6', name: 'Luis' },
  { id: 'p-7', name: 'Marta' },
  { id: 'p-8', name: 'Adri' },
  { id: 'p-9', name: 'Blanca' },
  { id: 'p-10', name: 'Nico' },
  { id: 'p-11', name: 'Sergio' },
  { id: 'p-12', name: 'Rafa' },
];

const DEFAULT_SETTINGS = {
  pointsSystem: { 1: 10, 2: 7, 3: 5, 4: 3, 5: 2, 6: 1 },
  currentWeek: 1,
};

const DEFAULT_MATCHES = [
  { id: 'm-1', matchNumber: 1, week: 1, date: '2026-10-06', table: 'A', player: 'Iván', position: 1, points: 10 },
  { id: 'm-2', matchNumber: 2, week: 1, date: '2026-10-06', table: 'A', player: 'Dani', position: 2, points: 7 },
  { id: 'm-3', matchNumber: 3, week: 1, date: '2026-10-06', table: 'A', player: 'Paco', position: 3, points: 5 },
  { id: 'm-4', matchNumber: 4, week: 1, date: '2026-10-06', table: 'B', player: 'Guille', position: 1, points: 10 },
  { id: 'm-5', matchNumber: 5, week: 1, date: '2026-10-06', table: 'B', player: 'Javi', position: 2, points: 7 },
  { id: 'm-6', matchNumber: 6, week: 1, date: '2026-10-06', table: 'B', player: 'Luis', position: 3, points: 5 },
];

const DEFAULT_DATA = {
  players: DEFAULT_PLAYERS,
  matches: DEFAULT_MATCHES,
  settings: DEFAULT_SETTINGS,
};

const STORAGE_KEYS = {
  players: 'pokerliaga-players',
  matches: 'pokerliaga-matches',
  settings: 'pokerliaga-settings',
};

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
    throw new Error(data.error || `No se pudo acceder a ${resourceName} (HTTP ${response.status}).`);
  }
  return data;
};

const isLocalMode = () => process.env.REACT_APP_USE_LOCAL_STORAGE === 'true';

const getStoredData = (resourceName) => {
  const storageKey = STORAGE_KEYS[resourceName];
  if (typeof window === 'undefined' || !storageKey) {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (error) {
    console.warn(`No se pudo leer ${storageKey}:`, error);
    return null;
  }
};

const persistLocalData = (resourceName, value) => {
  if (typeof window === 'undefined') {
    return;
  }

  const storageKey = STORAGE_KEYS[resourceName];
  if (!storageKey) {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(value));
};

export const fetchResource = async (resourceName) => {
  validateResource(resourceName);
  if (isLocalMode()) {
    return getStoredData(resourceName) ?? DEFAULT_DATA[resourceName];
  }

  const record = await requestResource(resourceName);
  persistLocalData(resourceName, record);
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
  }

  persistLocalData(resourceName, newData);
  return newData;
};
