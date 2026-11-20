// The game: day points, a level that grows with them, streaks and medals.
// Each day earns up to 10 points for the things that actually help: training
// your strain target (a minimum), sleeping well, moving enough and wearing the
// band at night. Going far beyond it earns nothing extra.
// Points add up to a week score (for the team standings) and to XP, which
// raises your level. Pure functions: no DOM, runs in Node.
// Words shown to people are getters that ask js/i18n.js when they are read,
// so a game computed once follows the language when it changes.

import { addDays, fromKey, isNum } from './util.js';
import { date, num, strings } from '../i18n.js';

const t = strings({
  en: {
    trainIn: 'Reach your strain target', trainedIn: 'Reached your strain target', closeTo: 'Close to your target',
    needsRecovery: 'needs a recovery score first', inRange: '{s}, target {lo}+', offRange: '{s}, target {lo}+', range: 'target {lo}+',
    sleptWell: 'Slept well', sleptOk: 'Slept enough', sleepGoal: 'Sleep 85% or more',
    sleepPct: 'sleep {p}%', sleepPctMore: 'sleep {p}%, 85% earns {m}', noSleep: 'no sleep recorded',
    moved: '{n}+ zone minutes', azm: '{n} zone minutes', noAzm: 'no zone minutes',
    overnight: 'Wore the band to bed', measured: 'recovery measured', noNight: 'no night recorded',
    stTarget: 'Target reached', stSleep: 'Slept 85%+', stMoved: '{n}+ zone min',
    lv1: 'Starter', lv2: 'Walker', lv3: 'Cyclist', lv4: 'Runner', lv5: 'Skater', lv6: 'Road racer',
    lv7: 'Marathoner', lv8: 'Eleven-cities skater', lv9: 'Champion', lv10: 'Legend',
    dElfsteden: '200 km covered within four weeks, the length of the Frisian eleven-cities tour.',
    dFietsland: '20 rides recorded. Commutes count.',
    dVierdaagse: 'Four days in a row of 12,000 steps or more.',
    dVroegevogel: 'Up before 07:00 on five mornings in one week.',
    dNachtrust: 'Seven nights in a row with seven hours of sleep or more.',
    dDeltawerken: 'Reached your strain target five days running. Built to last.',
    dRustdag: 'Took it easy, strain under 9, the day after a strain of 14 or more.',
    dOranjeboven: 'One all-out day: a strain of 18 or more. Then rest.',
    bKm: '{n} / 200 km', bRides: '{n} / 20 rides', bRunDays: 'best run {n} / {of} days', bWeek: 'best week {n} / 5 mornings',
    bRunNights: 'best run {n} / 7 nights', bRested: 'rested well', bHadHard: 'had the hard day, now the easy one',
    bNeedsHard: 'needs a 14+ day first', bBestDay: 'best day {n} / 18',
  },
  nl: {
    trainIn: 'Haal je strain-doel', trainedIn: 'Strain-doel gehaald', closeTo: 'Dicht bij je doel',
    needsRecovery: 'eerst een herstelscore nodig', inRange: '{s}, doel {lo}+', offRange: '{s}, doel {lo}+', range: 'doel {lo}+',
    sleptWell: 'Goed geslapen', sleptOk: 'Genoeg geslapen', sleepGoal: 'Slaap 85% of meer',
    sleepPct: 'slaap {p}%', sleepPctMore: 'slaap {p}%, 85% levert {m} op', noSleep: 'geen slaap gemeten',
    moved: '{n}+ zoneminuten', azm: '{n} zoneminuten', noAzm: 'geen zoneminuten',
    overnight: 'Met de band naar bed', measured: 'herstel gemeten', noNight: 'geen nacht gemeten',
    stTarget: 'Doel gehaald', stSleep: 'Slaap 85%+', stMoved: '{n}+ zonemin',
    lv1: 'Starter', lv2: 'Wandelaar', lv3: 'Fietser', lv4: 'Hardloper', lv5: 'Schaatser', lv6: 'Wielrenner',
    lv7: 'Marathonloper', lv8: 'Elfstedenrijder', lv9: 'Kampioen', lv10: 'Legende',
    dElfsteden: '200 km binnen vier weken, de lengte van de Friese Elfstedentocht.',
    dFietsland: '20 fietsritten vastgelegd. Woon-werkritjes tellen mee.',
    dVierdaagse: 'Vier dagen op rij 12.000 stappen of meer.',
    dVroegevogel: 'In één week vijf ochtenden voor 07:00 op.',
    dNachtrust: 'Zeven nachten op rij zeven uur slaap of meer.',
    dDeltawerken: 'Vijf dagen achter elkaar je strain-doel gehaald. Gebouwd om te blijven.',
    dRustdag: 'Rustig aan gedaan, Strain onder 9, de dag na een Strain van 14 of meer.',
    dOranjeboven: 'Eén dag alles geven: een Strain van 18 of meer. Daarna rust.',
    bKm: '{n} / 200 km', bRides: '{n} / 20 ritten', bRunDays: 'beste reeks {n} / {of} dagen', bWeek: 'beste week {n} / 5 ochtenden',
    bRunNights: 'beste reeks {n} / 7 nachten', bRested: 'goed gerust', bHadHard: 'de zware dag gehad, nu de rustige',
    bNeedsHard: 'eerst een dag van 14+ nodig', bBestDay: 'beste dag {n} / 18',
  },
});

