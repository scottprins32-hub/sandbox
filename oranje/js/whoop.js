import { createRing } from './ui/ring.js?v=9';
import { $, h } from './ui/motion.js?v=9';
import { fmtDur } from './core/util.js';

const status = $('#whoop-status');
const connect = $('#whoop-connect');
const refresh = $('#whoop-refresh');
const disconnect = $('#whoop-disconnect');
const results = $('#whoop-results');
const cycle = $('#whoop-cycle');
const metrics = [
  { name: 'strain', max: 21, digits: 1, unit: ' out of 21' },
  { name: 'recovery', max: 100, digits: 0, unit: '%' },
  { name: 'sleep', max: 100, digits: 0, unit: '%' },
].map((metric) => {
  const value = $(`#whoop-${metric.name}`);
  const card = value.closest('.ring');
  return { ...metric, value, card, ring: createRing($('.ring-face', card), { max: metric.max }) };
});
let days = [];
let revision = 0;
let activePage = true;
const connection = typeof BroadcastChannel === 'function' ? new BroadcastChannel('oranje-whoop') : null;

const errors = {
  not_configured: 'WHOOP is awaiting setup by the owner of Oranje.',
  cancelled: 'WHOOP sign-in was cancelled. You can try again.',
  state_mismatch: 'The sign-in link expired. Start again from this page.',
  exchange_failed: 'WHOOP sign-in could not finish. You can try again.',
  rate_limited: 'WHOOP is busy. Wait a moment and try refreshing again.',
  reauth: 'Your WHOOP session has ended. Connect again to load your scores.',
};
const errorText = (key) => errors[key] ?? 'Oranje could not reach WHOOP. Please try again.';

function request(action) {
  const run = async () => {
    const response = await fetch(`/functions/whoop?action=${action}`, {
      method: action === 'session' ? 'GET' : 'POST',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'unavailable');
    return payload;
  };
  if (action === 'session' || !navigator.locks) return run();
  return navigator.locks.request('oranje-whoop-session', run);
}

const finite = Number.isFinite;
const reading = (value, digits, unit) => finite(value) ? `${value.toFixed(digits)}${unit}` : '–';

function renderDay() {
  const day = days[Number(cycle.value)];
  if (!day) return;
  const readings = [];
  for (const { name, digits, unit, value, card, ring } of metrics) {
    const score = day[name];
    value.textContent = reading(score, digits, '');
    value.parentElement.classList.toggle('nil', !finite(score));
    ring.set(score);
    if (name === 'recovery') card.dataset.band = score >= 67 ? 'hi' : score >= 34 ? 'mid' : 'lo';
    readings.push(`${name} ${finite(score) ? reading(score, digits, unit) : 'unavailable'}`);
  }
  $('#whoop-reading').textContent = readings.join(', ');
  $('#whoop-resting').textContent = reading(day.restingHeartRate, 0, ' bpm');
  $('#whoop-hrv').textContent = reading(day.hrv, 0, ' ms');
  $('#whoop-average').textContent = reading(day.averageHeartRate, 0, ' bpm');
  $('#whoop-duration').textContent = finite(day.sleepMinutes) ? fmtDur(day.sleepMinutes) : '–';
  const workouts = day.workouts.map((workout) => h('li', {},
    h('strong', { text: workout.name }),
    h('span', { text: [
      finite(workout.minutes) && fmtDur(workout.minutes),
      finite(workout.strain) && `Strain ${reading(workout.strain, 1, '')}`,
      finite(workout.averageHeartRate) && reading(workout.averageHeartRate, 0, ' bpm avg.'),
    ].filter(Boolean).join(' · ') }),
  ));
  $('#whoop-workouts').replaceChildren(...workouts);
  $('#whoop-workouts-empty').hidden = workouts.length > 0;
}

function clearScores() {
  revision++;
  days = [];
  results.hidden = true;
  cycle.replaceChildren();
  for (const { value, ring } of metrics) {
    value.textContent = '–';
    ring.set(null, { animate: false });
  }
  for (const id of ['resting', 'hrv', 'average', 'duration']) $(`#whoop-${id}`).textContent = '–';
  $('#whoop-reading').textContent = '';
  $('#whoop-workouts').replaceChildren();
}

function showDisconnected(text, configured) {
  clearScores();
  refresh.hidden = disconnect.hidden = true;
  connect.hidden = !configured;
  status.textContent = text;
}

async function loadScores() {
  const requestRevision = ++revision;
  refresh.disabled = disconnect.disabled = true;
  status.textContent = 'Loading scores from WHOOP…';
  try {
    const payload = await request('data');
    if (revision !== requestRevision) return;
    days = payload.days;
    const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeZone: 'UTC' });
    const labels = new Map();
    cycle.replaceChildren(...days.map((day, index) => {
      const occurrence = (labels.get(day.date) ?? 0) + 1;
      labels.set(day.date, occurrence);
      const label = dateFormat.format(new Date(`${day.date}T00:00:00Z`));
      return h('option', { value: index, text: occurrence === 1 ? label : `${label} (${occurrence})` });
    }));
    results.hidden = days.length === 0;
    status.textContent = days.length ? 'Official WHOOP scores from the last 30 days.' : 'WHOOP returned no cycles in the last 30 days.';
    renderDay();
  } catch (error) {
    if (revision !== requestRevision) return;
    if (error.message === 'reauth') showDisconnected(errorText('reauth'), true);
    else status.textContent = errorText(error.message);
  } finally {
    refresh.disabled = disconnect.disabled = false;
  }
}

cycle.addEventListener('change', renderDay);
refresh.addEventListener('click', loadScores);
disconnect.addEventListener('click', async () => {
  refresh.disabled = disconnect.disabled = true;
  try {
    const { revoked } = await request('logout');
    connection?.postMessage({ disconnected: true, revoked });
    disconnected(revoked);
    connect.focus();
  } catch (error) {
    status.textContent = errorText(error.message);
  } finally {
    refresh.disabled = disconnect.disabled = false;
  }
});

function disconnected(revoked) {
  try { localStorage.removeItem('oranje.whoop.owner'); } catch { /* storage off */ }
  showDisconnected(revoked ? 'WHOOP disconnected.' : 'WHOOP disconnected here. To remove any remaining access, open Connected Apps in WHOOP and remove Oranje.', true);
}

connection?.addEventListener('message', (event) => {
  if (event.data?.disconnected === true) disconnected(event.data.revoked === true);
});

async function start() {
  const requestRevision = revision;
  const url = new URL(location.href);
  const error = url.searchParams.get('error');
  if (error) {
    url.searchParams.delete('error');
    history.replaceState(null, '', url);
  }
  try {
    const session = await request('session');
    if (!activePage || revision !== requestRevision) return;
    if (!session.configured || !session.connected) {
      showDisconnected(error ? errorText(error) : session.configured ? 'Connect your account to see the scores reported by WHOOP.' : errorText('not_configured'), session.configured);
      return;
    }
    refresh.hidden = disconnect.hidden = false;
    await loadScores();
  } catch {
    if (activePage && revision === requestRevision) showDisconnected('WHOOP is unavailable right now. Reload this page to try again.', false);
  }
}

window.addEventListener('pagehide', () => {
  // A back-forward cache entry may otherwise show personal data after logout.
  activePage = false;
  clearScores();
});
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  activePage = true;
  start();
});
start();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
