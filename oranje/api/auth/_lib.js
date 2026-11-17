// Shared by the four sign-in functions. These exist only to keep a Google
// refresh token out of the browser: it lives in an AES-256-GCM encrypted,
// httpOnly cookie that only /api/auth can read. No health data comes through here.

import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const S = 'https://www.googleapis.com/auth/googlehealth.';
// openid/email/profile only to greet each person by name; health scopes are all read-only.
export const SCOPES = ['openid', 'email', 'profile', ...['activity_and_fitness', 'health_metrics_and_measurements', 'sleep', 'profile', 'settings'].map((s) => `${S}${s}.readonly`)];
export const COOKIE = 'oranje_rt';
export const WHO = 'oranje_who';
export const STATE = 'oranje_state';

export const env = () => ({
  id: process.env.GOOGLE_CLIENT_ID || '',
  secret: process.env.GOOGLE_CLIENT_SECRET || '',
  // Optional: without it the cookie key is derived from the client secret, so
  // two variables are enough. Set it to rotate cookies without a new secret.
  key: process.env.ORANJE_SECRET || '',
});
export const configured = () => { const e = env(); return !!(e.id && e.secret); };

export const origin = (req) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || (String(host).startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
};
// Refuse cross-site callers: a token may only be minted for our own page.
export const sameOrigin = (req) => {
  const o = req.headers.origin;
  const site = req.headers['sec-fetch-site'];
  if (o) return o === origin(req);
  return site === 'same-origin';
};

export const cookies = (req) => Object.fromEntries(String(req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((p) => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
export const setCookie = (name, value, { maxAge, sameSite = 'Strict', path = '/api/auth' } = {}) =>
  `${name}=${encodeURIComponent(value)}; Path=${path}; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=${maxAge}`;

const keyBytes = () => { const e = env(); return createHash('sha256').update(e.key.length >= 16 ? e.key : `oranje-cookie-v1:${e.secret}`).digest(); };
export function seal(text) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', keyBytes(), iv);
  const body = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString('base64url');
}
export function open(sealed) {
  try {
    const raw = Buffer.from(sealed, 'base64url');
    const d = createDecipheriv('aes-256-gcm', keyBytes(), raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8');
  } catch { return null; }
}
export const safeEqual = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };

export async function googleToken(params) {
  const e = env();
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: e.id, client_secret: e.secret, ...params }),
  });
  return { ok: r.ok, status: r.status, json: await r.json().catch(() => ({})) };
}
export const json = (res, status, body, headers = {}) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
};

// Who signed in, from the ID token Google returned straight to us over TLS in
// the code exchange; as OpenID Connect allows, that channel is the proof.
export function whoFrom(idToken) {
  try {
    const p = JSON.parse(Buffer.from(String(idToken).split('.')[1], 'base64url').toString('utf8'));
    if (p.aud !== env().id) return null;
    return { name: p.given_name || p.name || '', email: p.email || '' };
  } catch { return null; }
}
