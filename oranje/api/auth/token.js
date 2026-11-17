import { COOKIE, WHO, configured, cookies, googleToken, json, open, sameOrigin, setCookie } from './_lib.js';

// Hands the page a one-hour access token. Only our own page may ask.
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' }, { Allow: 'POST' });
  if (!configured()) return json(res, 503, { error: 'not_configured' });
  if (!sameOrigin(req)) return json(res, 403, { error: 'cross_site' });
  const sealed = cookies(req)[COOKIE];
  const refresh = sealed && open(sealed);
  const drop = { 'Set-Cookie': [setCookie(COOKIE, '', { maxAge: 0 }), setCookie(WHO, '', { maxAge: 0 })] };
  if (!refresh) return json(res, 401, { error: 'reauth' }, sealed ? drop : {});

  const t = await googleToken({ refresh_token: refresh, grant_type: 'refresh_token' });
  // invalid_grant: revoked, or the weekly expiry Google applies to apps left in "Testing".
  if (!t.ok) return t.json.error === 'invalid_grant' ? json(res, 401, { error: 'reauth' }, drop) : json(res, 502, { error: t.json.error || 'google_unavailable' });
  json(res, 200, { access_token: t.json.access_token, expires_in: t.json.expires_in });
}
