// The climb: a small game on top of the scores. Each day earns metres of
// altitude for doing the things that actually help (training inside your
// target, sleeping well, moving enough), so it rewards balance, not pain.
// You start in the Zuidplaspolder, the lowest point of the Netherlands, and
// climb past Dutch landmarks towards the Alpe d'Huez, "the Dutch mountain".
// Pure functions: no DOM, runs in Node.
// Words shown to people are getters that ask js/i18n.js at the moment they are
// read, so a game computed once follows the language when it changes.

import { fromKey, isNum } from './util.js';
import { date, num, strings } from '../i18n.js';

const t = strings({
  en: {
    lvPolder: 'Zuidplaspolder', lvNap: 'Sea level', lvDune: 'Catrijper Nok', lvCauberg: 'Cauberg',
    lvVaals: 'Vaalserberg', lvBotrange: 'Signal de Botrange', lvAlpe: "Alpe d'Huez",
    ntPolder: 'the lowest point of the Netherlands', ntNap: 'NAP, the Dutch zero', ntDune: 'the highest dune in the Netherlands',
    ntCauberg: 'the Amstel Gold Race climb', ntVaals: 'the top of the European Netherlands', ntBotrange: 'the top of Belgium',
    ntAlpe: 'the Dutch mountain',

    trainIn: 'Train inside your target', trainedIn: 'Trained inside your target', closeTo: 'Close to your target',
    needsRecovery: 'needs a recovery score first', inRange: '{s} in {lo}–{hi}', offRange: '{s}, target {lo}–{hi}', range: 'target {lo}–{hi}',
    sleptWell: 'Slept well', sleptOk: 'Slept enough', sleepGoal: 'Sleep 85% or more',
    sleepPct: 'sleep {p}%', sleepPctMore: 'sleep {p}%, 85% earns {m}', noSleep: 'no sleep recorded',
    moved: '{n}+ zone minutes', azm: '{n} zone minutes', noAzm: 'no zone minutes',
    overnight: 'Wore the band to bed', measured: 'recovery measured', noNight: 'no night recorded',
    streakBonus: 'Streak bonus, day {n}', streakDetail: '+1 m for each day in a row, up to {max}',

    stTarget: 'Inside target', stSleep: 'Slept 85%+', stMoved: '{n}+ zone min',

    dElfsteden: '200 km covered within four weeks, the length of the Frisian eleven-cities tour.',
    dFietsland: '20 rides recorded. Commutes count.',
    dVierdaagse: 'Four days in a row of 12,000 steps or more.',
    dVroegevogel: 'Up before 07:00 on five mornings in one week.',
    dNachtrust: 'Seven nights in a row with seven hours of sleep or more.',
    dDeltawerken: 'Inside your strain target five days running. Built to last.',
    dRustdag: 'Took it easy, strain under 9, the day after a strain of 14 or more.',
    dOranjeboven: 'One all-out day: a strain of 18 or more. Then rest.',
    bKm: '{n} / 200 km', bRides: '{n} / 20 rides', bRunDays: 'best run {n} / {of} days', bWeek: 'best week {n} / 5 mornings',
    bRunNights: 'best run {n} / 7 nights', bRested: 'rested well', bHadHard: 'had the hard day, now the easy one',
    bNeedsHard: 'needs a 14+ day first', bBestDay: 'best day {n} / 18',
  },
  nl: {
    lvNap: 'Zeeniveau',
    ntPolder: 'het laagste punt van Nederland', ntNap: 'NAP, het Nederlandse nulpunt', ntDune: 'de hoogste duin van Nederland',
    ntCauberg: 'de klim van de Amstel Gold Race', ntVaals: 'het hoogste punt van Europees Nederland', ntBotrange: 'het hoogste punt van België',
    ntAlpe: 'de Hollandse berg',

    trainIn: 'Train binnen je doel', trainedIn: 'Binnen je doel getraind', closeTo: 'Dicht bij je doel',
    needsRecovery: 'eerst een herstelscore nodig', inRange: '{s} binnen {lo}–{hi}', offRange: '{s}, doel {lo}–{hi}', range: 'doel {lo}–{hi}',
    sleptWell: 'Goed geslapen', sleptOk: 'Genoeg geslapen', sleepGoal: 'Slaap 85% of meer',
    sleepPct: 'slaap {p}%', sleepPctMore: 'slaap {p}%, 85% levert {m} op', noSleep: 'geen slaap gemeten',
    moved: '{n}+ zoneminuten', azm: '{n} zoneminuten', noAzm: 'geen zoneminuten',
    overnight: 'Met de band naar bed', measured: 'herstel gemeten', noNight: 'geen nacht gemeten',
    streakBonus: 'Reeksbonus, dag {n}', streakDetail: '+1 m voor elke dag op rij, tot {max}',

    stTarget: 'Binnen doel', stSleep: 'Slaap 85%+', stMoved: '{n}+ zonemin',

    dElfsteden: '200 km binnen vier weken, de lengte van de Friese Elfstedentocht.',
    dFietsland: '20 fietsritten vastgelegd. Woon-werkritjes tellen mee.',
    dVierdaagse: 'Vier dagen op rij 12.000 stappen of meer.',
    dVroegevogel: 'In één week vijf ochtenden voor 07:00 op.',
    dNachtrust: 'Zeven nachten op rij zeven uur slaap of meer.',
    dDeltawerken: 'Vijf dagen achter elkaar binnen je Strain-doel. Gebouwd om te blijven.',
    dRustdag: 'Rustig aan gedaan, Strain onder 9, de dag na een Strain van 14 of meer.',
    dOranjeboven: 'Eén dag alles geven: een Strain van 18 of meer. Daarna rust.',
    bKm: '{n} / 200 km', bRides: '{n} / 20 ritten', bRunDays: 'beste reeks {n} / {of} dagen', bWeek: 'beste week {n} / 5 ochtenden',
    bRunNights: 'beste reeks {n} / 7 nachten', bRested: 'goed gerust', bHadHard: 'de zware dag gehad, nu de rustige',
    bNeedsHard: 'eerst een dag van 14+ nodig', bBestDay: 'beste dag {n} / 18',
  },
});

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const level = (id, alt) => ({ id, alt, get name() { return t(`lv${cap(id)}`); }, get note() { return t(`nt${cap(id)}`); } });

