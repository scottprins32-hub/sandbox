// Which reading wins when more than one source has it.
//
//   1. A wearable maker's own score (WHOOP's strain, recovery and sleep).
//   2. Oranje's estimate, worked out from what a wearable measured.
//
// Measurements follow the same idea: what the Fitbit band itself recorded
// comes first (see data/health.js, which asks Google for wearable data
// before anything else), WHOOP's readings fill the gaps, and data that phone
// apps wrote to Google Health is used only when no wearable has a value.

import { bandOf, targetFor } from './strain.js?v=16';
import { isNum } from './util.js?v=16';

// WHOOP lists cycles newest first; when one date has two cycles, keep the newest.
export function whoopByDate(days = []) {
  const out = {};
  for (const d of days) if (d?.date && !out[d.date]) out[d.date] = d;
  return out;
}

// Before scoring: fill resting heart rate and HRV from WHOOP where the band has none.
export function withWhoopVitals(rawDays, whoop) {
  if (!whoop) return rawDays;
  return rawDays.map((d) => {
    const w = whoop[d.date];
    if (!w) return d;
    const src = { ...(d.src || {}) };
    const next = { ...d, src };
    if (!isNum(d.rhr) && isNum(w.restingHeartRate)) { next.rhr = Math.round(w.restingHeartRate); src.rhr = 'whoop'; }
    if (!isNum(d.hrv) && isNum(w.hrv)) { next.hrv = Math.round(w.hrv); src.hrv = 'whoop'; }
    return next;
  });
}

// After scoring: WHOOP's own scores replace Oranje's estimates for the same day.
// The estimates stay on the day as `est`, so the views can show both.
export function applyOfficial(days, whoop) {
  for (const d of days) {
    const src = { ...(d.src || {}), strain: isNum(d.strain) ? 'oranje' : null, recovery: isNum(d.recovery) ? 'oranje' : null, sleep: isNum(d.sleepPct) ? 'oranje' : null };
    d.est = { strain: d.strain, recovery: d.recovery, sleep: d.sleepPct };
    d.src = src;
    const w = whoop?.[d.date];
    if (!w) continue;
    d.whoop = w;
    if (isNum(w.strain)) { d.strain = +w.strain.toFixed(1); d.band = bandOf(d.strain); src.strain = 'whoop'; }
    if (isNum(w.recovery)) { d.recovery = Math.round(w.recovery); d.target = targetFor(d.recovery); src.recovery = 'whoop'; }
    if (isNum(w.sleep)) {
      d.sleepPct = Math.round(w.sleep); src.sleep = 'whoop';
      if (d.sleepInfo) d.sleepInfo = { ...d.sleepInfo, score: d.sleepPct };
    }
  }
  return days;
}

export const SOURCE_NAME = { whoop: 'WHOOP', oranje: 'Oranje estimate' };
