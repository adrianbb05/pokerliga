import { fetchResource, updateResource } from './api';

const originalEnv = process.env;
const originalFetch = global.fetch;

beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.REACT_APP_USE_LOCAL_STORAGE;
  window.localStorage.clear();
  global.fetch = jest.fn();
});

afterEach(() => {
  process.env = originalEnv;
  global.fetch = originalFetch;
});

test('loads protected data without persisting it in browser storage', async () => {
  const record = { matches: [] };
  fetch.mockResolvedValue({ ok: true, json: async () => record });
  expect(await fetchResource('matches')).toEqual(record);
  expect(fetch).toHaveBeenCalledWith('/api/data?resource=matches', {});
  expect(localStorage.getItem('pokerliaga-matches')).toBeNull();
});

test('uses local demo storage only when explicitly enabled', async () => {
  process.env.REACT_APP_USE_LOCAL_STORAGE = 'true';
  const record = { matches: [] };
  await updateResource('matches', record);
  expect(await fetchResource('matches')).toEqual(record);
  expect(fetch).not.toHaveBeenCalled();
});

test('reports incomplete configuration instead of silently saving locally', async () => {
  fetch.mockResolvedValue({ ok: false, status: 503, json: async () => ({ error: 'Falta BIN_MATCHES' }) });
  await expect(updateResource('matches', { matches: [] })).rejects.toThrow('BIN_MATCHES');
  expect(localStorage.getItem('pokerliaga-matches')).toBeNull();
});

test('does not substitute cached data for a failed remote read', async () => {
  localStorage.setItem('pokerliaga-matches', JSON.stringify({ matches: [] }));
  fetch.mockResolvedValue({ ok: false, status: 502, json: async () => ({ error: 'JSONBin HTTP 401' }) });
  await expect(fetchResource('matches')).rejects.toThrow('HTTP 401');
});

test.each([403, 404, 429, 500])('rejects failed writes with HTTP %s without changing the cache', async (status) => {
  localStorage.setItem('pokerliaga-matches', 'old-data');
  fetch.mockResolvedValue({ ok: false, status: 502, json: async () => ({ error: `JSONBin HTTP ${status}` }) });
  await expect(updateResource('matches', { matches: [] })).rejects.toThrow(`HTTP ${status}`);
  expect(localStorage.getItem('pokerliaga-matches')).toBe('old-data');
});

test('reports network errors without claiming a save succeeded', async () => {
  fetch.mockRejectedValue(new TypeError('Failed to fetch'));
  await expect(updateResource('matches', { matches: [] })).rejects.toThrow('No se pudo conectar');
  expect(localStorage.getItem('pokerliaga-matches')).toBeNull();
});

test('sends updated JSON without persisting protected data', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  const record = { matches: [{ playerCount: 8 }] };
  expect(await updateResource('matches', record)).toEqual(record);
  expect(fetch).toHaveBeenCalledWith('/api/data?resource=matches', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  expect(localStorage.getItem('pokerliaga-matches')).toBeNull();
});

test('explains when the API route is unavailable instead of falling back to local data', async () => {
  fetch.mockResolvedValue({ ok: false, status: 404, json: async () => { throw new SyntaxError(); } });
  await expect(fetchResource('matches')).rejects.toThrow('/api/data');
});


test('unauthorized requests clear legacy caches and lock the app', async () => {
  localStorage.setItem('pokerliaga-matches', 'private data');
  const lock = jest.fn();
  window.addEventListener('pokerliga:unauthorized', lock);
  fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: 'Introduce la contraseña' }) });
  await expect(fetchResource('matches')).rejects.toThrow('Introduce la contraseña');
  expect(localStorage.getItem('pokerliaga-matches')).toBeNull();
  expect(lock).toHaveBeenCalledTimes(1);
  window.removeEventListener('pokerliga:unauthorized', lock);
});

test('production cannot bypass the password gate using local demo mode', async () => {
  process.env.NODE_ENV = 'production';
  process.env.REACT_APP_USE_LOCAL_STORAGE = 'true';
  fetch.mockResolvedValue({ ok: true, json: async () => ({ matches: [] }) });
  await fetchResource('matches');
  expect(fetch).toHaveBeenCalled();
});
