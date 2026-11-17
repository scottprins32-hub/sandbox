// Demo data. Generates a believable month for one fictional wearer so the
// dashboard can be explored before an account is connected. Everything here
// is synthetic and the UI labels it as such. Output has exactly the same
// shape as the Google Health adapter (js/data/health.js) produces.

import { addDays, clamp, dateKey, dayStartMs, fromKey } from '../core/util.js';

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HR_MAX = 188;
const AGE = 33;

// One week of training, Dutch-flavoured: commutes by bike, padel on Sunday.
// x = share of heart-rate reserve the effort sits at.
const PLAN = {
  1: [{ name: 'Run', type: 'RUNNING', at: 18 * 60 + 20, dur: 46, x: 0.66, steps: 168 }],
  2: [{ name: 'Strength', type: 'STRENGTH_TRAINING', at: 7 * 60 + 5, dur: 52, x: 0.47, spiky: 0.16, steps: 12 }],
  3: [{ name: 'Walk', type: 'WALKING', at: 12 * 60 + 35, dur: 32, x: 0.33, steps: 112 }],
  4: [{ name: 'Intervals', type: 'INTERVAL_WORKOUT', at: 18 * 60 + 30, dur: 42, x: 0.62, intervals: true, steps: 170 }],
  5: [{ name: 'Walk', type: 'WALKING', at: 19 * 60 + 40, dur: 38, x: 0.31, steps: 110 }],
  6: [{ name: 'Ride', type: 'OUTDOOR_BIKE', at: 9 * 60 + 30, dur: 118, x: 0.68, steps: 0, kmh: 28 }],
  0: [{ name: 'Padel', type: 'PADEL', at: 11 * 60, dur: 74, x: 0.6, spiky: 0.2, steps: 70 }],
};
const COMMUTE = [
  { name: 'Commute ride', type: 'BIKING', at: 8 * 60 + 12, dur: 19, x: 0.43, steps: 0, kmh: 19 },
  { name: 'Commute ride', type: 'BIKING', at: 17 * 60 + 28, dur: 20, x: 0.45, steps: 0, kmh: 19 },
];

function buildSleep(rng, key, quality) {
  // The night that ENDS on `key`.
  const dow = fromKey(key).getDay();
  const prevDow = (dow + 6) % 7;
  const lateNight = prevDow === 5 || prevDow === 6;
  const lieIn = dow === 0 || dow === 6;
  const g = () => (rng() + rng() + rng() - 1.5) / 1.5; // roughly -1..1, bell-ish
  const midnight = dayStartMs(key);
  let bed = midnight - (lateNight ? 15 : 52) * 60000 + g() * 34 * 60000;
  let wake = midnight + ((lieIn ? 8 * 60 + 5 : 6 * 60 + 52) + g() * (lieIn ? 36 : 14)) * 60000;
  if (quality < 0) bed += 70 * 60000 * -quality; // a short night starts late
  bed = Math.round(bed / 60000) * 60000;
  wake = Math.round(wake / 60000) * 60000;

  const stages = [];
  let t = bed;
  const push = (s, min) => {
    if (min <= 0 || t >= wake) return;
    const t1 = Math.min(wake, t + Math.round(min) * 60000);
    const last = stages[stages.length - 1];
    if (last && last.s === s) last.t1 = t1; else stages.push({ s, t0: t, t1 });
    t = t1;
  };
  push('wake', 6 + rng() * 9);
  const deep = [40, 30, 17, 8, 4, 2];
  const rem = [7, 17, 25, 31, 36, 38];
  for (let c = 0; t < wake && c < 7; c++) {
    const j = () => 0.78 + rng() * 0.44;
    const dq = quality < 0 ? 1 + quality * 0.45 : 1;
    push('light', (c === 0 ? 16 : 24) * j());
    push('deep', (deep[c] ?? 2) * j() * dq);
    push('light', 22 * j());
    push('rem', (rem[c] ?? 30) * j() * dq);
    if (rng() < (quality < 0 ? 0.9 : 0.55)) push('wake', 1 + rng() * (quality < 0 ? 9 : 4));
  }
  if (t < wake) push('light', (wake - t) / 60000);
  const asleepMin = stages.filter((x) => x.s !== 'wake').reduce((a, x) => a + (x.t1 - x.t0) / 60000, 0);
  return { start: bed, end: wake, stages, asleepMin: Math.round(asleepMin), inBedMin: Math.round((wake - bed) / 60000) };
}

