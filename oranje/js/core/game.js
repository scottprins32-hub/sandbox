// The climb: a small game on top of the scores. Each day earns metres of
// altitude for doing the things that actually help (training inside your
// target, sleeping well, moving enough), so it rewards balance, not pain.
// You start in the Zuidplaspolder, the lowest point of the Netherlands, and
// climb past Dutch landmarks towards the Alpe d'Huez, "the Dutch mountain".
// Pure functions: no DOM, runs in Node.

import { fromKey, isNum } from './util.js';

export const LEVELS = [
  { id: 'polder', name: 'Zuidplaspolder', alt: -6.76, note: 'the lowest point of the Netherlands' },
  { id: 'nap', name: 'Sea level', alt: 0, note: 'NAP, the Dutch zero' },
  { id: 'dune', name: 'Catrijper Nok', alt: 55.4, note: 'the highest dune in the Netherlands' },
  { id: 'cauberg', name: 'Cauberg', alt: 134, note: 'the Amstel Gold Race climb' },
  { id: 'vaals', name: 'Vaalserberg', alt: 322, note: 'the top of the European Netherlands' },
  { id: 'botrange', name: 'Signal de Botrange', alt: 694, note: 'the top of Belgium' },
  { id: 'alpe', name: "Alpe d'Huez", alt: 1850, note: 'the Dutch mountain' },
];

