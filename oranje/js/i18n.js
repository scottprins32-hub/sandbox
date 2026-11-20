// English and Dutch. One small module every part of the app uses.
//
//   const t = strings({ en: { hi: 'Hello {name}' }, nl: { hi: 'Hallo {name}' } });
//   t('hi', { name: 'Scott' })   → in the current language
//
// A value may also be a function of the variables, for plurals and the like.
// Static text in the HTML is marked with data-i18n (text), data-i18n-html
// (markup we wrote ourselves, never user data) and data-i18n-attr
// ("aria-label:key; title:key"); applyPage() fills those in.
// The language is stored per browser. Without a choice, a browser set to
// Dutch gets Dutch and everyone else gets English.

import { setDurationUnits } from './core/util.js';

const KEY = 'oranje.lang';
export const LANGS = ['en', 'nl'];

function initial() {
  if (typeof localStorage === 'undefined' || typeof document === 'undefined') return 'en';   // Node: tests run in English
  try { const v = localStorage.getItem(KEY); if (LANGS.includes(v)) return v; } catch { /* storage off */ }
  const nav = (navigator.languages || [navigator.language || 'en']).map((l) => String(l).toLowerCase());
  return nav.some((l) => l === 'nl' || l.startsWith('nl-')) ? 'nl' : 'en';
}

let lang = typeof navigator === 'undefined' ? 'en' : initial();
const listeners = new Set();

export const getLang = () => lang;
export const locale = () => (lang === 'nl' ? 'nl-NL' : 'en-GB');

function sync() {
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  setDurationUnits(lang === 'nl' ? { h: 'u', m: 'm' } : { h: 'h', m: 'm' });
}
sync();

export function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return;
  lang = next;
  try { localStorage.setItem(KEY, next); } catch { /* storage off */ }
  sync();
  for (const fn of listeners) fn(lang);
}
export const onLang = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s);

// A translator for one table. Missing Dutch falls back to English, then to the key.
export function strings(table) {
  return (key, vars) => {
    const v = table[lang]?.[key] ?? table.en?.[key];
    if (v == null) return key;
    return typeof v === 'function' ? v(vars || {}) : fill(v, vars);
  };
}

// Numbers and dates in the reader's language: 7.3 → 7,3 and 9,855 → 9.855 in Dutch.
const nf = new Map();
export function num(v, digits = 0) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '–';
  const k = `${lang}${digits}`;
  if (!nf.has(k)) nf.set(k, new Intl.NumberFormat(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits }));
  return nf.get(k).format(v);
}
export const signedNum = (v, digits = 0) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${num(Math.abs(v), digits)}`;
export const date = (d, opts) => new Date(d).toLocaleDateString(locale(), opts);
export const dateTime = (d, opts) => new Date(d).toLocaleString(locale(), opts);

// Static page text. `t` is the page's own translator (see i18n-page.js).
export function applyPage(t, root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of root.querySelectorAll('[data-i18n-attr]')) {
    for (const pair of el.dataset.i18nAttr.split(';')) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    }
  }
}
