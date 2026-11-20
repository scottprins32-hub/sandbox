// The team: a few friends on one Oranje link share per-day scores with each
// other for weekly competitions. Health data is sensitive, so:
// - who you are comes only from the sealed sign-in cookies (signedIn);
// - every value the browser sends is checked against its range or dropped;
// - emails are the internal key and never leave this file; members are
//   identified to browsers by their TeamMember record id only.
//
// Storage is two Base44 entities, TeamMember and TeamDay, whose RLS denies the
// browser everything; the backend reaches them with the service role. `db` is
// { TeamMember, TeamDay } using only filter, list, create, update, delete,
// bulkCreate, bulkUpdate and deleteMany, so tests can pass an in-memory fake.
// Base44 deletes are soft: deleted records go to the app's trash (visible to
// the app's admins) until it is emptied.
//
// Web standards only (Request, Response), like broker.js.

import { configured, origin, signedIn } from './broker.js';

const DAY_MS = 86_400_000;
const SHOWN_DAYS = 63;       // days of each member returned by `state`
const KEEP_DAYS = 120;       // older days are refused by `sync` and pruned
const MAX_SYNC_DAYS = 63;
const MAX_FUTURE_DAYS = 1;   // time zones: a member may already be "tomorrow"
const MAX_BODY = 64 * 1024;
const NAME_MAX = 24;
const LIST_LIMIT = 5000;

// name: [min, max, integer]
const METRICS = {
  points: [0, 10, true], strain: [0, 21, false], recovery: [0, 100, true], sleep: [0, 100, true],
  rhr: [25, 150, false], hrv: [1, 400, false], sleepMin: [0, 1440, true], azm: [0, 1440, true],
  steps: [0, 200_000, true],
};
const FIELDS = [...Object.keys(METRICS), 'inTarget'];

class Refusal extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

function reply(status, json) {
  return new Response(JSON.stringify(json), {
    status,
    headers: {
      'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    },
  });
}
export const unavailable = () => reply(503, { error: 'unavailable' });

// Same rule as broker.js: our own page only.
const sameSite = (req, env) => {
  const o = req.headers.get('origin');
  return o ? o === origin(req, env) : req.headers.get('sec-fetch-site') === 'same-origin';
};

// --- validation -------------------------------------------------------------

const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const dayFrom = (now, offset) => iso(now.getTime() + offset * DAY_MS);

export function isDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

// A finite number within range, integers rounded, others to two decimals; anything else is null.
function metric(v, [lo, hi, integer]) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < lo || v > hi) return null;
  return integer ? Math.round(v) : Math.round(v * 100) / 100;
}

// The one day shape browsers send and receive.
function cleanDay(raw) {
  const day = { date: raw.date };
  for (const [k, range] of Object.entries(METRICS)) day[k] = metric(raw[k], range);
  day.inTarget = typeof raw.inTarget === 'boolean' ? raw.inTarget : null;
  return day;
}

// Display names: no control or invisible formatting characters (bidi
// overrides and the like; the emoji joiner stays), no < or >, single spaces,
// at most 24 characters.
export function cleanName(raw) {
  if (typeof raw !== 'string') return '';
  const s = raw.normalize('NFC').replace(/\s+/gu, ' ')
    .replace(/(?!‍)[\p{Cc}\p{Cf}<>]/gu, '')
    .replace(/ {2,}/g, ' ').trim();
  return Array.from(s).slice(0, NAME_MAX).join('').trim();
}

// --- request body -------------------------------------------------------------

