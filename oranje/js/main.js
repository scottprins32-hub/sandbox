// Oranje: boot, state, and the top of the page.

import { computeAll, recoveryBand } from './core/scores.js';
import { playGame } from './core/game.js';
import { setCurve } from './core/strain.js';
import { fmtClock, fmtDur, fromKey, isNum, todayKey } from './core/util.js';
import { auth } from './data/auth.js';
import { makeDemo } from './data/demo.js';
import { syncGoogle } from './data/health.js';
import { store } from './data/store.js';
import { createDial, createMeter } from './ui/dial.js';
import { announce, renderChip, renderClimb } from './ui/game.js';
import { $, $$, h, reduced, roll, watchReveals } from './ui/motion.js';
import { createRiver } from './ui/river.js';
import { VITAL_DEFS, renderRecovery, renderSleep, renderStrain, renderTrends, renderVitals } from './ui/sections.js';

const state = { source: null, data: null, ctx: null, date: null, settings: store.settings(), syncing: false, progress: '', signIn: false, error: null };
const dial = createDial($('#dial'));
const recMeter = createMeter($('#recovery-ticks'));
const sleepMeter = createMeter($('#sleep-ticks'));
const river = createRiver($('#river'));
const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
// Preview builds (config.js: preview: true) run on demo data only and never offer sign-in.
const PREVIEW = !!window.ORANJE_CONFIG?.preview;

// ───────── views ─────────
function show(view) {
  const welcome = $('#welcome');
  if (welcome) welcome.hidden = view !== 'welcome';
  $('#dash').hidden = view !== 'dash';
  $('#status').hidden = $('#open-panel').hidden = view !== 'dash';
  document.body.classList.toggle('welcoming', view === 'welcome');
}

function compute() {
  setCurve(state.settings.curve);
  state.ctx = computeAll(state.data.days, state.data.profile, state.settings);
  state.game = playGame(state.ctx.days);
  const last = state.ctx.days[state.ctx.days.length - 1]?.date;
  if (!state.date || !state.ctx.byDate[state.date]) state.date = last;
}
const current = () => state.ctx.byDate[state.date];

// ───────── hero ─────────
function verdictParts(d) {
  const s = d.strain, r = d.recovery, t = d.target;
  if (!isNum(s) && !isNum(r)) return [['No data for this day.'], ['Was the band on?', 1]];
  if (d.partial) {
    if (!isNum(r)) return isNum(s) ? [['Strain'], [s.toFixed(1), 1], ['so far. Recovery is still learning your normal.']] : [['Waiting for the first sync.']];
    const lead = r >= 67 ? 'Recovered and ready.' : r >= 34 ? 'Steady today.' : 'Run down today.';
    if (!isNum(s)) return [[lead]];
    if (s > t.hi) return [[lead], ['Past target.', 1], ['Time to ease off.']];
    if (s >= t.lo) return [[lead], ['Right on target', 1], [`at ${s.toFixed(1)}.`]];
    return [[lead], [`${(t.lo - s).toFixed(1)} to go`, 1], ['to today’s target.']];
  }
  if (!isNum(s)) return [['No heart rate recorded.']];
  const kind = { Light: 'A light day', Moderate: 'A moderate day', High: 'A hard day', 'All out': 'An all-out day' }[d.band.name];
  if (!isNum(r)) return [[`${kind}.`]];
  const judge = s > t.hi ? 'Past target.' : s >= t.lo ? 'Well judged.' : 'Room to spare.';
  return [[`${kind} on`], [`${r}% recovery.`, 1], [judge]];
}

function setVerdict(d) {
  const el = $('#verdict'), parts = verdictParts(d);
  const text = parts.map((p) => p[0]).join(' ');
  if (el.dataset.text === text) return;
  el.dataset.text = text;
  el.setAttribute('aria-label', text);
  let i = 0;
  const kids = [];
  for (const [phrase, strong] of parts) {
    const words = phrase.split(' ').map((w) => h('span', { class: 'w', style: `--i:${i++}`, 'aria-hidden': 'true', text: w }));
    const spaced = words.flatMap((w, k) => (k ? [' ', w] : [w]));
    kids.push(strong ? h('em', {}, spaced) : spaced, ' ');
  }
  el.replaceChildren(...kids.flat());
}

