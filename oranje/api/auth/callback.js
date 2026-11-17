import { COOKIE, STATE, cookies, googleToken, origin, safeEqual, seal, setCookie } from './_lib.js';

// Step 2: Google sends the visitor back with a code. Swap it for tokens and
// keep only the refresh token, encrypted, in an httpOnly cookie.
export default async function handler(req, res) {
  const url = new URL(req.url, origin(req));
  const back = (q) => { res.statusCode = 302; res.setHeader('Cache-Control', 'no-store'); res.setHeader('Location', `/${q}`); res.end(); };
  const clearState = setCookie(STATE, '', { maxAge: 0, sameSite: 'Lax' });

  const state = url.searchParams.get('state'), code = url.searchParams.get('code');
  const expected = cookies(req)[STATE];
  if (url.searchParams.get('error')) { res.setHeader('Set-Cookie', clearState); return back(`?auth_error=${encodeURIComponent(url.searchParams.get('error'))}`); }
  if (!code || !state || !expected || !safeEqual(state, expected)) { res.setHeader('Set-Cookie', clearState); return back('?auth_error=state_mismatch'); }

  const t = await googleToken({ code, grant_type: 'authorization_code', redirect_uri: `${origin(req)}/api/auth/callback` });
  if (!t.ok || !t.json.refresh_token) { res.setHeader('Set-Cookie', clearState); return back(`?auth_error=${encodeURIComponent(t.json.error || 'no_refresh_token')}`); }

  res.setHeader('Set-Cookie', [clearState, setCookie(COOKIE, seal(t.json.refresh_token), { maxAge: 60 * 60 * 24 * 180 })]);
  back('?connected=1');
}
