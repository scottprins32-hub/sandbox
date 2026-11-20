// Small SVG charts. Each one draws into its container at the container's real
// pixel width, so type stays crisp and nothing is stretched.

import { STRAIN_MAX, strainFromLoad } from '../core/strain.js';
import { clamp, fmtClock, fmtDur, fromKey, isNum } from '../core/util.js';
import { date as fmtDate, num, strings } from '../i18n.js';
import { stageName } from '../terms.js';
import { h } from './motion.js?v=12';

const t = strings({
  en: {
    wd: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    hypAria: 'Sleep stages from {from} to {to}',
    curveAria: "Strain rises quickly at first and flattens. Today's load of {load} gives strain {strain}.",
    curveAxis: 'Heart-rate load →',
    noNights: 'No nights recorded this week.',
    nightsAria: 'Bed and wake times for the last seven nights',
    bedToWake: '{from} to {to}',
    trendAria: 'Day strain and recovery for the last {n} days',
    dayAria: ({ d, s, r }) => `${d.toDateString()}: strain ${s ?? 'none'}, recovery ${r ?? 'none'}`,
  },
  nl: {
    wd: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
    hypAria: 'Slaapfases van {from} tot {to}',
    curveAria: 'Strain stijgt eerst snel en vlakt dan af. De belasting van vandaag, {load}, geeft een strain van {strain}.',
    curveAxis: 'Hartslagbelasting →',
    noNights: 'Deze week geen nachten vastgelegd.',
    nightsAria: 'Bedtijd en opstaan in de laatste zeven nachten',
    bedToWake: '{from} tot {to}',
    trendAria: 'Strain en herstel per dag, de laatste {n} dagen',
    dayAria: ({ d, s, r }) => `${fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}: strain ${s ?? 'geen'}, herstel ${r ?? 'geen'}`,
  },
});
const weekday = (d) => t('wd')[d.getDay()];
const mount = (el, height) => {
  const W = Math.max(120, el.clientWidth);
  const svg = h('svg', { viewBox: `0 0 ${W} ${height}`, width: W, height, role: 'img' });
  el.replaceChildren(svg);
  return { svg, W };
};

