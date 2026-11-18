// A stand-in for health.googleapis.com, speaking the wire format described in
// the API's discovery document: int64 as strings, durations as "900s", civil
// dates as {year, month, day}, newest-first pages with nextPageToken, the
// 14-day cap on heart-rate and calorie roll-ups, snake_case filters.
// It serves a set of days in the app's own shape, so a sync through the real
// adapter can be compared with what went in.

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const civil = (key) => { const [year, month, day] = key.split('-').map(Number); return { year, month, day }; };
const civilKey = (c) => `${c.year}-${pad(c.month)}-${pad(c.day)}`;
const iso = (ms) => new Date(ms).toISOString();
const offset = (ms) => `${-new Date(ms).getTimezoneOffset() * 60}s`;
const session = (t0, t1) => ({ startTime: iso(t0), startUtcOffset: offset(t0), endTime: iso(t1), endUtcOffset: offset(t1), civilStartTime: { date: civil(keyOf(new Date(t0))) }, civilEndTime: { date: civil(keyOf(new Date(t1))) } });
const STAGE = { wake: 'AWAKE', light: 'LIGHT', deep: 'DEEP', rem: 'REM' };

// `appOnly` lists types that only phone apps wrote: asked for from the
// google-wearables source family they come back empty, as on the real API.
export function createMockHealth(days, { deny = [], appOnly = [], noReconcile = false, unauthorized = false, notLinked = false, age = 33 } = {}) {
  const log = [];
  const json = (status, body) => ({ ok: status >= 200 && status < 300, status, headers: { get: () => 'application/json' }, json: async () => body });
  const error = (status, statusName, reason, message) => json(status, { error: { code: status, status: statusName, message, details: [{ reason }] } });
  const page = (items, size, token) => { const at = Number(token || 0); const next = at + size < items.length ? String(at + size) : undefined; return [items.slice(at, at + size), next]; };

  const dailyValue = {
    'daily-resting-heart-rate': (d) => d.rhr != null && { dailyRestingHeartRate: { date: civil(d.date), beatsPerMinute: String(d.rhr), dailyRestingHeartRateMetadata: { calculationMethod: 'WITH_SLEEP' } } },
    'daily-heart-rate-variability': (d) => d.hrv != null && { dailyHeartRateVariability: { date: civil(d.date), averageHeartRateVariabilityMilliseconds: d.hrv } },
    'daily-oxygen-saturation': (d) => d.spo2 && { dailyOxygenSaturation: { date: civil(d.date), averagePercentage: d.spo2.avg, lowerBoundPercentage: d.spo2.min, upperBoundPercentage: d.spo2.max } },
    'daily-respiratory-rate': (d) => d.br != null && { dailyRespiratoryRate: { date: civil(d.date), breathsPerMinute: d.br } },
    'daily-sleep-temperature-derivations': (d) => d.skinTemp != null && { dailySleepTemperatureDerivations: { date: civil(d.date), nightlyTemperatureCelsius: 33.2 + d.skinTemp, baselineTemperatureCelsius: 33.2 } },
    'daily-vo2-max': (d) => d.vo2max != null && { dailyVo2Max: { date: civil(d.date), vo2Max: d.vo2max, cardioFitnessLevel: 'GOOD' } },
  };
  const rollValue = {
    steps: (d) => ({ steps: { countSum: String(d.steps) } }),
    distance: (d) => ({ distance: { millimetersSum: String(Math.round(d.distance * 1e6)) } }),
    'total-calories': (d) => ({ totalCalories: { kcalSum: d.calories } }),
    'active-zone-minutes': (d) => ({ activeZoneMinutes: { sumInFatBurnHeartZone: String(d.azm.fatBurn), sumInCardioHeartZone: String(d.azm.cardio), sumInPeakHeartZone: String(d.azm.peak) } }),
  };

  async function fetchImpl(url, init = {}) {
    const u = new URL(url), method = init.method || 'GET', body = init.body ? JSON.parse(init.body) : null;
    const family = u.searchParams.get('dataSourceFamily') || body?.dataSourceFamily || null;
    log.push({ method, path: u.pathname, filter: u.searchParams.get('filter'), body, family });
    if (!/^Bearer \S+/.test(init.headers?.Authorization || '')) return error(401, 'UNAUTHENTICATED', 'ACCESS_TOKEN_MISSING', 'No token');
    if (unauthorized) return error(401, 'UNAUTHENTICATED', 'ACCESS_TOKEN_EXPIRED', 'Token expired');
    if (notLinked) return error(400, 'FAILED_PRECONDITION', 'ACCOUNT_NOT_LINKED', 'Account not linked');
    const path = u.pathname.replace('/v4/users/me/', '');
    if (path === 'identity') return json(200, { name: 'users/me/identity', healthUserId: '111111256096816351', legacyUserId: 'A1B2C3' });
    if (path === 'profile') return json(200, { name: 'users/me/profile', age });
    if (path === 'pairedDevices') return json(200, { pairedDevices: [{ name: 'users/me/pairedDevices/1', deviceType: 'TRACKER', deviceVersion: 'Fitbit Air', batteryLevel: 68, batteryStatus: 'High', lastSyncTime: iso(Date.now() - 600000) }] });

    const m = path.match(/^dataTypes\/([a-z0-9-]+)\/dataPoints(:\w+)?$/);
    if (!m) return error(404, 'NOT_FOUND', 'NOT_FOUND', `No route ${u.pathname}`);
    const [, type, op] = m;
    if (deny.includes(type)) return error(403, 'PERMISSION_DENIED', 'MISSING_OAUTH_SCOPE', 'Request had insufficient authentication scopes.');
    if (family && type === 'sleep') return error(400, 'INVALID_ARGUMENT', 'UNSUPPORTED_FILTER', 'sleep cannot be filtered by data source family');
    if (family?.endsWith('/google-wearables') && appOnly.includes(type)) return json(200, op === ':rollUp' || op === ':dailyRollUp' ? { rollupDataPoints: [] } : { dataPoints: [] });

    if (op === ':rollUp') {
      if (method !== 'POST' || type !== 'heart-rate') return error(400, 'INVALID_ARGUMENT', 'UNSUPPORTED', 'rollUp');
      const a = Date.parse(body.range.startTime), b = Date.parse(body.range.endTime);
      if (b - a > 14 * 86400000 + 3600000) return error(400, 'INVALID_ARGUMENT', 'RANGE_TOO_LARGE', 'heart-rate range is capped at 14 days');
      if (body.windowSize !== '60s') return error(400, 'INVALID_ARGUMENT', 'UNSUPPORTED_WINDOW', 'mock serves 60s windows');
      const pts = [];
      for (const d of days) {
        const [y, mo, da] = d.date.split('-').map(Number), d0 = new Date(y, mo - 1, da).getTime();
        d.hr.forEach((v, i) => { const t = d0 + i * 60000; if (v != null && t >= a && t < b) pts.push({ startTime: iso(t), endTime: iso(t + 60000), heartRate: { beatsPerMinuteAvg: v + 0.2, beatsPerMinuteMax: v + 3, beatsPerMinuteMin: v - 3 } }); });
      }
      pts.reverse();
      const [items, next] = page(pts, Math.min(body.pageSize || 1440, 10000), body.pageToken);
      return json(200, { rollupDataPoints: items, nextPageToken: next });
    }
    if (op === ':dailyRollUp') {
      if (method !== 'POST' || !rollValue[type]) return error(400, 'INVALID_ARGUMENT', 'UNSUPPORTED', 'dailyRollUp');
      const a = civilKey(body.range.start.date), b = civilKey(body.range.end.date);
      const span = (Date.parse(b) - Date.parse(a)) / 86400000;
      if (span > (type === 'total-calories' ? 14 : 90)) return error(400, 'INVALID_ARGUMENT', 'RANGE_TOO_LARGE', `${type} range too large`);
      const pts = days.filter((d) => d.date >= a && d.date < b && d.steps != null).reverse().map((d) => ({ civilStartTime: { date: civil(d.date), time: {} }, civilEndTime: { date: civil(d.date) }, ...rollValue[type](d) }));
      return json(200, { rollupDataPoints: pts });
    }
    if (op === ':reconcile' && noReconcile) return error(400, 'INVALID_ARGUMENT', 'UNSUPPORTED_OPERATION', 'reconcile not available');
    if (op && op !== ':reconcile') return error(404, 'NOT_FOUND', 'NOT_FOUND', op);

    const filter = u.searchParams.get('filter') || '';
    if (/[a-z]-[a-z]/.test(filter.replace(/"[^"]*"/g, ''))) return error(400, 'INVALID_ARGUMENT', 'INVALID_DATA_POINT_FILTER', 'Filters use snake_case');
    if (/\bOR\b|<=|>(?!=)|[^<>]=/.test(filter.replace(/"[^"]*"/g, ''))) return error(400, 'INVALID_ARGUMENT', 'INVALID_DATA_POINT_FILTER', 'Only >= and < joined by AND');
    const bounds = [...filter.matchAll(/([\w.]+) (>=|<) "([^"]+)"/g)];
    const lo = bounds.find((x) => x[2] === '>=')?.[3] || '0000', hi = bounds.find((x) => x[2] === '<')?.[3] || '9999';
    const field = bounds[0]?.[1] || '';
    const wrap = (inner, name) => (op ? { dataPointName: name, ...inner } : { name, dataSource: { platform: 'FITBIT' }, ...inner });
    let pts = [];
    if (dailyValue[type]) {
      if (field !== `${type.replace(/-/g, '_')}.date`) return error(400, 'INVALID_ARGUMENT', 'INVALID_DATA_POINT_FILTER', `Unexpected field ${field}`);
      pts = days.filter((d) => d.date >= lo && d.date < hi).map((d) => dailyValue[type](d)).filter(Boolean).map((v) => wrap(v)).reverse();
    } else if (type === 'sleep') {
      if (field !== 'sleep.interval.civil_end_time') return error(400, 'INVALID_ARGUMENT', 'INVALID_DATA_POINT_FILTER', 'Sleep filters on end time only');
      pts = days.filter((d) => d.sleep && d.date >= lo && d.date < hi).map((d) => wrap({ sleep: {
        interval: session(d.sleep.start, d.sleep.end), type: 'STAGES',
        stages: d.sleep.stages.map((s) => ({ startTime: iso(s.t0), endTime: iso(s.t1), startUtcOffset: offset(s.t0), endUtcOffset: offset(s.t1), type: STAGE[s.s] })),
        metadata: { stagesStatus: 'SUCCEEDED', processed: true, mainSleep: true },
        summary: { minutesAsleep: String(d.sleep.asleepMin), minutesInSleepPeriod: String(d.sleep.inBedMin), minutesAwake: String(d.sleep.inBedMin - d.sleep.asleepMin) },
      } }, `users/1/dataTypes/sleep/dataPoints/${d.date}`)).reverse();
    } else if (type === 'exercise') {
      if (field !== 'exercise.interval.civil_start_time') return error(400, 'INVALID_ARGUMENT', 'INVALID_DATA_POINT_FILTER', 'Exercise filters on civil start time');
      pts = days.filter((d) => d.date >= lo && d.date < hi).flatMap((d) => d.workouts.map((w) => wrap({ exercise: {
        interval: session(w.t0, w.t1), exerciseType: w.type, displayName: w.name, activeDuration: `${Math.round((w.t1 - w.t0) / 1000)}s`,
        metricsSummary: { caloriesKcal: w.kcal, averageHeartRateBeatsPerMinute: String(w.avgHr), ...(w.km != null ? { distanceMillimeters: w.km * 1e6 } : {}) },
      } }))).reverse();
    } else return error(400, 'INVALID_ARGUMENT', 'UNSUPPORTED_DATA_TYPE', type);
    const cap = type === 'sleep' || type === 'exercise' ? 25 : 10000;
    const [items, next] = page(pts, Math.min(Number(u.searchParams.get('pageSize')) || (cap === 25 ? 25 : 1440), cap), u.searchParams.get('pageToken'));
    return json(200, { dataPoints: items, nextPageToken: next });
  }
  return { fetchImpl, log };
}
