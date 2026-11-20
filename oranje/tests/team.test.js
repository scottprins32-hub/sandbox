import test from 'node:test';
import assert from 'node:assert/strict';
import { seal, signedIn } from '../base44/shared/broker.js';
import { handleTeam, cleanName } from '../base44/shared/team.js';

const ORIGIN = 'https://oranje.test';
const ENV = { id: 'cid.apps.googleusercontent.com', secret: 'shh', appOrigin: ORIGIN };
const NOW = new Date('2026-11-20T12:00:00Z');
const day = (offset) => new Date(NOW.getTime() + offset * 86_400_000).toISOString().slice(0, 10);

// --- an in-memory stand-in for base44.asServiceRole.entities ------------------
function matches(row, query) {
  return Object.entries(query).every(([k, cond]) => {
    if (cond === null || typeof cond !== 'object') return row[k] === cond;
    return Object.entries(cond).every(([op, v]) => {
      if (op === '$gte') return row[k] >= v;
      if (op === '$lt') return row[k] < v;
      if (op === '$in') return v.includes(row[k]);
      throw new Error(`fake db: unsupported operator ${op}`);
    });
  });
}
function entity(name, log) {
  const rows = [];
  let n = 0;
  const copy = (r) => structuredClone(r);
  const stamp = () => new Date(Date.UTC(2026, 0, 1) + rows.length * 1000 + n * 7).toISOString();
  const sorted = (list, sort) => {
    if (!sort) return list.sort((a, b) => b.created_date.localeCompare(a.created_date));
    const desc = sort.startsWith('-'), f = sort.replace(/^-/, '');
    return list.sort((a, b) => String(a[f]).localeCompare(String(b[f])) * (desc ? -1 : 1));
  };
  const api = {
    rows,
    async filter(query, sort, limit = 5000) { log.push(`${name}.filter`); return sorted(rows.filter((r) => matches(r, query)), sort).slice(0, limit).map(copy); },
    async list(sort, limit = 5000) { log.push(`${name}.list`); return sorted([...rows], sort).slice(0, limit).map(copy); },
    async create(data) {
      log.push(`${name}.create`);
      const r = { ...structuredClone(data), id: `${name}-${++n}`, created_date: stamp(), updated_date: stamp() };
      rows.push(r);
      return copy(r);
    },
    async bulkCreate(list) { log.push(`${name}.bulkCreate`); const out = []; for (const d of list) { out.push(await api.create(d)); log.pop(); } return out; },
    async update(id, data) {
      log.push(`${name}.update`);
      const r = rows.find((x) => x.id === id);
      if (!r) throw new Error('not found');
      Object.assign(r, structuredClone(data), { updated_date: stamp() });
      return copy(r);
    },
    async bulkUpdate(list) {
      log.push(`${name}.bulkUpdate`);
      assert.ok(list.length <= 500);
      for (const { id, ...fields } of list) { await api.update(id, fields); log.pop(); }
    },
    async delete(id) { log.push(`${name}.delete`); const i = rows.findIndex((x) => x.id === id); if (i >= 0) rows.splice(i, 1); },
    async deleteMany(query) {
      log.push(`${name}.deleteMany`);
      for (let i = rows.length - 1; i >= 0; i--) if (matches(rows[i], query)) rows.splice(i, 1);
    },
  };
  return api;
}
function fakeDb() {
  const log = [];
  return { log, TeamMember: entity('TeamMember', log), TeamDay: entity('TeamDay', log) };
}

// --- requests -------------------------------------------------------------------
const jar = async (who, env = ENV) => `oranje_rt=${await seal(env, 'refresh-value')}; oranje_who=${await seal(env, JSON.stringify(who))}`;
const ANNA = { name: 'Anna Maria', email: 'anna@example.com' };
const BOB = { name: 'Bob', email: 'bob@example.com' };

