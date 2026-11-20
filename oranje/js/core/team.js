// The team: weekly standings, the weekly challenge and the leaderboards,
// worked out from the day summaries members share (see base44/shared/team.js).
// Pure functions: no DOM, runs in Node.
//
// A shared day: { date, points, strain, recovery, sleep, rhr, hrv, sleepMin, azm, steps, inTarget }
// A member:     { id, name, me, days: [shared day…] } (oldest first)

import { addDays, fromKey, isNum, mean } from './util.js?v=16';
import { inTarget, weekStart } from './game.js?v=16';

// One of your own computed days, as it is shared with the team.
export function shareDay(d, points) {
  const r = (v, digits = 0) => (isNum(v) ? +v.toFixed(digits) : null);
  return {
    date: d.date, points: isNum(points) ? points : 0,
    strain: r(d.strain, 1), recovery: r(d.recovery), sleep: r(d.sleepPct),
    rhr: r(d.rhr), hrv: r(d.hrv), sleepMin: r(d.sleepInfo?.asleep ?? d.whoop?.sleepMinutes),
    azm: r(d.azm?.total), steps: r(d.steps), inTarget: inTarget(d),
  };
}

const inWeek = (days, start) => { const end = addDays(start, 7); return days.filter((d) => d.date >= start && d.date < end); };
const sum = (xs) => xs.filter(isNum).reduce((a, b) => a + b, 0);
// best first; ties share a place
function rank(rows, better = 'high') {
  const sorted = rows.filter((r) => isNum(r.value)).sort((a, b) => (better === 'high' ? b.value - a.value : a.value - b.value) || a.name.localeCompare(b.name));
  let place = 0, prev = null;
  sorted.forEach((r, i) => { if (r.value !== prev) { place = i + 1; prev = r.value; } r.place = place; });
  return [...sorted, ...rows.filter((r) => !isNum(r.value)).map((r) => ({ ...r, place: null }))];
}

// Weekly standings on day points (Monday to Sunday).
export function weekBoard(members, start) {
  return rank(members.map((m) => {
    const days = inWeek(m.days, start);
    return { id: m.id, name: m.name, me: !!m.me, value: sum(days.map((d) => d.points)), days: days.length };
  }));
}

// Winners of the finished weeks the shared days still cover (up to `weeks` back).
export function pastWinners(members, start, weeks = 16) {
  const out = [];
  for (let k = 1; k <= weeks; k++) {
    const w = addDays(start, -7 * k);
    const board = weekBoard(members, w).filter((r) => r.days > 0);
    if (!board.length) continue;
    out.push({ week: w, winners: board.filter((r) => r.place === 1 && r.value > 0) });
  }
  return out;
}
export function winCounts(members, start, weeks = 16) {
  const n = Object.fromEntries(members.map((m) => [m.id, 0]));
  for (const w of pastWinners(members, start, weeks)) for (const r of w.winners) n[r.id] = (n[r.id] || 0) + 1;
  return n;
}

// One theme a week, in turn. Same week, same theme for everyone.
export const CHALLENGES = [
  { id: 'sleep', better: 'high', unit: '%', score: (days) => mean(days.map((d) => d.sleep)) },
  { id: 'target', better: 'high', unit: 'days', score: (days) => days.filter((d) => d.inTarget).length },
  { id: 'azm', better: 'high', unit: 'min', score: (days) => sum(days.map((d) => d.azm)) },
  { id: 'recovery', better: 'high', unit: '%', score: (days) => mean(days.map((d) => d.recovery)) },
  { id: 'steps', better: 'high', unit: 'steps', score: (days) => sum(days.map((d) => d.steps)) },
];
export function challengeOf(start) {
  const weeks = Math.round((fromKey(weekStart(start)) - fromKey('2026-01-05')) / (7 * 86400000));   // 5 Jan 2026 is a Monday
  return CHALLENGES[((weeks % CHALLENGES.length) + CHALLENGES.length) % CHALLENGES.length];
}
export function challengeBoard(members, start) {
  const c = challengeOf(start);
  return { challenge: c, rows: rank(members.map((m) => {
    const days = inWeek(m.days, start);
    const v = days.length ? c.score(days) : null;
    return { id: m.id, name: m.name, me: !!m.me, value: isNum(v) ? +v.toFixed(c.unit === '%' ? 0 : 0) : null };
  }), c.better) };
}

// Leaderboards over the last 7 days, like WHOOP's team averages.
export const BOARDS = [
  { id: 'recovery', better: 'high', digits: 0, get: (d) => d.recovery },
  { id: 'strain', better: 'high', digits: 1, get: (d) => d.strain },
  { id: 'sleep', better: 'high', digits: 0, get: (d) => d.sleep },
  { id: 'hrv', better: 'high', digits: 0, get: (d) => d.hrv },
  { id: 'rhr', better: 'low', digits: 0, get: (d) => d.rhr },
  { id: 'sleepMin', better: 'high', digits: 0, get: (d) => d.sleepMin },
];
export function leaderboard(members, endKey, id) {
  const b = BOARDS.find((x) => x.id === id) || BOARDS[0];
  const from = addDays(endKey, -6);
  return { board: b, rows: rank(members.map((m) => {
    const v = mean(m.days.filter((d) => d.date >= from && d.date <= endKey).map(b.get));
    return { id: m.id, name: m.name, me: !!m.me, value: isNum(v) ? +v.toFixed(b.digits) : null };
  }), b.better) };
}

export { weekStart };
