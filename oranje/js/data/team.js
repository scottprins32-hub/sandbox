// The team, from the browser: talks to this site's /functions/team, keeps the
// XP ledger, and makes a pretend team for the demo.
//
// Nothing is shared until the person chooses "Join". After that, the day
// summaries from core/team.js shareDay() are sent after each sync.

import { computeAll } from '../core/scores.js';
import { playGame } from '../core/game.js';
import { shareDay } from '../core/team.js';
import { makeDemo } from './demo.js';

async function call(action, body) {
  const res = await fetch(`/functions/team?action=${action}`, {
    method: action === 'state' ? 'GET' : 'POST', cache: 'no-store',
    headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.error || 'unavailable'), { status: res.status });
  return json;
}

export const team = {
  state: () => call('state'),
  join: (name) => call('join', { name }),
  leave: () => call('leave'),
  // the last 63 days the app has computed, today included
  sync: (days, game) => call('sync', { days: days.slice(-63).map((d) => shareDay(d, game.byDate[d.date]?.points ?? 0)) }),
};

// Your own days replace the server's copy of them, so the standings are
// current even before the upload has finished.
export function withMine(members, days, game) {
  const mine = days.map((d) => shareDay(d, game.byDate[d.date]?.points ?? 0));
  return members.map((m) => {
    if (!m.me) return m;
    const by = Object.fromEntries((m.days || []).map((d) => [d.date, d]));
    for (const d of mine) by[d.date] = d;
    return { ...m, days: Object.values(by).sort((a, b) => (a.date < b.date ? -1 : 1)) };
  });
}

// ───────── XP ledger: points of settled days, kept per person ─────────
const LEDGER = (scope) => `oranje.ledger.${scope}`;
export const ledger = {
  read(scope) { try { return JSON.parse(localStorage.getItem(LEDGER(scope)) || '{}') || {}; } catch { return {}; } },
  write(scope, value) { try { localStorage.setItem(LEDGER(scope), JSON.stringify(value)); } catch { /* storage off */ } },
  forget(scope) { try { localStorage.removeItem(LEDGER(scope)); } catch { /* storage off */ } },
};

// ───────── the demo: three made-up teammates ─────────
// name, seed, and habits: how much each sleeps and moves compared with the generator
const DEMO = [['Sanne', 21, 1.06, 1.5], ['Joost', 1953, 0.88, 0.8], ['Fleur', 707, 0.97, 1.15]];
function habits(day, sleep, move) {
  const d = { ...day };
  if (d.sleep) d.sleep = { ...d.sleep, asleepMin: Math.round(d.sleep.asleepMin * sleep) };
  if (d.azm) { const k = (v) => Math.round(v * move); d.azm = { fatBurn: k(d.azm.fatBurn), cardio: k(d.azm.cardio), peak: k(d.azm.peak), total: k(d.azm.fatBurn) + k(d.azm.cardio) + k(d.azm.peak) }; }
  if (typeof d.steps === 'number') d.steps = Math.round(d.steps * (0.7 + 0.3 * move));
  return d;
}
let demoCache = null;
export function demoMembers(myDays, myGame, meName) {
  if (!demoCache) {
    demoCache = DEMO.map(([name, seed, sleep, move], i) => {
      const data = makeDemo({ seed });
      const days = computeAll(data.days.map((d) => habits(d, sleep, move)), data.profile).days;
      const g = playGame(days);
      return { id: `demo-${i}`, name, me: false, days: days.map((d) => shareDay(d, g.byDate[d.date].points)) };
    });
  }
  return [{ id: 'demo-me', name: meName, me: true, days: myDays.map((d) => shareDay(d, myGame.byDate[d.date]?.points ?? 0)) }, ...demoCache];
}
