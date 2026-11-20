import test from 'node:test';
import assert from 'node:assert/strict';
import { BADGES, DAY_MAX, LEVELS, POINTS, dayPoints, levelOf, playGame, weekStart } from '../js/core/game.js';
import { challengeBoard, challengeOf, leaderboard, pastWinners, shareDay, weekBoard, winCounts } from '../js/core/team.js';
import { computeAll } from '../js/core/scores.js';
import { makeDemo } from '../js/data/demo.js';

const day = (o = {}) => ({ date: '2026-11-10', strain: 12, target: { lo: 11, hi: 13.4 }, sleepPct: 90, azm: { total: 30 }, sleep: { end: 0 }, partial: false, distance: 0, steps: 0, workouts: [], ...o });

test('the strain target is a minimum: reaching it earns the points, going further changes nothing', () => {
  assert.equal(DAY_MAX, 10);
  assert.equal(dayPoints(day()).points, 10);
  assert.equal(dayPoints(day({ strain: 18 })).parts.find((p) => p.key === 'target').points, POINTS.target, 'well above the minimum still counts');
  assert.equal(dayPoints(day({ strain: 10 })).parts.find((p) => p.key === 'target').points, POINTS.close, 'within 1.5 below it earns something');
  assert.equal(dayPoints(day({ strain: 9 })).parts.find((p) => p.key === 'target').points, 0);
  assert.equal(dayPoints(day({ sleepPct: 75 })).parts.find((p) => p.key === 'sleep').points, POINTS.sleptOk);
  assert.equal(dayPoints(day({ azm: { total: 10 }, sleep: null, sleepPct: null })).points, POINTS.target);
});

test('today keeps unearned training open instead of calling it a miss', () => {
  const t = dayPoints(day({ partial: true, strain: 6, sleepPct: 60, azm: { total: 4 } }));
  const target = t.parts.find((p) => p.key === 'target');
  assert.equal(target.got, false);
  assert.equal(target.open, true);
  assert.equal(t.parts.find((p) => p.key === 'sleep').open, false, 'last night is settled');
});

test('levels rise with XP and never skip', () => {
  assert.equal(levelOf(0).n, 1);
  assert.equal(levelOf(0).name, 'Starter');
  assert.equal(levelOf(149).n, 2);
  assert.equal(levelOf(149).toGo, 1);
  assert.equal(levelOf(99999).next, null);
  for (let i = 1; i < LEVELS.length; i++) assert.ok(LEVELS[i].xp > LEVELS[i - 1].xp);
});

test('weeks start on Monday', () => {
  assert.equal(weekStart('2026-11-16'), '2026-11-16');   // Monday
  assert.equal(weekStart('2026-11-22'), '2026-11-16');   // Sunday
  assert.equal(weekStart('2026-11-23'), '2026-11-23');
});

test('XP keeps the points of days that left the synced window', () => {
  const demo = makeDemo({ now: new Date(2026, 10, 17, 21, 40) });
  const days = computeAll(demo.days, demo.profile).days;
  const g = playGame(days);
  const settled = g.timeline.filter((e) => !e.partial).reduce((a, e) => a + e.points, 0);
  assert.equal(g.xp, settled + g.timeline.at(-1).points);
  g.timeline.forEach((e) => assert.ok(e.points >= 0 && e.points <= DAY_MAX));
  const later = playGame(days.slice(10), g.ledger);
  assert.equal(later.xp, g.xp, 'the ledger remembers the first ten days');
  assert.equal(playGame(days.slice(10)).xp < g.xp, true);
  assert.ok(g.week.points <= g.week.max);
  const earned = g.badges.filter((b) => b.earned).length;
  assert.ok(earned >= 3 && earned < g.badges.length, `${earned} medals`);
});

test('badges: rest after a hard day, five days on target, 200 km', () => {
  const keys = Array.from({ length: 10 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
  const run = keys.map((k, i) => day({ date: k, strain: i === 2 ? 15 : i === 3 ? 6 : 12, distance: 22 }));
  const by = Object.fromEntries(BADGES.map((b) => [b.id, b.check(run)]));
  assert.equal(by.rustdag.at, '2026-11-04');
  assert.equal(by.deltawerken.at, '2026-11-09', 'the run restarts after the off-target days');
  assert.equal(by.elfsteden.at, '2026-11-10');
  assert.equal(by.oranjeboven.at, null);
});

test('team: standings, past winners, challenge and leaderboards', () => {
  const d = (date, o) => ({ date, points: 5, strain: 10, recovery: 60, sleep: 80, rhr: 55, hrv: 60, sleepMin: 420, azm: 20, steps: 8000, inTarget: false, ...o });
  const members = [
    { id: 'a', name: 'Anna', me: true, days: [d('2026-11-09', { points: 9 }), d('2026-11-16', { points: 7, sleep: 90, rhr: 50 }), d('2026-11-17', { points: 6 })] },
    { id: 'b', name: 'Bram', days: [d('2026-11-09', { points: 4 }), d('2026-11-16', { points: 10, sleep: 70, rhr: 60 })] },
    { id: 'c', name: 'Cas', days: [] },
  ];
  const board = weekBoard(members, '2026-11-16');
  assert.deepEqual(board.map((r) => [r.name, r.value, r.place]), [['Anna', 13, 1], ['Bram', 10, 2], ['Cas', 0, 3]]);
  assert.deepEqual(pastWinners(members, '2026-11-16', 2)[0].winners.map((r) => r.name), ['Anna']);
  assert.deepEqual(winCounts(members, '2026-11-16'), { a: 1, b: 0, c: 0 });
  assert.equal(challengeOf('2026-11-22').id, challengeOf('2026-11-16').id, 'one theme for the whole week');
  assert.notEqual(challengeOf('2026-11-16').id, challengeOf('2026-11-23').id, 'a new theme every week');
  const c = challengeBoard(members, '2026-11-16');
  assert.equal(c.rows.find((r) => r.name === 'Cas').value, null, 'no days, no score');
  const rhr = leaderboard(members, '2026-11-17', 'rhr');
  assert.deepEqual(rhr.rows.filter((r) => r.place).map((r) => r.name), ['Anna', 'Bram'], 'lower resting heart rate ranks higher');
  const shared = shareDay(day({ recovery: 64.4, rhr: 51, hrv: 70.2, steps: 9000, sleepInfo: { asleep: 432 } }), 10);
  assert.deepEqual(shared, { date: '2026-11-10', points: 10, strain: 12, recovery: 64, sleep: 90, rhr: 51, hrv: 70, sleepMin: 432, azm: 30, steps: 9000, inTarget: true });
});