async function readJson(req) {
  const declared = Number(req.headers.get('content-length'));
  if (declared > MAX_BODY) throw new Refusal(413, 'too_large');
  if (!req.body) return {};
  const reader = req.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) { reader.cancel().catch(() => {}); throw new Refusal(413, 'too_large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) { bytes.set(c, at); at += c.byteLength; }
  const text = new TextDecoder().decode(bytes);
  if (!text.trim()) return {};
  let body;
  try { body = JSON.parse(text); } catch { throw new Refusal(400, 'bad_request'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Refusal(400, 'bad_request');
  return body;
}

// --- storage helpers -------------------------------------------------------------

const oldestFirst = (a, b) => String(a.created_date || '').localeCompare(String(b.created_date || ''));

// One member per email: the oldest record wins if a race ever made two.
async function allMembers(db) {
  const seen = new Map();
  for (const m of [...(await db.TeamMember.list('created_date', LIST_LIMIT))].sort(oldestFirst)) {
    if (m && typeof m.email === 'string' && !seen.has(m.email)) seen.set(m.email, m);
  }
  return [...seen.values()];
}

async function state(env, db, who, now) {
  const base = { configured: configured(env), signedIn: Boolean(who), joined: false, me: null, members: [] };
  if (!who) return base;
  const members = await allMembers(db);
  const mine = members.find((m) => m.email === who.email);
  if (!mine) return { ...base, count: members.length };

  const since = dayFrom(now, -(SHOWN_DAYS - 1));
  const rows = await db.TeamDay.filter({ email: { $in: members.map((m) => m.email) }, date: { $gte: since } }, 'date', LIST_LIMIT);
  const byEmail = new Map(members.map((m) => [m.email, new Map()]));
  for (const r of rows) {
    if (r && byEmail.has(r.email) && isDate(r.date) && r.date >= since) byEmail.get(r.email).set(r.date, cleanDay(r));
  }
  return {
    ...base,
    joined: true,
    me: { id: mine.id, name: cleanName(mine.name) || 'Member' },
    members: members.map((m) => ({
      id: m.id,
      name: cleanName(m.name) || 'Member',
      me: m.email === who.email,
      days: [...byEmail.get(m.email).values()].sort((a, b) => a.date.localeCompare(b.date)),
    })),
  };
}

const same = (a, b) => (a ?? null) === (b ?? null);
const withoutNulls = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null));

// --- actions -------------------------------------------------------------------

const ACTIONS = {
  state: {
    method: 'GET',
    async run({ env, db, who, now }) { return reply(200, await state(env, db, who, now)); },
  },

  join: {
    method: 'POST',
    async run({ req, env, db, who, now }) {
      if (!who) throw new Refusal(401, 'not_signed_in');
      const body = await readJson(req);
      const name = cleanName(body.name) || cleanName(cleanName(who.name).split(' ')[0]) || 'Member';
      const found = [...(await db.TeamMember.filter({ email: who.email }))].sort(oldestFirst);
      if (!found.length) {
        await db.TeamMember.create({ email: who.email, name, joined: dayFrom(now, 0) });
      } else {
        const [keep, ...extra] = found;
        if (keep.name !== name) await db.TeamMember.update(keep.id, { name });
        for (const x of extra) await db.TeamMember.delete(x.id);
      }
      return reply(200, await state(env, db, who, now));
    },
  },

  sync: {
    method: 'POST',
    async run({ req, db, who, now }) {
      if (!who) throw new Refusal(401, 'not_signed_in');
      const body = await readJson(req);
      if (!(await db.TeamMember.filter({ email: who.email })).length) throw new Refusal(409, 'not_joined');
      if (!Array.isArray(body.days)) throw new Refusal(400, 'bad_request');
      if (body.days.length > MAX_SYNC_DAYS) throw new Refusal(400, 'too_many_days');

      const oldest = dayFrom(now, -KEEP_DAYS), newest = dayFrom(now, MAX_FUTURE_DAYS);
      const wanted = new Map(); // date -> clean day; a repeated date: the last one wins
      for (const raw of body.days) {
        if (!raw || typeof raw !== 'object' || !isDate(raw.date) || raw.date < oldest || raw.date > newest) continue;
        wanted.set(raw.date, cleanDay(raw));
      }

      if (wanted.size) {
        const existing = new Map();
        for (const r of [...(await db.TeamDay.filter({ email: who.email, date: { $in: [...wanted.keys()] } }))].sort(oldestFirst)) {
          if (!existing.has(r.date)) existing.set(r.date, []);
          existing.get(r.date).push(r);
        }
        const creates = [], updates = [], extras = [];
        for (const [date, day] of wanted) {
          const fields = Object.fromEntries(FIELDS.map((k) => [k, day[k]]));
          const [row, ...dupes] = existing.get(date) || [];
          extras.push(...dupes);
          if (!row) creates.push(withoutNulls({ email: who.email, date, key: `${who.email}|${date}`, ...fields }));
          else if (FIELDS.some((k) => !same(row[k], fields[k]))) updates.push({ id: row.id, ...fields });
        }
        if (updates.length) await db.TeamDay.bulkUpdate(updates);
        if (creates.length) await db.TeamDay.bulkCreate(creates);
        for (const x of extras) await db.TeamDay.delete(x.id);
      }
      // Keep no more history than the competitions need (soft delete, see top).
      await db.TeamDay.deleteMany({ email: who.email, date: { $lt: oldest } });
      return reply(200, { ok: true, saved: wanted.size });
    },
  },

  leave: {
    method: 'POST',
    async run({ db, who }) {
      if (!who) throw new Refusal(401, 'not_signed_in');
      // Member first, so the others stop seeing this person at once; then
      // every day they shared. Soft deletes: see the note at the top.
      await db.TeamMember.deleteMany({ email: who.email });
      await db.TeamDay.deleteMany({ email: who.email });
      return reply(200, { ok: true });
    },
  },
};

// Error text without emails or numbers (dates, health values).
const describe = (error) => `${error?.name || 'Error'}${error?.status ? ` ${error.status}` : ''}: ${
  String(error?.message || '').replace(/[^\s@]+@[^\s@]+/g, '<email>').replace(/\d+(?:\.\d+)?/g, '#').slice(0, 200)}`;

export async function handleTeam(req, env, db, now = new Date()) {
  const action = new URL(req.url).searchParams.get('action') || '';
  if (!Object.hasOwn(ACTIONS, action)) return reply(404, { error: 'not_found' });
  const route = ACTIONS[action];
  if (req.method !== route.method) return reply(405, { error: 'method_not_allowed' });
  if (!sameSite(req, env)) return reply(403, { error: 'cross_site' });
  try {
    const who = await signedIn(req, env);
    return await route.run({ req, env, db, who, now });
  } catch (error) {
    if (error instanceof Refusal) return reply(error.status, { error: error.code });
    console.error(`team ${action} failed`, describe(error));
    return unavailable();
  }
}
