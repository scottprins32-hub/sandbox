// Oranje: boot, state, and the top of the page.

import { computeAll } from './core/scores.js?v=16';
import { playGame } from './core/game.js?v=16';
import { applyOfficial, whoopByDate, withWhoopVitals } from './core/sources.js?v=16';
import { setCurve } from './core/strain.js?v=16';
import { fmtClock, fmtDur, fromKey, isNum, todayKey } from './core/util.js?v=16';
import { auth } from './data/auth.js?v=16';
import { makeDemo } from './data/demo.js?v=16';
import { syncGoogle } from './data/health.js?v=16';
import { store } from './data/store.js?v=16';
import { forgetWhoopOwner, loadWhoop } from './data/whoop.js?v=16';
import { demoMembers, ledger, team as teamApi, withMine } from './data/team.js?v=16';
import { createDial, createMeter } from './ui/dial.js?v=16';
import { announce, renderChip, renderGame } from './ui/game.js?v=16';
import { $, $$, h, reduced, roll, watchReveals } from './ui/motion.js?v=16';
import { createRiver } from './ui/river.js?v=16';
import { initHelp } from './ui/help.js?v=16';
import { applyPage, date, dateTime, getLang, num, onLang, setLang, strings } from './i18n.js?v=16';
import { pageText } from './i18n-page.js?v=16';
import { bandName, recoveryName, sleepName, term } from './terms.js?v=16';
import { createRing } from './ui/ring.js?v=16';
import { VITAL_DEFS, aimParts, renderRecovery, renderSleep, renderStrain, renderTrends, renderVitals } from './ui/sections.js?v=16';