function trend(v, base, goodUp, unit) {
  if (!isNum(v)) return h('dd', { text: '–' });
  const dd = h('dd', {}, `${Math.round(v)} ${unit}`);
  if (base && isNum(base.mean)) {
    const diff = Math.round(v - base.mean);
    if (diff) dd.append(' ', h('small', { class: (diff > 0) === goodUp ? 'up' : 'down', text: `${diff > 0 ? '▲' : '▼'} ${Math.abs(diff)}` }));
  }
  return dd;
}

let ribbonKey = '';
const narrow = window.matchMedia('(max-width: 860px)');
function renderRibbon() {
  const days = state.ctx.days;
  let end = days.length - 1;
  const sel = days.findIndex((d) => d.date === state.date);
  const span = narrow.matches ? 7 : 14;
  if (sel < end - (span - 1)) end = Math.min(days.length - 1, sel + Math.floor(span / 2));
  const win = days.slice(Math.max(0, end - (span - 1)), end + 1);
  const el = $('#ribbon'), key = span + win.map((d) => d.date).join();
  if (key !== ribbonKey) {
    ribbonKey = key;
    el.replaceChildren(...win.map((d) => {
      const date = fromKey(d.date);
      const btn = h('button', { class: 'day', type: 'button', 'data-date': d.date, onclick: () => pick(d.date) },
        h('span', { class: 'col' }, h('i')), h('span', { class: 'dot' }), h('span', { class: 'wd', text: WD[date.getDay()] }));
      return btn;
    }));
    for (let i = win.length; i < span; i++) el.prepend(h('span'));   // a short history sits at the right
  }
  for (const d of win) {
    const btn = $(`[data-date="${d.date}"]`, el), date = fromKey(d.date);
    btn.setAttribute('aria-pressed', String(d.date === state.date));
    btn.setAttribute('aria-label', `${date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}: strain ${isNum(d.strain) ? d.strain.toFixed(1) : 'none'}, recovery ${isNum(d.recovery) ? d.recovery + '%' : 'none'}`);
    $('.dot', btn).className = `dot ${!isNum(d.recovery) ? '' : d.recovery >= 67 ? 'hi' : d.recovery >= 34 ? 'mid' : 'lo'}`;
    requestAnimationFrame(() => { $('.col i', btn).style.height = `${((d.strain || 0) / 21) * 100}%`; });
  }
}