// What a day can earn, in metres.
export const EARN = { target: 12, close: 5, sleptWell: 8, sleptOk: 4, moved: 4, overnight: 2, streakMax: 5 };
const MOVED_AZM = 22;          // 150 zone minutes a week, the WHO and Fitbit weekly goal, per day
const CLOSE = 1.5;             // strain within this of the target range still earns something

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
export function dayEarnings(d, streak) {
  const open = !!d.partial;
  const parts = [];
  const add = (key, label, metres, got, detail) => parts.push({ key, label, metres: got ? metres : 0, max: metres, got, open: open && !got && key !== 'sleep' && key !== 'overnight', detail });

  if (!d.target) add('target', 'Train inside your target', EARN.target, false, 'needs a recovery score first');
  else if (inTarget(d)) add('target', 'Trained inside your target', EARN.target, true, `${d.strain.toFixed(1)} in ${d.target.lo}–${d.target.hi}`);
  else if (nearTarget(d) && !(open && d.strain < d.target.lo)) add('target', 'Close to your target', EARN.close, true, `${d.strain.toFixed(1)}, target ${d.target.lo}–${d.target.hi}`);
  else add('target', 'Train inside your target', EARN.target, false, isNum(d.strain) ? `${d.strain.toFixed(1)}, target ${d.target.lo}–${d.target.hi}` : `target ${d.target.lo}–${d.target.hi}`);

  const sp = d.sleepPct;
  if (isNum(sp) && sp >= 85) add('sleep', 'Slept well', EARN.sleptWell, true, `sleep ${sp}%`);
  else if (isNum(sp) && sp >= 70) add('sleep', 'Slept enough', EARN.sleptOk, true, `sleep ${sp}%, 85% earns ${EARN.sleptWell}`);
  else add('sleep', 'Sleep 85% or more', EARN.sleptWell, false, isNum(sp) ? `sleep ${sp}%` : 'no sleep recorded');

  const azm = d.azm?.total;
  add('moved', `${MOVED_AZM}+ zone minutes`, EARN.moved, isNum(azm) && azm >= MOVED_AZM, isNum(azm) ? `${azm} zone minutes` : 'no zone minutes');
  add('overnight', 'Wore the band to bed', EARN.overnight, !!d.sleep, d.sleep ? 'recovery measured' : 'no night recorded');

  const bonus = inTarget(d) ? Math.min(EARN.streakMax, Math.max(0, streak - 1)) : 0;
  if (bonus) parts.push({ key: 'streak', label: `Streak bonus, day ${streak}`, metres: bonus, max: EARN.streakMax, got: true, open: false, detail: `+1 m for each day in a row, up to ${EARN.streakMax}` });
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
    id: 'elfsteden', name: 'Elfstedentocht', glyph: '200', desc: '200 km covered within four weeks, the length of the Frisian eleven-cities tour.',
    check(days) {
      let best = 0, at = null;
      days.forEach((d, i) => {
        const sum = days.slice(Math.max(0, i - 27), i + 1).reduce((a, x) => a + (x.distance || 0), 0);
        if (sum > best) best = sum;
        if (!at && sum >= 200) at = d.date;
      });
      return { at, progress: best / 200, label: `${Math.round(Math.min(best, 200))} / 200 km` };
    },
  },
  {
    id: 'fietsland', name: 'Fietsland', glyph: '20', desc: '20 rides recorded. Commutes count.',
    check(days) {
      let n = 0, at = null;
      for (const d of days) for (const w of d.workouts || []) if (RIDE.test(w.type || '') && ++n === 20) at = d.date;
      return { at, progress: n / 20, label: `${Math.min(n, 20)} / 20 rides` };
    },
  },
  {
    id: 'vierdaagse', name: 'Vierdaagse', glyph: '4×', desc: 'Four days in a row of 12,000 steps or more.',
    check(days) {
      const test = (d) => isNum(d.steps) && d.steps >= 12000;
      const r = longestRun(days, test);
      return { at: firstRun(days, test, 4), progress: r.best / 4, label: `best run ${Math.min(r.best, 4)} / 4 days` };
    },
  },
  {
    id: 'vroegevogel', name: 'Vroege vogel', glyph: '07', desc: 'Up before 07:00 on five mornings in one week.',
    check(days) {
      let best = 0, at = null;
      days.forEach((d, i) => {
        const n = days.slice(Math.max(0, i - 6), i + 1).filter(wokeBy7).length;
        best = Math.max(best, n);
        if (!at && n >= 5) at = d.date;
      });
      return { at, progress: best / 5, label: `best week ${Math.min(best, 5)} / 5 mornings` };
    },
  },
  {
    id: 'nachtrust', name: 'Nachtrust', glyph: '7h', desc: 'Seven nights in a row with seven hours of sleep or more.',
    check(days) {
      const test = (d) => !!d.sleepInfo && d.sleepInfo.asleep >= 420;
      const r = longestRun(days, test);
      return { at: firstRun(days, test, 7), progress: r.best / 7, label: `best run ${Math.min(r.best, 7)} / 7 nights` };
    },
  },
  {
    id: 'deltawerken', name: 'Deltawerken', glyph: '5', desc: 'Inside your strain target five days running. Built to last.',
    check(days) {
      const r = longestRun(days, inTarget);
      return { at: firstRun(days, inTarget, 5), progress: r.best / 5, label: `best run ${Math.min(r.best, 5)} / 5 days` };
    },
  },
  {
    id: 'rustdag', name: 'Rustdag', glyph: 'zz', desc: 'Took it easy, strain under 9, the day after a strain of 14 or more.',
    check(days) {
      let at = null, hard = false;
      for (let i = 1; i < days.length; i++) {
        const a = days[i - 1], b = days[i];
        if (isNum(a.strain) && a.strain >= 14) hard = true;
        if (!at && !b.partial && isNum(a.strain) && a.strain >= 14 && isNum(b.strain) && b.strain < 9) at = b.date;
      }
      return { at, progress: at ? 1 : hard ? 0.5 : 0, label: at ? 'rested well' : hard ? 'had the hard day, now the easy one' : 'needs a 14+ day first' };
    },
  },
  {
    id: 'oranjeboven', name: 'Oranjeboven', glyph: '18', desc: 'One all-out day: a strain of 18 or more. Then rest.',
    check(days) {
      const best = Math.max(0, ...days.map((d) => (isNum(d.strain) ? d.strain : 0)));
      const hit = days.find((d) => isNum(d.strain) && d.strain >= 18);
      return { at: hit?.date || null, progress: best / 18, label: `best day ${best.toFixed(1)} / 18` };
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
    target: { label: 'Inside target', ...streakOf(days, inTarget) },
    sleep: { label: 'Slept 85%+', ...streakOf(days, (d) => isNum(d.sleepPct) && d.sleepPct >= 85) },
    moved: { label: `${MOVED_AZM}+ zone min`, ...streakOf(days, (d) => isNum(d.azm?.total) && d.azm.total >= MOVED_AZM) },
  };
  const badges = BADGES.map((b) => {
    const r = b.check(days);
    return { id: b.id, name: b.name, glyph: b.glyph, desc: b.desc, earned: !!r.at, at: r.at, progress: Math.max(0, Math.min(1, r.at ? 1 : r.progress)), label: r.label };
  });
  return { alt, level: levelAt(alt), timeline, byDate: Object.fromEntries(timeline.map((t) => [t.date, t])), reached, streaks, badges };
}

export const weekdayShort = (key) => fromKey(key).toLocaleDateString('en-GB', { weekday: 'short' });