const state = { source: null, data: null, ctx: null, date: null, settings: store.settings(), syncing: false, progress: '', signIn: false, error: null, whoop: null, team: null };
// Who the Google data belongs to: their email when this site signs people in, else Google's user id.
const person = () => (state.source === 'google' ? auth.who.email || state.data?.userId || '' : '');
const saveSettings = () => store.saveSettings(state.settings, person());
const dial = createDial($('#dial'));
const recMeter = createMeter($('#recovery-ticks'));
const sleepMeter = createMeter($('#sleep-ticks'));
const river = createRiver($('#river'));
const rings = {
  strain: createRing($('#ring-strain .ring-face'), { max: 21 }),
  recovery: createRing($('#ring-recovery .ring-face')),
  sleep: createRing($('#ring-sleep .ring-face')),
};
const WD = { en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], nl: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'] };
const plural = (n, one, many) => (n === 1 ? one : many);
const tx = strings({
  en: {
    title: 'Oranje · strain, recovery and sleep for Fitbit Air',
    description: 'A personal dashboard for Fitbit Air: day strain, recovery, sleep and vitals, worked out in your browser from your own heart rate.',
    noData: 'No data for this day.', bandOn: 'Was the band on?',
    strainSoFar: 'so far. Recovery is still learning your normal.', firstSync: 'Waiting for the first sync.',
    leadHi: 'Recovered and ready.', leadMid: 'Steady today.', leadLo: 'Run down today.',
    pastTarget: 'Past target.', easeOff: 'Time to ease off.', onTarget: 'Target reached', atValue: 'at {v}.',
    toGo: '{v} to go', toTarget: 'to today’s target.', noHr: 'No heart rate recorded.',
    kindLight: 'A light day', kindModerate: 'A moderate day', kindHigh: 'A hard day', kindAll: 'An all-out day',
    wellJudged: 'Target reached.', roomToSpare: 'Below target.', kindOn: '{kind} on', recPct: '{r}% recovery.',
    today: 'Today', jumpToday: 'Jump to today', none: 'none',
    ribbonDay: '{date}: strain {s}, recovery {r}',
    learning: 'Learning · {n}/3 nights', learningShort: 'Learning {n}/3', noReading: 'No reading',
    noHeartRate: 'No heart rate', notSyncedYet: 'Not synced yet', notRecorded: 'Not recorded', notSynced: 'Not synced',
    hrv: 'HRV', restingHr: 'Resting HR', asleep: 'Asleep', needed: 'Needed',
    dialLabel: 'Day strain {s} of 21, {band}', noStrain: 'No strain for this day', target: 'Target {lo}+',
    openView: '{aria}. Open the {view} view',
    ariaStrain: 'Strain {s} of 21, {band}', ariaRecovery: 'Recovery {r}%, {band}', noRecovery: 'No recovery for this day',
    ariaSleep: 'Sleep {s}%', ariaAsleep: ', {d} asleep', noSleep: 'No sleep recorded', fromSource: ' (from {source})',
    noteStrain: 'Day strain from <b>WHOOP</b>. ', noteStrainEst: "Oranje's own estimate from your Fitbit heart rate: {v}. The zones and sessions below are from the Fitbit.",
    noteStrainNone: 'The Fitbit has no heart rate for this day yet, so Oranje has no estimate of its own.',
    noteRecovery: 'Recovery from <b>WHOOP</b>. ', noteRecoveryEst: "Oranje's own estimate: {v}%. The breakdown below is Oranje's reading of your band's numbers.",
    noteRecoveryNone: 'Oranje has no estimate of its own for this morning.',
    noteSleep: 'Sleep score from <b>WHOOP</b>. ', noteSleepEst: "Oranje's own estimate: {v}%. Stages below are from the Fitbit.",
    noteSleepNone: 'The Fitbit recorded no night, so Oranje has no estimate of its own.',
    goalNone: 'A strain target appears once recovery is known: a few nights of wear and it shows up here.',
    goalAim: 'Aim for at least <b>{lo}</b> on {r}% recovery. ',
    stDemo: 'Demo data', stSyncing: 'Syncing', stSyncingN: 'Syncing {done}/{total}', stSignIn: 'Sign in again', stError: 'Sync failed · retry',
    stSynced: 'Synced {t}', stNotSynced: 'Not synced',
    tipSignIn: 'Google needs you to sign in again before new data can load', tipDemo: 'These numbers are made up. Connect your account to see your own.', tipSync: 'Sync now',
    srcDemo: 'Showing demo data, generated in this browser. None of it is real.', srcGoogle: 'Read from Google Health', srcSynced: ', last synced {t}', srcBattery: ', battery {b}%',
    privDemo: 'Nothing is read from Google or sent anywhere on this page.', privGoogle: 'Health data is read from Google Health and kept in this browser only.',
    syncFailed: 'Sync failed',
    acctPreview: "Everything here is <b>generated data</b>: a made-up month for one made-up wearer. None of it is yours or anyone's.",
    newMonth: 'Generate a different month',
    acctDemo: 'You are looking at <b>demo data</b>. Nothing is being read from Google.', connect: 'Connect Google account', leaveDemo: 'Leave demo',
    signedInAs: 'Signed in as {who}', lapsed: 'Sign-in has lapsed. ', lapsedText: 'What you see is the last synced copy. Sign in again to load new data.',
    broker: 'Connected to Google Health; this site keeps you signed in. Everyone who uses this link signs in with their own account and sees only their own data.',
    popup: 'Connected to Google Health. Google asks for a fresh sign-in about once an hour, because this site runs without a server.',
    signInAgain: 'Sign in again', syncNow: 'Sync now', notYou: 'Not {name}? Disconnect', disconnect: 'Disconnect and erase', whoopScores: 'WHOOP scores',
    battery: ' · battery {b}%', batteryStatus: ' · battery {s}', lastSync: ' · last synced to your phone {t}',
    hrNow: '· now {v} bpm, {src}', hrSet: 'set by you', hrSeen: 'highest seen', hrAge: 'estimated from age {age}', hrEst: 'estimated', auto: 'auto', autoV: '{v} (auto)',
    demoData: 'Demo data', notReal: 'not real', notSyncedYetH: 'Not synced yet',
    read: '{n} read', fromBand: ' · band', fromOther: ' · other apps', nothing: 'nothing recorded', error: 'error {s}',
    denied: 'Permission was not granted for this. Disconnect, then connect again and tick every box Google shows.',
    wChecking: 'checking', wOther: 'connected for someone else here', wFailed: 'could not load', wNot: 'not connected',
    wDays: (v) => `${v.n} ${plural(v.n, 'day', 'days')} · leads strain, recovery, sleep`,
    wOtherNote: 'WHOOP scores are only added to the days of the person who first used them on this device. Disconnect WHOOP on the WHOOP page to link it to you.',
    badClient: 'That does not look like an OAuth client ID. It ends in .apps.googleusercontent.com',
    toNavy: 'Switch to the navy look', toCream: 'Switch to the cream look',
    authDenied: 'Google sign-in was cancelled. Nothing was connected.', authUnconfigured: 'This deployment is missing its Google credentials. See the README.',
    authOther: 'Google sign-in did not finish ({e}). Try again.',
    notLinked: 'This Google account is not linked to Google Health yet. Open the Google Health (Fitbit) app on your phone, sign in with this account, then try again.',
    gisFailed: 'Could not load Google sign-in. Check your connection or content blocker.', refreshFailed: 'Could not refresh sign-in. Try again in a moment.',
    needClient: 'Add an OAuth client ID first.',
    'heart-rate': 'Heart rate, minute by minute', steps: 'Steps', distance: 'Distance', 'total-calories': 'Calories', 'active-zone-minutes': 'Zone minutes',
    'daily-resting-heart-rate': 'Resting heart rate', 'daily-heart-rate-variability': 'Heart-rate variability', 'daily-oxygen-saturation': 'Blood oxygen',
    'daily-respiratory-rate': 'Breathing rate', 'daily-sleep-temperature-derivations': 'Skin temperature', 'daily-vo2-max': 'Cardio fitness',
    sleep: 'Sleep', exercise: 'Exercise sessions', profile: 'Profile', devices: 'Band status', whoopLine: 'WHOOP scores',
    switchTo: 'Nederlands', switchShort: 'NL', you: 'You',
  },
  nl: {
    title: 'Oranje · strain, herstel en slaap voor Fitbit Air',
    description: 'Een persoonlijk dashboard voor Fitbit Air: strain, herstel, slaap en lichaamswaarden per dag, in je browser berekend uit je eigen hartslag.',
    noData: 'Geen gegevens voor deze dag.', bandOn: 'Droeg je de band?',
    strainSoFar: 'tot nu toe. Je herstel leert nog wat normaal is voor jou.', firstSync: 'Wachten op de eerste synchronisatie.',
    leadHi: 'Hersteld en klaar.', leadMid: 'Stabiel vandaag.', leadLo: 'Uitgeput vandaag.',
    pastTarget: 'Voorbij je doel.', easeOff: 'Tijd om gas terug te nemen.', onTarget: 'Doel gehaald', atValue: 'op {v}.',
    toGo: 'Nog {v}', toTarget: 'tot je doel van vandaag.', noHr: 'Geen hartslag gemeten.',
    kindLight: 'Een lichte dag', kindModerate: 'Een gemiddelde dag', kindHigh: 'Een zware dag', kindAll: 'Een dag alles gegeven',
    wellJudged: 'Doel gehaald.', roomToSpare: 'Onder je doel.', kindOn: '{kind} bij', recPct: '{r}% herstel.',
    today: 'Vandaag', jumpToday: 'Naar vandaag', none: 'geen',
    ribbonDay: '{date}: strain {s}, herstel {r}',
    learning: 'Aan het leren · {n}/3 nachten', learningShort: 'Leren {n}/3', noReading: 'Geen meting',
    noHeartRate: 'Geen hartslag', notSyncedYet: 'Nog niet gesynchroniseerd', notRecorded: 'Niet gemeten', notSynced: 'Nog niet binnen',
    hrv: 'HRV', restingHr: 'Rusthartslag', asleep: 'Geslapen', needed: 'Nodig',
    dialLabel: 'Dagstrain {s} van 21, {band}', noStrain: 'Geen strain voor deze dag', target: 'Doel {lo}+',
    openView: '{aria}. Open {view}',
    ariaStrain: 'Strain {s} van 21, {band}', ariaRecovery: 'Herstel {r}%, {band}', noRecovery: 'Geen herstel voor deze dag',
    ariaSleep: 'Slaap {s}%', ariaAsleep: ', {d} geslapen', noSleep: 'Geen slaap gemeten', fromSource: ' (van {source})',
    noteStrain: 'Dagstrain van <b>WHOOP</b>. ', noteStrainEst: 'De eigen schatting van Oranje uit je Fitbit-hartslag: {v}. De zones en trainingen hieronder komen van de Fitbit.',
    noteStrainNone: 'De Fitbit heeft voor deze dag nog geen hartslag, dus Oranje heeft geen eigen schatting.',
    noteRecovery: 'Herstel van <b>WHOOP</b>. ', noteRecoveryEst: 'De eigen schatting van Oranje: {v}%. De uitsplitsing hieronder is hoe Oranje de waarden van je band leest.',
    noteRecoveryNone: 'Oranje heeft voor vanochtend geen eigen schatting.',
    noteSleep: 'Slaapscore van <b>WHOOP</b>. ', noteSleepEst: 'De eigen schatting van Oranje: {v}%. De fases hieronder komen van de Fitbit.',
    noteSleepNone: 'De Fitbit heeft geen nacht gemeten, dus Oranje heeft geen eigen schatting.',
    goalNone: 'Een strain-doel verschijnt zodra je herstel bekend is: na een paar nachten dragen staat het hier.',
    goalAim: 'Mik op minstens <b>{lo}</b> bij {r}% herstel. ',
    stDemo: 'Demogegevens', stSyncing: 'Synchroniseren', stSyncingN: 'Synchroniseren {done}/{total}', stSignIn: 'Log opnieuw in', stError: 'Synchroniseren mislukt · opnieuw',
    stSynced: 'Bijgewerkt {t}', stNotSynced: 'Nog niet bijgewerkt',
    tipSignIn: 'Google wil dat je opnieuw inlogt voordat er nieuwe gegevens kunnen komen', tipDemo: 'Deze getallen zijn verzonnen. Koppel je account om je eigen te zien.', tipSync: 'Nu bijwerken',
    srcDemo: 'Je ziet demogegevens, gemaakt in deze browser. Niets ervan is echt.', srcGoogle: 'Gelezen uit Google Health', srcSynced: ', laatst bijgewerkt {t}', srcBattery: ', batterij {b}%',
    privDemo: 'Op deze pagina wordt niets uit Google gelezen of ergens naartoe gestuurd.', privGoogle: 'Gezondheidsgegevens worden uit Google Health gelezen en alleen in deze browser bewaard.',
    syncFailed: 'Synchroniseren mislukt',
    acctPreview: 'Alles hier is <b>verzonnen</b>: een bedachte maand voor een bedachte drager. Niets ervan is van jou of van iemand anders.',
    newMonth: 'Maak een andere maand',
    acctDemo: 'Je bekijkt <b>demogegevens</b>. Er wordt niets uit Google gelezen.', connect: 'Google-account koppelen', leaveDemo: 'Demo verlaten',
    signedInAs: 'Ingelogd als {who}', lapsed: 'Je inlog is verlopen. ', lapsedText: 'Je ziet de laatst bijgewerkte versie. Log opnieuw in om nieuwe gegevens te laden.',
    broker: 'Gekoppeld aan Google Health; deze site houdt je ingelogd. Iedereen die deze link gebruikt, logt in met een eigen account en ziet alleen zijn eigen gegevens.',
    popup: 'Gekoppeld aan Google Health. Google vraagt ongeveer elk uur om opnieuw in te loggen, omdat deze site zonder server werkt.',
    signInAgain: 'Opnieuw inloggen', syncNow: 'Nu bijwerken', notYou: 'Niet {name}? Ontkoppelen', disconnect: 'Ontkoppelen en wissen', whoopScores: 'WHOOP-scores',
    battery: ' · batterij {b}%', batteryStatus: ' · batterij {s}', lastSync: ' · laatst gesynchroniseerd met je telefoon {t}',
    hrNow: '· nu {v} bpm, {src}', hrSet: 'door jou ingesteld', hrSeen: 'hoogste gemeten', hrAge: 'geschat op leeftijd {age}', hrEst: 'geschat', auto: 'auto', autoV: '{v} (auto)',
    demoData: 'Demogegevens', notReal: 'niet echt', notSyncedYetH: 'Nog niet gesynchroniseerd',
    read: '{n} gelezen', fromBand: ' · band', fromOther: ' · andere apps', nothing: 'niets gemeten', error: 'fout {s}',
    denied: 'Hiervoor is geen toestemming gegeven. Ontkoppel, koppel opnieuw en vink elk vakje aan dat Google laat zien.',
    wChecking: 'controleren', wOther: 'hier gekoppeld voor iemand anders', wFailed: 'kon niet laden', wNot: 'niet gekoppeld',
    wDays: (v) => `${v.n} ${plural(v.n, 'dag', 'dagen')} · bepaalt strain, herstel, slaap`,
    wOtherNote: 'WHOOP-scores worden alleen toegevoegd aan de dagen van wie ze als eerste op dit apparaat gebruikte. Ontkoppel WHOOP op de WHOOP-pagina om het aan jou te koppelen.',
    badClient: 'Dat lijkt geen OAuth client ID. Die eindigt op .apps.googleusercontent.com',
    toNavy: 'Naar het navy uiterlijk', toCream: 'Naar het crème uiterlijk',
    authDenied: 'Inloggen bij Google is geannuleerd. Er is niets gekoppeld.', authUnconfigured: 'Deze versie mist zijn Google-gegevens. Zie de README.',
    authOther: 'Inloggen bij Google is niet gelukt ({e}). Probeer het opnieuw.',
    notLinked: 'Dit Google-account is nog niet gekoppeld aan Google Health. Open de Google Health (Fitbit)-app op je telefoon, log in met dit account en probeer het opnieuw.',
    gisFailed: 'Inloggen bij Google kon niet laden. Controleer je verbinding of adblocker.', refreshFailed: 'Inlog vernieuwen lukte niet. Probeer het zo opnieuw.',
    needClient: 'Vul eerst een OAuth client ID in.',
    'heart-rate': 'Hartslag, per minuut', steps: 'Stappen', distance: 'Afstand', 'total-calories': 'Calorieën', 'active-zone-minutes': 'Zoneminuten',
    'daily-resting-heart-rate': 'Rusthartslag', 'daily-heart-rate-variability': 'Hartslagvariabiliteit', 'daily-oxygen-saturation': 'Zuurstof in je bloed',
    'daily-respiratory-rate': 'Ademhaling', 'daily-sleep-temperature-derivations': 'Huidtemperatuur', 'daily-vo2-max': 'Conditie (VO₂ max)',
    sleep: 'Slaap', exercise: 'Trainingen', profile: 'Profiel', devices: 'Status van de band', whoopLine: 'WHOOP-scores',
    switchTo: 'English', switchShort: 'EN', you: 'Jij',
  },
});
// Known English messages from the data and sign-in modules, shown in the reader's language.
const ERR = {
  'This Google account is not linked to Google Health yet. Open the Google Health (Fitbit) app on your phone, sign in with this account, then try again.': 'notLinked',
  'Could not load Google sign-in. Check your connection or content blocker.': 'gisFailed',
  'Could not refresh sign-in. Try again in a moment.': 'refreshFailed',
  'Add an OAuth client ID first.': 'needClient',
  'Sync failed': 'syncFailed',
};
const errText = (msg) => (ERR[msg] ? tx(ERR[msg]) : msg);
// Preview builds (config.js: preview: true) run on demo data only and never offer sign-in.
const PREVIEW = !!window.ORANJE_CONFIG?.preview;

