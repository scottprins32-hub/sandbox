// Strain: a 0–21 score for how hard the heart worked today.
//
// WHOOP does not publish its formula. What it does say: strain comes from time
// spent at elevated heart rate relative to your own range, the scale runs 0–21,
// and it is not linear ("it takes more stress to move from 16 to 17 than from
// 4 to 5"). This module builds exactly that from published sports science:
//
//   1. Intensity per minute = share of heart-rate reserve (Karvonen):
//        x = (HR − resting HR) / (max HR − resting HR)
//   2. Load per minute = Banister's training impulse (TRIMP):
//        w(x) = 0.64 · x · e^(1.92·x)
//      counted only above 30 % of reserve, and only the part above what that
//      floor itself would score, so load rises smoothly from zero. Google's
//      own Cardio Load uses the same weighting and the same 30 % floor.
//   3. Strain = 4.1 · ln(1 + 0.315 · load), capped at 21.
//      The same curve open-source WHOOP approximations use; checked here
//      against the figures WHOOP has published: an hour's walk ≈ 6.5, an hour's
//      run ≈ 12, a marathon ≈ 20.4.
//
// It is an estimate in WHOOP's spirit, not WHOOP's number. It sees the heart
// only, so heavy lifting reads lower than it would on a WHOOP.

import { clamp, isNum } from './util.js?v=16';

export const STRAIN_MAX = 21;
export const FLOOR = 0.3;   // share of HR reserve below which a minute adds no load
const K = 4.1;
const ALPHA = 0.315;
// Banister's constants. The Health API does not expose sex, so "a" is the
// default and "b" is a setting.
const CURVES = { a: [0.64, 1.92], b: [0.86, 1.67] };
let curve = CURVES.a;
export const setCurve = (key) => { curve = CURVES[key] || CURVES.a; };
const w = (x) => curve[0] * x * Math.exp(curve[1] * x);

// Display zones, as share of heart-rate reserve.
export const ZONES = [
  { id: 0, key: 'rest', name: 'Resting', lo: -Infinity, hi: 0.3 },
  { id: 1, key: 'z1', name: 'Easy', lo: 0.3, hi: 0.45 },
  { id: 2, key: 'z2', name: 'Steady', lo: 0.45, hi: 0.6 },
  { id: 3, key: 'z3', name: 'Tempo', lo: 0.6, hi: 0.72 },
  { id: 4, key: 'z4', name: 'Hard', lo: 0.72, hi: 0.85 },
  { id: 5, key: 'z5', name: 'Max', lo: 0.85, hi: Infinity },
];

export const BANDS = [
  { name: 'Light', lo: 0, hi: 10 },
  { name: 'Moderate', lo: 10, hi: 14 },
  { name: 'High', lo: 14, hi: 18 },
  { name: 'All out', lo: 18, hi: 21.01 },
];
export const bandOf = (s) => BANDS.find((b) => s >= b.lo && s < b.hi) || BANDS[0];

export const reserveShare = (hr, rhr, hrMax) => clamp((hr - rhr) / Math.max(1, hrMax - rhr), 0, 1.1);
export const zoneOf = (x) => ZONES.find((z) => x >= z.lo && x < z.hi) || ZONES[0];
export const zoneBpm = (z, rhr, hrMax) => ({
  lo: z.id === 0 ? null : Math.round(rhr + z.lo * (hrMax - rhr)),
  hi: z.id === 5 ? null : Math.round(rhr + z.hi * (hrMax - rhr)),
});

export const minuteLoad = (x) => (x < FLOOR ? 0 : w(Math.min(x, 1)) - w(FLOOR));
export const strainFromLoad = (load) => clamp(K * Math.log(1 + ALPHA * Math.max(0, load)), 0, STRAIN_MAX);
export const loadFromStrain = (s) => (Math.exp(clamp(s, 0, STRAIN_MAX) / K) - 1) / ALPHA;

// hr: per-minute bpm for one day (null where the band was off the wrist).
export function analyseDay(hr, rhr, hrMax, from = 0, to = hr.length) {
  const zoneMin = [0, 0, 0, 0, 0, 0];
  const zoneLoad = [0, 0, 0, 0, 0, 0];
  const cumulative = new Array(hr.length).fill(null); // strain reached by each minute
  let load = 0, worn = 0, peak = null;
  for (let m = from; m < to; m++) {
    const v = hr[m];
    if (isNum(v)) {
      const x = reserveShare(v, rhr, hrMax);
      const z = zoneOf(x).id;
      const l = minuteLoad(x);
      zoneMin[z] += 1; zoneLoad[z] += l; load += l; worn += 1;
      if (peak == null || v > peak) peak = v;
    }
    cumulative[m] = strainFromLoad(load);
  }
  return { load, strain: strainFromLoad(load), zoneMin, zoneLoad, cumulative, worn, peak };
}

// Strain for one tracked session, cut from the day's minutes.
export function sessionStrain(hr, dayStart, t0, t1, rhr, hrMax) {
  const a = clamp(Math.floor((t0 - dayStart) / 60000), 0, hr.length);
  const b = clamp(Math.ceil((t1 - dayStart) / 60000), 0, hr.length);
  return analyseDay(hr, rhr, hrMax, a, b);
}

// The least strain worth doing today, given how recovered you woke up. WHOOP
// publishes only the colour guidance (run down → light, steady → moderate,
// recovered → high); this line passes through its band edges: 33 % → about 9,
// 67 % → about 13. It is a minimum: going further is allowed, it just earns
// nothing extra. `hi` is the top of the scale, so drawings show "from here up".
export function targetFor(recovery) {
  if (!isNum(recovery)) return null;
  return { lo: +(4.8 + 0.12 * recovery).toFixed(1), hi: STRAIN_MAX };
}

// Tanaka et al. 2001. Used only until real maxima are seen in the data.
export const estimateHrMax = (age) => Math.round(208 - 0.7 * (isNum(age) ? age : 35));
