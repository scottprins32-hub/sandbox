import { createRing } from './ui/ring.js?v=16';
import { $, h } from './ui/motion.js?v=16';
import { fmtDur } from './core/util.js?v=16';
import { applyPage, date, getLang, num, onLang, setLang, strings } from './i18n.js?v=16';

const t = strings({
  en: {
    title: 'WHOOP scores | Oranje', skip: 'Skip to content', dashboard: 'Fitbit dashboard', connect: 'Connect WHOOP', refresh: 'Refresh', disconnect: 'Disconnect',
    day: 'WHOOP day', scores: 'Scores reported by WHOOP', strain: 'Strain', recovery: 'Recovery', sleep: 'Sleep', outOf21: 'Out of 21',
    metrics: 'Daily metrics', rhr: 'Resting heart rate', hrv: 'Heart rate variability', avgHr: 'Average heart rate', asleep: 'Time asleep',
    workouts: 'Workouts', noWorkouts: 'No workouts for this WHOOP day.', privacy: 'Privacy',
    note: 'Scores come directly from WHOOP. A dash means the score or measurement is unavailable. WHOOP shares average heart rate, so this view has no minute-by-minute chart.',
    not_configured: 'WHOOP is awaiting setup by the owner of Oranje.', cancelled: 'WHOOP sign-in was cancelled. You can try again.',
    state_mismatch: 'The sign-in link expired. Start again from this page.', exchange_failed: 'WHOOP sign-in could not finish. You can try again.',
    rate_limited: 'WHOOP is busy. Wait a moment and try refreshing again.', reauth: 'Your WHOOP session has ended. Connect again to load your scores.',
    unknown: 'Oranje could not reach WHOOP. Please try again.',
    loading: 'Loading scores from WHOOP…', loaded: 'Official WHOOP scores from the last 30 days.', empty: 'WHOOP returned no cycles in the last 30 days.',
    revoked: 'WHOOP disconnected.', partly: 'WHOOP disconnected here. To remove any remaining access, open Connected Apps in WHOOP and remove Oranje.',
    prompt: 'Connect your account to see the scores reported by WHOOP.', down: 'WHOOP is unavailable right now. Reload this page to try again.',
    checking: 'Checking your WHOOP connection…', unavailable: 'unavailable', outOf: ' out of 21', bpm: ' bpm', ms: ' ms', bpmAvg: ' bpm avg.',
    workoutStrain: 'Strain {v}', reading: '{name} {value}', switchTo: 'Nederlands', switchShort: 'NL',
  },
  nl: {
    title: 'WHOOP-scores | Oranje', skip: 'Naar de inhoud', dashboard: 'Fitbit-dashboard', connect: 'WHOOP koppelen', refresh: 'Vernieuwen', disconnect: 'Ontkoppelen',
    day: 'WHOOP-dag', scores: 'Scores van WHOOP', strain: 'Strain', recovery: 'Herstel', sleep: 'Slaap', outOf21: 'Van de 21',
    metrics: 'Dagwaarden', rhr: 'Rusthartslag', hrv: 'Hartslagvariabiliteit', avgHr: 'Gemiddelde hartslag', asleep: 'Geslapen',
    workouts: 'Trainingen', noWorkouts: 'Geen trainingen op deze WHOOP-dag.', privacy: 'Privacy',
    note: 'De scores komen rechtstreeks van WHOOP. Een streepje betekent dat de score of meting er niet is. WHOOP deelt alleen de gemiddelde hartslag, dus hier staat geen grafiek per minuut.',
    not_configured: 'WHOOP moet nog worden ingesteld door de beheerder van Oranje.', cancelled: 'Inloggen bij WHOOP is geannuleerd. Je kunt het opnieuw proberen.',
    state_mismatch: 'De inloglink is verlopen. Begin opnieuw vanaf deze pagina.', exchange_failed: 'Inloggen bij WHOOP is niet gelukt. Je kunt het opnieuw proberen.',
    rate_limited: 'WHOOP heeft het druk. Wacht even en vernieuw opnieuw.', reauth: 'Je WHOOP-sessie is afgelopen. Koppel opnieuw om je scores te laden.',
    unknown: 'Oranje kon WHOOP niet bereiken. Probeer het opnieuw.',
    loading: 'Scores ophalen bij WHOOP…', loaded: 'Officiële WHOOP-scores van de afgelopen 30 dagen.', empty: 'WHOOP gaf geen dagen terug van de afgelopen 30 dagen.',
    revoked: 'WHOOP ontkoppeld.', partly: 'WHOOP is hier ontkoppeld. Haal Oranje ook weg onder Connected Apps in WHOOP om alle toegang in te trekken.',
    prompt: 'Koppel je account om de scores van WHOOP te zien.', down: 'WHOOP is nu niet bereikbaar. Laad deze pagina opnieuw om het nog eens te proberen.',
    checking: 'Je WHOOP-koppeling controleren…', unavailable: 'niet beschikbaar', outOf: ' van de 21', bpm: ' bpm', ms: ' ms', bpmAvg: ' bpm gem.',
    workoutStrain: 'Strain {v}', reading: '{name} {value}', switchTo: 'English', switchShort: 'EN',
  },
});


