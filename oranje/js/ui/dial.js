// One continuous strain arc and a separate bracket for the target range.
import { STRAIN_MAX } from '../core/strain.js';
import { arcPath, ease, h, polar, tween } from './motion.js?v=4';

const C = 300, A0 = -135, SWEEP = 270;
const angleOf = (value) => A0 + (value / STRAIN_MAX) * SWEEP;

export function createDial(root, gradientId) {
  const svg = h('svg', { viewBox: '0 0 600 600', class: 'dial-svg', 'aria-hidden': 'true' });
  svg.append(h('defs', {}, h('linearGradient', { id: gradientId, x1: '0%', y1: '90%', x2: '100%', y2: '0%' },
    h('stop', { offset: '0%', 'stop-color': 'var(--heat-a)' }),
    h('stop', { offset: '60%', 'stop-color': 'var(--heat-b)' }),
    h('stop', { offset: '100%', 'stop-color': 'var(--heat-c)' }),
  )));

  const arc = arcPath(C, C, 229, A0, angleOf(STRAIN_MAX));
  const track = h('path', { class: 'dial-track', d: arc });
  const progress = h('path', { class: 'dial-progress', d: arc, pathLength: STRAIN_MAX, opacity: 0 });
  const ticks = h('g');
  for (let i = 0; i <= STRAIN_MAX * 2; i++) {
    const major = i % 2 === 0, angle = angleOf(i / 2);
    const [x1, y1] = polar(C, C, major ? 197 : 204, angle);
    const [x2, y2] = polar(C, C, 210, angle);
    ticks.append(h('line', { x1, y1, x2, y2, class: major ? 'tick major' : 'tick' }));
  }
  const scale = h('g', { class: 'dial-scale' });
  for (const value of [0, STRAIN_MAX]) {
    const [x, y] = polar(C, C, 246, angleOf(value));
    scale.append(h('text', { x, y: y + 15, 'text-anchor': 'middle', text: value }));
  }
  const target = h('path', { class: 'dial-aim' });
  const caps = h('path', { class: 'dial-aim-caps' });
  svg.append(track, progress, ticks, scale, target, caps);
  root.prepend(svg);

  let value = 0, shownRange = null;

  function paint(v) {
    value = v;
    progress.setAttribute('stroke-dasharray', `${v.toFixed(2)} ${STRAIN_MAX}`);
    progress.setAttribute('opacity', v > 0 ? 1 : 0);
  }

  function paintTarget(range) {
    shownRange = range;
    if (!range) {
      target.removeAttribute('d');
      caps.removeAttribute('d');
      return;
    }
    const a = angleOf(range.lo), b = angleOf(range.hi);
    target.setAttribute('d', arcPath(C, C, 252, a, b));
    const cap = (angle) => {
      const [x1, y1] = polar(C, C, 245, angle), [x2, y2] = polar(C, C, 260, angle);
      return `M${x1} ${y1}L${x2} ${y2}`;
    };
    caps.setAttribute('d', cap(a) + cap(b));
  }

  return {
    set(v, range, { animate = true, delay = 0 } = {}) {
      tween(root, { from: value, to: v ?? 0, dur: animate ? 650 : 0, delay, easing: ease.out, update: paint });
      const from = shownRange || (range ? { lo: range.lo, hi: range.lo } : null);
      tween(target, {
        dur: animate && range ? 500 : 0, delay, easing: ease.out,
        update: (t) => paintTarget(range ? {
          lo: from.lo + (range.lo - from.lo) * t,
          hi: from.hi + (range.hi - from.hi) * t,
        } : null),
      });
    },
  };
}

// The two supporting scores use a shorter, linear meter.
export function createMeter(root, count = 20) {
  const ticks = [];
  for (let i = 0; i < count; i++) { const t = h('i'); ticks.push(t); root.append(t); }
  let value = 0;
  return {
    set(pct, { animate = true, delay = 0 } = {}) {
      tween(root, {
        from: value, to: pct ?? 0, dur: animate ? 530 : 0, delay, easing: ease.out,
        update: (x) => { value = x; const n = Math.round((x / 100) * count); ticks.forEach((t, i) => t.classList.toggle('on', i < n)); },
      });
    },
  };
}