function renderHero(animate, delay = 0) {
  const d = current(), days = state.ctx.days;
  const date = fromKey(d.date), isToday = d.date === todayKey();
  $('#dayline').replaceChildren(h('b', { text: date.toLocaleDateString('en-GB', { weekday: 'long' }) }), ` ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}${isToday ? ' · today' : ''}`);
  $('#day-prev').disabled = d.date === days[0].date;
  $('#day-next').disabled = d.date === days[days.length - 1].date;
  renderRibbon();

  dial.set(d.strain, d.target, { animate, delay });
  roll($('#strain-num'), d.strain, { format: (v) => v.toFixed(1), dur: animate ? 1300 : 0, delay });
  $('#strain-band').textContent = d.band ? d.band.name : 'No heart rate';
  $('#strain-target').textContent = d.target ? `Target ${d.target.lo.toFixed(1)}–${d.target.hi.toFixed(1)}` : '';
  $('#dial').setAttribute('aria-label', isNum(d.strain) ? `Day strain ${d.strain.toFixed(1)} of 21, ${d.band.name}` : 'No strain for this day');
  setVerdict(d);

  const rec = d.recovery, m = $('#m-recovery');
  m.dataset.band = !isNum(rec) ? '' : rec >= 67 ? 'hi' : rec >= 34 ? 'mid' : 'lo';
  roll($('#recovery-num'), rec, { dur: animate ? 1100 : 0, delay: delay + 120 });
  $('#recovery-num').parentElement.classList.toggle('nil', !isNum(rec));
  recMeter.set(rec, { animate, delay: delay + 120 });
  const nights = days.filter((x) => x.date < d.date && (isNum(x.hrv) || isNum(x.rhr))).length;
  $('#recovery-band').textContent = isNum(rec) ? recoveryBand(rec) : nights < 3 ? `Learning · ${nights}/3 nights` : 'No reading';
  $('#recovery-facts').replaceChildren(h('dt', { text: 'HRV' }), trend(d.hrv, d.baseline.hrv, true, 'ms'), h('dt', { text: 'Resting HR' }), trend(d.rhr, d.baseline.rhr, false, 'bpm'));

  const sl = d.sleepInfo;
  roll($('#sleep-num'), sl?.score, { dur: animate ? 1100 : 0, delay: delay + 220 });
  $('#sleep-num').parentElement.classList.toggle('nil', !sl);
  sleepMeter.set(sl?.score, { animate, delay: delay + 220 });
  $('#sleep-band').textContent = !sl ? (d.partial ? 'Not synced yet' : 'Not recorded') : sl.score >= 85 ? 'Well rested' : sl.score >= 70 ? 'Enough' : 'Short';
  $('#sleep-facts').replaceChildren(h('dt', { text: 'Asleep' }), h('dd', { text: sl ? fmtDur(sl.asleep) : '–' }), h('dt', { text: 'Needed' }), h('dd', { text: sl ? fmtDur(sl.need) : '–' }));

  river.set(d, { animate });
  renderChip(state.game);
}

function renderAll({ animate = true, delay = 0 } = {}) {
  if (!state.ctx?.days.length) return;
  const d = current();
  renderHero(animate, delay);
  renderClimb(d, state.game, pick);
  renderStrain(d);
  renderRecovery(d, state.ctx);
  renderSleep(d, state.ctx);
  renderVitals(d, state.ctx, state.settings.hidden, state.data.issues || []);
  renderTrends(d, state.ctx, state.settings.range, pick);
  renderStatus();
  watchReveals();
}

function pick(date) {
  if (!state.ctx.byDate[date] || date === state.date) return;
  state.date = date;
  renderAll();
}
const step = (n) => { const i = state.ctx.days.findIndex((d) => d.date === state.date) + n; if (state.ctx.days[i]) pick(state.ctx.days[i].date); };