const status = $('#whoop-status');
const connect = $('#whoop-connect');
const refresh = $('#whoop-refresh');
const disconnect = $('#whoop-disconnect');
const results = $('#whoop-results');
const cycle = $('#whoop-cycle');
const metrics = [
  { name: 'strain', max: 21, digits: 1, unit: 'outOf' },
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

const KNOWN = ['not_configured', 'cancelled', 'state_mismatch', 'exchange_failed', 'rate_limited', 'reauth'];
const errorText = (key) => t(KNOWN.includes(key) ? key : 'unknown');

function request(action) {
  const run = async () => {
    const response = await fetch(`/functions/whoopApi?action=${action}`, {
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
const reading = (value, digits, unit) => finite(value) ? `${num(value, digits)}${unit === '%' || !unit ? unit : t(unit)}` : '–';

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
    readings.push(t('reading', { name: t(name), value: finite(score) ? reading(score, digits, unit) : t('unavailable') }));
  }
  $('#whoop-reading').textContent = readings.join(', ');
  $('#whoop-resting').textContent = reading(day.restingHeartRate, 0, 'bpm');
  $('#whoop-hrv').textContent = reading(day.hrv, 0, 'ms');
  $('#whoop-average').textContent = reading(day.averageHeartRate, 0, 'bpm');
  $('#whoop-duration').textContent = finite(day.sleepMinutes) ? fmtDur(day.sleepMinutes) : '–';
  const workouts = day.workouts.map((workout) => h('li', {},
    h('strong', { text: workout.name }),
    h('span', { text: [
      finite(workout.minutes) && fmtDur(workout.minutes),
      finite(workout.strain) && t('workoutStrain', { v: reading(workout.strain, 1, '') }),
      finite(workout.averageHeartRate) && reading(workout.averageHeartRate, 0, 'bpmAvg'),
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

// one option per WHOOP day, labelled in the current language
function labelCycles() {
  const keep = cycle.value;
  const labels = new Map();
  cycle.replaceChildren(...days.map((day, index) => {
    const occurrence = (labels.get(day.date) ?? 0) + 1;
    labels.set(day.date, occurrence);
    const label = date(new Date(`${day.date}T00:00:00Z`), { dateStyle: 'full', timeZone: 'UTC' });
    return h('option', { value: index, text: occurrence === 1 ? label : `${label} (${occurrence})` });
  }));
  if (keep) cycle.value = keep;
}

async function loadScores() {
  const requestRevision = ++revision;
  refresh.disabled = disconnect.disabled = true;
  status.textContent = t('loading');
  try {
    const payload = await request('data');
    if (revision !== requestRevision) return;
    days = payload.days;
    labelCycles();
    results.hidden = days.length === 0;
    status.textContent = t(days.length ? 'loaded' : 'empty');
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
  showDisconnected(t(revoked ? 'revoked' : 'partly'), true);
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
      showDisconnected(error ? errorText(error) : session.configured ? t('prompt') : errorText('not_configured'), session.configured);
      return;
    }
    refresh.hidden = disconnect.hidden = false;
    await loadScores();
  } catch {
    if (activePage && revision === requestRevision) showDisconnected(t('down'), false);
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
// language: page text, then whatever is on screen
function applyLanguage() {
  applyPage(t);
  document.title = t('title');
  const btn = $('#lang-btn');
  btn.textContent = t('switchShort');
  btn.setAttribute('aria-label', t('switchTo'));
  btn.setAttribute('lang', getLang() === 'nl' ? 'en' : 'nl');
}
applyLanguage();
if (status.textContent.trim() === 'Checking your WHOOP connection…') status.textContent = t('checking');
$('#lang-btn').addEventListener('click', () => setLang(getLang() === 'nl' ? 'en' : 'nl'));
onLang(() => {
  applyLanguage();
  if (days.length) { labelCycles(); status.textContent = t('loaded'); renderDay(); } else start();
});

start();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