// ───────── views ─────────
function show(view) {
  const welcome = $('#welcome');
  if (welcome) welcome.hidden = view !== 'welcome';
  $('#dash').hidden = view !== 'dash';
  $('#status').hidden = $('#open-panel').hidden = $('#daynav').hidden = $('#tabs').hidden = view !== 'dash';
  document.body.classList.toggle('welcoming', view === 'welcome');
  if (view === 'dash') showView(routeOf(), { quiet: true });
}

// ───────── tabs: today, strain, recovery, sleep, climb ─────────
const VIEWS = ['today', 'strain', 'recovery', 'sleep', 'team'];
const ALIAS = { vitals: 'today', trends: 'today', climb: 'team' };
const routeOf = () => { const k = location.hash.slice(1); return VIEWS.includes(k) ? k : ALIAS[k] || 'today'; };
let shown = null;
function showView(name, { quiet = false } = {}) {
  const changed = name !== shown;
  const focusWasInView = shown && $(`#view-${shown}`).contains(document.activeElement);
  shown = name;
  for (const v of VIEWS) $(`#view-${v}`).hidden = v !== name;
  $$('#tabs a').forEach((a) => { if (a.dataset.view === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (!changed || quiet) return;
  const el = $(`#view-${name}`);
  el.classList.remove('swap');
  if (!reduced()) requestAnimationFrame(() => { if (shown === name) el.classList.add('swap'); });
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (focusWasInView) {
    const heading = $('h1, h2', el);
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  }
  if (state.ctx) renderAll({ animate: false });
  if (ALIAS[location.hash.slice(1)]) requestAnimationFrame(() => $(location.hash)?.scrollIntoView({ block: 'start' }));
}
window.addEventListener('hashchange', () => { if (!$('#dash').hidden) showView(routeOf()); });

function compute() {
  setCurve(state.settings.curve);
  const whoop = state.source === 'google' && state.whoop?.days?.length ? whoopByDate(state.whoop.days) : null;
  state.ctx = computeAll(withWhoopVitals(state.data.days, whoop), state.data.profile, state.settings);
  applyOfficial(state.ctx.days, whoop);
  const scope = state.source === 'google' ? `google:${person()}` : 'demo';
  state.game = playGame(state.ctx.days, ledger.read(scope));
  if (state.source === 'google') ledger.write(scope, state.game.ledger);
  if (state.source === 'demo') state.team = { mode: 'demo', members: demoMembers(state.ctx.days, state.game, 'Demo') };
  else if (state.team?.mode === 'joined' && state.team.server) state.team.members = withMine(state.team.server, state.ctx.days, state.game);
  const last = state.ctx.days[state.ctx.days.length - 1]?.date;
  if (!state.date || !state.ctx.byDate[state.date]) state.date = last;
}
const current = () => state.ctx.byDate[state.date];
const dateOf = (d, opts) => date(d, opts);
const dateLabel = (d) => date(d, { weekday: 'long', day: 'numeric', month: 'long' });

// ───────── hero ─────────
function verdictParts(d) {
  const s = d.strain, r = d.recovery, t = d.target;
  if (!isNum(s) && !isNum(r)) return [[tx('noData')], [tx('bandOn'), 1]];
  if (d.partial) {
    if (!isNum(r)) return isNum(s) ? [['Strain'], [num(s, 1), 1], [tx('strainSoFar')]] : [[tx('firstSync')]];
    const lead = tx(r >= 67 ? 'leadHi' : r >= 34 ? 'leadMid' : 'leadLo');
    if (!isNum(s)) return [[lead]];
    if (s >= t.lo) return [[lead], [tx('onTarget'), 1], [tx('atValue', { v: num(s, 1) })]];
    return [[lead], [tx('toGo', { v: num(t.lo - s, 1) }), 1], [tx('toTarget')]];
  }
  if (!isNum(s)) return [[tx('noHr')]];
  const kind = tx({ Light: 'kindLight', Moderate: 'kindModerate', High: 'kindHigh', 'All out': 'kindAll' }[d.band.name]);
  if (!isNum(r)) return [[`${kind}.`]];
  const judge = tx(s >= t.lo ? 'wellJudged' : 'roomToSpare');
  return [[tx('kindOn', { kind })], [tx('recPct', { r }), 1], [judge]];
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
const narrow = window.matchMedia('(max-width: 720px)');
function renderRibbon() {
  const days = state.ctx.days;
  let end = days.length - 1;
  const sel = days.findIndex((d) => d.date === state.date);
  const span = narrow.matches ? 7 : 14;
  if (sel < end - (span - 1)) end = Math.min(days.length - 1, sel + Math.floor(span / 2));
  const win = days.slice(Math.max(0, end - (span - 1)), end + 1);
  const el = $('#ribbon'), key = getLang() + span + win.map((d) => d.date).join();
  if (key !== ribbonKey) {
    ribbonKey = key;
    el.replaceChildren(...win.map((d) => {
      const date = fromKey(d.date);
      const btn = h('button', { class: 'day', type: 'button', 'data-date': d.date, onclick: () => pick(d.date) },
        h('span', { class: 'col' }, h('i')), h('span', { class: 'dot' }), h('span', { class: 'wd', text: WD[getLang()][date.getDay()] }));
      return btn;
    }));
    for (let i = win.length; i < span; i++) el.prepend(h('span'));   // a short history sits at the right
  }
  for (const d of win) {
    const btn = $(`[data-date="${d.date}"]`, el), date = fromKey(d.date);
    btn.setAttribute('aria-pressed', String(d.date === state.date));
    btn.setAttribute('aria-label', tx('ribbonDay', { date: dateLabel(date), s: isNum(d.strain) ? num(d.strain, 1) : tx('none'), r: isNum(d.recovery) ? `${d.recovery}%` : tx('none') }));
    $('.dot', btn).className = `dot ${!isNum(d.recovery) ? '' : d.recovery >= 67 ? 'hi' : d.recovery >= 34 ? 'mid' : 'lo'}`;
    requestAnimationFrame(() => { $('.col i', btn).style.height = `${((d.strain || 0) / 21) * 100}%`; });
  }
}

function renderHero(animate, delay = 0) {
  const d = current(), days = state.ctx.days;
  const date = fromKey(d.date), isToday = d.date === todayKey();
  const dm = dateOf(date, { day: 'numeric', month: narrow.matches ? 'short' : 'long' });
  $('#dayline').replaceChildren(h('b', { text: isToday ? tx('today') : dateOf(date, { weekday: 'long' }) }),
    h('span', { class: isToday ? 'is-today' : '', text: isToday ? `${dateOf(date, { weekday: 'short' })} ${dm}` : dm }));
  $('#dayline').title = isToday ? '' : tx('jumpToday');
  $('#day-prev').disabled = d.date === days[0].date;
  $('#day-next').disabled = d.date === days[days.length - 1].date;
  renderRibbon();

  dial.set(d.strain, d.target, { animate, delay });
  roll($('#strain-num'), d.strain, { format: (v) => num(v, 1), dur: animate ? 1300 : 0, delay });
  $('#strain-band').textContent = d.band ? bandName(d.band) : tx('noHeartRate');
  $('#strain-target').textContent = d.target ? tx('target', { lo: num(d.target.lo, 1) }) : '';
  $('#dial').setAttribute('aria-label', isNum(d.strain) ? tx('dialLabel', { s: num(d.strain, 1), band: bandName(d.band) }) : tx('noStrain'));
  setVerdict(d);

  const rec = d.recovery, m = $('#m-recovery');
  m.dataset.band = !isNum(rec) ? '' : rec >= 67 ? 'hi' : rec >= 34 ? 'mid' : 'lo';
  roll($('#recovery-num'), rec, { dur: animate ? 1100 : 0, delay: delay + 120 });
  $('#recovery-num').parentElement.classList.toggle('nil', !isNum(rec));
  recMeter.set(rec, { animate, delay: delay + 120 });
  const nights = days.filter((x) => x.date < d.date && (isNum(x.hrv) || isNum(x.rhr))).length;
  $('#recovery-band').textContent = isNum(rec) ? recoveryName(rec) : nights < 3 ? tx('learning', { n: nights }) : tx('noReading');
  $('#recovery-facts').replaceChildren(h('dt', { text: tx('hrv'), 'data-help': 'vital-hrv' }), trend(d.hrv, d.baseline.hrv, true, 'ms'), h('dt', { text: tx('restingHr'), 'data-help': 'vital-rhr' }), trend(d.rhr, d.baseline.rhr, false, 'bpm'));

  const sl = d.sleepInfo, sp = d.sleepPct, asleep = sl?.asleep ?? d.whoop?.sleepMinutes;
  roll($('#sleep-num'), sp, { dur: animate ? 1100 : 0, delay: delay + 220 });
  $('#sleep-num').parentElement.classList.toggle('nil', !isNum(sp));
  sleepMeter.set(sp, { animate, delay: delay + 220 });
  $('#sleep-band').textContent = !isNum(sp) ? tx(d.partial ? 'notSyncedYet' : 'notRecorded') : sleepName(sp);
  $('#sleep-facts').replaceChildren(h('dt', { text: tx('asleep'), 'data-help': 'asleep' }), h('dd', { text: isNum(asleep) ? fmtDur(asleep) : '–' }), h('dt', { text: tx('needed'), 'data-help': 'need' }), h('dd', { text: sl ? fmtDur(sl.need) : '–' }));

  river.set(d, { animate });
  renderChip(state.game, state.team);
  renderTrio(d, rec, sl, nights, animate, delay);
  renderGoal(d);
}

// the three scores of the day, each a ring that opens its own tab
function renderTrio(d, rec, sl, nights, animate, delay) {
  const set = (kind, value, text, band, aria, i) => {
    const el = $(`#ring-${kind}`), numEl = $('.ring-num', el);
    el.dataset.band = band || '';
    $('.ring-read', el).classList.toggle('nil', !isNum(value));
    roll(numEl, value, { format: kind === 'strain' ? (v) => num(v, 1) : (v) => num(Math.round(v)), dur: animate ? 1200 : 0, delay: delay + i * 90, key: `ring-${kind}` });
    rings[kind].set(value, { animate, delay: delay + i * 90 });
    $('.ring-band', el).textContent = text;
    el.setAttribute('aria-label', tx('openView', { aria, view: term(kind) }));
  };
  const recBand = !isNum(rec) ? '' : rec >= 67 ? 'hi' : rec >= 34 ? 'mid' : 'lo';
  set('strain', d.strain, d.band ? bandName(d.band) : tx('noHeartRate'), '', isNum(d.strain) ? tx('ariaStrain', { s: num(d.strain, 1), band: bandName(d.band) }) : tx('noStrain'), 0);
  set('recovery', rec, isNum(rec) ? recoveryName(rec) : nights < 3 ? tx('learningShort', { n: nights }) : tx('noReading'), recBand, isNum(rec) ? tx('ariaRecovery', { r: rec, band: recoveryName(rec) }) : tx('noRecovery'), 1);
  const sp = d.sleepPct, asleep = sl?.asleep ?? d.whoop?.sleepMinutes;
  set('sleep', sp, !isNum(sp) ? tx(d.partial ? 'notSynced' : 'notRecorded') : sleepName(sp),
    '', isNum(sp) ? `${tx('ariaSleep', { s: sp })}${isNum(asleep) ? tx('ariaAsleep', { d: fmtDur(asleep) }) : ''}` : tx('noSleep'), 2);
  renderSources(d);
}

// Where each score came from: WHOOP's own number leads; Oranje's estimate fills in.
function renderSources(d) {
  const src = d.src || {};
  for (const kind of ['strain', 'recovery', 'sleep']) {
    const el = $(`#ring-${kind}`);
    let tag = $('.ring-src', el);
    if (!tag) { tag = h('span', { class: 'ring-src' }); el.append(tag); }
    tag.textContent = src[kind] ? term(src[kind]) : '';
    tag.dataset.src = src[kind] || '';
    el.setAttribute('aria-label', `${el.getAttribute('aria-label')}${src[kind] ? tx('fromSource', { source: term(src[kind]) }) : ''}`);
  }
  const notes = {
    strain: src.strain === 'whoop' ? tx('noteStrain') + (isNum(d.est?.strain) ? tx('noteStrainEst', { v: num(d.est.strain, 1) }) : tx('noteStrainNone')) : '',
    recovery: src.recovery === 'whoop' ? tx('noteRecovery') + (isNum(d.est?.recovery) ? tx('noteRecoveryEst', { v: d.est.recovery }) : tx('noteRecoveryNone')) : '',
    sleep: src.sleep === 'whoop' ? tx('noteSleep') + (isNum(d.est?.sleep) ? tx('noteSleepEst', { v: d.est.sleep }) : tx('noteSleepNone')) : '',
  };
  for (const [kind, html] of Object.entries(notes)) {
    const head = $(`#view-${kind} .view-head`);
    if (!head) continue;
    let p = $('.src-note', head);
    if (!p) { p = h('p', { class: 'src-note' }); head.append(p); }
    p.innerHTML = html;
    p.hidden = !html;
  }
}

function renderGoal(d) {
  const scale = $('#goal-scale'), text = $('#goal-text');
  if (!d.target) {
    scale.replaceChildren();
    text.textContent = tx('goalNone');
    return;
  }
  const parts = aimParts(d);
  scale.replaceChildren(parts.scale);
  text.innerHTML = tx('goalAim', { lo: num(d.target.lo, d.target.lo % 1 ? 1 : 0), r: d.recovery }) + parts.line;
}

function renderAll({ animate = true, delay = 0 } = {}) {
  if (!state.ctx?.days.length) return;
  const d = current();
  renderHero(animate, delay);
  renderGame(d, state.game, state.team, { pick, join: joinTeam, leave: leaveTeam });
  renderChip(state.game, state.team);
  renderStrain(d);
  renderRecovery(d, state.ctx);
  renderSleep(d, state.ctx);
  renderVitals(d, state.ctx, state.settings.hidden, state.data.issues || []);
  renderTrends(d, state.ctx, state.settings.range, pick);
  renderStatus();
  watchReveals();
  initHelp();
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
  if (state.source === 'demo') { st = 'demo'; label = tx('stDemo'); }
  else if (state.syncing) { st = 'syncing'; label = state.progress || tx('stSyncing'); }
  else if (state.signIn) { st = 'signin'; label = tx('stSignIn'); }
  else if (state.error) { st = 'error'; label = tx('stError'); }
  else label = state.data?.syncedAt ? tx('stSynced', { t: fmtClock(state.data.syncedAt) }) : tx('stNotSynced');
  el.dataset.state = st; text.textContent = label;
  el.setAttribute('aria-label', label);
  el.title = state.error ? errText(state.error) : tx(st === 'signin' ? 'tipSignIn' : st === 'demo' ? 'tipDemo' : 'tipSync');

  const src = $('#foot-source'), dev = state.data?.device;
  src.textContent = state.source === 'demo' ? tx('srcDemo')
    : `${tx('srcGoogle')}${state.data?.syncedAt ? tx('srcSynced', { t: dateTime(state.data.syncedAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }) : ''}${dev?.name ? `. ${dev.name}${isNum(dev.battery) ? tx('srcBattery', { b: dev.battery }) : ''}` : ''}.`;
  $('#foot-privacy').textContent = tx(state.source === 'demo' ? 'privDemo' : 'privGoogle');
  renderPanel();
}

async function sync() {
  if (state.syncing || state.source !== 'google') return;
  state.syncing = true; state.error = null; state.progress = tx('stSyncing'); renderStatus();
  try {
    const data = await syncGoogle({
      getToken: (o) => auth.token(o), known: state.data,
      onProgress: (done, total) => { state.progress = total ? tx('stSyncingN', { done, total }) : tx('stSyncing'); $('#status-text').textContent = state.progress; },
    });
    const firstData = !state.data || state.data.userId !== data.userId;
    state.data = { ...data, owner: auth.who.email || '' }; state.signIn = false;
    if (firstData) { state.settings = store.settings(person()); state.date = null; }
    store.saveCache(state.data);
    if (firstData) state.whoop = null;
    await refreshWhoop();
    compute();
    if (firstData) state.date = state.ctx.days[state.ctx.days.length - 1].date;
    show('dash');
    renderAll({ animate: true });
    announce(state.game, `google:${person()}`);
    refreshTeam({ upload: true });
  } catch (e) {
    if (e.signIn || e.status === 401) state.signIn = true; else state.error = e.message || 'Sync failed';
    if (!state.data) { show('welcome'); welcomeError(e.signIn ? '' : errText(state.error)); }
  } finally { state.syncing = false; renderStatus(); }
}

function enter() {
  $('#dash').classList.add('enter');
  setTimeout(() => $('#dash').classList.remove('enter'), 2200);
}

// ───────── team ─────────
function teamFrom(s) {
  if (!s.signedIn) return { mode: 'signedOut', members: [] };
  if (!s.joined) return { mode: 'join', members: [], count: s.count || 0, name: (auth.who.name || '').split(' ')[0] };
  return { mode: 'joined', me: s.me, server: s.members, members: state.ctx ? withMine(s.members, state.ctx.days, state.game) : s.members };
}
const rerenderTeam = () => { if (state.ctx && !$('#dash').hidden) renderAll({ animate: false }); };
async function refreshTeam({ upload = false } = {}) {
  if (PREVIEW || state.source !== 'google') return;
  if (auth.mode !== 'broker') { state.team = { mode: 'signedOut', members: [] }; rerenderTeam(); return; }
  try {
    let s = await teamApi.state();
    if (s.joined && upload && state.ctx) { state.team = { ...teamFrom(s), busy: true }; rerenderTeam(); await teamApi.sync(state.ctx.days, state.game); s = await teamApi.state(); }
    state.team = teamFrom(s);
  } catch { state.team = { mode: 'error', members: [] }; }
  rerenderTeam();
}
async function joinTeam(name) {
  state.team = { ...(state.team || {}), busy: true, name }; rerenderTeam();
  try { await teamApi.join(name); await refreshTeam({ upload: true }); }
  catch { state.team = { mode: 'error', members: [] }; rerenderTeam(); }
}
async function leaveTeam() {
  state.team = { ...(state.team || {}), busy: true }; rerenderTeam();
  try { await teamApi.leave(); } catch { /* the state below shows what is left */ }
  await refreshTeam();
}

let whoopLoading = null;
function refreshWhoop() {
  if (PREVIEW || state.source !== 'google' || whoopLoading) return whoopLoading;
  whoopLoading = loadWhoop(person()).then((w) => {
    whoopLoading = null;
    if (state.source !== 'google') return;
    const before = JSON.stringify(state.whoop?.days || []);
    state.whoop = w;
    if (state.data && JSON.stringify(w.days) !== before) { compute(); if (!$('#dash').hidden) renderAll({ animate: false }); }
    renderPanel();
  });
  return whoopLoading;
}

function startGoogle() {
  state.source = 'google'; store.demo = false;
  const cache = store.cache();
  // On a shared device, never show one person's cached days to another.
  const mine = cache && !cache.demo && (!auth.who.email || !cache.owner || cache.owner === auth.who.email);
  if (cache && !mine) store.clearCache();
  state.data = mine ? cache : null;
  state.settings = store.settings(person());
  state.team = { mode: 'loading', members: [] };
  if (state.data) { compute(); show('dash'); enter(); renderAll({ delay: 350 }); }
  refreshWhoop();
  refreshTeam();
  sync();
}

function startDemo(seed) {
  state.source = 'demo'; store.demo = true;
  state.data = makeDemo(seed ? { seed } : {}); state.date = null; state.signIn = false; state.error = null;
  compute(); show('dash'); enter(); renderAll({ delay: 350 });
  announce(state.game, 'demo');
  window.scrollTo(0, 0);
}

function welcomeError(msg) { const el = $('#welcome-error'); el.textContent = msg || ''; el.hidden = !msg; }

async function connect(btn) {
  welcomeError('');
  if (auth.unconfigured) { $('#owner-setup').hidden = false; $('#owner-setup').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' }); return; }
  if (auth.needsSetup) { $('#setup').hidden = false; $('#client-id').focus(); return; }
  if (btn) btn.disabled = true;
  try { await auth.connect(); startGoogle(); }
  catch (e) { if (state.source === 'google' && state.data) { state.error = e.message; renderStatus(); } else welcomeError(errText(e.message)); }
  finally { if (btn) btn.disabled = false; }
}

async function disconnect() {
  store.forget(person());
  forgetWhoopOwner(); state.whoop = null; state.team = null;
  await auth.disconnect();
  store.demo = false; state.settings = store.settings();
  state.source = null; state.data = null; state.ctx = null; state.date = null; state.signIn = false; state.error = null;
  closePanel(); showWelcome();
}

let welcomeDial;
function showWelcome() {
  show('welcome');
  $('#setup-origin').textContent = location.origin;
  $('#owner-redirect').textContent = `${location.origin}/functions/authCallback`;
  if (!welcomeDial) welcomeDial = createDial($('#welcome-dial'));
  welcomeDial.set(14.6, { lo: 12.8, hi: 15.2 }, { delay: 500 });
  roll($('#welcome-num'), 14.6, { format: (v) => num(v, 1), dur: 1300, delay: 500 });
}

// ───────── panel ─────────
let lastFocus = null;
// core/scores.js says where max heart rate came from, in English
function hrSource(s) {
  const age = /estimated from age (\d+)/.exec(s || '');
  if (age) return tx('hrAge', { age: age[1] });
  return tx({ 'set by you': 'hrSet', 'highest seen': 'hrSeen' }[s] || 'hrEst');
}

function renderPanel() {
  if ($('#panel').hidden) return;
  const acct = $('#acct-line'), actions = $('#acct-actions');
  actions.replaceChildren();
  if (state.source === 'demo' && PREVIEW) {
    acct.innerHTML = tx('acctPreview');
    actions.append(h('button', { class: 'btn primary small', type: 'button', text: tx('newMonth'), onclick: () => { closePanel(); startDemo(1 + Math.floor(Math.random() * 1e6)); } }));
  } else if (state.source === 'demo') {
    acct.innerHTML = tx('acctDemo');
    actions.append(h('button', { class: 'btn primary small', type: 'button', text: tx('connect'), onclick: (e) => { closePanel(); showWelcome(); connect(e.target); } }),
      h('button', { class: 'btn ghost small', type: 'button', text: tx('leaveDemo'), onclick: () => { store.demo = false; state.source = null; closePanel(); showWelcome(); } }));
  } else {
    const w = auth.who;
    acct.replaceChildren(...(w.name || w.email ? [h('b', { text: tx('signedInAs', { who: w.name || w.email }) }), w.name && w.email ? ` (${w.email}). ` : '. '] : []),
      state.signIn ? h('b', { text: tx('lapsed') }) : '',
      state.signIn ? tx('lapsedText')
        : tx(auth.mode === 'broker' ? 'broker' : 'popup'));
    actions.append(
      state.signIn ? h('button', { class: 'btn primary small', type: 'button', text: tx('signInAgain'), onclick: (e) => connect(e.target) }) : h('button', { class: 'btn primary small', type: 'button', text: tx('syncNow'), onclick: () => sync() }),
      h('button', { class: 'btn ghost small', type: 'button', text: w.name ? tx('notYou', { name: w.name }) : tx('disconnect'), onclick: disconnect }));
  }
  if (!PREVIEW) actions.append(h('a', { class: 'btn ghost small', href: 'whoop.html', text: tx('whoopScores'), style: { textDecoration: 'none' } }));
  const dev = state.data?.device;
  $('#device-sec').hidden = !dev;
  if (dev) {
    $('#device-line').replaceChildren(h('b', { text: dev.name }),
      `${isNum(dev.battery) ? tx('battery', { b: dev.battery }) : dev.batteryStatus ? tx('batteryStatus', { s: dev.batteryStatus.toLowerCase() }) : ''}${dev.lastSync ? tx('lastSync', { t: dateTime(dev.lastSync, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }) : ''}`);
  }

  $('#set-hrmax').value = state.settings.hrMax || '';
  $('#set-hrmax').placeholder = state.ctx ? tx('autoV', { v: state.ctx.hrMax.value }) : tx('auto');
  $('#hrmax-source').textContent = state.ctx ? tx('hrNow', { v: state.ctx.hrMax.value, src: hrSource(state.ctx.hrMax.source) }) : '';
  $('#set-curve').value = state.settings.curve;

  renderInstall();
  $('#toggles').replaceChildren(...Object.entries(VITAL_DEFS).map(([k, def]) => {
    const input = h('input', { type: 'checkbox', checked: !state.settings.hidden.includes(k) });
    input.addEventListener('change', () => {
      state.settings.hidden = input.checked ? state.settings.hidden.filter((x) => x !== k) : [...state.settings.hidden, k];
      saveSettings();
      renderVitals(current(), state.ctx, state.settings.hidden, state.data.issues || []);
    });
    return h('label', { class: 'toggle' }, def.name, input, h('span', { class: 'sw' }));
  }));

  const issues = state.data?.issues || [];
  $('#health').replaceChildren(...(state.source === 'demo'
    ? [h('li', { class: 'none' }, h('i'), tx('demoData'), h('span', { text: tx('notReal') }))]
    : issues.length ? issues.map((i) => h('li', { class: i.ok ? (i.count ? '' : 'none') : 'bad' }, h('i'), tx(i.type), h('span', { text: i.ok ? (i.count ? `${tx('read', { n: num(i.count) })}${i.from === 'band' ? tx('fromBand') : i.from === 'other' ? tx('fromOther') : ''}` : tx('nothing')) : tx('error', { s: i.status || '' }) }),
      i.ok ? null : h('small', { text: i.status === 403 ? tx('denied') : errText(i.message) })))
      : [h('li', { class: 'none' }, h('i'), tx('notSyncedYetH'), h('span', { text: '' }))]));
  if (state.source === 'google') {
    const w = state.whoop;
    const text = !w ? tx('wChecking') : w.other ? tx('wOther') : w.error && w.connected ? tx('wFailed') : !w.connected ? tx('wNot') : tx('wDays', { n: w.days.length });
    $('#health').append(h('li', { class: w?.connected && !w.other && !w.error && w.days.length ? '' : w?.error ? 'bad' : 'none' }, h('i'), tx('whoopLine'), h('span', { text }),
      w?.other ? h('small', { text: tx('wOtherNote') }) : null));
  }
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
$('#btn-demo')?.addEventListener('click', () => {
  startDemo();
  $('#dayline').focus({ preventScroll: true });
});
$('#setup-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = $('#client-id').value.trim();
  if (!/\.apps\.googleusercontent\.com$/.test(id)) { welcomeError(tx('badClient')); return; }
  auth.setClientId(id); connect(e.submitter);
});
$('#day-prev').addEventListener('click', () => step(-1));
$('#day-next').addEventListener('click', () => step(1));
$('#dayline').addEventListener('click', () => { const last = state.ctx?.days[state.ctx.days.length - 1]; if (last) pick(last.date); });
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
  saveSettings(); compute(); renderAll({ animate: true });
});
$('#set-curve').addEventListener('change', (e) => { state.settings.curve = e.target.value; saveSettings(); compute(); renderAll({ animate: true }); });
$$('.seg [data-range]').forEach((b) => b.addEventListener('click', () => {
  state.settings.range = Number(b.dataset.range); saveSettings();
  $$('.seg [data-range]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
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

// swipe sideways anywhere on a view to move a day (touch only), except on charts you scrub
{
  const pane = $('#dash');
  let x0 = 0, y0 = 0, tracking = false;
  pane.addEventListener('touchstart', (e) => { if (e.touches.length !== 1 || e.target.closest('.river, .t-spark, .profile, .trend, .hypno, .seg')) return; tracking = true; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  pane.addEventListener('touchend', (e) => {
    if (!tracking) return; tracking = false;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.8) step(dx > 0 ? -1 : 1);
  }, { passive: true });
  pane.addEventListener('touchcancel', () => { tracking = false; }, { passive: true });
}
narrow.addEventListener('change', () => { if (state.ctx && !$('#dash').hidden) renderAll({ animate: false }); });


let lastW = window.innerWidth, rz = 0;
window.addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => { if (window.innerWidth !== lastW && state.ctx && !$('#dash').hidden) { lastW = window.innerWidth; renderAll({ animate: false }); } }, 180);
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || state.source !== 'google' || state.signIn) return;
  if (Date.now() - (state.data?.syncedAt || 0) > 10 * 60000) sync();
});

// ───────── look: navy (default) or cream ─────────
const currentLook = () => (document.documentElement.dataset.look === 'cream' ? 'cream' : 'navy');
function setLook(look) {
  const root = document.documentElement;
  if (look === 'cream') root.dataset.look = 'cream'; else root.removeAttribute('data-look');
  try { localStorage.setItem('oranje.look', look); } catch { /* storage off */ }
  $('meta[name="theme-color"]')?.setAttribute('content', look === 'cream' ? '#F5EEE0' : '#04102B');
  $('meta[name="color-scheme"]')?.setAttribute('content', look === 'cream' ? 'light' : 'dark');
  $$('[data-look-pick]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lookPick === look)));
  const btn = $('#look-btn');
  btn.setAttribute('aria-label', tx(look === 'cream' ? 'toNavy' : 'toCream'));
  btn.title = btn.getAttribute('aria-label');
}
$('#look-btn').addEventListener('click', () => setLook(currentLook() === 'cream' ? 'navy' : 'cream'));
$$('[data-look-pick]').forEach((b) => b.addEventListener('click', () => setLook(b.dataset.lookPick)));

// ───────── language: English or Dutch ─────────
function applyLanguage() {
  const lang = getLang();
  applyPage(pageText);
  document.title = tx('title');
  $('meta[name="description"]')?.setAttribute('content', tx('description'));
  const btn = $('#lang-btn');
  btn.textContent = tx('switchShort');
  btn.setAttribute('aria-label', tx('switchTo'));
  btn.setAttribute('lang', lang === 'nl' ? 'en' : 'nl');
  btn.title = tx('switchTo');
  $$('[data-lang-pick]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.langPick === lang)));
  setLook(currentLook());   // its label
}
onLang(() => {
  applyLanguage();
  ribbonKey = '';
  $('#verdict').dataset.text = '';
  if (state.ctx && !$('#dash').hidden) renderAll({ animate: false });
  else initHelp();
  renderStatus();
});
$('#lang-btn').addEventListener('click', () => setLang(getLang() === 'nl' ? 'en' : 'nl'));
$$('[data-lang-pick]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.langPick)));

// ───────── install as an app ─────────
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; renderPanel(); });
window.addEventListener('appinstalled', () => { installPrompt = null; renderPanel(); });
function renderInstall() {
  const sec = $('#install-sec');
  if (!sec) return;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  sec.hidden = standalone || PREVIEW;
  const btn = $('#install-btn');
  btn.hidden = !installPrompt;
  btn.onclick = async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice.catch(() => null); installPrompt = null; renderPanel(); };
}

// ───────── boot ─────────
if ('serviceWorker' in navigator && location.protocol === 'https:' && !PREVIEW) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* works without it, just not offline */ });
}

(async function boot() {
  $$('.seg [data-range]').forEach((x) => x.setAttribute('aria-pressed', String(Number(x.dataset.range) === state.settings.range)));
  setLook(currentLook());
  applyLanguage();
  if (PREVIEW) { startDemo(); document.body.classList.remove('booting'); document.body.classList.add('ready'); setTimeout(() => document.body.classList.add('settled'), 1200); return; }
  await auth.init();
  const q = new URLSearchParams(location.search);
  const authError = q.get('auth_error');
  if (q.has('auth_error') || q.has('connected')) history.replaceState(null, '', location.pathname + location.hash);

  if (auth.linked && !authError) startGoogle();
  else if (store.demo && !authError) startDemo();
  else {
    showWelcome();
    if (authError) welcomeError(authError === 'access_denied' ? tx('authDenied') : authError === 'not_configured' ? tx('authUnconfigured') : tx('authOther', { e: authError }));
  }
  document.body.classList.remove('booting');
  document.body.classList.add('ready');
  try { sessionStorage.setItem('oranje.seen', '1'); } catch { /* fine */ }
  setTimeout(() => document.body.classList.add('settled'), 1200);
})();
