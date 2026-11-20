import test from 'node:test';
import assert from 'node:assert/strict';
import { analyseDay, bandOf, loadFromStrain, minuteLoad, strainFromLoad, targetFor } from '../js/core/strain.js';
import { computeAll, recoveryScore, sleepScore } from '../js/core/scores.js';
import { makeDemo } from '../js/data/demo.js';

const RHR = 60, MAX = 185;
const bpm = (share) => Math.round(RHR + share * (MAX - RHR));
const dayWith = (blocks) => { const hr = new Array(1440).fill(RHR + 8); let m = 600; for (const [min, share] of blocks) { hr.fill(bpm(share), m, m + min); m += min; } return hr; };
const strainOf = (blocks) => analyseDay(dayWith(blocks), RHR, MAX).strain;

test('strain lands on the published WHOOP reference points', () => {
  const near = (v, lo, hi, what) => assert.ok(v >= lo && v <= hi, `${what}: ${v.toFixed(2)} not in ${lo}–${hi}`);
  near(strainOf([[60, 0.40]]), 5.8, 7.2, '1 h walk (WHOOP ≈ 6.5)');
  near(strainOf([[30, 0.62]]), 8, 10.5, 'easy 30 min jog');
  near(strainOf([[60, 0.67]]), 11.5, 13.5, '1 h run (WHOOP ≈ 12)');
  near(strainOf([[60, 0.82]]), 14, 16.5, 'hard hour');
  near(strainOf([[210, 0.80]]), 19.5, 20.8, 'marathon (WHOOP ≈ 20.4)');
});

test('strain is zero at rest, never exceeds 21, and each point costs more than the last', () => {
  assert.equal(strainOf([]), 0);
  assert.equal(strainOf([[600, 0.95]]), 21);
  assert.equal(minuteLoad(0.29), 0);
  assert.ok(minuteLoad(0.3) < 1e-9, 'load starts from zero at the floor, with no jump');
  const cost = (s) => loadFromStrain(s + 1) - loadFromStrain(s);
  for (let s = 0; s < 19; s++) assert.ok(cost(s + 1) > cost(s));
  assert.ok(Math.abs(strainFromLoad(loadFromStrain(13.7)) - 13.7) < 1e-9);
});

test('a gap in wear does not break the day, and bands follow WHOOP', () => {
  const hr = dayWith([[45, 0.7]]);
  hr.fill(null, 0, 360);
  const a = analyseDay(hr, RHR, MAX);
  assert.equal(a.worn, 1080);
  assert.ok(a.strain > 9);
  assert.deepEqual([9.9, 10, 13.9, 14, 17.9, 18, 21].map((s) => bandOf(s).name), ['Light', 'Moderate', 'Moderate', 'High', 'High', 'All out', 'All out']);
  assert.deepEqual(targetFor(33), { lo: 8.8, hi: 21 }, 'a minimum: anything from 8.8 up counts');
  assert.equal(targetFor(null), null);
});

test('recovery needs a baseline and moves the right way', () => {
  const base = { lnHrv: { mean: Math.log(60), sd: 0.12 }, rhr: { mean: 55, sd: 2 }, br: { mean: 14, sd: 0.4 } };
  const r = (d, sleep = 85) => recoveryScore(d, base, sleep).score;
  assert.ok(r({ hrv: 60, rhr: 55, br: 14 }) > 50 && r({ hrv: 60, rhr: 55, br: 14 }) < 70, 'an ordinary morning reads mid-range');
  assert.ok(r({ hrv: 80, rhr: 51, br: 14 }) > 80);
  assert.ok(r({ hrv: 40, rhr: 62, br: 15 }, 60) < 20);
  assert.equal(recoveryScore({ hrv: 60, rhr: 55 }, { lnHrv: null, rhr: null, br: null }, 85), null, 'no baseline, no score');
});

test('sleep score rewards enough, efficient, staged sleep', () => {
  const night = (hours, wakeShare = 0.06) => {
    const start = new Date(2026, 10, 16, 23, 0).getTime(), end = start + hours * 3600000, stages = [];
    for (let t = start; t < end; t += 1800000) stages.push({ s: ['light', 'deep', 'light', 'rem'][stages.length % 4], t0: t, t1: Math.min(end, t + 1800000) });
    stages.push({ s: 'wake', t0: end, t1: end + hours * 3600000 * wakeShare });
    return { start, end: end + hours * 3600000 * wakeShare, stages };
  };
  assert.ok(sleepScore(night(8), 456, null).score >= 90);
  assert.ok(sleepScore(night(5), 456, null).score < 75);
  assert.equal(sleepScore(null, 456, null), null);
});

test('a month of demo data produces sane, complete days', () => {
  const demo = makeDemo({ now: new Date(2026, 10, 17, 21, 40) });
  const { days } = computeAll(demo.days, demo.profile);
  assert.equal(days.length, 42);
  for (const d of days.slice(5)) {
    assert.ok(d.strain >= 0 && d.strain <= 21, `${d.date} strain ${d.strain}`);
    assert.ok(d.recovery >= 1 && d.recovery <= 99, `${d.date} recovery ${d.recovery}`);
    assert.ok(d.sleepPct > 40 && d.sleepPct <= 100, `${d.date} sleep ${d.sleepPct}`);
    for (const w of d.workouts) assert.ok(w.strain <= d.strain + 1e-9, 'a session never exceeds its day');
  }
  assert.equal(days[1].recovery, null, 'recovery waits for three nights of baseline');
});