function stageAt(sleep, ms) {
  if (!sleep || ms < sleep.start || ms >= sleep.end) return null;
  for (const st of sleep.stages) if (ms >= st.t0 && ms < st.t1) return st.s;
  return 'light';
}

export function makeDemo({ days = 42, now = new Date(), seed = 1815 } = {}) {
  const rng = mulberry32(seed);
  const today = dateKey(now);
  const nowMs = now.getTime();
  const first = addDays(today, -(days - 1));
  const out = [];

  // Pre-roll nights so each day can see its own morning sleep AND tonight's bedtime.
  const quality = {};
  const sleeps = {};
  for (let i = -1; i <= days; i++) {
    const k = addDays(first, i);
    const ago = Math.round((dayStartMs(today) - dayStartMs(k)) / 86400000);
    let q = rng() < 0.1 ? -(0.4 + rng() * 0.6) : 0;
    if (ago === 11 || ago === 10) q = -0.7;     // a rough patch a week and a half back
    if (ago === 0) q = 0;                        // keep "today" representative
    quality[k] = q;
    sleeps[k] = buildSleep(rng, k, q);
  }

  let fatigue = 0.4; // carries yesterday's effort into this morning's numbers
  for (let i = 0; i < days; i++) {
    const key = addDays(first, i);
    const d0 = dayStartMs(key);
    const dow = fromKey(key).getDay();
    const ago = days - 1 - i;
    const sick = ago === 11 ? 1 : ago === 10 ? 0.6 : ago === 9 ? 0.2 : 0;
    const q = quality[key];
    const g = () => (rng() + rng() + rng() - 1.5) / 1.5;

    const rhr = Math.round(52 + fatigue * 2.6 + sick * 6 - q * 3 + g() * 1.3);
    const hrv = Math.round(clamp(69 - fatigue * 8.5 - sick * 22 + q * 13 + g() * 6, 22, 120));
    const br = +(14.1 + sick * 1.6 - q * 0.5 + g() * 0.35).toFixed(1);
    const skinTemp = +(sick * 0.95 + g() * 0.22).toFixed(2);
    const spo2Avg = +(96.5 - sick * 1.1 + g() * 0.5).toFixed(1);
    const vo2max = +(47.6 + Math.sin(i / 9) * 0.5 + i * 0.012).toFixed(1);

    // What happened today
    const sessions = [];
    if (dow >= 1 && dow <= 5 && sick < 0.5) COMMUTE.forEach((c) => sessions.push({ ...c }));
    for (const p of PLAN[dow] || []) {
      const skip = sick > 0.3 || (p.type !== 'WALKING' && rng() < 0.1);
      if (!skip) sessions.push({ ...p, x: p.x * (0.94 + rng() * 0.13), dur: Math.round(p.dur * (0.9 + rng() * 0.2)), at: p.at + Math.round(g() * 12) });
    }
    const strolls = 3 + Math.floor(rng() * 4);
    for (let s = 0; s < strolls; s++) {
      sessions.push({ name: null, at: 9 * 60 + Math.floor(rng() * 12 * 60), dur: 4 + Math.floor(rng() * 14), x: 0.24 + rng() * 0.12, steps: 96 });
    }

    const morning = sleeps[key];
    const tonight = sleeps[addDays(key, 1)];
    const hr = new Array(1440).fill(null);
    const stepsMin = new Array(1440).fill(0);
    let cur = rhr + 2, wander = 0;
    for (let m = 0; m < 1440; m++) {
      const ms = d0 + m * 60000;
      if (ms + 60000 > nowMs) break;   // the current minute is not finished yet
      const st = stageAt(morning, ms) || stageAt(tonight, ms);
      let target, tau = 3.2;
      if (st) {
        const off = st === 'deep' ? -4 : st === 'rem' ? 2.5 : st === 'wake' ? 7 : -1;
        const away = Math.min(Math.abs(m - 240), 1440 - Math.abs(m - 240));
        const nadir = -3 * Math.exp(-(away ** 2) / (2 * 150 ** 2));
        target = rhr + off + nadir + sick * 2;
        tau = 6;
      } else {
        wander = wander * 0.97 + g() * 1.6;
        const circ = 3.5 * Math.sin(((m - 9 * 60) / 1440) * Math.PI * 2);
        target = rhr + 15 + circ + wander + sick * 5;
        for (const s of sessions) {
          if (m >= s.at && m < s.at + s.dur) {
            let x = s.x;
            const into = m - s.at;
            if (s.intervals) x = into < 8 ? 0.5 : into > s.dur - 6 ? 0.45 : (Math.floor((into - 8) / 3) % 2 === 0 ? 0.9 : 0.58);
            else if (s.spiky) x += Math.sin(into / 2.3) * s.spiky + g() * 0.05;
            else x *= 0.9 + 0.14 * Math.min(1, into / 10) + 0.04 * (into / s.dur);
            target = Math.max(target, rhr + clamp(x, 0, 0.98) * (HR_MAX - rhr));
            stepsMin[m] = Math.round((s.steps || 0) * (0.9 + rng() * 0.2));
            tau = s.intervals ? 1.5 : 2.4;
          }
        }
        if (!stepsMin[m] && rng() < 0.2) stepsMin[m] = Math.floor(rng() * 34);
      }
      cur += (target - cur) / tau + g() * 1.1;
      hr[m] = Math.round(clamp(cur, 38, HR_MAX));
    }

    // Tracked workouts (strolls are just life, not sessions)
    const workouts = [];
    for (const s of sessions) {
      if (!s.name) continue;
      const t0 = d0 + s.at * 60000, t1 = t0 + s.dur * 60000;
      if (t1 > nowMs) continue;
      const seg = hr.slice(s.at, s.at + s.dur).filter((v) => v != null);
      if (!seg.length) continue;
      const avgHr = Math.round(seg.reduce((a, b) => a + b, 0) / seg.length);
      const stepSum = stepsMin.slice(s.at, s.at + s.dur).reduce((a, b) => a + b, 0);
      const km = s.kmh ? (s.kmh * s.dur) / 60 : (stepSum * (s.type === 'RUNNING' || s.type === 'INTERVAL_WORKOUT' ? 1.08 : 0.76)) / 1000;
      workouts.push({
        name: s.name, type: s.type, t0, t1, avgHr, maxHr: Math.max(...seg),
        kcal: Math.round(seg.reduce((a, v) => a + 1.2 + Math.max(0, v - rhr - 12) * 0.125, 0)),
        km: s.type === 'STRENGTH_TRAINING' ? null : +km.toFixed(1),
      });
    }

    const lived = hr.filter((v) => v != null);
    const steps = stepsMin.reduce((a, b) => a + b, 0);
    const kcal = lived.reduce((a, v) => a + 1.2 + Math.max(0, v - rhr - 12) * 0.125, 0);
    const azm = { fatBurn: 0, cardio: 0, peak: 0 };
    for (const v of lived) {
      const x = (v - rhr) / (HR_MAX - rhr);
      if (x >= 0.85) azm.peak += 2; else if (x >= 0.6) azm.cardio += 2; else if (x >= 0.4) azm.fatBurn += 1;
    }
    azm.total = azm.fatBurn + azm.cardio + azm.peak;

    const sleepReady = morning.end + 12 * 60000 <= nowMs;
    out.push({
      date: key,
      hr,
      rhr, hrv, br, skinTemp, vo2max,
      spo2: { avg: spo2Avg, min: +(spo2Avg - 1.9 - rng() * 0.8).toFixed(1), max: +Math.min(100, spo2Avg + 1.7).toFixed(1) },
      steps, distance: +((steps * 0.76) / 1000 + workouts.filter((w) => w.type.includes('BIK')).reduce((a, w) => a + (w.km || 0), 0)).toFixed(2),
      calories: Math.round(kcal),
      azm,
      sleep: sleepReady ? morning : null,
      naps: [],
      workouts,
      partial: key === today,
    });

    // tomorrow's morning feels today's work
    const hard = lived.reduce((a, v) => a + Math.max(0, (v - rhr) / (HR_MAX - rhr) - 0.4), 0);
    fatigue = clamp(fatigue * 0.35 + hard / 26 - 0.25, -0.6, 1.6);
  }

  return {
    demo: true,
    profile: { age: AGE, name: 'Demo wearer' },
    device: { name: 'Fitbit Air', battery: 68, lastSync: nowMs - 9 * 60000 },
    days: out,
    syncedAt: nowMs,
    issues: [],
  };
}
