import { seal, open } from './broker.js';
import { fetchWhoopDays } from './whoop-data.js';

const BASE = 'https://api.prod.whoop.com';
const TOKEN = `${BASE}/oauth/oauth2/token`;
const STATE = 'oranje_whoop_state';
const SESSION = 'oranje_whoop_session';
const MAX_AGE = 60 * 60 * 24 * 30;
export const WHOOP_SCOPES = ['read:cycles', 'read:recovery', 'read:sleep', 'read:workout'];
const configured = (env) => Boolean(env.id && env.secret);
const currentOrigin = (req, env) => req.headers.has('origin')
  ? req.headers.get('origin') === env.appOrigin
  : req.headers.get('sec-fetch-site') === 'same-origin';
const cookie = (name, value, age, sameSite = 'Strict') =>
  `${name}=${value}; Path=/functions; Secure; HttpOnly; SameSite=${sameSite}; Max-Age=${age}`;
const getCookie = (req, name) => (req.headers.get('cookie') || '').split(';')
  .map((c) => c.trim()).find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1);

function reply(status, data, { location, cookies = [] } = {}) {
  const headers = new Headers({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
  if (data) headers.set('Content-Type', 'application/json; charset=utf-8');
  if (location) headers.set('Location', location);
  for (const value of cookies) headers.append('Set-Cookie', value);
  return new Response(data ? JSON.stringify(data) : null, { status, headers });
}

const callbackUrl = (env) => `${env.appOrigin}/functions/whoopReturn`;
const dashboard = (env) => `${env.appOrigin}/whoop.html`;
const dropState = () => cookie(STATE, '', 0, 'Lax');
const dropSession = () => cookie(SESSION, '', 0);

async function exchange(env, params, fetchImpl) {
  const response = await fetchImpl(TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ client_id: env.id, client_secret: env.secret, ...params }),
    signal: AbortSignal.timeout(8_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token || !body.refresh_token || !(Number(body.expires_in) > 0)) {
    throw Object.assign(new Error('WHOOP token exchange failed'), { status: body.error === 'invalid_grant' ? 401 : 502 });
  }
  return { access: body.access_token, refresh: body.refresh_token, expiresAt: Date.now() + Number(body.expires_in) * 1000 };
}

async function readSession(req, env) {
  const sealed = getCookie(req, SESSION);
  if (!sealed) return null;
  try {
    const session = JSON.parse(await open(env, sealed));
    return session?.access && session?.refresh && Number.isFinite(session.expiresAt) ? session : null;
  } catch { return null; }
}

async function sessionCookie(session, env) {
  const sealed = await seal(env, JSON.stringify(session));
  if (sealed.length > 3800) throw new Error('WHOOP session exceeds cookie capacity');
  return cookie(SESSION, sealed, MAX_AGE);
}

// Multiple simultaneous requests in this runtime share one rotation. The
// browser also serializes requests from its tabs before they reach Base44.
const refreshing = new Map();
async function refreshSession(session, env, fetchImpl) {
  const key = session.refresh;
  if (!refreshing.has(key)) {
    refreshing.set(key, exchange(env, { grant_type: 'refresh_token', refresh_token: key, scope: 'offline' }, fetchImpl)
      .finally(() => refreshing.delete(key)));
  }
  return refreshing.get(key);
}

async function revokeWhoop(session, env, fetchImpl) {
  const revoke = (access) => fetchImpl(`${BASE}/developer/v2/user/access`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${access}` }, signal: AbortSignal.timeout(8_000),
  });
  try {
    const active = session.expiresAt <= Date.now() + 30_000
      ? await refreshSession(session, env, fetchImpl) : session;
    const response = await revoke(active.access);
    if (response.status !== 401 || active !== session) return response.ok;
    const refreshed = await refreshSession(session, env, fetchImpl);
    return (await revoke(refreshed.access)).ok;
  } catch { return false; }
}

export async function handleWhoop(req, env, fetchImpl = fetch) {
  const action = new URL(req.url).searchParams.get('action') || 'session';
  if (action === 'login') {
    if (req.method !== 'GET') return reply(405, { error: 'method_not_allowed' });
    if (!configured(env)) return reply(302, null, { location: `${dashboard(env)}?error=not_configured` });
    const state = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(6)))).replace(/\+/g, '-').replace(/\//g, '_');
    const url = new URL('/oauth/oauth2/auth', BASE);
    url.search = new URLSearchParams({
      client_id: env.id, redirect_uri: callbackUrl(env), response_type: 'code', state,
      scope: [...WHOOP_SCOPES, 'offline'].join(' '),
    });
    return reply(302, null, { location: url.href, cookies: [cookie(STATE, state, 600, 'Lax')] });
  }
  if (!['session', 'data', 'logout'].includes(action)) return reply(404, { error: 'not_found' });
  if (req.method !== (action === 'session' ? 'GET' : 'POST')) return reply(405, { error: 'method_not_allowed' });
  if (!currentOrigin(req, env)) return reply(403, { error: 'cross_site' });
  const enabled = configured(env);
  const session = enabled ? await readSession(req, env) : null;
  if (action === 'session') return reply(200, { configured: enabled, connected: Boolean(session) });
  if (action === 'logout') {
    const revoked = session ? await revokeWhoop(session, env, fetchImpl) : false;
    return reply(200, { ok: true, revoked }, { cookies: [dropSession()] });
  }
  if (!enabled) return reply(503, { error: 'not_configured' });
  if (!session) return reply(401, { error: 'reauth' });

  const cookies = [];
  try {
    let active = session;
    if (session.expiresAt <= Date.now() + 30_000) {
      active = await refreshSession(session, env, fetchImpl);
      cookies.push(await sessionCookie(active, env));
    }
    return reply(200, { days: await fetchWhoopDays(active.access, fetchImpl) }, { cookies });
  } catch (error) {
    if (error.status === 401) {
      // A competing refresh may have just saved newer tokens. Do not clear
      // the cookie on this response and overwrite that successful rotation.
      return reply(401, { error: 'reauth' }, { cookies });
    }
    return reply(error.status === 429 ? 429 : 502, { error: error.status === 429 ? 'rate_limited' : 'whoop_unavailable' }, { cookies });
  }
}

export async function whoopCallback(req, env, fetchImpl = fetch) {
  if (req.method !== 'GET') return reply(405, { error: 'method_not_allowed' });
  const back = (error, extra = []) => reply(302, null, {
    location: `${dashboard(env)}${error ? `?error=${error}` : ''}`, cookies: [dropState(), ...extra],
  });
  if (!configured(env)) return back('not_configured');
  const params = new URL(req.url).searchParams;
  const state = params.get('state');
  if (!state || state !== getCookie(req, STATE)) return back('state_mismatch');
  if (params.has('error')) return back('cancelled');
  const code = params.get('code');
  if (!code) return back('exchange_failed');
  try {
    const session = await exchange(env, { grant_type: 'authorization_code', code, redirect_uri: callbackUrl(env) }, fetchImpl);
    return back(null, [await sessionCookie(session, env)]);
  } catch {
    return back('exchange_failed');
  }
}