// ───────── status, account, sync ─────────
function renderStatus() {
  const el = $('#status'), text = $('#status-text');
  let st = 'ok', label = '';
  if (state.source === 'demo') { st = 'demo'; label = 'Demo data'; }
  else if (state.syncing) { st = 'syncing'; label = state.progress || 'Syncing'; }
  else if (state.signIn) { st = 'signin'; label = 'Sign in again'; }
  else if (state.error) { st = 'error'; label = 'Sync failed · retry'; }
  else label = state.data?.syncedAt ? `Synced ${fmtClock(state.data.syncedAt)}` : 'Not synced';
  el.dataset.state = st; text.textContent = label;
  el.title = state.error || (st === 'signin' ? 'Google needs you to sign in again before new data can load' : st === 'demo' ? 'These numbers are made up. Connect your account to see your own.' : 'Sync now');

  const src = $('#foot-source'), dev = state.data?.device;
  src.textContent = state.source === 'demo' ? 'Showing demo data, generated in this browser. None of it is real.'
    : `Read from Google Health${state.data?.syncedAt ? `, last synced ${new Date(state.data.syncedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}${dev?.name ? `. ${dev.name}${isNum(dev.battery) ? `, battery ${dev.battery}%` : ''}` : ''}.`;
  $('#foot-privacy').textContent = state.source === 'demo' ? 'Nothing is read from Google or sent anywhere on this page.' : 'Health data is read from Google Health and kept in this browser only.';
  renderPanel();
}

async function sync() {
  if (state.syncing || state.source !== 'google') return;
  state.syncing = true; state.error = null; state.progress = 'Syncing'; renderStatus();
  try {
    const data = await syncGoogle({
      getToken: (o) => auth.token(o), known: state.data,
      onProgress: (done, total) => { state.progress = total ? `Syncing ${done}/${total}` : 'Syncing'; $('#status-text').textContent = state.progress; },
    });
    const firstData = !state.data;
    state.data = data; state.signIn = false;
    store.saveCache(data);
    compute();
    if (firstData) state.date = state.ctx.days[state.ctx.days.length - 1].date;
    show('dash');
    renderAll({ animate: true });
    announce(state.game, 'google');
  } catch (e) {
    if (e.signIn || e.status === 401) state.signIn = true; else state.error = e.message || 'Sync failed';
    if (!state.data) { show('welcome'); welcomeError(e.signIn ? '' : state.error); }
  } finally { state.syncing = false; renderStatus(); }
}

function enter() {
  $('#dash').classList.add('enter');
  setTimeout(() => $('#dash').classList.remove('enter'), 2200);
}

function startGoogle() {
  state.source = 'google'; store.demo = false;
  const cache = store.cache();
  state.data = cache && !cache.demo ? cache : null;
  if (state.data) { compute(); show('dash'); enter(); renderAll({ delay: 350 }); }
  sync();
}

function startDemo(seed) {
  state.source = 'demo'; store.demo = true;
  state.data = makeDemo(seed ? { seed } : {}); state.date = null; state.signIn = false; state.error = null;
  compute(); show('dash'); enter(); renderAll({ delay: 350 });
  window.scrollTo(0, 0);
  announce(state.game, 'demo');
}

function welcomeError(msg) { const el = $('#welcome-error'); el.textContent = msg || ''; el.hidden = !msg; }

async function connect(btn) {
  welcomeError('');
  if (auth.needsSetup) { $('#setup').hidden = false; $('#client-id').focus(); return; }
  if (btn) btn.disabled = true;
  try { await auth.connect(); startGoogle(); }
  catch (e) { if (state.source === 'google' && state.data) { state.error = e.message; renderStatus(); } else welcomeError(e.message); }
  finally { if (btn) btn.disabled = false; }
}

async function disconnect() {
  await auth.disconnect();
  store.clearCache(); store.demo = false;
  state.source = null; state.data = null; state.ctx = null; state.date = null; state.signIn = false; state.error = null;
  closePanel(); showWelcome();
}

let welcomeDial;
function showWelcome() {
  show('welcome');
  $('#setup-origin').textContent = location.origin;
  if (!welcomeDial) welcomeDial = createDial($('#welcome-dial'));
  welcomeDial.set(14.6, { lo: 12.8, hi: 15.2 }, { delay: 500 });
  roll($('#welcome-num'), 14.6, { format: (v) => v.toFixed(1), dur: 1300, delay: 500 });
}

// ───────── panel ─────────
let lastFocus = null;
function renderPanel() {
  if ($('#panel').hidden) return;
  const acct = $('#acct-line'), actions = $('#acct-actions');
  actions.replaceChildren();
  if (state.source === 'demo' && PREVIEW) {
    acct.innerHTML = 'Everything here is <b>generated data</b>: a made-up month for one made-up wearer. None of it is yours or anyone\'s.';
    actions.append(h('button', { class: 'btn primary small', type: 'button', text: 'Generate a different month', onclick: () => { closePanel(); startDemo(1 + Math.floor(Math.random() * 1e6)); } }));
  } else if (state.source === 'demo') {
    acct.innerHTML = 'You are looking at <b>demo data</b>. Nothing is being read from Google.';
    actions.append(h('button', { class: 'btn primary small', type: 'button', text: 'Connect Google account', onclick: (e) => { closePanel(); showWelcome(); connect(e.target); } }),
      h('button', { class: 'btn ghost small', type: 'button', text: 'Leave demo', onclick: () => { store.demo = false; state.source = null; closePanel(); showWelcome(); } }));
  } else {
    acct.innerHTML = state.signIn ? '<b>Sign-in has lapsed.</b> What you see is the last synced copy. Sign in again to load new data.'
      : `<b>Connected to Google Health.</b> ${auth.mode === 'broker' ? 'This site keeps you signed in.' : 'Google asks for a fresh sign-in about once an hour, because this site runs without a server.'}`;
    actions.append(
      state.signIn ? h('button', { class: 'btn primary small', type: 'button', text: 'Sign in again', onclick: (e) => connect(e.target) }) : h('button', { class: 'btn primary small', type: 'button', text: 'Sync now', onclick: () => sync() }),
      h('button', { class: 'btn ghost small', type: 'button', text: 'Disconnect and erase', onclick: disconnect }));
  }
  const dev = state.data?.device;
  $('#device-sec').hidden = !dev;
  if (dev) $('#device-line').innerHTML = `<b>${dev.name}</b>${isNum(dev.battery) ? ` · battery ${dev.battery}%` : dev.batteryStatus ? ` · battery ${dev.batteryStatus.toLowerCase()}` : ''}${dev.lastSync ? ` · last synced to your phone ${new Date(dev.lastSync).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}`;

  $('#set-hrmax').value = state.settings.hrMax || '';
  $('#set-hrmax').placeholder = state.ctx ? `${state.ctx.hrMax.value} (auto)` : 'auto';
  $('#hrmax-source').textContent = state.ctx ? `· now ${state.ctx.hrMax.value} bpm, ${state.ctx.hrMax.source}` : '';
  $('#set-curve').value = state.settings.curve;

  $('#toggles').replaceChildren(...Object.entries(VITAL_DEFS).map(([k, def]) => {
    const input = h('input', { type: 'checkbox', checked: !state.settings.hidden.includes(k) });
    input.addEventListener('change', () => {
      state.settings.hidden = input.checked ? state.settings.hidden.filter((x) => x !== k) : [...state.settings.hidden, k];
      store.saveSettings(state.settings);
      renderVitals(current(), state.ctx, state.settings.hidden, state.data.issues || []);
    });
    return h('label', { class: 'toggle' }, def.name, input, h('span', { class: 'sw' }));
  }));

  const issues = state.data?.issues || [];
  $('#health').replaceChildren(...(state.source === 'demo'
    ? [h('li', { class: 'none' }, h('i'), 'Demo data', h('span', { text: 'not real' }))]
    : issues.length ? issues.map((i) => h('li', { class: i.ok ? (i.count ? '' : 'none') : 'bad' }, h('i'), i.label, h('span', { text: i.ok ? (i.count ? `${i.count.toLocaleString('en-GB')} read` : 'nothing recorded') : `error ${i.status || ''}` }),
      i.ok ? null : h('small', { text: i.status === 403 ? 'Permission was not granted for this. Disconnect, then connect again and tick every box Google shows.' : i.message })))
      : [h('li', { class: 'none' }, h('i'), 'Not synced yet', h('span', { text: '' }))]));
}

function openPanel() {
  lastFocus = document.activeElement;
  $('#panel').hidden = $('#scrim').hidden = false;
  renderPanel();
  requestAnimationFrame(() => { $('#panel').classList.add('on'); $('#scrim').classList.add('on'); $('#close-panel').focus(); });
}
function closePanel() {
  if ($('#panel').hidden) return;
  $('#panel').classList.remove('on'); $('#scrim').classList.remove('on');
  setTimeout(() => { $('#panel').hidden = $('#scrim').hidden = true; }, reduced() ? 0 : 450);
  lastFocus?.focus?.();
}

// ───────── wiring ─────────
$('#btn-connect')?.addEventListener('click', (e) => connect(e.currentTarget));
$('#btn-demo')?.addEventListener('click', () => startDemo());
$('#setup-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = $('#client-id').value.trim();
  if (!/\.apps\.googleusercontent\.com$/.test(id)) { welcomeError('That does not look like an OAuth client ID. It ends in .apps.googleusercontent.com'); return; }
  auth.setClientId(id); connect(e.submitter);
});
$('#day-prev').addEventListener('click', () => step(-1));
$('#day-next').addEventListener('click', () => step(1));
$('#open-panel').addEventListener('click', openPanel);
$('#customise').addEventListener('click', openPanel);
$('#close-panel').addEventListener('click', closePanel);
$('#scrim').addEventListener('click', closePanel);
$('#status').addEventListener('click', (e) => {
  if (state.source === 'demo') openPanel();
  else if (state.signIn) connect(e.currentTarget);
  else sync();
});
$('#set-hrmax').addEventListener('change', (e) => {
  const v = Number(e.target.value);
  state.settings.hrMax = v >= 120 && v <= 230 ? v : null;
  store.saveSettings(state.settings); compute(); renderAll({ animate: true });
});
$('#set-curve').addEventListener('change', (e) => { state.settings.curve = e.target.value; store.saveSettings(state.settings); compute(); renderAll({ animate: true }); });
$$('.seg button').forEach((b) => b.addEventListener('click', () => {
  state.settings.range = Number(b.dataset.range); store.saveSettings(state.settings);
  $$('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  renderTrends(current(), state.ctx, state.settings.range, pick);
}));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closePanel(); return; }
  if ($('#dash').hidden || !$('#panel').hidden || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t.closest('input, select, textarea, .river')) return;
  if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1);
});
$('#panel').addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const f = $$('button, input, select, a[href]', $('#panel')).filter((x) => !x.disabled && x.offsetParent !== null);
  if (!f.length) return;
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
  else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
});

