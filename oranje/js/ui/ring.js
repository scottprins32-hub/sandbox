// A small score ring for the Today view: a 270° arc open at the bottom,
// filled to the value with a knob at its tip.

import { arcPath, ease, h, polar, tween } from './motion.js?v=12';

const A0 = -135, SWEEP = 270, CX = 60, CY = 62, R = 48;

export function createRing(face, { max = 100 } = {}) {
  const fill = h('path', { class: 'ring-fill', d: arcPath(CX, CY, R, A0, A0 + SWEEP), pathLength: 1, 'stroke-dasharray': '0 1' });
  const knob = h('circle', { class: 'ring-knob', r: 5.5, cx: CX, cy: CY - R, opacity: 0 });
  face.prepend(h('svg', { class: 'ring-svg', viewBox: '0 0 120 120', 'aria-hidden': 'true' },
    h('path', { class: 'ring-track', d: arcPath(CX, CY, R, A0, A0 + SWEEP) }), fill, knob));
  let t = 0;
  const paint = (x) => {
    const v = Math.max(0, Math.min(1, x));
    // a hair under 1 so a full ring keeps its rounded cap instead of a seam
    fill.setAttribute('stroke-dasharray', `${(v * 0.9999).toFixed(4)} 1`);
    const [kx, ky] = polar(CX, CY, R, A0 + SWEEP * v);
    knob.setAttribute('cx', kx.toFixed(2)); knob.setAttribute('cy', ky.toFixed(2));
    knob.setAttribute('opacity', v > 0.002 ? 1 : 0);
  };
  return {
    set(value, { animate = true, delay = 0 } = {}) {
      const to = Number.isFinite(value) ? Math.max(0, Math.min(1, value / max)) : 0;
      tween(fill, { from: t, to, dur: animate ? 1200 : 0, delay, easing: ease.expo, update: (x) => { t = x; paint(x); } });
    },
  };
}
