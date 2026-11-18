// Google Health API v4 adapter (https://health.googleapis.com/v4).
// The legacy Fitbit Web API was switched off on 2 November 2026; a Fitbit Air
// now syncs to Google Health and this is the only door to its data.
//
// Written against the API's discovery document (revision 20261116). Rules it
// leans on, all from that document and Google's guides:
//   - data type ids are kebab-case in the URL and snake_case inside filters
//   - filters allow only >= and <, joined by AND
//   - int64 values arrive as JSON strings; durations as "900s"
//   - heart-rate roll-ups span at most 14 days per request; most others 90
//   - reconcile gives one de-duplicated stream and is what Google recommends
//     for display; plain list is the fallback
// Every data type is fetched on its own and failures are recorded rather than
// thrown, so one refused type never blanks the dashboard.
//
// Wearable first: each type is asked for from the `google-wearables` source
// family (Fitbit trackers and Pixel Watch, nothing typed in or written by
// phone apps). Only when the band has nothing for a type are all sources
// used, so Apple Health, Health Connect and other apps fill gaps but never
// override what the band measured. Sleep cannot be filtered that way, so
// nights recorded by a wearable are preferred when choosing a day's sleep.

import { addDays, dateKey, dayStartMs, fromKey, isNum, rangeKeys, todayKey } from '../core/util.js';

const BASE = 'https://health.googleapis.com/v4';
export const WEARABLES = 'users/me/dataSourceFamilies/google-wearables';
const S = 'https://www.googleapis.com/auth/googlehealth.';
export const SCOPES = [
  `${S}activity_and_fitness.readonly`,
  `${S}health_metrics_and_measurements.readonly`,
  `${S}sleep.readonly`,
  `${S}profile.readonly`,
  `${S}settings.readonly`,
];

