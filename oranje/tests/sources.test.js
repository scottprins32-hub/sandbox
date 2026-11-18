import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOfficial, whoopByDate, withWhoopVitals } from '../js/core/sources.js';
import { computeAll } from '../js/core/scores.js';
import { makeDemo } from '../js/data/demo.js';

const now = new Date(2026, 10, 17, 21, 40);
const demo = makeDemo({ now });
const last = demo.days.at(-1).date, prev = demo.days.at(-2).date;

test('WHOOP scores lead; Oranje estimates stay alongside and fill days WHOOP missed', () => {
  const whoop = whoopByDate([
    { date: last, strain: 4.5, recovery: 44, sleep: 68, hrv: 137, restingHeartRate: 47, sleepMinutes: 322, workouts: [] },
    { date: last, strain: 9.9, recovery: 99, sleep: 99, workouts: [] },   // an older cycle on the same date loses
  ]);
  const ctx = computeAll(demo.days, demo.profile);
  const before = ctx.byDate[last], other = { ...ctx.byDate[prev] };
  const est = { strain: before.strain, recovery: before.recovery, sleep: before.sleepPct };
  applyOfficial(ctx.days, whoop);
  const d = ctx.byDate[last];
  assert.equal(d.strain, 4.5); assert.equal(d.recovery, 44); assert.equal(d.sleepPct, 68); assert.equal(d.sleepInfo.score, 68);
  assert.deepEqual(d.src, { strain: 'whoop', recovery: 'whoop', sleep: 'whoop' });
  assert.deepEqual(d.est, est);
  assert.equal(d.band.name, 'Light');
  assert.deepEqual(d.target, { lo: 10.1, hi: 12.5 });   // the target follows WHOOP's recovery
  const p = ctx.byDate[prev];
  assert.equal(p.strain, other.strain); assert.equal(p.recovery, other.recovery);
  assert.equal(p.src.strain, 'oranje');
});

test('WHOOP readings fill only the vitals the band did not record', () => {
  const whoop = whoopByDate([{ date: last, hrv: 137, restingHeartRate: 47 }, { date: prev, hrv: 120, restingHeartRate: 50 }]);
  const days = demo.days.map((d) => (d.date === prev ? { ...d, rhr: null, hrv: null } : d));
  const out = withWhoopVitals(days, whoop);
  const a = out.find((d) => d.date === last), b = out.find((d) => d.date === prev);
  assert.equal(a.rhr, demo.days.at(-1).rhr); assert.equal(a.hrv, demo.days.at(-1).hrv);
  assert.equal(a.src?.rhr, undefined);
  assert.equal(b.rhr, 50); assert.equal(b.hrv, 120); assert.deepEqual(b.src, { rhr: 'whoop', hrv: 'whoop' });
  assert.equal(withWhoopVitals(days, null), days);
});
