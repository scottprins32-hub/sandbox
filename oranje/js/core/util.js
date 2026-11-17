// Small shared helpers. No DOM in here: everything in js/core runs in Node too.

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export function mean(xs) {
  const v = xs.filter(isNum);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

export function sd(xs) {
  const v = xs.filter(isNum);
  if (v.length < 2) return null;
  const m = mean(v);
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1));
}

export function percentile(xs, p) {
  const v = xs.filter(isNum).sort((a, b) => a - b);
  if (!v.length) return null;
  const i = clamp((v.length - 1) * p, 0, v.length - 1);
  const lo = Math.floor(i), hi = Math.ceil(i);
  return lerp(v[lo], v[hi], i - lo);
}

// ---- dates: a "day" is always a local calendar date string YYYY-MM-DD ----

const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return dateKey(d); };
export const todayKey = () => dateKey(new Date());
export const dayStartMs = (k) => fromKey(k).getTime();

export function rangeKeys(endKey, n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(endKey, -i));
  return out;
}

export const fmtDur = (min) => {
  if (!isNum(min)) return '–';
  const m = Math.round(min);
  return m >= 60 ? `${Math.floor(m / 60)}h ${pad(m % 60)}m` : `${m}m`;
};
export const fmtClock = (ms) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fmtMinuteOfDay = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(Math.floor(m % 60))}`;
