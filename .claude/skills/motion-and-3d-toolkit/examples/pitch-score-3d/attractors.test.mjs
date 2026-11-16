import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const A = createRequire(import.meta.url)('./attractors.js');
const r = (key, value, low, high, minFps = 25, extra = {}) => ({ key, value, low, high, minFps, measurable: true, kind: 'range', ...extra });
test('inside the range scores 100', () => assert.deepEqual(A.judge(r('lock', 160, 150, 180)), { score: 100, status: 'ok' }));
test('wave counts pairs in order', () => { assert.equal(A.judge({ kind: 'count', value: 3, high: 3 }).status, 'ok'); const j = A.judge({ kind: 'count', value: 2, high: 3 }); assert.equal(j.score, 67); assert.equal(j.status, 'close'); });
test('a proxy faster than the frame rate is not scored', () => { const e = A.evaluate([r('close', 40, 15, 80, 100)], 30); assert.equal(e.cards[0].status, 'na'); assert.equal(e.scored, 0); });
test('an attractor without a proxy is never scored', () => { const e = A.evaluate([{ key: 'sagittal', measurable: false, why: 'x', value: null }], 120); assert.equal(e.cards[0].status, 'nm'); assert.equal(e.overall, null); });
test('no total below five scored attractors', () => { const e = A.evaluate([r('lock', 160, 150, 180), r('head', 3, 0, 6)], 30); assert.equal(e.overall, null); assert.equal(e.partial, 100); assert.match(e.reason, /2 of 2/); });
test('five scored attractors give a total', () => { const e = A.evaluate(['a', 'b', 'c', 'd', 'e'].map(k => r(k, 0, 0, 6)), 30); assert.equal(e.overall, 100); });
