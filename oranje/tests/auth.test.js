import test from 'node:test';
import assert from 'node:assert/strict';
import { handle, open, seal, whoFrom } from '../base44/shared/broker.js';

const ORIGIN = 'https://oranje.base44.app';
const ENV = { id: 'cid.apps.googleusercontent.com', secret: 'shh', key: '', appOrigin: ORIGIN };

const req = (path, { method = 'GET', cookie, origin, headers = {} } = {}) =>
  new Request(`${ORIGIN}${path}`, { method, headers: { ...(cookie ? { cookie } : {}), ...(origin ? { origin } : {}), ...headers } });
const setCookies = (res) => res.headers.getSetCookie();
const cookieOf = (res, name) => setCookies(res).map((c) => c.split(';')[0]).find((c) => c.startsWith(`${name}=`));
const body = async (res) => JSON.parse(await res.text());
const googleReplies = (reply) => {
  const calls = [];
  const fetchImpl = async (url, init) => { calls.push({ url, body: String(init.body) }); return { ok: reply.status === 200, status: reply.status, json: async () => reply.json }; };
  return { calls, fetchImpl };
};
const part = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const idToken = (o) => `${part({ alg: 'RS256' })}.${part(o)}.sig`;

async function signIn(tokenReply) {
  const start = await handle('login', req('/functions/authLogin'), ENV);
  const state = new URL(start.headers.get('location')).searchParams.get('state');
  const g = googleReplies({ status: 200, json: tokenReply });
  const done = await handle('callback', req(`/functions/authCallback?code=abc&state=${state}`, { cookie: `oranje_state=${state}` }), ENV, g.fetchImpl);
  return { start, done, calls: g.calls };
}

