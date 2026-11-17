import test from 'node:test';
import assert from 'node:assert/strict';

process.env.GOOGLE_CLIENT_ID = 'cid.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_SECRET = 'shh';
process.env.ORANJE_SECRET = 'a-long-random-string-for-tests';

const { default: login } = await import('../api/auth/login.js');
const { default: callback } = await import('../api/auth/callback.js');
const { default: token } = await import('../api/auth/token.js');
const { default: session } = await import('../api/auth/session.js');
const { default: logout } = await import('../api/auth/logout.js');

const HOST = 'oranje.example';
function call(handler, { method = 'GET', url = '/', headers = {} } = {}) {
  const res = { statusCode: 200, headers: {}, body: '', setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(b = '') { this.body = b; } };
  return Promise.resolve(handler({ method, url, headers: { host: HOST, 'x-forwarded-proto': 'https', ...headers } }, res)).then(() => res);
}
const cookieOf = (res, name) => [].concat(res.headers['set-cookie'] || []).map((c) => c.split(';')[0]).find((c) => c.startsWith(name + '='));
const realFetch = globalThis.fetch;
const google = (reply) => { const calls = []; globalThis.fetch = async (url, init) => { calls.push({ url, body: String(init.body) }); return { ok: reply.status === 200, status: reply.status, json: async () => reply.json }; }; return calls; };
test.after(() => { globalThis.fetch = realFetch; });

