const endpoint = '/functions/whoop';
export const whoopLogin = `${endpoint}?action=login`;
const connection = typeof window !== 'undefined' && typeof BroadcastChannel === 'function' ? new BroadcastChannel('oranje-whoop') : null;

export async function requestWhoop(action) {
  const run = async () => {
    const response = await fetch(`${endpoint}?action=${action}`, {
      method: action === 'session' ? 'GET' : 'POST',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(action === 'session' ? 5000 : 30000),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'unavailable');
    return payload;
  };
  // WHOOP rotates refresh tokens. Serialize data and logout across tabs.
  if (action === 'session' || !navigator.locks) return run();
  return navigator.locks.request('oranje-whoop-session', run);
}

const errors = new Map([
  ['not_configured', 'WHOOP is awaiting setup by the owner of Oranje.'],
  ['cancelled', 'WHOOP sign-in was cancelled. You can try again.'],
  ['state_mismatch', 'The sign-in link expired. Start again from this page.'],
  ['exchange_failed', 'WHOOP sign-in could not finish. You can try again.'],
  ['rate_limited', 'WHOOP is busy. Wait a moment and try refreshing again.'],
  ['reauth', 'Your WHOOP session has ended. Connect again to load your scores.'],
]);

export const whoopError = (error) => errors.get(error) ?? 'Oranje could not reach WHOOP. Please try again.';

export function onWhoopDisconnect(callback) {
  connection?.addEventListener('message', (event) => {
    if (event.data?.disconnected === true) callback(event.data.revoked === true);
  });
}

export async function disconnectWhoop() {
  const { revoked } = await requestWhoop('logout');
  connection?.postMessage({ disconnected: true, revoked });
  return revoked;
}

export const whoopDisconnectMessage = (revoked) => revoked
  ? 'WHOOP disconnected.'
  : 'WHOOP disconnected here. To remove any remaining access, remove Oranje from Connected Apps in WHOOP.';

// The broker returns newest cycle first. A date is a label, not an identifier:
// WHOOP can report several physiological cycles on the same calendar date.
export function whoopContext(cycles) {
  const counts = new Map();
  const days = cycles.map((cycle) => {
    const occurrence = (counts.get(cycle.date) ?? 0) + 1;
    counts.set(cycle.date, occurrence);
    return { ...cycle, key: `${cycle.date}:${occurrence}`, occurrence };
  }).reverse();
  return { days, byDate: Object.fromEntries(days.map((day) => [day.key, day])), source: 'whoop' };
}

// Only direct wearable connections participate in automatic source selection.
export function defaultWearable({ whoop, fitbit, preference }) {
  if (preference === 'google' && fitbit) return 'google';
  if (whoop) return 'whoop';
  return fitbit ? 'google' : null;
}