test('sign-in round trip: consent URL, state check, sealed cookies, token refresh', async () => {
  const start = await handle('login', req('/functions/authLogin'), ENV);
  assert.equal(start.status, 302);
  const to = new URL(start.headers.get('location'));
  assert.equal(to.origin + to.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
  assert.equal(to.searchParams.get('redirect_uri'), `${ORIGIN}/functions/authCallback`);
  assert.equal(to.searchParams.get('access_type'), 'offline');
  const scopes = to.searchParams.get('scope').split(' ');
  assert.deepEqual(scopes.slice(0, 3), ['openid', 'email', 'profile']);
  assert.ok(scopes.slice(3).every((s) => s.includes('googlehealth.') && s.endsWith('.readonly')), 'health scopes are read-only');
  assert.match(setCookies(start)[0], /^oranje_state=.*; Path=\/functions; HttpOnly; Secure; SameSite=Lax/);

  // a forged state is refused before Google is ever asked
  const g0 = googleReplies({ status: 200, json: {} });
  const forged = await handle('callback', req('/functions/authCallback?code=abc&state=evil', { cookie: cookieOf(start, 'oranje_state') }), ENV, g0.fetchImpl);
  assert.match(forged.headers.get('location'), /auth_error=state_mismatch/);
  assert.equal(g0.calls.length, 0);

  const { done, calls } = await signIn({ access_token: 'at', refresh_token: 'rt-secret', expires_in: 3599, id_token: idToken({ aud: ENV.id, given_name: 'Anna', email: 'anna@example.com' }) });
  assert.equal(done.headers.get('location'), `${ORIGIN}/?connected=1`);
  assert.match(calls[0].body, /grant_type=authorization_code/);
  const jar = ['oranje_rt', 'oranje_who'].map((n) => cookieOf(done, n)).join('; ');
  assert.ok(!jar.includes('rt-secret') && !jar.includes('anna@example.com'), 'token and email are sealed');
  assert.ok(setCookies(done).some((c) => /^oranje_rt=.*HttpOnly; Secure; SameSite=Strict/.test(c)));

  assert.deepEqual(await body(await handle('session', req('/functions/authSession', { cookie: jar }), ENV)),
    { broker: true, configured: true, connected: true, name: 'Anna', email: 'anna@example.com' });

  const g = googleReplies({ status: 200, json: { access_token: 'fresh', expires_in: 3599 } });
  const ok = await handle('token', req('/functions/authToken', { method: 'POST', cookie: jar, origin: ORIGIN }), ENV, g.fetchImpl);
  assert.deepEqual(await body(ok), { access_token: 'fresh', expires_in: 3599 });
  assert.match(g.calls[0].body, /refresh_token=rt-secret/);
  assert.equal(ok.headers.get('cache-control'), 'no-store');
});

test('token endpoint refuses other sites, GET, tampered cookies and expired grants', async () => {
  const g = googleReplies({ status: 200, json: { access_token: 'x' } });
  const post = (o) => handle('token', req('/functions/authToken', { method: 'POST', ...o }), ENV, g.fetchImpl);
  assert.equal((await post({ cookie: 'oranje_rt=abc', origin: 'https://evil.example' })).status, 403);
  assert.equal((await post({ cookie: 'oranje_rt=abc' })).status, 403, 'no Origin and no Sec-Fetch-Site');
  assert.equal((await post({ cookie: 'oranje_rt=abc', headers: { 'sec-fetch-site': 'same-origin' } })).status, 401, 'same-origin fetch without Origin is accepted, then the bad cookie is refused');
  assert.equal((await handle('token', req('/functions/authToken', { origin: ORIGIN }), ENV)).status, 405);
  assert.equal((await post({ cookie: 'oranje_rt=not-a-real-cookie', origin: ORIGIN })).status, 401);
  assert.equal(g.calls.length, 0);

  const { done } = await signIn({ refresh_token: 'rt2' });
  const gone = await handle('token', req('/functions/authToken', { method: 'POST', cookie: cookieOf(done, 'oranje_rt'), origin: ORIGIN }), ENV,
    googleReplies({ status: 400, json: { error: 'invalid_grant' } }).fetchImpl);
  assert.equal(gone.status, 401);
  assert.ok(setCookies(gone).some((c) => /^oranje_rt=; .*Max-Age=0/.test(c)));
  assert.equal((await handle('logout', req('/functions/authLogout', { method: 'POST', origin: 'https://evil.example' }), ENV)).status, 403);
});

test('two secrets are enough, the ID token must be ours, logout clears both cookies', async () => {
  assert.equal(await open(ENV, await seal(ENV, 'hello')), 'hello', 'cookie key derived from the client secret');
  assert.equal(await open({ ...ENV, secret: 'other' }, await seal(ENV, 'hello')), null, 'a different key cannot open it');
  assert.equal(whoFrom(idToken({ aud: 'someone-else', given_name: 'Mallory' }), ENV.id), null);
  assert.equal(whoFrom('garbage', ENV.id), null);
  const unset = await handle('session', req('/functions/authSession'), { id: '', secret: '', key: '', appOrigin: ORIGIN });
  assert.deepEqual(await body(unset), { broker: true, configured: false, connected: false, name: '', email: '' });
  const login = await handle('login', req('/functions/authLogin'), { id: '', secret: '', appOrigin: ORIGIN });
  assert.equal(login.headers.get('location'), `${ORIGIN}/?auth_error=not_configured`);

  const { done } = await signIn({ refresh_token: 'rt3' });
  const g = googleReplies({ status: 200, json: {} });
  const out = await handle('logout', req('/functions/authLogout', { method: 'POST', cookie: cookieOf(done, 'oranje_rt'), origin: ORIGIN }), ENV, g.fetchImpl);
  assert.equal(out.status, 200);
  assert.equal(g.calls[0].url, 'https://oauth2.googleapis.com/revoke');
  assert.deepEqual(setCookies(out).map((c) => c.split('=')[0]), ['oranje_rt', 'oranje_who']);
});

test('without APP_ORIGIN the redirect URI follows the forwarded host', async () => {
  const r = new Request('http://internal.local/functions/authLogin', { headers: { 'x-forwarded-host': 'oranje.base44.app', 'x-forwarded-proto': 'https' } });
  const res = await handle('login', r, { ...ENV, appOrigin: '' });
  assert.equal(new URL(res.headers.get('location')).searchParams.get('redirect_uri'), 'https://oranje.base44.app/functions/authCallback');
});
