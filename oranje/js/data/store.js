// What Oranje remembers, all of it in this browser's localStorage:
// your settings and the last synced data, so the page opens instantly.

const KEY_SETTINGS = 'oranje.settings';
const KEY_CACHE = 'oranje.cache.v1';
const KEY_DEMO = 'oranje.demo';

export const VITALS = ['rhr', 'hrv', 'spo2', 'br', 'skinTemp', 'vo2max', 'steps', 'distance', 'calories', 'azm'];
const DEFAULTS = { hrMax: null, curve: 'a', hidden: [], range: 14 };

const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const write = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

export const store = {
  settings() { return { ...DEFAULTS, ...(read(KEY_SETTINGS) || {}) }; },
  saveSettings(s) { write(KEY_SETTINGS, s); },
  cache() { const c = read(KEY_CACHE); return c && Array.isArray(c.days) ? c : null; },
  saveCache(data) {
    if (write(KEY_CACHE, data)) return;
    // Storage full: keep the most recent three weeks rather than nothing.
    write(KEY_CACHE, { ...data, days: data.days.slice(-21) });
  },
  clearCache() { write(KEY_CACHE, null); },
  get demo() { return read(KEY_DEMO) === true; },
  set demo(v) { write(KEY_DEMO, v ? true : null); },
};
