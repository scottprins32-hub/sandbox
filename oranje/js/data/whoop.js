// WHOOP scores for the dashboard, through this site's /functions/whoop.
// The WHOOP page (whoop.html) connects the account; this only reads.
//
// A WHOOP connection lives in this browser, not in a Google account. So the
// dashboard remembers which Google person first used it here, and does not
// mix WHOOP scores into anyone else's days on a shared device.

const OWNER = 'oranje.whoop.owner';
const read = () => { try { return localStorage.getItem(OWNER) || ''; } catch { return ''; } };
const write = (v) => { try { if (v) localStorage.setItem(OWNER, v); else localStorage.removeItem(OWNER); } catch { /* storage off */ } };

async function call(action) {
  const res = await fetch(`/functions/whoop?action=${action}`, {
    method: action === 'session' ? 'GET' : 'POST', headers: { Accept: 'application/json' }, cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error || 'unavailable'), { status: res.status });
  return body;
}

// → { connected, days, error, other }. Never throws: WHOOP is extra, the
// dashboard works without it.
export async function loadWhoop(person) {
  try {
    const session = await call('session');
    if (!session.configured || !session.connected) return { connected: false, days: [] };
    const owner = read();
    if (owner && person && owner !== person) return { connected: true, other: true, days: [] };
    const run = () => call('data');
    const { days } = navigator.locks ? await navigator.locks.request('oranje-whoop-session', run) : await run();
    if (person && !owner) write(person);
    return { connected: true, days: Array.isArray(days) ? days : [] };
  } catch (e) {
    return { connected: e.message !== 'reauth' && e.status !== 401, days: [], error: e.message || 'unavailable' };
  }
}

// When someone disconnects Google here, the next person starts clean.
export const forgetWhoopOwner = () => write('');
