// Timing, math, easing, noise and color — the vocabulary every scene shares.

export const W = 1920;
export const H = 1080;
export const FPS = 60;
export const BPM = 128;
export const BEAT = 60 / BPM; // 0.46875 s
export const DURATION = 15; // 8 bars at 128 BPM, exactly
export const FRAMES = Math.round(DURATION * FPS);

/** beats → seconds */
export const b = (beats) => beats * BEAT;

export const clamp = (x, a = 0, c = 1) => (x < a ? a : x > c ? c : x);
export const lerp = (a, c, t) => a + (c - a) * t;
export const prog = (x, a, c) => clamp((x - a) / (c - a));
export const fract = (x) => x - Math.floor(x);
export const TAU = Math.PI * 2;

/** progress of global time t through the beat window [b0, b1] */
export const bp = (t, b0, b1) => prog(t, b(b0), b(b1));

// ── easing ────────────────────────────────────────────────────────────────
const pow = Math.pow;
export const E = {
  lin: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2),
  inQuart: (t) => t * t * t * t,
  outQuart: (t) => 1 - pow(1 - t, 4),
  inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - pow(-2 * t + 2, 4) / 2),
  inQuint: (t) => t * t * t * t * t,
  outQuint: (t) => 1 - pow(1 - t, 5),
  inOutQuint: (t) => (t < 0.5 ? 16 * pow(t, 5) : 1 - pow(-2 * t + 2, 5) / 2),
  inExpo: (t) => (t <= 0 ? 0 : pow(2, 10 * t - 10)),
  outExpo: (t) => (t >= 1 ? 1 : 1 - pow(2, -10 * t)),
  inOutExpo: (t) =>
    t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? pow(2, 20 * t - 10) / 2 : (2 - pow(2, -20 * t + 10)) / 2,
  inSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  outSine: (t) => Math.sin((t * Math.PI) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  inCirc: (t) => 1 - Math.sqrt(1 - t * t),
  outCirc: (t) => Math.sqrt(1 - pow(t - 1, 2)),
  inOutCirc: (t) =>
    t < 0.5 ? (1 - Math.sqrt(1 - pow(2 * t, 2))) / 2 : (Math.sqrt(1 - pow(-2 * t + 2, 2)) + 1) / 2,
  inBack: (t, s = 1.70158) => (s + 1) * t * t * t - s * t * t,
  outBack: (t, s = 1.70158) => 1 + (s + 1) * pow(t - 1, 3) + s * pow(t - 1, 2),
  inOutBack: (t, s = 1.70158 * 1.525) =>
    t < 0.5
      ? (pow(2 * t, 2) * ((s + 1) * 2 * t - s)) / 2
      : (pow(2 * t - 2, 2) * ((s + 1) * (t * 2 - 2) + s) + 2) / 2,
  outElastic: (t) =>
    t <= 0 ? 0 : t >= 1 ? 1 : pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
};

/** CSS-style cubic-bezier easing */
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-6) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

// Signature curves: a hard "snap" and a long cinematic settle.
export const snap = bezier(0.7, 0, 0.1, 1);
export const settle = bezier(0.16, 1, 0.3, 1);
export const swoop = bezier(0.85, 0, 0.15, 1);

/** Damped spring step response, 0 → 1 with overshoot. */
export function spring(t, freq = 3, damp = 0.35) {
  if (t <= 0) return 0;
  const w = TAU * freq;
  const wd = w * Math.sqrt(1 - damp * damp);
  return 1 - Math.exp(-damp * w * t) * (Math.cos(wd * t) + ((damp * w) / wd) * Math.sin(wd * t));
}

/** Decaying oscillation after an impulse at t=0 (0 before). */
export function wobble(t, freq = 6, decay = 8) {
  if (t <= 0) return 0;
  return Math.exp(-decay * t) * Math.sin(TAU * freq * t);
}

/** Sharp attack, exponential decay envelope. */
export function hit(t, decay = 10) {
  return t < 0 ? 0 : Math.exp(-decay * t);
}