// Fortnight of one measurement. `onRead` reports the value under the pointer.
export function sparkline(el, values, { baseline = null, labels = [], onRead } = {}) {
  const H = 50, { svg, W } = mount(el, H);
  svg.setAttribute('aria-hidden', 'true');
  const pts = values.map((v, i) => (isNum(v) ? [i, v] : null)).filter(Boolean);
  if (pts.length < 2) { svg.append(h('line', { x1: 0, x2: W, y1: H / 2, y2: H / 2, class: 'spark-base' })); return; }
  const ys = pts.map((p) => p[1]).concat(isNum(baseline) ? [baseline] : []);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
  const pad = (hi - lo) * 0.18; lo -= pad; hi += pad;
  const X = (i) => 5 + (i / (values.length - 1)) * (W - 10);
  const Y = (v) => 4 + (1 - (v - lo) / (hi - lo)) * (H - 8);
  const d = pts.map(([i, v], k) => `${k ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('');
  if (isNum(baseline)) svg.append(h('line', { x1: 0, x2: W, y1: Y(baseline), y2: Y(baseline), class: 'spark-base' }));
  svg.append(h('path', { class: 'spark-area', d: `${d}L${X(pts[pts.length - 1][0]).toFixed(1)} ${H}L${X(pts[0][0]).toFixed(1)} ${H}Z` }));
  svg.append(h('path', { class: 'spark-line', d }));
  const last = pts[pts.length - 1];
  const dot = h('circle', { class: 'spark-dot', r: 4, cx: X(last[0]), cy: Y(last[1]) });
  svg.append(dot);
  if (!onRead) return;
  const read = (e) => {
    const r = svg.getBoundingClientRect();
    const i = clamp(Math.round(((e.clientX - r.left - 5) / (r.width - 10)) * (values.length - 1)), 0, values.length - 1);
    const near = pts.reduce((a, p) => (Math.abs(p[0] - i) < Math.abs(a[0] - i) ? p : a), pts[0]);
    dot.setAttribute('cx', X(near[0])); dot.setAttribute('cy', Y(near[1]));
    onRead(near[1], labels[near[0]]);
  };
  const reset = () => { dot.setAttribute('cx', X(last[0])); dot.setAttribute('cy', Y(last[1])); onRead(null); };
  el.onpointermove = read; el.onpointerdown = read; el.onpointerleave = reset; el.onpointercancel = reset;
}

const STAGE_ROWS = [['wake', 'var(--stage-wake)'], ['rem', 'var(--stage-rem)'], ['light', 'var(--stage-light)'], ['deep', 'var(--stage-deep)']];
export const STAGE_COLORS = Object.fromEntries(STAGE_ROWS);

export function hypnogram(el, sleep) {
  const H = 210, { svg, W } = mount(el, H);
  const PL = W < 520 ? 46 : 62, PR = 6, PT = 8, PB = 26, rowH = (H - PT - PB) / 4;
  const X = (ms) => PL + ((ms - sleep.start) / (sleep.end - sleep.start)) * (W - PL - PR);
  svg.setAttribute('aria-label', t('hypAria', { from: fmtClock(sleep.start), to: fmtClock(sleep.end) }));
  STAGE_ROWS.forEach(([k], r) => {
    const y = PT + r * rowH;
    svg.append(h('line', { x1: PL, x2: W - PR, y1: y + rowH, y2: y + rowH, class: 'h-row' }));
    svg.append(h('text', { x: 0, y: y + rowH / 2 + 4, class: 'h-name', text: stageName(k) }));
  });
  let prev = null;
  for (const st of sleep.stages) {
    const r = STAGE_ROWS.findIndex(([k]) => k === st.s);
    if (r < 0) continue;
    const x = X(st.t0), w = Math.max(1, X(st.t1) - x), y = PT + r * rowH + 5;
    if (prev) svg.append(h('line', { x1: x, x2: x, y1: Math.min(prev.y, y) + (rowH - 10) / 2, y2: Math.max(prev.y, y) + (rowH - 10) / 2, class: 'h-link' }));
    svg.append(h('rect', { x, y, width: w, height: rowH - 10, style: { fill: STAGE_ROWS[r][1] }, class: 'h-seg' }, h('title', { text: `${stageName(st.s)} ${fmtClock(st.t0)}–${fmtClock(st.t1)} (${fmtDur((st.t1 - st.t0) / 60000)})` })));
    prev = { y };
  }
  const first = new Date(sleep.start); first.setMinutes(0, 0, 0); first.setHours(first.getHours() + 1);
  const every = W < 520 ? 2 : 1;
  for (let t = first.getTime(), k = 0; t < sleep.end; t += 3600000, k++) {
    if (k % every) continue;
    svg.append(h('text', { x: X(t), y: H - 6, 'text-anchor': 'middle', class: 'axis', text: fmtClock(t) }));
  }
  svg.append(h('text', { x: PL, y: H - 6, class: 'axis', 'text-anchor': 'start', fill: 'currentColor', text: '' }));
}

// The strain curve, with today's dot on it.
export function strainCurve(el, load, strain) {
  const H = 210, { svg, W } = mount(el, H);
  const PL = 26, PR = 10, PT = 12, PB = 24, maxL = 560;
  const X = (l) => PL + (Math.min(l, maxL) / maxL) * (W - PL - PR);
  const Y = (s) => PT + (1 - s / STRAIN_MAX) * (H - PT - PB);
  svg.setAttribute('aria-label', t('curveAria', { load: Math.round(load), strain: num(strain, 1) }));
  svg.append(h('defs', {}, h('linearGradient', { id: 'curve-fill', x1: 0, y1: 0, x2: 0, y2: 1 }, h('stop', { offset: 0, style: { stopColor: 'var(--oranje)' }, 'stop-opacity': 0.3 }), h('stop', { offset: 1, style: { stopColor: 'var(--oranje)' }, 'stop-opacity': 0 }))));
  for (const s of [10, 14, 18, 21]) {
    svg.append(h('line', { x1: PL, x2: W - PR, y1: Y(s), y2: Y(s), class: 'c-band' }));
    svg.append(h('text', { x: PL - 6, y: Y(s) + 4, 'text-anchor': 'end', class: 'axis', text: s }));
  }
  let d = '';
  for (let l = 0; l <= maxL; l += 4) d += `${l ? 'L' : 'M'}${X(l).toFixed(1)} ${Y(strainFromLoad(l)).toFixed(1)}`;
  svg.append(h('path', { class: 'c-fill', d: `${d}L${X(maxL)} ${Y(0)}L${X(0)} ${Y(0)}Z` }));
  svg.append(h('path', { class: 'c-line', d }));
  const x = X(load), y = Y(strain);
  svg.append(h('line', { x1: x, x2: x, y1: y, y2: Y(0), class: 'c-guide' }));
  svg.append(h('line', { x1: PL, x2: x, y1: y, y2: y, class: 'c-guide' }));
  svg.append(h('circle', { class: 'c-dot', r: 6, cx: x, cy: y }));
  svg.append(h('text', { x: PL, y: H - 6, class: 'axis', text: t('curveAxis') }));
}

// Bed-to-wake bars for the last week, on a shared evening-to-morning clock.
export function consistency(el, nights) {
  const H = 190, { svg, W } = mount(el, H);
  const PL = 44, PT = 6, PB = 22;
  const rel = (ms) => { const d = new Date(ms); let m = d.getHours() * 60 + d.getMinutes(); if (m < 14 * 60) m += 1440; return m; }; // minutes since noon-ish, so evening < morning
  const all = nights.filter((n) => n.sleep);
  if (!all.length) { el.replaceChildren(h('p', { class: 'empty', text: t('noNights') })); return; }
  const lo = Math.floor(Math.min(...all.map((n) => rel(n.sleep.start))) / 60) * 60 - 30;
  const hi = Math.ceil(Math.max(...all.map((n) => rel(n.sleep.end))) / 60) * 60 + 30;
  const Y = (m) => PT + ((m - lo) / (hi - lo)) * (H - PT - PB);
  svg.setAttribute('aria-label', t('nightsAria'));
  for (let m = Math.ceil(lo / 120) * 120; m <= hi; m += 120) {
    svg.append(h('line', { x1: PL, x2: W, y1: Y(m), y2: Y(m), class: 'k-grid' }));
    svg.append(h('text', { x: 0, y: Y(m) + 4, class: 'axis', text: `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:00` }));
  }
  const slot = (W - PL) / nights.length, bw = Math.min(22, slot * 0.46);
  nights.forEach((n, i) => {
    const cx = PL + slot * (i + 0.5);
    svg.append(h('text', { x: cx, y: H - 5, 'text-anchor': 'middle', class: 'axis', text: weekday(fromKey(n.date)) }));
    if (!n.sleep) return;
    const y0 = Y(rel(n.sleep.start)), y1 = Y(rel(n.sleep.end));
    svg.append(h('rect', { x: cx - bw / 2, y: y0, width: bw, height: Math.max(2, y1 - y0), rx: 3, class: n.selected ? 'k-bar sel' : 'k-bar' }, h('title', { text: t('bedToWake', { from: fmtClock(n.sleep.start), to: fmtClock(n.sleep.end) }) })));
  });
}

// Strain bars with the morning's recovery drawn across them.
export function trendChart(el, days, selected, onPick) {
  const H = Math.max(220, el.clientHeight || 300), { svg, W } = mount(el, H);
  const PL = 28, PR = 38, PT = 14, PB = 40;
  const slot = (W - PL - PR) / days.length, bw = Math.max(4, Math.min(34, slot * 0.56));
  const Ys = (s) => PT + (1 - s / STRAIN_MAX) * (H - PT - PB);
  const Yr = (r) => PT + (1 - r / 100) * (H - PT - PB);
  svg.setAttribute('aria-label', t('trendAria', { n: days.length }));
  for (const s of [0, 7, 14, 21]) {
    svg.append(h('line', { x1: PL, x2: W - PR, y1: Ys(s), y2: Ys(s), class: 't-grid' }));
    svg.append(h('text', { x: PL - 8, y: Ys(s) + 4, 'text-anchor': 'end', class: 'axis', text: s }));
    svg.append(h('text', { x: W - PR + 8, y: Ys(s) + 4, class: 'axis', text: `${Math.round((s / 21) * 100)}%` }));
  }
  let d = '', pen = false;
  const dots = [];
  days.forEach((day, i) => {
    const cx = PL + slot * (i + 0.5);
    const date = fromKey(day.date);
    const showLabel = days.length <= 14 || date.getDay() === 1;
    if (showLabel) {
      svg.append(h('text', { x: cx, y: H - 22, 'text-anchor': 'middle', class: 'axis', text: weekday(date) }));
      svg.append(h('text', { x: cx, y: H - 8, 'text-anchor': 'middle', class: 'axis', text: date.getDate() }));
    }
    const s = isNum(day.strain) ? day.strain : 0;
    const hit = h('rect', { x: cx - slot / 2, y: PT, width: slot, height: H - PT - PB, class: 't-hit', tabindex: 0, role: 'button', 'aria-label': t('dayAria', { d: date, s: isNum(day.strain) ? num(day.strain, 1) : null, r: isNum(day.recovery) ? day.recovery + '%' : null }) });
    hit.addEventListener('click', () => onPick(day.date));
    hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(day.date); } });
    const bar = h('rect', { x: cx - bw / 2, y: Ys(s), width: bw, height: Math.max(0, Ys(0) - Ys(s)), rx: Math.min(3, bw / 2), class: `t-bar${day.date === selected ? ' sel' : ''}` });
    bar.style.pointerEvents = 'none';
    svg.append(hit, bar);
    if (isNum(day.recovery)) { d += `${pen ? 'L' : 'M'}${cx.toFixed(1)} ${Yr(day.recovery).toFixed(1)}`; pen = true; dots.push([cx, Yr(day.recovery)]); } else pen = false;
  });
  svg.append(h('path', { class: 't-rec', d }));
  for (const [x, y] of dots) svg.append(h('circle', { class: 't-dot', r: days.length > 20 ? 3 : 4, cx: x, cy: y }));
}
