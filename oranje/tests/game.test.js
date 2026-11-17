import test from 'node:test';
import assert from 'node:assert/strict';
import { BADGES, EARN, LEVELS, dayEarnings, levelAt, playGame } from '../js/core/game.js';
import { computeAll } from '../js/core/scores.js';
import { makeDemo } from '../js/data/demo.js';

const day = (o = {}) => ({ date: '2026-11-10', strain: 12, target: { lo: 11, hi: 13.4 }, sleepPct: 90, azm: { total: 30 }, sleep: { end: 0 }, partial: false, distance: 0, steps: 0, workouts: [], ...o });

test('levels climb from below sea level to the Alpe d’Huez', () => {
  assert.equal(levelAt(-6.76).level.name, 'Zuidplaspolder');
  assert.equal(levelAt(0).level.name, 'Sea level');
  assert.equal(levelAt(321).level.name, 'Cauberg');
  assert.equal(Math.round(levelAt(321).toGo), 1);
  assert.equal(levelAt(5000).next, null);
  for (let i = 1; i < LEVELS.length; i++) assert.ok(LEVELS[i].alt > LEVELS[i - 1].alt);
});

test('a balanced day earns the full amount, overdoing it does not', () => {
  const good = dayEarnings(day(), 1);
  assert.equal(good.metres, EARN.target + EARN.sleptWell + EARN.moved + EARN.overnight);
  const hard = dayEarnings(day({ strain: 18 }), 0);
  assert.equal(hard.parts.find((p) => p.key === 'target').metres, 0, 'going far past the target earns nothing for training');
  const close = dayEarnings(day({ strain: 14.5 }), 0);
  assert.equal(close.parts.find((p) => p.key === 'target').metres, EARN.close);
  assert.equal(dayEarnings(day(), 4).parts.find((p) => p.key === 'streak').metres, 3);
  assert.equal(dayEarnings(day(), 30).parts.find((p) => p.key === 'streak').metres, EARN.streakMax);
});

test('today keeps unearned training open instead of calling it a miss', () => {
  const t = dayEarnings(day({ partial: true, strain: 6, sleepPct: 60, azm: { total: 4 } }), 0);
  const target = t.parts.find((p) => p.key === 'target');
  assert.equal(target.got, false);
  assert.equal(target.open, true);
  assert.equal(t.parts.find((p) => p.key === 'sleep').open, false, 'last night is settled');
});

test('badges: rest after a hard day, five days on target, 200 km', () => {
  const keys = Array.from({ length: 10 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
  const run = keys.map((k, i) => day({ date: k, strain: i === 2 ? 15 : i === 3 ? 6 : 12, distance: 22 }));
  const by = Object.fromEntries(BADGES.map((b) => [b.id, b.check(run)]));
  assert.equal(by.rustdag.at, '2026-11-04');
  assert.equal(by.deltawerken.at, '2026-11-09', 'the run restarts after the off-target days');
  assert.equal(by.elfsteden.at, '2026-11-10');
  assert.equal(by.oranjeboven.at, null);
  assert.ok(Math.abs(by.oranjeboven.progress - 15 / 18) < 1e-9);
});

test('a generated month climbs steadily and earns some medals, not all', () => {
  const demo = makeDemo({ now: new Date(2026, 10, 17, 21, 40) });
  const g = playGame(computeAll(demo.days, demo.profile).days);
  g.timeline.forEach((t) => assert.ok(t.to >= t.from && t.metres <= 31));
  assert.ok(g.alt > 322 && g.alt < 1850, `ended at ${g.alt}`);
  const earned = g.badges.filter((b) => b.earned).length;
  assert.ok(earned >= 3 && earned < g.badges.length, `${earned} medals`);
  assert.ok(g.reached.vaals);
});