// swipe the opening panel sideways to move a day (touch only)
{
  const pane = $('.today-grid');
  let x0 = 0, y0 = 0, tracking = false;
  pane.addEventListener('touchstart', (e) => { if (e.touches.length !== 1) return; tracking = true; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  pane.addEventListener('touchend', (e) => {
    if (!tracking) return; tracking = false;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.8) step(dx > 0 ? -1 : 1);
  }, { passive: true });
  pane.addEventListener('touchcancel', () => { tracking = false; }, { passive: true });
}
narrow.addEventListener('change', () => { if (state.ctx && !$('#dash').hidden) renderAll({ animate: false }); });

// section in view → nav highlight
const links = Object.fromEntries($$('.nav a').map((a) => [a.getAttribute('href').slice(1), a]));
const spy = new IntersectionObserver((entries) => {
  for (const en of entries) if (en.isIntersecting) { Object.values(links).forEach((a) => a.classList.remove('on')); links[en.target.id]?.classList.add('on'); }
}, { rootMargin: '-45% 0px -50% 0px' });
$$('#dash > section').forEach((s) => spy.observe(s));

let lastW = window.innerWidth, rz = 0;
window.addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => { if (window.innerWidth !== lastW && state.ctx && !$('#dash').hidden) { lastW = window.innerWidth; renderAll({ animate: false }); } }, 180);
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || state.source !== 'google' || state.signIn) return;
  if (Date.now() - (state.data?.syncedAt || 0) > 10 * 60000) sync();
});

// ───────── boot ─────────
(async function boot() {
  $$('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(Number(x.dataset.range) === state.settings.range)));
  if (PREVIEW) { startDemo(); document.body.classList.remove('booting'); document.body.classList.add('ready'); setTimeout(() => document.body.classList.add('settled'), 1200); return; }
  await auth.init();
  const q = new URLSearchParams(location.search);
  const authError = q.get('auth_error');
  if (q.has('auth_error') || q.has('connected')) history.replaceState(null, '', location.pathname + location.hash);

  if (auth.linked && !authError) startGoogle();
  else if (store.demo && !authError) startDemo();
  else {
    showWelcome();
    if (authError) welcomeError(authError === 'access_denied' ? 'Google sign-in was cancelled. Nothing was connected.' : authError === 'not_configured' ? 'This deployment is missing its Google credentials. See the README.' : `Google sign-in did not finish (${authError}). Try again.`);
  }
  document.body.classList.remove('booting');
  document.body.classList.add('ready');
  try { sessionStorage.setItem('oranje.seen', '1'); } catch { /* fine */ }
  setTimeout(() => document.body.classList.add('settled'), 1200);
})();
