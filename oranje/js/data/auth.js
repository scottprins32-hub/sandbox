// Signing in. Two ways, picked automatically:
//
//   broker  The site is deployed with its sign-in functions (Base44). Google
//           sends a code to the server, which keeps the refresh token in an
//           encrypted httpOnly cookie and hands the browser short-lived access
//           tokens. Sign in once; it stays signed in.
//   popup   Plain static hosting. Google Identity Services gives the browser a
//           one-hour access token directly. No server at all, but Google asks
//           for a click again when the hour is up.
//
// Either way the browser talks to Google Health itself; health data never
// passes through a server of ours.

import { SCOPES } from './health.js?v=16';

const KEY_CLIENT = 'oranje.clientId';
const KEY_LINKED = 'oranje.linked';
const KEY_TOKEN = 'oranje.token';

export class SignInNeeded extends Error { constructor(msg = 'Sign in again to refresh') { super(msg); this.signIn = true; } }

const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* private mode */ } },
};

let mode = null;            // 'broker' | 'popup' | 'unconfigured' | null
let who = { name: '', email: '' };   // who is signed in (broker only)
let brokerLinked = false;
let cached = null;          // { token, exp }
let gisClient = null;

const clientId = () => (window.ORANJE_CONFIG?.clientId || ls.get(KEY_CLIENT) || '').trim();
const fresh = () => cached && cached.exp - Date.now() > 60000;

function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load Google sign-in. Check your connection or content blocker.'));
    document.head.append(s);
  });
}

function popup(prompt) {
  return new Promise((resolve, reject) => {
    gisClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId(),
      scope: SCOPES.join(' '),
      prompt,
      callback: (r) => {
        if (r.error) return reject(new Error(r.error_description || r.error));
        const missing = SCOPES.filter((s) => !window.google.accounts.oauth2.hasGrantedAllScopes(r, s));
        cached = { token: r.access_token, exp: Date.now() + (Number(r.expires_in) || 3600) * 1000, missing };
        try { sessionStorage.setItem(KEY_TOKEN, JSON.stringify(cached)); } catch { /* fine */ }
        ls.set(KEY_LINKED, 'popup');
        resolve(cached.token);
      },
      error_callback: (e) => reject(new Error(e?.type === 'popup_closed' ? 'Sign-in window closed before finishing.' : e?.type === 'popup_failed_to_open' ? 'The sign-in window was blocked. Allow pop-ups for this page and try again.' : (e?.message || 'Sign-in failed.'))),
    });
    gisClient.requestAccessToken();
  });
}

export const auth = {
  get mode() { return mode; },
  get clientId() { return clientId(); },
  setClientId(id) { ls.set(KEY_CLIENT, id ? id.trim() : null); if (mode !== 'broker') mode = clientId() ? 'popup' : null; },

  // Work out which way of signing in this deployment supports.
  async init() {
    try {
      const r = await fetch('/functions/authSession', { headers: { Accept: 'application/json' }, cache: 'no-store' });
      const j = r.ok && (r.headers.get('content-type') || '').includes('json') ? await r.json() : null;
      if (j?.broker && j.configured) { mode = 'broker'; brokerLinked = !!j.connected; who = { name: j.name || '', email: j.email || '' }; }
      else if (j?.broker && !window.ORANJE_CONFIG?.clientId) mode = 'unconfigured';   // hosted, but its Google credentials are not set yet
    } catch { /* static hosting: no broker */ }
    if (!mode && clientId()) mode = 'popup';
    if (mode === 'popup') {
      try { const t = JSON.parse(sessionStorage.getItem(KEY_TOKEN) || 'null'); if (t && t.exp - Date.now() > 60000) cached = t; } catch { /* fine */ }
    }
    return mode;
  },

  // Has an account been connected on this browser (even if the token has lapsed)?
  get linked() { return mode === 'broker' ? brokerLinked : mode === 'popup' && ls.get(KEY_LINKED) === 'popup'; },
  get needsSetup() { return !mode; },
  get unconfigured() { return mode === 'unconfigured'; },
  get who() { return who; },
  get missingScopes() { return cached?.missing || []; },

  async connect() {
    if (mode === 'broker') { location.assign('/functions/authLogin'); return new Promise(() => {}); }
    if (mode === 'unconfigured') throw new Error('unconfigured');
    if (!clientId()) throw new Error('Add an OAuth client ID first.');
    mode = 'popup';
    await loadGis();
    return popup(ls.get(KEY_LINKED) ? '' : 'consent');
  },

  // A valid access token, or SignInNeeded if getting one would need a click.
  async token({ force = false } = {}) {
    if (!force && fresh()) return cached.token;
    if (mode === 'broker') {
      const r = await fetch('/functions/authToken', { method: 'POST', headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (r.status === 401) { brokerLinked = false; throw new SignInNeeded(); }
      if (!r.ok) throw new Error('Could not refresh sign-in. Try again in a moment.');
      const j = await r.json();
      cached = { token: j.access_token, exp: Date.now() + (Number(j.expires_in) || 3600) * 1000 };
      return cached.token;
    }
    throw new SignInNeeded();
  },

  async disconnect() {
    const t = cached?.token;
    cached = null; brokerLinked = false; who = { name: '', email: '' };
    try { sessionStorage.removeItem(KEY_TOKEN); } catch { /* fine */ }
    ls.set(KEY_LINKED, null);
    if (mode === 'broker') { try { await fetch('/functions/authLogout', { method: 'POST' }); } catch { /* offline */ } }
    else if (t && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(t, () => {});
  },
};
