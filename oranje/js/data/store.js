// What Oranje remembers, all of it in this browser's localStorage: each
// person's settings, and the last synced data so the page opens instantly.
// Several people may share one device, so settings are kept per person and
// the cache remembers whose it is.

const KEY_SETTINGS = 'oranje.settings';
const KEY_CACHE = 'oranje.cache.v1';
const KEY_DEMO = 'oranje.demo';
const KEY_SEEN = 'oranje.game.seen';

export const VITALS = ['rhr', 'hrv', 'spo2', 'br', 'skinTemp', 'vo2max', 'steps', 'distance', 'calories', 'azm'];
const DEFAULTS = { hrMax: null, curve: 'a', hidden: [], range: 14 };

const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const write = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
const settingsKey = (who) => (who ? `${KEY_SETTINGS}:${who}` : KEY_SETTINGS);

export const store = {
  settings(who) { return { ...DEFAULTS, ...(read(KEY_SETTINGS) || {}), ...(who ? read(settingsKey(who)) || {} : {}) }; },
  saveSettings(s, who) { write(settingsKey(who), s); },
  cache() { const c = read(KEY_CACHE); return c && Array.isArray(c.days) ? c : null; },
  saveCache(data) {
    if (write(KEY_CACHE, data)) return;
    // Storage full: keep the most recent three weeks rather than nothing.
    write(KEY_CACHE, { ...data, days: data.days.slice(-21) });
  },
  clearCache() { write(KEY_CACHE, null); },
  // Everything kept for one person: used by "Disconnect and erase".
  forget(who) {
    this.clearCache();
    if (who) write(settingsKey(who), null);
    const seen = read(KEY_SEEN);
    if (seen && who) { delete seen[`google:${who}`]; write(KEY_SEEN, seen); }
  },
  get demo() { return read(KEY_DEMO) === true; },
  set demo(v) { write(KEY_DEMO, v ? true : null); },
};