test('sign-in round trip: consent URL, state check, sealed cookie, token refresh', async () => {
  const start = await call(login);
  assert.equal(start.statusCode, 302);
  const to = new URL(start.headers.location);
  assert.equal(to.origin + to.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
  assert.equal(to.searchParams.get('redirect_uri'), `https://${HOST}/api/auth/callback`);
  assert.equal(to.searchParams.get('access_type'), 'offline');
  const scopes = to.searchParams.get('scope').split(' ');
  assert.deepEqual(scopes.slice(0, 3), ['openid', 'email', 'profile']);
  assert.equal(scopes.length, 8);
  assert.ok(scopes.slice(3).every((s) => s.includes('googlehealth.') && s.endsWith('.readonly')), 'health scopes are read-only');
  const state = to.searchParams.get('state'), stateCookie = cookieOf(start, 'oranje_state');
  assert.match(start.headers['set-cookie'], /HttpOnly; Secure; SameSite=Lax/);

  // wrong state is refused before Google is ever called
  let calls = google({ status: 200, json: {} });
  const forged = await call(callback, { url: `/api/auth/callback?code=abc&state=evil`, headers: { cookie: stateCookie } });
  assert.match(forged.headers.location, /auth_error=state_mismatch/);
  assert.equal(calls.length, 0);

  calls = google({ status: 200, json: { access_token: 'at', refresh_token: 'rt-secret', expires_in: 3599 } });
  const done = await call(callback, { url: `/api/auth/callback?code=abc&state=${state}`, headers: { cookie: stateCookie } });
  assert.equal(done.headers.location, '/?connected=1');
  assert.match(calls[0].body, /grant_type=authorization_code/);
  const rt = cookieOf(done, 'oranje_rt');
  assert.ok(rt && !rt.includes('rt-secret'), 'refresh token is stored encrypted');
  assert.ok(done.headers['set-cookie'].some((c) => /oranje_rt=.*HttpOnly; Secure; SameSite=Strict/.test(c)));

  assert.deepEqual(JSON.parse((await call(session, { headers: { cookie: rt } })).body), { broker: true, configured: true, connected: true, name: '', email: '' });

  calls = google({ status: 200, json: { access_token: 'fresh', expires_in: 3599 } });
  const ok = await call(token, { method: 'POST', headers: { cookie: rt, origin: `https://${HOST}` } });
  assert.deepEqual(JSON.parse(ok.body), { access_token: 'fresh', expires_in: 3599 });
  assert.match(calls[0].body, /refresh_token=rt-secret/);
  assert.equal(ok.headers['cache-control'], 'no-store');
});

test('token endpoint refuses other sites, GET, tampered cookies and expired grants', async () => {
  const calls = google({ status: 200, json: { access_token: 'x' } });
  assert.equal((await call(token, { method: 'POST', headers: { cookie: 'oranje_rt=abc', origin: 'https://evil.example' } })).statusCode, 403);
  assert.equal((await call(token, { method: 'POST', headers: { cookie: 'oranje_rt=abc' } })).statusCode, 403, 'no Origin and no Sec-Fetch-Site');
  assert.equal((await call(token, { method: 'GET', headers: { origin: `https://${HOST}` } })).statusCode, 405);
  assert.equal((await call(token, { method: 'POST', headers: { cookie: 'oranje_rt=not-a-real-cookie', origin: `https://${HOST}` } })).statusCode, 401);
  assert.equal(calls.length, 0);

  // a real cookie whose grant Google has expired (the weekly expiry in Testing mode)
  const state = new URL((await call(login)).headers.location).searchParams.get('state');
  google({ status: 200, json: { refresh_token: 'rt2' } });
  const rt = cookieOf(await call(callback, { url: `/api/auth/callback?code=c&state=${state}`, headers: { cookie: `oranje_state=${state}` } }), 'oranje_rt');
  google({ status: 400, json: { error: 'invalid_grant' } });
  const gone = await call(token, { method: 'POST', headers: { cookie: rt, origin: `https://${HOST}` } });
  assert.equal(gone.statusCode, 401);
  assert.ok(gone.headers['set-cookie'].some((c) => /^oranje_rt=; .*Max-Age=0/.test(c)));
  assert.equal((await call(logout, { method: 'POST', headers: { origin: 'https://evil.example' } })).statusCode, 403);
});

test('two variables are enough, and the ID token gives each person a name', async () => {
  const saved = process.env.ORANJE_SECRET;
  delete process.env.ORANJE_SECRET;
  try {
    const { configured, seal, open, whoFrom } = await import('../api/auth/_lib.js');
    assert.equal(configured(), true);
    assert.equal(open(seal('hello')), 'hello', 'cookie key derived from the client secret');
    const part = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const idt = (o) => `${part({ alg: 'RS256' })}.${part(o)}.sig`;
    assert.deepEqual(whoFrom(idt({ aud: process.env.GOOGLE_CLIENT_ID, given_name: 'Anna', email: 'anna@example.com' })), { name: 'Anna', email: 'anna@example.com' });
    assert.equal(whoFrom(idt({ aud: 'someone-else', given_name: 'Mallory' })), null, 'a token for another app is ignored');
    assert.equal(whoFrom('garbage'), null);

    const state = new URL((await call(login)).headers.location).searchParams.get('state');
    google({ status: 200, json: { refresh_token: 'rt3', id_token: idt({ aud: process.env.GOOGLE_CLIENT_ID, given_name: 'Anna', email: 'anna@example.com' }) } });
    const done = await call(callback, { url: `/api/auth/callback?code=c&state=${state}`, headers: { cookie: `oranje_state=${state}` } });
    const jar = ['oranje_rt', 'oranje_who'].map((n) => cookieOf(done, n)).join('; ');
    const s = JSON.parse((await call(session, { headers: { cookie: jar } })).body);
    assert.deepEqual(s, { broker: true, configured: true, connected: true, name: 'Anna', email: 'anna@example.com' });
    assert.ok(!jar.includes('anna@example.com'), 'the name and email are sealed too');
    const out = await call(logout, { method: 'POST', headers: { cookie: jar, origin: `https://${HOST}` } });
    assert.ok(out.headers['set-cookie'].some((c) => /^oranje_who=;/.test(c)));
  } finally { if (saved) process.env.ORANJE_SECRET = saved; }
});
