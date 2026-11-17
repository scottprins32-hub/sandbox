// Sleep and recovery scores, plus the per-day roll-up the UI reads.
// Google Health does not expose Fitbit's own Readiness or Sleep Score through
// the API, so these are computed here, in the open, from the raw measurements.

import { analyseDay, bandOf, estimateHrMax, sessionStrain, targetFor } from './strain.js';
import { clamp, dayStartMs, isNum, mean, percentile, sd } from './util.js';

const BASE_SLEEP_NEED_MIN = 7.6 * 60;

// How much sleep last night called for: a base need, plus extra after a hard
// day, plus a share of what is still owed from the night before.
export function sleepNeed(prev) {
  let need = BASE_SLEEP_NEED_MIN;
  if (prev && isNum(prev.strain)) need += clamp(prev.strain - 8, 0, 13) * 3.2;
  if (prev && isNum(prev.sleepDebt)) need += clamp(prev.sleepDebt, 0, 120) * 0.3;
  return Math.round(need);
}

export function sleepScore(sleep, needMin, usualMidpoint) {
  if (!sleep) return null;
  const sum = { wake: 0, light: 0, deep: 0, rem: 0 };
  for (const st of sleep.stages) sum[st.s] = (sum[st.s] || 0) + (st.t1 - st.t0) / 60000;
  const asleep = sleep.asleepMin ?? sum.light + sum.deep + sum.rem;
  const inBed = sleep.inBedMin ?? (sleep.end - sleep.start) / 60000;
  const efficiency = inBed ? asleep / inBed : null;
  const hasStages = sum.deep + sum.rem > 0;
  const restorative = hasStages ? (sum.deep + sum.rem) / Math.max(1, asleep) : null;

  const sufficiency = clamp(asleep / needMin, 0, 1);
  const effPart = isNum(efficiency) ? clamp((efficiency - 0.7) / 0.22, 0, 1) : 0.7;
  const restPart = isNum(restorative) ? clamp(restorative / 0.42, 0, 1) : 0.7;
  const midpoint = (sleep.start + sleep.end) / 2;
  const md = new Date(midpoint);
  const mod = md.getHours() * 60 + md.getMinutes();
  let drift = isNum(usualMidpoint) ? Math.abs(mod - usualMidpoint) : 0;
  if (drift > 720) drift = 1440 - drift;
  const regPart = clamp(1 - drift / 120, 0, 1);

  // Hours come first: the score is the share of your need you met, marked
  // down by up to 30 % when the sleep was broken, shallow or badly timed.
  const quality = 0.4 * effPart + 0.4 * restPart + 0.2 * regPart;
  const score = 100 * sufficiency * (0.7 + 0.3 * quality);
  return {
    score: Math.round(score), asleep, inBed, efficiency, restorative, need: needMin,
    debt: Math.max(0, needMin - asleep), stageMin: sum, hasStages, midpointMin: mod,
    quality, parts: { sufficiency, efficiency: effPart, restorative: restPart, regularity: regPart },
  };
}

// Recovery: how today's morning numbers sit against your own last month.
// HRV carries most of the weight, as it does in WHOOP's model; resting heart
// rate, sleep and breathing rate fill in the rest. Output is 0–100.
export function recoveryScore(day, baseline, sleepPct) {
  const parts = [];
  const z = (v, b, flip, floorSd) => {
    if (!isNum(v) || !b || !isNum(b.mean)) return null;
    const s = Math.max(b.sd || 0, floorSd);
    return clamp(((v - b.mean) / s) * (flip ? -1 : 1), -3, 3);
  };
  const add = (key, zv, w) => { if (zv != null) parts.push({ key, z: zv, w }); };
  add('hrv', isNum(day.hrv) && baseline.lnHrv ? z(Math.log(day.hrv), baseline.lnHrv, false, 0.08) : null, 0.5);
  add('rhr', z(day.rhr, baseline.rhr, true, 1.5), 0.25);
  add('sleep', isNum(sleepPct) ? clamp((sleepPct - 80) / 12, -3, 2) : null, 0.2);
  add('br', z(day.br, baseline.br, true, 0.3), 0.05);
  if (!parts.some((p) => p.key === 'hrv' || p.key === 'rhr')) return null;
  const wsum = parts.reduce((a, p) => a + p.w, 0);
  const c = parts.reduce((a, p) => a + p.z * p.w, 0) / wsum;
  const score = 100 / (1 + Math.exp(-(1.25 * c + 0.32)));   // an average morning reads ~58 %
  return { score: Math.round(clamp(score, 1, 99)), parts: parts.map((p) => ({ ...p, w: p.w / wsum })), composite: c };
}