function req(action, { method = 'GET', cookie, origin = ORIGIN, headers = {}, body } = {}) {
  const h = { ...headers };
  if (origin) h.origin = origin;
  if (cookie) h.cookie = cookie;
  if (body !== undefined) h['content-type'] = 'application/json';
  return new Request(`${ORIGIN}/functions/team?action=${action}`, { method, headers: h, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
}
async function call(db, action, opts = {}, now = NOW) {
  const res = await handleTeam(req(action, opts), ENV, db, now);
  const text = await res.text();
  return { status: res.status, res, text, json: text ? JSON.parse(text) : null };
}
const as = async (who) => ({ cookie: await jar(who) });

test('signedIn trusts only our sealed cookies', async () => {
  const r = (cookie) => new Request(`${ORIGIN}/x`, { headers: cookie ? { cookie } : {} });
  assert.deepEqual(await signedIn(r(await jar({ name: 'Anna', email: ' Anna@Example.com ' })), ENV), { name: 'Anna', email: 'anna@example.com' });
  assert.equal(await signedIn(r(), ENV), null);
  const who = (await jar(ANNA)).split('; ')[1];
  assert.equal(await signedIn(r(who), ENV), null, 'no refresh token cookie');
  assert.equal(await signedIn(r(await jar(ANNA, { ...ENV, secret: 'other' })), ENV), null, 'sealed with another key');
  assert.equal(await signedIn(r('oranje_rt=x; oranje_who=' + Buffer.from(JSON.stringify(ANNA)).toString('base64url')), ENV), null, 'unsealed JSON');
  assert.equal(await signedIn(r(await jar({ name: 'Anna', email: '' })), ENV), null, 'empty email');
  assert.equal(await signedIn(r(await jar({ name: 'Anna' })), ENV), null, 'no email');
  assert.equal(await signedIn(r(await jar(ANNA)), { ...ENV, id: '' }), null, 'Google not configured');
  assert.equal(await signedIn(r('oranje_rt=%E0%A4%A; oranje_who=%'), ENV), null, 'malformed cookie header');
});

test('other sites, wrong methods and unknown actions are refused', async () => {
  const db = fakeDb();
  const cookie = await jar(ANNA);
  assert.deepEqual((await call(db, 'state', { cookie, origin: 'https://evil.example' })).json, { error: 'cross_site' });
  assert.equal((await call(db, 'join', { method: 'POST', cookie, origin: 'https://evil.example', body: { name: 'x' } })).status, 403);
  assert.equal((await call(db, 'leave', { method: 'POST', cookie, origin: null })).status, 403, 'no Origin and no Sec-Fetch-Site');
  assert.equal((await call(db, 'state', { cookie, origin: null, headers: { 'sec-fetch-site': 'cross-site' } })).status, 403);
  assert.equal((await call(db, 'state', { cookie, origin: null, headers: { 'sec-fetch-site': 'same-origin' } })).status, 200);
  assert.equal((await call(db, 'state', { method: 'POST', cookie })).status, 405);
  assert.equal((await call(db, 'sync', { cookie })).status, 405);
  assert.equal((await call(db, 'nope', { cookie })).status, 404);
  assert.equal((await call(db, 'constructor', { cookie })).status, 404);
  assert.equal(db.TeamMember.rows.length, 0);
  const { res } = await call(db, 'state', { cookie });
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.match(res.headers.get('content-type'), /^application\/json/);
});

test('not signed in: empty state and every change refused', async () => {
  const db = fakeDb();
  const empty = { configured: true, signedIn: false, joined: false, me: null, members: [] };
  assert.deepEqual((await call(db, 'state')).json, empty);
  assert.deepEqual((await call(db, 'state', { cookie: (await jar(ANNA)).split('; ')[1] })).json, empty, 'name cookie alone is not enough');
  for (const action of ['join', 'sync', 'leave']) {
    const r = await call(db, action, { method: 'POST', body: { name: 'Anna', email: ANNA.email, days: [] } });
    assert.equal(r.status, 401, action);
    assert.deepEqual(r.json, { error: 'not_signed_in' });
  }
  assert.equal(db.TeamMember.rows.length, 0);
  assert.deepEqual((await handleTeam(req('state'), { ...ENV, id: '' }, db, NOW).then((r) => r.json())).configured, false);
});

test('join creates one member; joining again renames instead of duplicating', async () => {
  const db = fakeDb();
  const anna = await as(ANNA);
  const first = await call(db, 'join', { method: 'POST', ...anna, body: { name: 'Anna' } });
  assert.equal(first.status, 200);
  assert.equal(first.json.joined, true);
  assert.deepEqual(first.json.me, { id: db.TeamMember.rows[0].id, name: 'Anna' });
  assert.deepEqual(first.json.members, [{ id: db.TeamMember.rows[0].id, name: 'Anna', me: true, days: [] }]);
  assert.deepEqual(db.TeamMember.rows.map(({ email, name, joined }) => ({ email, name, joined })), [{ email: 'anna@example.com', name: 'Anna', joined: '2026-11-20' }]);

  const again = await call(db, 'join', { method: 'POST', ...anna, body: { name: 'Anna B' } });
  assert.equal(db.TeamMember.rows.length, 1);
  assert.equal(again.json.me.name, 'Anna B');
  assert.equal(again.json.me.id, first.json.me.id);

  // a duplicate left by a race collapses to the oldest record on the next join
  await db.TeamMember.create({ email: ANNA.email, name: 'Dup', joined: '2026-11-20' });
  assert.equal((await call(db, 'state', anna)).json.members.length, 1, 'state never shows a duplicate');
  await call(db, 'join', { method: 'POST', ...anna, body: { name: 'Anna' } });
  assert.deepEqual(db.TeamMember.rows.map((r) => [r.id, r.name]), [[first.json.me.id, 'Anna']]);

  // the email the browser claims is ignored: identity comes from the cookie
  await call(db, 'join', { method: 'POST', ...anna, body: { name: 'Eve', email: 'eve@example.com' } });
  assert.deepEqual(db.TeamMember.rows.map((r) => r.email), ['anna@example.com']);
});

test('names are sanitised, with the Google first name as fallback', async () => {
  assert.equal(cleanName('  <b>Anna</b>\u0000 \n\t Bos  '), 'bAnna/b Bos');
  assert.equal(cleanName('‮evil‬ name'), 'evil name');
  assert.equal(cleanName('x'.repeat(40)), 'x'.repeat(24));
  assert.equal(cleanName('👩‍👩‍👧 Fam'), '👩‍👩‍👧 Fam');
  assert.equal(Array.from(cleanName('😀'.repeat(30))).length, 24, 'cut by characters, not UTF-16 halves');
  assert.equal(cleanName(42), '');

  const db = fakeDb();
  const join = async (who, body) => (await call(db, 'join', { method: 'POST', ...(await as(who)), body })).json.me.name;
  assert.equal(await join(ANNA, { name: '   ' }), 'Anna');
  assert.equal(await join(ANNA, { name: { toString: 'x' } }), 'Anna');
  assert.equal(await join(ANNA, {}), 'Anna');
  assert.equal(await join({ name: '', email: 'c@example.com' }, { name: '<>' }), 'Member');
  assert.equal(await join({ name: '<script>', email: 'd@example.com' }, {}), 'script');
  assert.equal(await join(BOB, { name: 'A   very  long name that goes on and on' }), 'A very long name that go');
  assert.ok(db.TeamMember.rows.every((r) => r.name.length >= 1 && r.name.length <= 24));
});

test('sync requires joining and validates every day', async () => {
  const db = fakeDb();
  const anna = await as(ANNA);
  const sync = (body, opts = {}) => call(db, 'sync', { method: 'POST', ...anna, body, ...opts });
  assert.deepEqual((await sync({ days: [{ date: day(0), points: 5 }] })).json, { error: 'not_joined' });
  assert.equal((await sync({ days: [] })).status, 409);
  assert.equal(db.TeamDay.rows.length, 0);

  await call(db, 'join', { method: 'POST', ...anna, body: { name: 'Anna' } });
  assert.equal((await sync({ days: 'nope' })).status, 400);
  assert.equal((await sync('not json')).status, 400);
  assert.equal((await sync([1, 2])).status, 400);
  const tooMany = await sync({ days: Array.from({ length: 64 }, (_, i) => ({ date: day(-i), points: 1 })) });
  assert.deepEqual([tooMany.status, tooMany.json], [400, { error: 'too_many_days' }]);
  const big = await sync(JSON.stringify({ days: [], pad: 'x'.repeat(70_000) }));
  assert.deepEqual([big.status, big.json], [413, { error: 'too_large' }]);
  assert.equal(db.TeamDay.rows.length, 0);

  const r = await sync({ days: [
    { date: day(0), points: 7.4, strain: 12.456, recovery: 80.6, sleep: 91, rhr: 52.5, hrv: 61.234, sleepMin: 431.2, azm: 33, steps: 10234, inTarget: true, email: 'bob@example.com', key: 'x' },
    { date: day(-1), points: 11, strain: 22, recovery: -1, sleep: '90', rhr: 10, hrv: 0, sleepMin: 2000, azm: NaN, steps: 1e9, inTarget: 'yes' },
    { date: day(1), points: 3 },          // tomorrow: allowed (time zones)
    { date: day(2), points: 3 },          // too far ahead
    { date: day(-120), points: 2 },       // oldest allowed
    { date: day(-121), points: 2 },       // too old
    { date: '2026-02-30', points: 2 },    // not a real date
    { date: '2026-1-05', points: 2 },
    { date: '2026-11-19T00:00', points: 2 },
    null, 'x', { points: 4 },
  ] });
  assert.deepEqual(r.json, { ok: true, saved: 4 });
  const rows = Object.fromEntries(db.TeamDay.rows.map((x) => [x.date, x]));
  assert.deepEqual(Object.keys(rows).sort(), [day(-120), day(-1), day(0), day(1)].sort());
  const t = rows[day(0)];
  assert.deepEqual({ ...t, id: undefined, created_date: undefined, updated_date: undefined }, {
    email: 'anna@example.com', date: day(0), key: `anna@example.com|${day(0)}`, points: 7, strain: 12.46, recovery: 81, sleep: 91,
    rhr: 52.5, hrv: 61.23, sleepMin: 431, azm: 33, steps: 10234, inTarget: true, id: undefined, created_date: undefined, updated_date: undefined,
  });
  const bad = rows[day(-1)];
  for (const k of ['points', 'strain', 'recovery', 'sleep', 'rhr', 'hrv', 'sleepMin', 'azm', 'steps', 'inTarget']) assert.equal(bad[k] ?? null, null, k);
});

test('sync upserts by member and date, with one read, and prunes old days', async () => {
  const db = fakeDb();
  const anna = await as(ANNA), bob = await as(BOB);
  await call(db, 'join', { method: 'POST', ...anna, body: {} });
  await call(db, 'join', { method: 'POST', ...bob, body: {} });
  await db.TeamDay.create({ email: ANNA.email, date: day(-130), key: 'old', points: 1 });
  await db.TeamDay.create({ email: BOB.email, date: day(-130), key: 'old-bob', points: 1 });
  const sync = (who, days) => call(db, 'sync', { method: 'POST', ...who, body: { days } });

  await sync(anna, [{ date: day(-2), points: 4 }, { date: day(-1), points: 5 }]);
  assert.equal(db.TeamDay.rows.filter((r) => r.email === ANNA.email).length, 2, "Anna's old day was pruned");
  assert.equal(db.TeamDay.rows.filter((r) => r.email === BOB.email).length, 1, "Bob's old day waits for Bob's own sync");
  await sync(bob, [{ date: day(-1), points: 9 }]);
  assert.deepEqual(db.TeamDay.rows.filter((r) => r.email === BOB.email).map((r) => r.date), [day(-1)]);

  db.log.length = 0;
  const r = await sync(anna, [{ date: day(-2), points: 4 }, { date: day(-1), points: 6, steps: 9000 }, { date: day(0), points: 2 }, { date: day(0), points: 3 }]);
  assert.deepEqual(r.json, { ok: true, saved: 3 });
  assert.deepEqual(db.log, ['TeamMember.filter', 'TeamDay.filter', 'TeamDay.bulkUpdate', 'TeamDay.bulkCreate', 'TeamDay.deleteMany']);
  const annas = db.TeamDay.rows.filter((r) => r.email === ANNA.email).sort((a, b) => a.date.localeCompare(b.date));
  assert.deepEqual(annas.map((x) => [x.date, x.points, x.steps ?? null]), [[day(-2), 4, null], [day(-1), 6, 9000], [day(0), 3, null]]);
  assert.equal(db.TeamDay.rows.find((x) => x.email === BOB.email && x.date === day(-1)).points, 9, "Bob's day untouched");

  // a value that turns invalid is cleared, not kept
  await sync(anna, [{ date: day(-1), points: 6, steps: -5 }]);
  assert.equal(db.TeamDay.rows.find((x) => x.email === ANNA.email && x.date === day(-1)).steps, null);

  // nothing changed: no writes
  db.log.length = 0;
  await sync(anna, [{ date: day(-2), points: 4 }]);
  assert.deepEqual(db.log, ['TeamMember.filter', 'TeamDay.filter', 'TeamDay.deleteMany']);
});

test('state for members: everyone\'s last 63 days, oldest first, and never an email', async () => {
  const db = fakeDb();
  const anna = await as(ANNA), bob = await as(BOB), carol = await as({ name: 'Carol', email: 'carol@example.com' });
  await call(db, 'join', { method: 'POST', ...anna, body: { name: 'Anna' } });
  await call(db, 'join', { method: 'POST', ...bob, body: { name: 'Bob' } });
  await call(db, 'sync', { method: 'POST', ...anna, body: { days: [{ date: day(0), points: 8, strain: 14.2, inTarget: true }, { date: day(-5), points: 3 }, { date: day(-62), points: 1 }, { date: day(-63), points: 1 }] } });
  await call(db, 'sync', { method: 'POST', ...bob, body: { days: [{ date: day(-1), points: 6, recovery: 70 }] } });

  const outsider = (await call(db, 'state', carol)).json;
  assert.deepEqual(outsider, { configured: true, signedIn: true, joined: false, me: null, members: [], count: 2 });

  const { json, text } = await call(db, 'state', bob);
  assert.equal(json.joined, true);
  assert.equal(json.me.name, 'Bob');
  const a = json.members.find((m) => m.name === 'Anna'), b = json.members.find((m) => m.name === 'Bob');
  assert.deepEqual([a.me, b.me], [false, true]);
  assert.equal(b.id, json.me.id);
  assert.deepEqual(a.days.map((d) => d.date), [day(-62), day(-5), day(0)], 'oldest first, 63-day window');
  assert.deepEqual(a.days[2], { date: day(0), points: 8, strain: 14.2, recovery: null, sleep: null, rhr: null, hrv: null, sleepMin: null, azm: null, steps: null, inTarget: true });
  assert.deepEqual(b.days, [{ date: day(-1), points: 6, strain: null, recovery: 70, sleep: null, rhr: null, hrv: null, sleepMin: null, azm: null, steps: null, inTarget: null }]);
  assert.deepEqual(Object.keys(json.members[0]).sort(), ['days', 'id', 'me', 'name']);
  assert.ok(!/@|example\.com|"email"|"key"/.test(text), 'no email anywhere');
  assert.ok(!/@|example\.com/.test((await call(db, 'join', { method: 'POST', ...anna, body: {} })).text));
});

test('leave deletes the member and every day they shared', async () => {
  const db = fakeDb();
  const anna = await as(ANNA), bob = await as(BOB);
  assert.deepEqual((await call(db, 'leave', { method: 'POST', ...anna })).json, { ok: true }, 'leaving when not joined is fine');
  await call(db, 'join', { method: 'POST', ...anna, body: {} });
  await call(db, 'join', { method: 'POST', ...bob, body: {} });
  await call(db, 'sync', { method: 'POST', ...anna, body: { days: [{ date: day(0), points: 8 }] } });
  await call(db, 'sync', { method: 'POST', ...bob, body: { days: [{ date: day(0), points: 4 }] } });
  await db.TeamDay.create({ email: ANNA.email, date: day(-90), key: 'x', points: 1 });

  assert.deepEqual((await call(db, 'leave', { method: 'POST', ...anna })).json, { ok: true });
  assert.deepEqual(db.TeamMember.rows.map((r) => r.email), [BOB.email]);
  assert.deepEqual(db.TeamDay.rows.map((r) => r.email), [BOB.email]);

  const mine = (await call(db, 'state', anna)).json;
  assert.deepEqual([mine.joined, mine.count, mine.members], [false, 1, []]);
  const theirs = (await call(db, 'state', bob)).json;
  assert.deepEqual(theirs.members.map((m) => m.name), ['Bob']);
  assert.equal((await call(db, 'sync', { method: 'POST', ...anna, body: { days: [{ date: day(0), points: 8 }] } })).status, 409);
});

test('storage failures answer 503 and log no health values or emails', async () => {
  const db = fakeDb();
  const anna = await as(ANNA);
  await call(db, 'join', { method: 'POST', ...anna, body: {} });
  db.TeamDay.bulkCreate = async () => { throw new Error('rejected anna@example.com points=7 strain=13.5'); };
  const logged = [];
  const original = console.error;
  console.error = (...args) => logged.push(args.join(' '));
  try {
    const r = await call(db, 'sync', { method: 'POST', ...anna, body: { days: [{ date: day(0), points: 7, strain: 13.5 }] } });
    assert.deepEqual([r.status, r.json], [503, { error: 'unavailable' }]);
    db.TeamMember.list = async () => { throw new Error('down'); };
    assert.equal((await call(db, 'state', anna)).status, 503);
  } finally { console.error = original; }
  assert.equal(logged.length, 2);
  assert.ok(logged.every((l) => !/anna|example|7|13\.5/.test(l)), logged.join('\n'));
});
