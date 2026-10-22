const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/data');
const authHandler = require('../api/auth');
const { createSession } = require('../server/auth');

const originalEnv = process.env;
const originalFetch = global.fetch;
let calls;

beforeEach(() => {
  process.env = { ...originalEnv, APP_PASSWORD: 'a-long-test-password', JSONBIN_MASTER_KEY: 'private-test-key', BIN_MATCHES: 'matches-id', BIN_PLAYERS: 'players-id', BIN_SETTINGS: 'settings-id' };
  for (const key of ['JSONBIN_ACCESS_KEY', 'JSONBIN_READ_KEY', 'JSONBIN_WRITE_KEY']) delete process.env[key];
  calls = [];
  global.fetch = async (...args) => {
    calls.push(args);
    return { ok: true, json: async () => ({ matches: [] }) };
  };
});
afterEach(() => {
  process.env = originalEnv;
  global.fetch = originalFetch;
});

const request = async (overrides = {}, endpoint = handler) => {
  const res = {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return this; },
  };
  await endpoint({ method: 'GET', query: { resource: 'matches' }, headers: { cookie: `pokerliga_session=${createSession()}`, host: 'example.test' }, ...overrides }, res);
  return res;
};

test('reads a bin with server-only credentials and disables response caching', async () => {
  const res = await request();
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { matches: [] });
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(calls[0][0], 'https://api.jsonbin.io/v3/b/matches-id/latest');
  assert.equal(calls[0][1].headers['X-Master-Key'], 'private-test-key');
  assert.ok(!JSON.stringify(res).includes('private-test-key'));
});

test('maps each allowed resource to its own server-side bin', async () => {
  for (const resource of ['players', 'settings']) {
    global.fetch = async (url) => {
      assert.equal(url, `https://api.jsonbin.io/v3/b/${resource}-id/latest`);
      return { ok: true, json: async () => resource === 'players' ? { players: [] } : { currentWeek: 1 } };
    };
    assert.equal((await request({ query: { resource } })).statusCode, 200);
  }
});

test('preserves separate JSONBin read and write access keys on the server', async () => {
  process.env.JSONBIN_READ_KEY = 'private-read-key';
  process.env.JSONBIN_WRITE_KEY = 'private-write-key';
  await request();
  await request({ method: 'PUT', body: { matches: [] } });
  assert.equal(calls[0][1].headers['X-Access-Key'], 'private-read-key');
  assert.equal(calls[1][1].headers['X-Access-Key'], 'private-write-key');
  assert.equal(calls[0][1].headers['X-Master-Key'], undefined);
});

test('writes JSON to the configured bin without reflecting upstream secrets', async () => {
  const body = { matches: [{ playerCount: 8 }] };
  const res = await request({ method: 'PUT', body });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(calls[0][0], 'https://api.jsonbin.io/v3/b/matches-id');
  assert.equal(calls[0][1].method, 'PUT');
  assert.equal(calls[0][1].body, JSON.stringify(body));
});

test('rejects unsupported methods and arbitrary bin access', async () => {
  const res = await request({ method: 'DELETE' });
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, 'GET, PUT');
  for (const resource of ['https://evil.test', '__proto__', ['matches'], undefined]) {
    assert.equal((await request({ query: { resource } })).statusCode, 400);
  }
  assert.equal(calls.length, 0);
});

test('missing private configuration fails visibly without making an upstream request', async () => {
  delete process.env.JSONBIN_MASTER_KEY;
  let res = await request();
  assert.equal(res.statusCode, 503);
  assert.match(res.body.error, /JSONBIN_MASTER_KEY/);
  process.env.JSONBIN_MASTER_KEY = 'private-test-key';
  delete process.env.BIN_MATCHES;
  res = await request();
  assert.equal(res.statusCode, 503);
  assert.match(res.body.error, /BIN_MATCHES/);
  assert.equal(calls.length, 0);
});

test('rejects invalid write payloads before accessing JSONBin', async () => {
  for (const body of [undefined, null, '{invalid', {}, { matches: 'invalid' }]) {
    assert.equal((await request({ method: 'PUT', body })).statusCode, 400);
  }
  assert.equal(calls.length, 0);
});