export const LEVELS = [
  level('polder', -6.76),
  level('nap', 0),
  level('dune', 55.4),
  level('cauberg', 134),
  level('vaals', 322),
  level('botrange', 694),
  level('alpe', 1850),
];

// What a day can earn, in metres.
export const EARN = { target: 12, close: 5, sleptWell: 8, sleptOk: 4, moved: 4, overnight: 2, streakMax: 5 };
const MOVED_AZM = 22;          // 150 zone minutes a week, the WHO and Fitbit weekly goal, per day
const CLOSE = 1.5;             // strain within this of the target range still earns something

// a target bound as it was always shown: 11 stays 11, 13.4 becomes 13,4 in Dutch
const tnum = (v) => (isNum(v) ? num(v, Number.isInteger(v) ? 0 : 1) : '');
const inTarget = (d) => !!d.target && isNum(d.strain) && d.strain >= d.target.lo && d.strain <= d.target.hi;
const nearTarget = (d) => !!d.target && isNum(d.strain) && !inTarget(d) && d.strain >= d.target.lo - CLOSE && d.strain <= d.target.hi + CLOSE;

export function levelAt(alt) {
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) if (alt >= LEVELS[k].alt) i = k;
  const next = LEVELS[i + 1] || null;
  const span = next ? next.alt - LEVELS[i].alt : 1;
  return { index: i, level: LEVELS[i], next, toGo: next ? next.alt - alt : 0, progress: next ? Math.min(1, (alt - LEVELS[i].alt) / span) : 1 };
}