// What a day can earn, in points. 10 is a perfect day.
export const POINTS = { target: 4, close: 2, sleptWell: 3, sleptOk: 1, moved: 2, overnight: 1 };
export const DAY_MAX = POINTS.target + POINTS.sleptWell + POINTS.moved + POINTS.overnight;
export const MOVED_AZM = 22;   // 150 zone minutes a week, the WHO and Fitbit weekly goal, per day
const CLOSE = 1.5;             // strain within this below the target still earns something

// Levels by XP (all points ever earned). A steady week earns about 50.
const LEVEL_XP = [0, 50, 150, 300, 500, 800, 1200, 1700, 2400, 3300];
export const LEVELS = LEVEL_XP.map((xp, i) => ({ n: i + 1, xp, get name() { return t(`lv${i + 1}`); } }));
export function levelOf(xp) {
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) if (xp >= LEVELS[k].xp) i = k;
  const next = LEVELS[i + 1] || null;
  return { n: LEVELS[i].n, xp: LEVELS[i].xp, get name() { return LEVELS[i].name; }, next, toGo: next ? next.xp - xp : 0, progress: next ? (xp - LEVELS[i].xp) / (next.xp - LEVELS[i].xp) : 1 };
}

// a target bound as it was always shown: 11 stays 11, 13.4 becomes 13,4 in Dutch
const tnum = (v) => (isNum(v) ? num(v, Number.isInteger(v) ? 0 : 1) : '');
export const inTarget = (d) => !!d.target && isNum(d.strain) && d.strain >= d.target.lo;
const nearTarget = (d) => !!d.target && isNum(d.strain) && !inTarget(d) && d.strain >= d.target.lo - CLOSE;

