// The strain dial: 211 ticks across 270°, one per tenth of a strain point.
// Ticks light up to the current value; an outer bracket marks today's target.

import { STRAIN_MAX } from '../core/strain.js';
import { arcPath, ease, h, polar, tween } from './motion.js?v=12';

const C = 300, A0 = -135, SWEEP = 270, N = 210;
const MID = 12;   // where the colour ramp turns from its first leg to its second
const angleOf = (v) => A0 + (v / STRAIN_MAX) * SWEEP;

export function createDial(root) {
  const svg = h('svg', { viewBox: '0 0 600 600', class: 'dial-svg', 'aria-hidden': 'true' });
  const gTicks = h('g', { class: 'dial-ticks' });
  const ticks = [];
  for (let i = 0; i <= N; i++) {
    const v = i / 10;
    const major = i % 10 === 0;
    const [x1, y1] = polar(C, C, major ? 222 : 236, angleOf(v));
    const [x2, y2] = polar(C, C, 262, angleOf(v));
    const line = h('line', { x1: x1.toFixed(2), y1: y1.toFixed(2), x2: x2.toFixed(2), y2: y2.toFixed(2), class: `tick${major ? ' major' : ''} ${v <= MID ? 's1' : 's2'}` });
    line.style.setProperty('--m', `${Math.round((v <= MID ? v / MID : (v - MID) / (STRAIN_MAX - MID)) * 100)}%`);
    ticks.push(line);
    gTicks.append(line);
  }
  const gScale = h('g', { class: 'dial-scale' });
  for (const v of [0, 10, 14, 18, 21]) {
    const [x, y] = polar(C, C, 198, angleOf(v));
    gScale.append(h('text', { x: x.toFixed(1), y: (y + 4).toFixed(1), 'text-anchor': 'middle', class: v === 0 || v === STRAIN_MAX ? 'end' : null, text: v }));
  }
  const target = h('path', { class: 'dial-aim', d: '' });
  const targetCaps = h('path', { class: 'dial-aim-caps', d: '' });
  const head = h('line', { class: 'dial-head' });
  const headDot = h('circle', { class: 'dial-head-dot', r: 5 });
  svg.append(target, targetCaps, gTicks, gScale, head, headDot);
  root.prepend(svg);

  let value = 0, lit = -1, tgt = null;

  function paint(v) {
    const upto = Math.round(v * 10);
    if (upto !== lit) {
      const [a, b] = upto > lit ? [lit + 1, upto] : [upto + 1, lit];
      for (let i = Math.max(0, a); i <= Math.min(N, b); i++) ticks[i].classList.toggle('on', i <= upto && v > 0);
      lit = upto;
    }
    const ang = angleOf(v);
    const [x1, y1] = polar(C, C, 212, ang), [x2, y2] = polar(C, C, 270, ang), [dx, dy] = polar(C, C, 280, ang);
    head.setAttribute('x1', x1); head.setAttribute('y1', y1); head.setAttribute('x2', x2); head.setAttribute('y2', y2);
    headDot.setAttribute('cx', dx); headDot.setAttribute('cy', dy);
    head.style.opacity = headDot.style.opacity = v > 0 ? 1 : 0;
    root.style.setProperty('--heat', (v / STRAIN_MAX).toFixed(3));
  }

  function paintTarget(lo, hi) {
    if (lo == null) { target.setAttribute('d', ''); targetCaps.setAttribute('d', ''); return; }
    const a = angleOf(lo), b = angleOf(hi);
    target.setAttribute('d', arcPath(C, C, 281, a, b));
    const cap = (ang) => { const [x1, y1] = polar(C, C, 272, ang), [x2, y2] = polar(C, C, 290, ang); return `M${x1} ${y1}L${x2} ${y2}`; };
    targetCaps.setAttribute('d', cap(a) + cap(b));
  }

  return {
    set(v, range, { animate = true, delay = 0 } = {}) {
      const to = v ?? 0;
      tween(root, { from: value, to, dur: animate ? 1300 : 0, delay, easing: ease.expo, update: (x) => { value = x; paint(x); } });
      const from = tgt || (range ? { lo: range.lo, hi: range.lo } : null);
      if (!range) { tgt = null; paintTarget(null); return; }
      tween(target, {
        from: 0, to: 1, dur: animate ? 900 : 0, delay: delay + (animate ? 250 : 0), easing: ease.out,
        update: (t) => { tgt = { lo: from.lo + (range.lo - from.lo) * t, hi: from.hi + (range.hi - from.hi) * t }; paintTarget(tgt.lo, tgt.hi); },
      });
    },
  };
}

// Linear version of the same idea, used for recovery and sleep (0–100).
export function createMeter(root, count = 50) {
  const ticks = [];
  for (let i = 0; i < count; i++) { const t = h('i'); ticks.push(t); root.append(t); }
  let value = 0;
  return {
    set(pct, { animate = true, delay = 0 } = {}) {
      tween(root, {
        from: value, to: pct ?? 0, dur: animate ? 1100 : 0, delay, easing: ease.expo,
        update: (x) => { value = x; const n = Math.round((x / 100) * count); ticks.forEach((t, i) => t.classList.toggle('on', i < n)); },
      });
    },
  };
}