// One day's earnings. `streak` is the on-target streak including this day.
// On today, which is still running, a part not yet earned is "open".
// `label` and `detail` are read in the current language: each is a [key, vars] pair
// whose vars are a function, so numbers are formatted when shown.
export function dayEarnings(d, streak) {
  const open = !!d.partial;
  const parts = [];
  const say = ([key, vars]) => t(key, vars?.());
  const add = (key, label, metres, got, detail) => parts.push({ key, get label() { return say(label); }, metres: got ? metres : 0, max: metres, got, open: open && !got && key !== 'sleep' && key !== 'overnight', get detail() { return say(detail); } });
  const range = () => ({ s: isNum(d.strain) ? num(d.strain, 1) : '', lo: tnum(d.target.lo), hi: tnum(d.target.hi) });

  if (!d.target) add('target', ['trainIn'], EARN.target, false, ['needsRecovery']);
  else if (inTarget(d)) add('target', ['trainedIn'], EARN.target, true, ['inRange', range]);
  else if (nearTarget(d) && !(open && d.strain < d.target.lo)) add('target', ['closeTo'], EARN.close, true, ['offRange', range]);
  else add('target', ['trainIn'], EARN.target, false, isNum(d.strain) ? ['offRange', range] : ['range', range]);

  const sp = d.sleepPct;
  if (isNum(sp) && sp >= 85) add('sleep', ['sleptWell'], EARN.sleptWell, true, ['sleepPct', () => ({ p: num(sp) })]);
  else if (isNum(sp) && sp >= 70) add('sleep', ['sleptOk'], EARN.sleptOk, true, ['sleepPctMore', () => ({ p: num(sp), m: EARN.sleptWell })]);
  else add('sleep', ['sleepGoal'], EARN.sleptWell, false, isNum(sp) ? ['sleepPct', () => ({ p: num(sp) })] : ['noSleep']);

  const azm = d.azm?.total;
  add('moved', ['moved', () => ({ n: MOVED_AZM })], EARN.moved, isNum(azm) && azm >= MOVED_AZM, isNum(azm) ? ['azm', () => ({ n: num(azm) })] : ['noAzm']);
  add('overnight', ['overnight'], EARN.overnight, !!d.sleep, d.sleep ? ['measured'] : ['noNight']);

  const bonus = inTarget(d) ? Math.min(EARN.streakMax, Math.max(0, streak - 1)) : 0;
  if (bonus) parts.push({ key: 'streak', get label() { return t('streakBonus', { n: streak }); }, metres: bonus, max: EARN.streakMax, got: true, open: false, get detail() { return t('streakDetail', { max: EARN.streakMax }); } });
  return { metres: parts.reduce((a, p) => a + p.metres, 0), parts };
}

// A run of days meeting `test`. Today counts when it already meets it; if it
// does not yet, the streak stays alive from yesterday instead of breaking.
function streakOf(days, test) {
  let current = 0, best = 0, run = 0;
  const marks = days.map((d) => (test(d) ? 'hit' : d.partial ? 'open' : 'miss'));
  marks.forEach((m) => { if (m === 'hit') { run++; best = Math.max(best, run); } else if (m === 'miss') run = 0; });
  for (let i = marks.length - 1; i >= 0; i--) { if (marks[i] === 'hit') current++; else if (marks[i] === 'open') continue; else break; }
  return { current, best, marks };
}

const longestRun = (days, test) => { let run = 0, best = 0, at = null; for (const d of days) { if (test(d)) { run++; if (run > best) { best = run; at = d.date; } } else if (!d.partial) run = 0; } return { best, at }; };
const firstRun = (days, test, n) => { let run = 0; for (const d of days) { if (test(d)) { if (++run >= n) return d.date; } else if (!d.partial) run = 0; } return null; };
const RIDE = /BIK|CYCL|SPINNING/;
const wokeBy7 = (d) => !!d.sleep && (() => { const w = new Date(d.sleep.end); return w.getHours() < 7; })();

