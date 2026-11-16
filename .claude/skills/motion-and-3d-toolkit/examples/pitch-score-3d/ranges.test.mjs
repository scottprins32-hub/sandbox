import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const R = createRequire(import.meta.url)('./ranges.js');
const ref = (low, high) => ({ low, high, source: 'test' });
test('inside the range scores 100 and is ok', () => { assert.deepEqual(R.judge(50, 35, 65), { dist: 0, score: 100, status: 'ok', side: 'ok' }); });
test('one degree under a 30-degree range is close and scores 97', () => { const j = R.judge(34, 35, 65); assert.equal(j.status, 'close'); assert.equal(j.score, 97); });
test('far outside is out and never below 0', () => { const j = R.judge(-100, 35, 65); assert.equal(j.status, 'out'); assert.equal(j.score, 0); });
test('phases below their frame rate are not scored and do not count', () => {
  const m = [{ key: 'stride_length_pct', value: 84, reference: ref(75, 90) }, { key: 'shoulder_abduction_fc', value: 97, reference: ref(80, 105) },
             { key: 'trunk_forward_tilt_br', value: 10, reference: ref(25, 43) }];
  const r = R.evaluate(m, 30);
  assert.equal(r.phases.find(p => p.id === 'stride').scored, true);
  assert.equal(r.phases.find(p => p.id === 'arm').scored, false);
  assert.equal(r.phases.find(p => p.id === 'release').cards[0].status, 'na');
  assert.equal(r.overall, null); assert.equal(r.partial, 100); assert.match(r.reason, /1 of 4 phases/); assert.equal(r.measures, 1); assert.deepEqual(r.unscored, ['Rotation', 'Arm', 'Release']);
});
test('at 120 fps every phase with data is scored', () => {
  const m = [{ key: 'trunk_forward_tilt_br', value: 10, reference: ref(25, 43) }];
  const r = R.evaluate(m, 120); const rel = r.phases.find(p => p.id === 'release');
  assert.equal(rel.scored, true); assert.equal(rel.cards[0].status, 'out'); assert.equal(r.overall, null); assert.equal(r.partial, rel.score);
});
test('metrics without a reference never become cards', () => { assert.equal(R.evaluate([{ key: 'arm_slot', value: 22, reference: null }], 120).measures, 0); });
test('three scored phases give a total', () => {
  const m = [{ key: 'stride_length_pct', value: 84, reference: ref(75, 90) }, { key: 'separation_fc', value: 34, reference: ref(35, 65) }, { key: 'shoulder_abduction_fc', value: 97, reference: ref(80, 105) }];
  const r = R.evaluate(m, 60); assert.equal(r.scoredPhases, 3); assert.equal(r.overall, 99); assert.equal(r.reason, '');
});
