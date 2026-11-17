import test from 'node:test';
import assert from 'node:assert/strict';
import { makeDemo } from '../js/data/demo.js';
import { syncGoogle } from '../js/data/health.js';
import { computeAll } from '../js/core/scores.js';
import { createMockHealth } from './mock-health.js';

const now = new Date(2026, 10, 17, 21, 40);
const truth = makeDemo({ now });
const getToken = async () => 'test-token';
const run = (opts = {}, extra = {}) => { const mock = createMockHealth(truth.days, opts); return syncGoogle({ getToken, fetchImpl: mock.fetchImpl, minGap: 0, now, ...extra }).then((data) => ({ data, mock })); };

test('a full sync through the adapter reproduces what the server holds', async () => {
  const { data, mock } = await run();
  assert.equal(data.days.length, 28);
  assert.deepEqual(data.issues.filter((i) => !i.ok), []);
  const want = Object.fromEntries(truth.days.map((d) => [d.date, d]));
  for (const got of data.days) {
    const w = want[got.date];
    assert.deepEqual(got.hr, w.hr, `${got.date} heart rate`);
    for (const k of ['rhr', 'hrv', 'br', 'vo2max', 'steps', 'calories']) assert.equal(got[k], w[k], `${got.date} ${k}`);
    assert.ok(Math.abs(got.skinTemp - w.skinTemp) < 0.011, `${got.date} skin temperature`);
    assert.ok(Math.abs(got.distance - w.distance) < 0.011);
    assert.deepEqual(got.azm, w.azm);
    assert.equal(got.spo2.avg, w.spo2.avg);
    assert.equal(got.sleep?.start, w.sleep?.start);
    assert.equal(got.sleep?.asleepMin, w.sleep?.asleepMin);
    assert.deepEqual(got.sleep?.stages, w.sleep?.stages);
    assert.deepEqual(got.workouts.map((x) => [x.name, x.t0, x.t1, x.avgHr, x.maxHr]), [...w.workouts].sort((x, y) => x.t0 - y.t0).map((x) => [x.name, x.t0, x.t1, x.avgHr, x.maxHr]));
  }
  assert.equal(data.profile.age, 33);
  assert.equal(data.device.name, 'Fitbit Air');
  // same scores as the source data, for the days that share a baseline window
  const a = computeAll(data.days, data.profile).days.at(-1), b = computeAll(truth.days.slice(-28), truth.profile).days.at(-1);
  assert.equal(a.strain, b.strain);
  assert.equal(a.recovery, b.recovery);
  // heart rate was asked for in chunks of 14 days or fewer
  const spans = mock.log.filter((r) => r.path.endsWith('heart-rate/dataPoints:rollUp')).map((r) => (Date.parse(r.body.range.endTime) - Date.parse(r.body.range.startTime)) / 86400000);
  assert.ok(spans.length >= 2 && spans.every((s) => s <= 14.05));
});

test('one refused data type is reported, not fatal', async () => {
  const { data } = await run({ deny: ['daily-oxygen-saturation', 'sleep'] });
  const bad = data.issues.filter((i) => !i.ok).map((i) => [i.type, i.status, i.reason]);
  assert.deepEqual(bad.sort(), [['daily-oxygen-saturation', 403, 'MISSING_OAUTH_SCOPE'], ['sleep', 403, 'MISSING_OAUTH_SCOPE']]);
  const last = data.days.at(-1);
  assert.equal(last.spo2, null);
  assert.equal(last.sleep, null);
  assert.ok(last.hr.some((v) => v != null) && last.rhr != null);
  const d = computeAll(data.days, data.profile).days.at(-1);
  assert.ok(d.strain > 0 && d.recovery != null && d.sleepPct == null);
});

test('falls back to plain list when reconcile is refused', async () => {
  const { data, mock } = await run({ noReconcile: true });
  assert.deepEqual(data.issues.filter((i) => !i.ok), []);
  assert.ok(data.days.at(-2).sleep && data.days.at(-2).rhr);
  assert.ok(mock.log.some((r) => r.path.endsWith('/sleep/dataPoints')));
});

test('an expired token and an unlinked account surface as such', async () => {
  let forced = 0;
  const mock = createMockHealth(truth.days, { unauthorized: true });
  await assert.rejects(syncGoogle({ getToken: async (o) => { if (o?.force) forced++; return 't'; }, fetchImpl: mock.fetchImpl, minGap: 0, now }), (e) => e.status === 401);
  assert.equal(forced, 1, 'one forced refresh is tried before giving up');
  await assert.rejects(run({ notLinked: true }), (e) => e.reason === 'ACCOUNT_NOT_LINKED' && /Google Health/.test(e.message));
});

test('a second sync only asks for the days it lacks and keeps the rest', async () => {
  const first = await run();
  const later = new Date(now.getTime() + 20 * 60000);
  const mock = createMockHealth(truth.days);
  const data = await syncGoogle({ getToken, fetchImpl: mock.fetchImpl, minGap: 0, now: later, known: first.data });
  assert.equal(data.days.length, 28);
  const hrCalls = mock.log.filter((r) => r.path.endsWith('heart-rate/dataPoints:rollUp'));
  assert.equal(hrCalls.length, 1);
  assert.ok((Date.parse(hrCalls[0].body.range.endTime) - Date.parse(hrCalls[0].body.range.startTime)) / 86400000 < 3.1);
});

test('another person’s cached days are never merged into a sync', async () => {
  const theirs = { userId: 'someone-else', profile: {}, days: [{ ...truth.days[0], date: '2026-10-01', steps: 99999, partial: false }] };
  const { data } = await run({}, { known: theirs });
  assert.equal(data.userId, '111111256096816351');
  assert.ok(!data.days.some((d) => d.steps === 99999));
});