export class HealthError extends Error {
  constructor(status, reason, message) { super(message || reason || `HTTP ${status}`); this.status = status; this.reason = reason; }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (v) => (v == null || v === '' ? null : Number(v));
const snake = (type) => type.replace(/-/g, '_');
const camel = (type) => type.replace(/-(\w)/g, (_, c) => c.toUpperCase());
const civilKey = (d) => (d && d.year ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` : null);
const civilDate = (key) => { const d = fromKey(key); return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }; };
const midnight = { hours: 0, minutes: 0, seconds: 0, nanos: 0 };
const pretty = (enumName) => enumName.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export function createClient({ getToken, fetchImpl = (...a) => fetch(...a), minGap = 420 }) {
  // Unverified apps are allowed 2.5 requests a second per user: keep under it.
  let nextSlot = 0;
  async function call(path, { method = 'GET', query, body } = {}, attempt = 0, force = false) {
    const now = Date.now();
    const slot = Math.max(now, nextSlot);
    nextSlot = slot + minGap;
    if (slot > now) await wait(slot - now);

    const token = await getToken({ force });
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(query || {})) if (v != null && v !== '') url.searchParams.set(k, v);
    const res = await fetchImpl(url.toString(), {
      method,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401 && attempt === 0) return call(path, { method, query, body }, 1, true);
    if ((res.status === 429 || res.status >= 500) && attempt < 3) { await wait(700 * 2 ** attempt); return call(path, { method, query, body }, attempt + 1); }
    if (!res.ok) {
      let err = {};
      try { err = (await res.json()).error || {}; } catch { /* not JSON */ }
      const detail = (err.details || []).find((d) => d.reason) || {};
      throw new HealthError(res.status, detail.reason || err.status, err.message);
    }
    return res.json();
  }

  const plainList = new Set(); // types where reconcile was refused once
  async function points(type, filter, pageSize, dataSourceFamily) {
    const field = camel(type);
    const out = [];
    const run = async (suffix) => {
      let pageToken;
      do {
        const r = await call(`/users/me/dataTypes/${type}/dataPoints${suffix}`, { query: { filter, pageSize, pageToken, dataSourceFamily } });
        for (const p of r.dataPoints || []) if (p[field]) out.push(p.dataSource ? { ...p[field], dataSource: p.dataSource } : p[field]);
        pageToken = r.nextPageToken;
      } while (pageToken);
    };
    if (plainList.has(type)) { await run(''); return out; }
    try { await run(':reconcile'); } catch (e) {
      if (e.status !== 400 && e.status !== 404 && e.status !== 501) throw e;
      plainList.add(type); out.length = 0; await run('');
    }
    return out;
  }

  async function rollUp(type, startMs, endMs, windowSize, dataSourceFamily) {
    const out = [];
    let pageToken;
    do {
      const r = await call(`/users/me/dataTypes/${type}/dataPoints:rollUp`, {
        method: 'POST',
        body: { range: { startTime: new Date(startMs).toISOString(), endTime: new Date(endMs).toISOString() }, windowSize, pageSize: 10000, pageToken, dataSourceFamily },
      });
      out.push(...(r.rollupDataPoints || []));
      pageToken = r.nextPageToken;
    } while (pageToken);
    return out;
  }

  async function dailyRollUp(type, startKey, endKeyExclusive, dataSourceFamily) {
    const out = [];
    let pageToken;
    do {
      const r = await call(`/users/me/dataTypes/${type}/dataPoints:dailyRollUp`, {
        method: 'POST',
        body: { range: { start: { date: civilDate(startKey), time: midnight }, end: { date: civilDate(endKeyExclusive), time: midnight } }, windowSizeDays: 1, pageToken, dataSourceFamily },
      });
      out.push(...(r.rollupDataPoints || []));
      pageToken = r.nextPageToken;
    } while (pageToken);
    return out;
  }

  return { call, points, rollUp, dailyRollUp };
}

function mapSleep(s) {
  const start = Date.parse(s.interval?.startTime), end = Date.parse(s.interval?.endTime);
  if (!isNum(start) || !isNum(end) || end <= start) return null;
  const kind = { AWAKE: 'wake', RESTLESS: 'wake', LIGHT: 'light', ASLEEP: 'light', DEEP: 'deep', REM: 'rem' };
  const stages = (s.stages || [])
    .map((st) => ({ s: kind[st.type] || 'light', t0: Date.parse(st.startTime), t1: Date.parse(st.endTime) }))
    .filter((st) => isNum(st.t0) && st.t1 > st.t0)
    .sort((a, b) => a.t0 - b.t0);
  const fromStages = stages.filter((st) => st.s !== 'wake').reduce((a, st) => a + (st.t1 - st.t0) / 60000, 0);
  const meta = s.metadata || {};
  return {
    start, end, stages,
    asleepMin: num(s.summary?.minutesAsleep) ?? Math.round(fromStages || (end - start) / 60000),
    inBedMin: num(s.summary?.minutesInSleepPeriod) ?? Math.round((end - start) / 60000),
    staged: s.type === 'STAGES' || stages.some((st) => st.s === 'deep' || st.s === 'rem'),
    main: meta.mainSleep ?? meta.main ?? null,
    nap: !!meta.nap,
    processed: meta.processed !== false,
    endKey: civilKey(s.interval?.civilEndTime?.date) || dateKey(new Date(end)),
    wearable: fromWearable(s.dataSource),
  };
}

// A reading a tracker made, as opposed to one typed in or written by a phone app.
const WEARABLE_FORMS = new Set(['FITNESS_BAND', 'WATCH', 'RING', 'CHEST_STRAP']);
export function fromWearable(src) {
  if (!src) return null;
  if (src.recordingMethod === 'MANUAL') return false;
  if (src.device?.formFactor) return WEARABLE_FORMS.has(src.device.formFactor);
  if (src.platform) return src.platform === 'FITBIT';
  return null;
}

function mapExercise(x) {
  const t0 = Date.parse(x.interval?.startTime), t1 = Date.parse(x.interval?.endTime);
  if (!isNum(t0) || !isNum(t1) || t1 <= t0) return null;
  const m = x.metricsSummary || {};
  const mm = num(m.distanceMillimeters ?? m.distanceMillimiters);   // Google's own sample misspells this field
  return {
    name: x.displayName || pretty(x.exerciseType || 'WORKOUT'),
    type: x.exerciseType || 'WORKOUT',
    t0, t1,
    avgHr: num(m.averageHeartRateBeatsPerMinute),
    maxHr: null,
    kcal: isNum(num(m.caloriesKcal)) ? Math.round(num(m.caloriesKcal)) : null,
    km: mm ? +(mm / 1e6).toFixed(2) : null,
    startKey: civilKey(x.interval?.civilStartTime?.date) || dateKey(new Date(t0)),
  };
}

const LABELS = {
  'heart-rate': 'Heart rate, minute by minute',
  steps: 'Steps', distance: 'Distance', 'total-calories': 'Calories', 'active-zone-minutes': 'Zone minutes',
  'daily-resting-heart-rate': 'Resting heart rate', 'daily-heart-rate-variability': 'Heart-rate variability',
  'daily-oxygen-saturation': 'Blood oxygen', 'daily-respiratory-rate': 'Breathing rate',
  'daily-sleep-temperature-derivations': 'Skin temperature', 'daily-vo2-max': 'Cardio fitness',
  sleep: 'Sleep', exercise: 'Exercise sessions', profile: 'Profile', devices: 'Band status',
};

// Pull `days` days ending today and return them in the app's own shape.
// `known` is the cached data; days it already holds in full are kept.
export async function syncGoogle({ getToken, days = 28, known = null, fetchImpl, minGap, onProgress = () => {}, now = new Date() }) {
  const api = createClient({ getToken, fetchImpl, minGap });
  const today = dateKey(now);

  // Is this Google account linked to Google Health at all?
  let userId = null;
  try { userId = (await api.call('/users/me/identity')).healthUserId || null; } catch (e) {
    if (e.reason === 'ACCOUNT_NOT_LINKED') throw new HealthError(400, 'ACCOUNT_NOT_LINKED', 'This Google account is not linked to Google Health yet. Open the Google Health (Fitbit) app on your phone, sign in with this account, then try again.');
    throw e;
  }

  // Someone else's cache on a shared device: start clean rather than mix data.
  if (known && known.userId && userId && known.userId !== userId) known = null;

  // Re-fetch from the last day we hold (it may have been partial) minus one.
  const knownDays = Object.fromEntries((known?.days || []).map((d) => [d.date, d]));
  const full = Object.keys(knownDays).filter((k) => !knownDays[k].partial).sort();
  let startKey = addDays(today, -(days - 1));
  const resume = full.length ? addDays(full[full.length - 1], -1) : null;
  if (resume && resume > startKey) startKey = resume;
  const keys = rangeKeys(today, Math.round((dayStartMs(today) - dayStartMs(startKey)) / 86400000) + 1);
  const endExclusive = addDays(today, 1);

  const day = Object.fromEntries(keys.map((k) => [k, {
    date: k, hr: new Array(1440).fill(null), rhr: null, hrv: null, br: null, skinTemp: null, vo2max: null, spo2: null,
    steps: null, distance: null, calories: null, azm: null, sleep: null, naps: [], workouts: [], partial: k === today,
  }]));
  const issues = [];
  const jobs = [];
  let done = 0;
  const job = (type, fn) => jobs.push(async () => {
    try { const r = await fn(); const count = typeof r === 'number' ? r : r.n; issues.push({ type, label: LABELS[type], ok: true, count, from: typeof r === 'number' ? null : r.from }); }
    catch (e) { issues.push({ type, label: LABELS[type], ok: false, status: e.status || 0, reason: e.reason || '', message: e.message || 'Request failed' }); if (e.status === 401) throw e; }
    onProgress(++done, jobs.length, LABELS[type]);
  });
  // Band first; all sources only when the band has nothing for this type.
  // A family the API refuses for a type (400) counts as nothing from the band.
  const wearableFirst = async (fetchFrom) => {
    let n = 0;
    try { n = await fetchFrom(WEARABLES); } catch (e) { if (e.status !== 400) throw e; }
    if (n) return { n, from: 'band' };
    n = await fetchFrom(undefined);
    return { n, from: n ? 'other' : null };
  };
  const chunks = (size) => { const out = []; for (let i = 0; i < keys.length; i += size) out.push([keys[i], addDays(keys[Math.min(keys.length, i + size) - 1], 1)]); return out; };

  job('heart-rate', () => wearableFirst(async (family) => {
    let n = 0;
    for (const [a, b] of chunks(14)) {
      for (const p of await api.rollUp('heart-rate', dayStartMs(a), Math.min(dayStartMs(b), now.getTime()), '60s', family)) {
        const bpm = p.heartRate?.beatsPerMinuteAvg;
        if (!isNum(bpm)) continue;
        const t = new Date(p.startTime), d = day[dateKey(t)];
        if (d) { d.hr[t.getHours() * 60 + t.getMinutes()] = Math.round(bpm); n++; }
      }
    }
    return n;
  }));

  const daily = (type, each, size = 90) => job(type, () => wearableFirst(async (family) => {
    let n = 0;
    for (const [a, b] of chunks(size)) {
      for (const p of await api.dailyRollUp(type, a, b, family)) {
        const d = day[civilKey(p.civilStartTime?.date)];
        if (d && p[camel(type)]) { each(d, p[camel(type)]); n++; }
      }
    }
    return n;
  }));
  daily('steps', (d, v) => { d.steps = num(v.countSum) ?? 0; });
  daily('distance', (d, v) => { d.distance = +((num(v.millimetersSum) ?? 0) / 1e6).toFixed(2); });
  daily('total-calories', (d, v) => { d.calories = Math.round(v.kcalSum ?? 0); }, 14);
  daily('active-zone-minutes', (d, v) => {
    const fatBurn = num(v.sumInFatBurnHeartZone) ?? 0, cardio = num(v.sumInCardioHeartZone) ?? 0, peak = num(v.sumInPeakHeartZone) ?? 0;
    d.azm = { fatBurn, cardio, peak, total: fatBurn + cardio + peak };
  });

  const dated = (type, each) => job(type, () => wearableFirst(async (family) => {
    const f = `${snake(type)}.date >= "${keys[0]}" AND ${snake(type)}.date < "${endExclusive}"`;
    let n = 0;
    for (const v of await api.points(type, f, undefined, family)) { const d = day[civilKey(v.date)]; if (d) { each(d, v); n++; } }
    return n;
  }));
  dated('daily-resting-heart-rate', (d, v) => { d.rhr = num(v.beatsPerMinute); });
  dated('daily-heart-rate-variability', (d, v) => {
    const ms = v.averageHeartRateVariabilityMilliseconds ?? v.deepSleepRootMeanSquareOfSuccessiveDifferencesMilliseconds;
    d.hrv = isNum(ms) ? Math.round(ms) : null;
  });
  dated('daily-oxygen-saturation', (d, v) => { if (isNum(v.averagePercentage)) d.spo2 = { avg: +v.averagePercentage.toFixed(1), min: v.lowerBoundPercentage ?? null, max: v.upperBoundPercentage ?? null }; });
  dated('daily-respiratory-rate', (d, v) => { d.br = isNum(v.breathsPerMinute) ? +v.breathsPerMinute.toFixed(1) : null; });
  dated('daily-sleep-temperature-derivations', (d, v) => {
    d.skinNightly = v.nightlyTemperatureCelsius ?? null;
    d.skinTemp = isNum(v.nightlyTemperatureCelsius) && isNum(v.baselineTemperatureCelsius) ? +(v.nightlyTemperatureCelsius - v.baselineTemperatureCelsius).toFixed(2) : null;
  });
  dated('daily-vo2-max', (d, v) => { d.vo2max = isNum(v.vo2Max) ? +v.vo2Max.toFixed(1) : null; });

  job('sleep', async () => {
    const f = `sleep.interval.civil_end_time >= "${keys[0]}" AND sleep.interval.civil_end_time < "${endExclusive}"`;
    const nights = (await api.points('sleep', f, 25)).map(mapSleep).filter(Boolean);
    const byDay = {};
    for (const s of nights) (byDay[s.endKey] ||= []).push(s);
    for (const [k, list] of Object.entries(byDay)) {
      const d = day[k];
      if (!d) continue;
      // a night the band recorded beats one a phone app wrote for the same day
      const pool = list.some((s) => s.wearable) ? list.filter((s) => s.wearable !== false) : list;
      const main = pool.find((s) => s.main) || [...pool].filter((s) => !s.nap).sort((a, b) => b.asleepMin - a.asleepMin)[0] || pool[0];
      d.sleep = main; d.naps = pool.filter((s) => s !== main && s.nap);
    }
    const band = nights.filter((s) => s.wearable).length;
    return { n: nights.length, from: !nights.length ? null : band ? 'band' : nights.some((s) => s.wearable === false) ? 'other' : null };
  });

  job('exercise', () => wearableFirst(async (family) => {
    const f = `exercise.interval.civil_start_time >= "${keys[0]}" AND exercise.interval.civil_start_time < "${endExclusive}"`;
    const sessions = (await api.points('exercise', f, 25, family)).map(mapExercise).filter(Boolean);
    for (const w of sessions) day[w.startKey]?.workouts.push(w);
    return sessions.length;
  }));

  let profile = known?.profile || {};
  job('profile', async () => { const p = await api.call('/users/me/profile'); profile = { age: isNum(p.age) ? p.age : null }; return 1; });
  let device = known?.device || null;
  job('devices', async () => {
    const r = await api.call('/users/me/pairedDevices');
    const list = (r.pairedDevices || []).filter((p) => p.deviceType !== 'SCALE').sort((a, b) => Date.parse(b.lastSyncTime || 0) - Date.parse(a.lastSyncTime || 0));
    const p = list[0];
    device = p ? { name: p.deviceVersion || 'Tracker', battery: isNum(p.batteryLevel) ? p.batteryLevel : null, batteryStatus: p.batteryStatus || null, lastSync: Date.parse(p.lastSyncTime) || null } : null;
    return list.length;
  });

  onProgress(0, jobs.length, '');
  for (const run of jobs) await run();

  for (const d of Object.values(day)) {
    d.workouts.sort((x, y) => x.t0 - y.t0);
    for (const w of d.workouts) {
      const a = Math.max(0, Math.floor((w.t0 - dayStartMs(d.date)) / 60000)), b = Math.min(1440, Math.ceil((w.t1 - dayStartMs(d.date)) / 60000));
      const seg = d.hr.slice(a, b).filter(isNum);
      if (seg.length) { w.maxHr = Math.max(...seg); w.avgHr ??= Math.round(seg.reduce((x, y) => x + y, 0) / seg.length); }
    }
  }
  // Skin temperature without Google's baseline: measure against the wearer's own median.
  const merged = { ...knownDays, ...day };
  const nightly = Object.values(merged).map((d) => d.skinNightly).filter(isNum).sort((a, b) => a - b);
  if (nightly.length >= 5) {
    const median = nightly[Math.floor(nightly.length / 2)];
    for (const d of Object.values(day)) if (d.skinTemp == null && isNum(d.skinNightly)) d.skinTemp = +(d.skinNightly - median).toFixed(2);
  }

  // A new band has no history: drop the empty days before its first reading.
  const hasData = (d) => d.date === today || isNum(d.rhr) || isNum(d.steps) && d.steps > 0 || !!d.sleep || d.hr.some(isNum);
  const firstReal = Object.values(merged).filter(hasData).map((d) => d.date).sort()[0] || today;
  const keep = [addDays(today, -59), firstReal].sort()[1];
  return {
    demo: false, userId, profile, device,
    days: Object.values(merged).filter((d) => d.date >= keep).sort((a, b) => (a.date < b.date ? -1 : 1)),
    syncedAt: now.getTime(),
    issues,
  };
}

export { todayKey };