test('accepts raw JSON request bodies and legacy bare arrays', async () => {
  assert.equal((await request({ method: 'PUT', body: '{"matches":[]}' })).statusCode, 200);
  assert.equal((await request({ method: 'PUT', body: [] })).statusCode, 200);
});

test('returns safe actionable errors for rejected JSONBin requests', async () => {
  for (const status of [401, 403, 404, 429, 500]) {
    global.fetch = async () => ({ ok: false, status });
    const res = await request();
    assert.equal(res.statusCode, 502);
    assert.match(res.body.error, new RegExp(`HTTP ${status}`));
    assert.ok(!JSON.stringify(res).includes('private-test-key'));
  }
});

test('does not leak upstream exceptions or return malformed data', async () => {
  global.fetch = async () => { throw new Error('private-test-key'); };
  let res = await request();
  assert.equal(res.statusCode, 502);
  assert.ok(!JSON.stringify(res).includes('private-test-key'));
  global.fetch = async () => ({ ok: true, json: async () => ({ unexpected: [] }) });
  res = await request();
  assert.equal(res.statusCode, 502);
});


test('blocks anonymous reads and writes before contacting JSONBin', async () => {
  for (const method of ['GET', 'PUT']) {
    const res = await request({ method, headers: {} });
    assert.equal(res.statusCode, 401);
  }
  assert.equal(calls.length, 0);
});

test('fails closed when APP_PASSWORD is missing', async () => {
  delete process.env.APP_PASSWORD;
  for (const endpoint of [handler, authHandler]) {
    const res = await request({ headers: {} }, endpoint);
    assert.equal(res.statusCode, 503);
    assert.match(res.body.error, /APP_PASSWORD/);
  }
  assert.equal(calls.length, 0);
});

test('reports session status without exposing league data or secrets', async () => {
  assert.deepEqual((await request({ headers: {} }, authHandler)).body, { authenticated: false });
  assert.deepEqual((await request({}, authHandler)).body, { authenticated: true });
  assert.equal(calls.length, 0);
});

test('correct password creates a private secure signed session accepted by data API', async () => {
  process.env.NODE_ENV = 'production';
  const res = await request({ method: 'POST', body: { password: process.env.APP_PASSWORD }, headers: {} }, authHandler);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { authenticated: true });
  const cookie = res.headers['Set-Cookie'];
  for (const attribute of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Max-Age=43200', 'Path=/']) assert.ok(cookie.includes(attribute));
  assert.ok(!cookie.includes(process.env.APP_PASSWORD));
  assert.equal((await request({ headers: { cookie: cookie.split(';')[0] } })).statusCode, 200);
});

test('wrong passwords never create a session', async () => {
  const res = await request({ method: 'POST', body: { password: 'wrong' }, headers: {} }, authHandler);
  assert.equal(res.statusCode, 401);
  assert.equal(res.headers['Set-Cookie'], undefined);
  assert.ok(!JSON.stringify(res).includes(process.env.APP_PASSWORD));
});

test('rejects forged, expired and revoked sessions', async () => {
  const valid = createSession();
  const invalid = ['garbage', `${valid.slice(0, -1)}${valid.endsWith('a') ? 'b' : 'a'}`, '9999999999.bad.bad'];
  const originalNow = Date.now;
  try {
    Date.now = () => originalNow() - 13 * 60 * 60 * 1000;
    invalid.push(createSession());
  } finally {
    Date.now = originalNow;
  }
  process.env.APP_PASSWORD = 'a-new-password';
  invalid.push(valid);
  for (const token of invalid) {
    assert.equal((await request({ headers: { cookie: `pokerliga_session=${token}` } })).statusCode, 401);
  }
  assert.equal(calls.length, 0);
});

test('rejects cross-origin login, logout and writes', async () => {
  const headers = { host: 'example.test', origin: 'https://evil.test', cookie: `pokerliga_session=${createSession()}` };
  for (const method of ['POST', 'DELETE']) assert.equal((await request({ method, headers }, authHandler)).statusCode, 403);
  assert.equal((await request({ method: 'PUT', headers, body: { matches: [] } })).statusCode, 403);
  assert.equal(calls.length, 0);
});

test('logout expires the browser session cookie', async () => {
  const res = await request({ method: 'DELETE' }, authHandler);
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['Set-Cookie'], /Max-Age=0/);
  assert.deepEqual(res.body, { authenticated: false });
});
