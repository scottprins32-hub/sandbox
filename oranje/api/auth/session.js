import { COOKIE, WHO, configured, cookies, json, open } from './_lib.js';

// Tells the page whether server-side sign-in is available, already linked,
// and to whom, so each person sees their own name and their own cached data.
export default function handler(req, res) {
  const c = cookies(req);
  const connected = configured() && !!c[COOKIE];
  let who = null;
  if (connected && c[WHO]) { try { who = JSON.parse(open(c[WHO]) || 'null'); } catch { who = null; } }
  json(res, 200, { broker: true, configured: configured(), connected, name: who?.name || '', email: who?.email || '' });
}
