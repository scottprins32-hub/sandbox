// Motion and DOM primitives. One clock, a few eases, and every animation
// collapses to its end state when the visitor prefers reduced motion.

export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const ease = {
  out: (t) => 1 - Math.pow(1 - t, 4),
  expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOut: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  back: (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2),
};

const live = new Map(); // one running tween per key, so a new target interrupts cleanly

export function tween(key, { from = 0, to = 1, dur = 800, delay = 0, easing = ease.out, update, done }) {
  const prev = live.get(key);
  if (prev) cancelAnimationFrame(prev.raf);
  if (reduced() || dur <= 0) { update(to, 1); if (done) done(); live.delete(key); return; }
  const rec = { raf: 0 };
  const t0 = performance.now() + delay;
  const step = (now) => {
    const t = Math.min(1, Math.max(0, (now - t0) / dur));
    update(from + (to - from) * easing(t), t);
    if (t < 1) rec.raf = requestAnimationFrame(step);
    else { live.delete(key); if (done) done(); }
  };
  rec.raf = requestAnimationFrame(step);
  live.set(key, rec);
}

// A number that travels to its new value instead of snapping.
export function roll(el, to, { dur = 900, delay = 0, format = (v) => Math.round(v), key } = {}) {
  if (to == null || Number.isNaN(to)) { el.textContent = '–'; el._v = null; return; }
  const from = typeof el._v === 'number' ? el._v : 0;
  el._v = to;
  tween(key || el, { from, to, dur, delay, easing: ease.expo, update: (v) => { el.textContent = format(v); } });
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_TAGS = new Set(['svg', 'g', 'path', 'line', 'circle', 'rect', 'text', 'tspan', 'defs', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'polyline', 'polygon', 'mask', 'title']);

export function h(tag, attrs = {}, ...kids) {
  const el = SVG_TAGS.has(tag) ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.setAttribute('class', v);
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') { for (const [p, val] of Object.entries(v)) { if (p.startsWith('--')) el.style.setProperty(p, val); else el.style[p] = val; } }
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Reveal blocks once as they scroll into view. Content is visible without JS:
// the hidden state is only applied after this script has run.
export function watchReveals(root = document) {
  const items = $$('[data-reveal]', root).filter((el) => !el._seen);
  if (reduced() || !('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      e.target.dispatchEvent(new CustomEvent('reveal'));
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  items.forEach((el) => { el._seen = true; el.classList.add('pre'); io.observe(el); });
}

export const polar = (cx, cy, r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

export function arcPath(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${large} ${a1 > a0 ? 1 : 0} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}
