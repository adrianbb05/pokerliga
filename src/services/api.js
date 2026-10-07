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

const getEnvValue = (...keys) => keys.find((key) => key !== undefined && key !== null && key !== '');

const getServerConfig = () => {
  const env = typeof process !== 'undefined' && process.env ? process.env : {};
  const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

  return {
    masterKey: getEnvValue(env.REACT_APP_JSONBIN_MASTER_KEY, viteEnv.VITE_JSONBIN_MASTER_KEY),
    binIds: {
      matches: getEnvValue(env.REACT_APP_BIN_MATCHES, viteEnv.VITE_BIN_MATCHES),
      players: getEnvValue(env.REACT_APP_BIN_PLAYERS, viteEnv.VITE_BIN_PLAYERS),
      settings: getEnvValue(env.REACT_APP_BIN_SETTINGS, viteEnv.VITE_BIN_SETTINGS),
    },
  };
};

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
  const { masterKey, binIds } = getServerConfig();
  const binId = binIds[resourceName];

  if (masterKey && binId) {
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        headers: {
          'X-Master-Key': masterKey,
          'X-Bin-Meta': 'false',
        },
      });

      if (!response.ok) {
        throw new Error(`JSONBin request failed with status ${response.status}`);
      }

      const data = await response.json();
      const record = data.record ?? data;
      if (record) {
        persistLocalData(resourceName, record);
        return record;
      }
    } catch (error) {
      console.warn(`Fallo al cargar ${resourceName} desde JSONBin, usando caché local.`, error);
    }
  }

  const storedValue = getStoredData(resourceName);
  if (storedValue) {
    return storedValue;
  }

  return DEFAULT_DATA[resourceName] ?? [];
};

export const updateResource = async (resourceName, newData) => {
  const { masterKey, binIds } = getServerConfig();
  const binId = binIds[resourceName];

  persistLocalData(resourceName, newData);

  if (masterKey && binId) {
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': masterKey,
        },
        body: JSON.stringify(newData),
      });

      if (!response.ok) {
        throw new Error(`JSONBin update failed with status ${response.status}`);
      }
    } catch (error) {
      console.warn(`Fallo al guardar ${resourceName} en JSONBin, usando almacenamiento local.`, error);
    }
  }

  return newData;
};
