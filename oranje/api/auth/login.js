import { randomBytes } from 'node:crypto';
import { SCOPES, STATE, configured, env, origin, setCookie } from './_lib.js';

// Step 1: send the visitor to Google's consent screen.
export default function handler(req, res) {
  if (!configured()) { res.statusCode = 302; res.setHeader('Location', '/?auth_error=not_configured'); return res.end(); }
  const state = randomBytes(24).toString('base64url');
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: env().id,
    redirect_uri: `${origin(req)}/api/auth/callback`,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES.join(' '),
    state,
  }).toString();
  res.statusCode = 302;
  // Lax, not Strict: this cookie has to come back on the redirect from Google.
  res.setHeader('Set-Cookie', setCookie(STATE, state, { maxAge: 600, sameSite: 'Lax' }));
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Location', url.toString());
  res.end();
}
