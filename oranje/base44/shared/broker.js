// The sign-in broker. Its only job is to keep each person's Google refresh
// token out of the browser: the token lives in an AES-GCM encrypted, httpOnly
// cookie, and the page asks here for one-hour access tokens. Health data never
// passes through it; the browser calls Google Health itself.
//
// Written against web standards only (Request, Response, WebCrypto), so the
// same code runs as Base44 backend functions (Deno) and under Node's test runner.

const HEALTH = 'https://www.googleapis.com/auth/googlehealth.';
// openid/email/profile only to greet each person by name; health scopes are all read-only.
export const SCOPES = ['openid', 'email', 'profile',
  ...['activity_and_fitness', 'health_metrics_and_measurements', 'sleep', 'profile', 'settings'].map((s) => `${HEALTH}${s}.readonly`)];

export const ROUTES = { session: 'authSession', login: 'authLogin', callback: 'authCallback', token: 'authToken', logout: 'authLogout' };
const PATH = '/functions';
const RT = 'oranje_rt', WHO = 'oranje_who', STATE = 'oranje_state';
const HALF_YEAR = 60 * 60 * 24 * 180;

const enc = new TextEncoder(), dec = new TextDecoder();
const b64u = {
  to(bytes) { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  from(str) { const t = str.replace(/-/g, '+').replace(/_/g, '/'); const s = atob(t + '='.repeat((4 - (t.length % 4)) % 4)); return Uint8Array.from(s, (c) => c.charCodeAt(0)); },
};

export const configured = (env) => !!(env.id && env.secret);

// Optional ORANJE_SECRET; without it the key is derived from the client secret,
// so two secrets are enough. Set it to rotate cookies without a new client secret.
async function key(env) {
  const material = env.key && env.key.length >= 16 ? env.key : `oranje-cookie-v1:${env.secret}`;
  const raw = await crypto.subtle.digest('SHA-256', enc.encode(material));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
export async function seal(env, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const body = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(env), enc.encode(text)));
  const out = new Uint8Array(12 + body.length);
  out.set(iv); out.set(body, 12);
  return b64u.to(out);
}
export async function open(env, sealed) {
  try {
    const raw = b64u.from(sealed);
    return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.subarray(0, 12) }, await key(env), raw.subarray(12)));
  } catch { return null; }
}

const cookies = (req) => Object.fromEntries((req.headers.get('cookie') || '').split(';').map((c) => c.trim().split('='))
  .filter((p) => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
const cookie = (name, value, { maxAge, sameSite = 'Strict' }) =>
  `${name}=${encodeURIComponent(value)}; Path=${PATH}; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=${maxAge}`;

// The site's own origin. APP_ORIGIN wins: behind a platform the request URL
// may carry an internal host, and the Google redirect URI must match exactly.
export function origin(req, env) {
  if (env.appOrigin) return env.appOrigin.replace(/\/+$/, '');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (host) return `${req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')}://${host}`;
  return new URL(req.url).origin;
}
// A token may only be minted for our own page.
const sameOrigin = (req, env) => {
  const o = req.headers.get('origin');
  return o ? o === origin(req, env) : req.headers.get('sec-fetch-site') === 'same-origin';
};

function respond(status, { json, location, set = [] } = {}) {
  const h = new Headers({ 'Cache-Control': 'no-store' });
  if (json !== undefined) h.set('Content-Type', 'application/json; charset=utf-8');
  if (location) h.set('Location', location);
  for (const c of set) h.append('Set-Cookie', c);
  return new Response(json === undefined ? null : JSON.stringify(json), { status, headers: h });
}
const clear = (name, sameSite) => cookie(name, '', { maxAge: 0, sameSite });

// Who signed in, from the ID token Google returned straight to us over TLS in
// the code exchange; as OpenID Connect allows, that channel is the proof.
export function whoFrom(idToken, clientId) {
  try {
    const p = JSON.parse(dec.decode(b64u.from(String(idToken).split('.')[1])));
    if (p.aud !== clientId) return null;
    return { name: p.given_name || p.name || '', email: p.email || '' };
  } catch { return null; }
}

async function googleToken(env, params, fetchImpl) {
  const r = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.id, client_secret: env.secret, ...params }).toString(),
  });
  let json = {};
  try { json = await r.json(); } catch { /* not JSON */ }
  return { ok: r.ok, json };
}