// Each badge reports whether it is earned, when, and how close you are.
export const BADGES = [
  {
    id: 'elfsteden', name: 'Elfstedentocht', glyph: '200', get desc() { return t('dElfsteden'); },
    check(days) {
      let best = 0, at = null;
      days.forEach((d, i) => {
        const sum = days.slice(Math.max(0, i - 27), i + 1).reduce((a, x) => a + (x.distance || 0), 0);
        if (sum > best) best = sum;
        if (!at && sum >= 200) at = d.date;
      });
      return { at, progress: best / 200, get label() { return t('bKm', { n: Math.round(Math.min(best, 200)) }); } };
    },
  },
  {
    id: 'fietsland', name: 'Fietsland', glyph: '20', get desc() { return t('dFietsland'); },
    check(days) {
      let n = 0, at = null;
      for (const d of days) for (const w of d.workouts || []) if (RIDE.test(w.type || '') && ++n === 20) at = d.date;
      return { at, progress: n / 20, get label() { return t('bRides', { n: Math.min(n, 20) }); } };
    },
  },
  {
    id: 'vierdaagse', name: 'Vierdaagse', glyph: '4×', get desc() { return t('dVierdaagse'); },
    check(days) {
      const test = (d) => isNum(d.steps) && d.steps >= 12000;
      const r = longestRun(days, test);
      return { at: firstRun(days, test, 4), progress: r.best / 4, get label() { return t('bRunDays', { n: Math.min(r.best, 4), of: 4 }); } };
    },
  },
  {
    id: 'vroegevogel', name: 'Vroege vogel', glyph: '07', get desc() { return t('dVroegevogel'); },
    check(days) {
      let best = 0, at = null;
      days.forEach((d, i) => {
        const n = days.slice(Math.max(0, i - 6), i + 1).filter(wokeBy7).length;
        best = Math.max(best, n);
        if (!at && n >= 5) at = d.date;
      });
      return { at, progress: best / 5, get label() { return t('bWeek', { n: Math.min(best, 5) }); } };
    },
  },
  {
    id: 'nachtrust', name: 'Nachtrust', glyph: '7h', get desc() { return t('dNachtrust'); },
    check(days) {
      const test = (d) => !!d.sleepInfo && d.sleepInfo.asleep >= 420;
      const r = longestRun(days, test);
      return { at: firstRun(days, test, 7), progress: r.best / 7, get label() { return t('bRunNights', { n: Math.min(r.best, 7) }); } };
    },
  },
  {
    id: 'deltawerken', name: 'Deltawerken', glyph: '5', get desc() { return t('dDeltawerken'); },
    check(days) {
      const r = longestRun(days, inTarget);
      return { at: firstRun(days, inTarget, 5), progress: r.best / 5, get label() { return t('bRunDays', { n: Math.min(r.best, 5), of: 5 }); } };
    },
  },
  {
    id: 'rustdag', name: 'Rustdag', glyph: 'zz', get desc() { return t('dRustdag'); },
    check(days) {
      let at = null, hard = false;
      for (let i = 1; i < days.length; i++) {
        const a = days[i - 1], b = days[i];
        if (isNum(a.strain) && a.strain >= 14) hard = true;
        if (!at && !b.partial && isNum(a.strain) && a.strain >= 14 && isNum(b.strain) && b.strain < 9) at = b.date;
      }
      return { at, progress: at ? 1 : hard ? 0.5 : 0, get label() { return t(at ? 'bRested' : hard ? 'bHadHard' : 'bNeedsHard'); } };
    },
  },
  {
    id: 'oranjeboven', name: 'Oranjeboven', glyph: '18', get desc() { return t('dOranjeboven'); },
    check(days) {
      const best = Math.max(0, ...days.map((d) => (isNum(d.strain) ? d.strain : 0)));
      const hit = days.find((d) => isNum(d.strain) && d.strain >= 18);
      return { at: hit?.date || null, progress: best / 18, get label() { return t('bBestDay', { n: num(best, 1) }); } };
    },
  },
];

// Everything the game shows, from the computed days (oldest first).
export function playGame(days) {
  let alt = LEVELS[0].alt, streak = 0;
  const timeline = [];
  const reached = {};   // level id → date first reached
  for (const d of days) {
    if (inTarget(d)) streak++; else if (!d.partial) streak = 0;
    const e = dayEarnings(d, inTarget(d) ? streak : 0);
    const from = alt;
    alt += e.metres;
    for (const l of LEVELS) if (!reached[l.id] && alt >= l.alt && l.id !== 'polder') reached[l.id] = d.date;
    timeline.push({ date: d.date, from, to: alt, metres: e.metres, parts: e.parts, partial: !!d.partial });
  }
  const streaks = {
    target: { get label() { return t('stTarget'); }, ...streakOf(days, inTarget) },
    sleep: { get label() { return t('stSleep'); }, ...streakOf(days, (d) => isNum(d.sleepPct) && d.sleepPct >= 85) },
    moved: { get label() { return t('stMoved', { n: MOVED_AZM }); }, ...streakOf(days, (d) => isNum(d.azm?.total) && d.azm.total >= MOVED_AZM) },
  };
  const badges = BADGES.map((b) => {
    const r = b.check(days);
    return { id: b.id, name: b.name, glyph: b.glyph, get desc() { return b.desc; }, earned: !!r.at, at: r.at, progress: Math.max(0, Math.min(1, r.at ? 1 : r.progress)), get label() { return r.label; } };
  });
  return { alt, level: levelAt(alt), timeline, byDate: Object.fromEntries(timeline.map((t) => [t.date, t])), reached, streaks, badges };
}

export const weekdayShort = (key) => date(fromKey(key), { weekday: 'short' });
