import { COOKIE, WHO, cookies, json, open, sameOrigin, setCookie } from './_lib.js';

// Forget the account: revoke the grant at Google and drop the cookie.
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' }, { Allow: 'POST' });
  if (!sameOrigin(req)) return json(res, 403, { error: 'cross_site' });
  const sealed = cookies(req)[COOKIE];
  const refresh = sealed && open(sealed);
  if (refresh) {
    try { await fetch('https://oauth2.googleapis.com/revoke', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token: refresh }) }); } catch { /* still clear locally */ }
  }
  json(res, 200, { ok: true }, { 'Set-Cookie': [setCookie(COOKIE, '', { maxAge: 0 }), setCookie(WHO, '', { maxAge: 0 })] });
}