// One day's points. On today, which is still running, a part not yet earned is "open".
// `label` and `detail` are read in the current language.
export function dayPoints(d) {
  const open = !!d.partial;
  const parts = [];
  const say = ([key, vars]) => t(key, vars?.());
  const add = (key, label, points, got, detail) => parts.push({ key, get label() { return say(label); }, points: got ? points : 0, max: points, got, open: open && !got && key !== 'sleep' && key !== 'overnight', get detail() { return say(detail); } });
  const range = () => ({ s: isNum(d.strain) ? num(d.strain, 1) : '', lo: tnum(d.target.lo) });

  if (!d.target) add('target', ['trainIn'], POINTS.target, false, ['needsRecovery']);
  else if (inTarget(d)) add('target', ['trainedIn'], POINTS.target, true, ['inRange', range]);
  else if (nearTarget(d) && !(open && d.strain < d.target.lo)) add('target', ['closeTo'], POINTS.close, true, ['offRange', range]);
  else add('target', ['trainIn'], POINTS.target, false, isNum(d.strain) ? ['offRange', range] : ['range', range]);

  const sp = d.sleepPct;
  if (isNum(sp) && sp >= 85) add('sleep', ['sleptWell'], POINTS.sleptWell, true, ['sleepPct', () => ({ p: num(sp) })]);
  else if (isNum(sp) && sp >= 70) add('sleep', ['sleptOk'], POINTS.sleptOk, true, ['sleepPctMore', () => ({ p: num(sp), m: POINTS.sleptWell })]);
  else add('sleep', ['sleepGoal'], POINTS.sleptWell, false, isNum(sp) ? ['sleepPct', () => ({ p: num(sp) })] : ['noSleep']);

  const azm = d.azm?.total;
  add('moved', ['moved', () => ({ n: MOVED_AZM })], POINTS.moved, isNum(azm) && azm >= MOVED_AZM, isNum(azm) ? ['azm', () => ({ n: num(azm) })] : ['noAzm']);
  add('overnight', ['overnight'], POINTS.overnight, !!(d.sleep || d.whoop?.sleepMinutes), d.sleep || d.whoop?.sleepMinutes ? ['measured'] : ['noNight']);
  return { points: parts.reduce((a, p) => a + p.points, 0), parts };
}

// Monday of the week a date key falls in, as a date key.
export function weekStart(key) {
  const wd = (fromKey(key).getDay() + 6) % 7;   // Monday 0 … Sunday 6
  return addDays(key, -wd);
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
// `ledger` holds points of settled days from earlier visits ({ date: points }),
// so XP keeps growing after old days drop out of the synced window. The
// returned ledger includes this run's settled days; the caller stores it.
export function playGame(days, ledger = {}) {
  const timeline = days.map((d) => { const p = dayPoints(d); return { date: d.date, points: p.points, parts: p.parts, partial: !!d.partial }; });
  const next = { ...ledger };
  for (const e of timeline) if (!e.partial) next[e.date] = e.points;
  const today = timeline.find((e) => e.partial);
  const xp = Object.values(next).reduce((a, v) => a + (isNum(v) ? v : 0), 0) + (today && !(today.date in next) ? today.points : 0);
  const last = days[days.length - 1]?.date;
  const week = last ? weekStart(last) : null;
  const weekDays = week ? timeline.filter((e) => e.date >= week) : [];
  const prevWeek = week ? addDays(week, -7) : null;
  const streaks = {
    target: { get label() { return t('stTarget'); }, ...streakOf(days, inTarget) },
    sleep: { get label() { return t('stSleep'); }, ...streakOf(days, (d) => isNum(d.sleepPct) && d.sleepPct >= 85) },
    moved: { get label() { return t('stMoved', { n: MOVED_AZM }); }, ...streakOf(days, (d) => isNum(d.azm?.total) && d.azm.total >= MOVED_AZM) },
  };
  const badges = BADGES.map((b) => {
    const r = b.check(days);
    return { id: b.id, name: b.name, glyph: b.glyph, get desc() { return b.desc; }, earned: !!r.at, at: r.at, progress: Math.max(0, Math.min(1, r.at ? 1 : r.progress)), get label() { return r.label; } };
  });
  return {
    xp, level: levelOf(xp), timeline, byDate: Object.fromEntries(timeline.map((e) => [e.date, e])), ledger: next,
    week: { start: week, points: weekDays.reduce((a, e) => a + e.points, 0), days: weekDays, max: 7 * DAY_MAX },
    lastWeek: prevWeek ? timeline.filter((e) => e.date >= prevWeek && e.date < week).reduce((a, e) => a + e.points, 0) : 0,
    streaks, badges,
  };
}

export const weekdayShort = (key) => date(fromKey(key), { weekday: 'short' });