const handlers = {
  // Is server sign-in available, linked, and to whom?
  async session(req, env) {
    const c = cookies(req);
    const connected = configured(env) && !!c[RT];
    let who = null;
    if (connected && c[WHO]) { try { who = JSON.parse((await open(env, c[WHO])) || 'null'); } catch { who = null; } }
    return respond(200, { json: { broker: true, configured: configured(env), connected, name: who?.name || '', email: who?.email || '' } });
  },

  // Step 1: send the visitor to Google's consent screen.
  async login(req, env) {
    const base = origin(req, env);
    if (!configured(env)) return respond(302, { location: `${base}/?auth_error=not_configured` });
    const state = b64u.to(crypto.getRandomValues(new Uint8Array(24)));
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.search = new URLSearchParams({
      client_id: env.id, redirect_uri: `${base}${PATH}/${ROUTES.callback}`, response_type: 'code',
      access_type: 'offline', prompt: 'consent', scope: SCOPES.join(' '), state,
    }).toString();
    // Lax, not Strict: this cookie has to come back on the redirect from Google.
    return respond(302, { location: url.toString(), set: [cookie(STATE, state, { maxAge: 600, sameSite: 'Lax' })] });
  },

  // Step 2: Google sends the visitor back with a code. Keep only the refresh
  // token and the person's name, both sealed, in httpOnly cookies.
  async callback(req, env, fetchImpl) {
    const base = origin(req, env);
    const url = new URL(req.url);
    const dropState = clear(STATE, 'Lax');
    const back = (q, set = [dropState]) => respond(302, { location: `${base}/${q}`, set });
    if (url.searchParams.get('error')) return back(`?auth_error=${encodeURIComponent(url.searchParams.get('error'))}`);
    const code = url.searchParams.get('code'), state = url.searchParams.get('state'), expected = cookies(req)[STATE];
    if (!code || !state || !expected || state !== expected) return back('?auth_error=state_mismatch');
    const t = await googleToken(env, { code, grant_type: 'authorization_code', redirect_uri: `${base}${PATH}/${ROUTES.callback}` }, fetchImpl);
    if (!t.ok || !t.json.refresh_token) return back(`?auth_error=${encodeURIComponent(t.json.error || 'no_refresh_token')}`);
    const who = whoFrom(t.json.id_token, env.id) || {};
    return back('?connected=1', [dropState,
      cookie(RT, await seal(env, t.json.refresh_token), { maxAge: HALF_YEAR }),
      cookie(WHO, await seal(env, JSON.stringify(who)), { maxAge: HALF_YEAR })]);
  },

  // A one-hour access token for our own page.
  async token(req, env, fetchImpl) {
    if (req.method !== 'POST') return respond(405, { json: { error: 'method_not_allowed' } });
    if (!configured(env)) return respond(503, { json: { error: 'not_configured' } });
    if (!sameOrigin(req, env)) return respond(403, { json: { error: 'cross_site' } });
    const sealed = cookies(req)[RT];
    const refresh = sealed && (await open(env, sealed));
    const drop = [clear(RT), clear(WHO)];
    if (!refresh) return respond(401, { json: { error: 'reauth' }, set: sealed ? drop : [] });
    const t = await googleToken(env, { refresh_token: refresh, grant_type: 'refresh_token' }, fetchImpl);
    // invalid_grant: revoked, or the weekly expiry Google applies to apps left in "Testing".
    if (!t.ok) return t.json.error === 'invalid_grant' ? respond(401, { json: { error: 'reauth' }, set: drop }) : respond(502, { json: { error: t.json.error || 'google_unavailable' } });
    return respond(200, { json: { access_token: t.json.access_token, expires_in: t.json.expires_in } });
  },

  // Forget the account: revoke the grant at Google and drop the cookies.
  async logout(req, env, fetchImpl) {
    if (req.method !== 'POST') return respond(405, { json: { error: 'method_not_allowed' } });
    if (!sameOrigin(req, env)) return respond(403, { json: { error: 'cross_site' } });
    const sealed = cookies(req)[RT];
    const refresh = sealed && (await open(env, sealed));
    if (refresh) {
      try { await fetchImpl('https://oauth2.googleapis.com/revoke', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token: refresh }).toString() }); } catch { /* still clear locally */ }
    }
    return respond(200, { json: { ok: true }, set: [clear(RT), clear(WHO)] });
  },
};

export function handle(name, req, env, fetchImpl = (...a) => fetch(...a)) {
  return handlers[name](req, env, fetchImpl);
}