export const recoveryBand = (r) => (!isNum(r) ? null : r >= 67 ? 'Recovered' : r >= 34 ? 'Steady' : 'Run down');

function baselineOf(days, idx, window = 30) {
  const prior = days.slice(Math.max(0, idx - window), idx);
  const stat = (f) => {
    const xs = prior.map(f).filter(isNum);
    return xs.length >= 3 ? { mean: mean(xs), sd: sd(xs), n: xs.length } : null;
  };
  return {
    rhr: stat((d) => d.rhr),
    hrv: stat((d) => d.hrv),
    lnHrv: stat((d) => (isNum(d.hrv) ? Math.log(d.hrv) : null)),
    br: stat((d) => d.br),
    spo2: stat((d) => d.spo2?.avg),
    skinTemp: stat((d) => d.skinTemp),
    vo2max: stat((d) => d.vo2max),
    steps: stat((d) => (d.partial ? null : d.steps)),
    distance: stat((d) => (d.partial ? null : d.distance)),
    calories: stat((d) => (d.partial ? null : d.calories)),
    azm: stat((d) => (d.partial ? null : d.azm?.total)),
  };
}

// Highest heart rates actually seen beat any age formula.
export function resolveHrMax(days, profile, override) {
  if (isNum(override) && override > 100) return { value: Math.round(override), source: 'set by you' };
  const est = estimateHrMax(profile?.age);
  const peaks = days.map((d) => percentile(d.hr || [], 0.999)).filter(isNum);
  const seen = peaks.length ? Math.max(...peaks) : null;
  if (isNum(seen) && seen > est) return { value: Math.round(seen), source: 'highest seen' };
  return { value: est, source: isNum(profile?.age) ? `estimated from age ${profile.age}` : 'estimated' };
}

// Turn raw days into everything the UI shows. Pure and deterministic.
export function computeAll(rawDays, profile = {}, settings = {}) {
  const days = [...rawDays].sort((a, b) => (a.date < b.date ? -1 : 1));
  const hrMax = resolveHrMax(days, profile, settings.hrMax);
  const out = [];
  let prev = null;
  days.forEach((d, i) => {
    const baseline = baselineOf(days, i);
    const hr = d.hr || [];
    const rhr = isNum(d.rhr) ? d.rhr : (percentile(hr, 0.04) ?? baseline.rhr?.mean ?? 60);
    const a = analyseDay(hr, rhr, hrMax.value);
    const hasHr = a.worn > 30;

    const midpoints = out.slice(-14).map((o) => o.sleepInfo?.midpointMin).filter(isNum);
    const need = sleepNeed(prev);
    const sleepInfo = sleepScore(d.sleep, need, midpoints.length >= 3 ? mean(midpoints) : null);
    const recovery = recoveryScore({ ...d, rhr }, baseline, sleepInfo?.score);
    const d0 = dayStartMs(d.date);
    const workouts = (d.workouts || []).map((w) => {
      const s = sessionStrain(hr, d0, w.t0, w.t1, rhr, hrMax.value);
      return { ...w, strain: s.worn ? s.strain : null, load: s.load, zoneMin: s.zoneMin, durMin: Math.round((w.t1 - w.t0) / 60000) };
    }).sort((x, y) => x.t0 - y.t0);

    const row = {
      ...d, rhrUsed: rhr, hrMax: hrMax.value, baseline,
      strain: hasHr ? a.strain : null, load: a.load, band: hasHr ? bandOf(a.strain) : null,
      zoneMin: a.zoneMin, zoneLoad: a.zoneLoad, cumulative: a.cumulative, worn: a.worn, peakHr: a.peak,
      sleepInfo, sleepPct: sleepInfo?.score ?? null, sleepDebt: sleepInfo?.debt ?? null,
      recovery: recovery?.score ?? null, recoveryParts: recovery?.parts ?? [],
      target: targetFor(recovery?.score), workouts,
    };
    out.push(row);
    prev = row;
  });
  // Tonight's sleep often starts before midnight; let today's chart show it.
  out.forEach((d, i) => {
    const next = out[i + 1]?.sleep;
    d.nextSleep = next && next.start < dayStartMs(d.date) + 86400000 ? next : null;
  });
  return { days: out, byDate: Object.fromEntries(out.map((d) => [d.date, d])), hrMax };
}