// ── deterministic randomness ──────────────────────────────────────────────
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(n) {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

// ── simplex noise (2D / 3D) ───────────────────────────────────────────────
const perm = new Uint8Array(512);
{
  const r = rng(1337);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
}
const G3 = [1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1];

export function noise2(x, y) {
  const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
  const s = (x + y) * F2;
  const i = Math.floor(x + s), j = Math.floor(y + s);
  const t = (i + j) * G2;
  const x0 = x - (i - t), y0 = y - (j - t);
  const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
  const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
  const ii = i & 255, jj = j & 255;
  let n = 0;
  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 > 0) { const g = (perm[ii + perm[jj]] % 12) * 3; t0 *= t0; n += t0 * t0 * (G3[g] * x0 + G3[g + 1] * y0); }
  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 > 0) { const g = (perm[ii + i1 + perm[jj + j1]] % 12) * 3; t1 *= t1; n += t1 * t1 * (G3[g] * x1 + G3[g + 1] * y1); }
  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 > 0) { const g = (perm[ii + 1 + perm[jj + 1]] % 12) * 3; t2 *= t2; n += t2 * t2 * (G3[g] * x2 + G3[g + 1] * y2); }
  return 70 * n;
}

export function noise3(x, y, z) {
  const F3 = 1 / 3, G3c = 1 / 6;
  const s = (x + y + z) * F3;
  const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
  const t = (i + j + k) * G3c;
  const x0 = x - (i - t), y0 = y - (j - t), z0 = z - (k - t);
  let i1, j1, k1, i2, j2, k2;
  if (x0 >= y0) {
    if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
    else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
  } else {
    if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
    else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
    else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
  }
  const x1 = x0 - i1 + G3c, y1 = y0 - j1 + G3c, z1 = z0 - k1 + G3c;
  const x2 = x0 - i2 + 2 * G3c, y2 = y0 - j2 + 2 * G3c, z2 = z0 - k2 + 2 * G3c;
  const x3 = x0 - 1 + 0.5, y3 = y0 - 1 + 0.5, z3 = z0 - 1 + 0.5;
  const ii = i & 255, jj = j & 255, kk = k & 255;
  const c = (tt, gx, gy, gz, g) => {
    if (tt < 0) return 0;
    tt *= tt;
    return tt * tt * (G3[g] * gx + G3[g + 1] * gy + G3[g + 2] * gz);
  };
  const g0 = (perm[ii + perm[jj + perm[kk]]] % 12) * 3;
  const g1 = (perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12) * 3;
  const g2 = (perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12) * 3;
  const g3 = (perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12) * 3;
  return 32 * (
    c(0.6 - x0 * x0 - y0 * y0 - z0 * z0, x0, y0, z0, g0) +
    c(0.6 - x1 * x1 - y1 * y1 - z1 * z1, x1, y1, z1, g1) +
    c(0.6 - x2 * x2 - y2 * y2 - z2 * z2, x2, y2, z2, g2) +
    c(0.6 - x3 * x3 - y3 * y3 - z3 * z3, x3, y3, z3, g3)
  );
}

// ── color ─────────────────────────────────────────────────────────────────
export const C = {
  ink: "#0E0D0C",
  ink2: "#1A1917",
  paper: "#F2EDE4",
  ember: "#FF4F1A",
  cobalt: "#2B3FF2",
  sun: "#FFC23A",
  blush: "#FFB4A0",
};

export function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgba(hex, a = 1) {
  const [r, g, bl] = rgb(hex);
  return `rgba(${r},${g},${bl},${a})`;
}
export function mixc(h1, h2, t, a = 1) {
  const p = rgb(h1), q = rgb(h2);
  return `rgba(${Math.round(lerp(p[0], q[0], t))},${Math.round(lerp(p[1], q[1], t))},${Math.round(lerp(p[2], q[2], t))},${a})`;
}
/** [0..1] floats for shaders */
export function glc(hex) {
  return rgb(hex).map((v) => v / 255);
}
