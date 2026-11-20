// The day as one line: 24 hours of heart rate, coloured by how hard each
// minute was, with last night's sleep and every session marked on it and the
// strain it added up to drawn over the top. Changing day reshapes the line.

import { ZONES, zoneOf, reserveShare } from '../core/strain.js';
import { clamp, dayStartMs, fmtDur, fmtMinuteOfDay, fromKey, isNum } from '../core/util.js';
import { date, num, strings } from '../i18n.js';
import { stageName, zoneName } from '../terms.js';
import { ease, h, reduced, tween } from './motion.js?v=11';

const t = strings({
  en: {
    rest: 'Rest {bpm}',
    asleepFor: 'Asleep {dur}', asleep: 'Asleep',
    now: 'Now',
    stageSleep: ({ s }) => `${stageName(s)} sleep`,
    strainAt: 'Strain {v}',
    aria: ({ day, peak }) => `Heart rate through ${day}${peak ? `, peaking at ${peak}` : ''} beats per minute. Use the arrow keys to read values.`,
  },
  nl: {
    rest: 'Rust {bpm}',
    asleepFor: 'Slaap {dur}', asleep: 'Slaap',
    now: 'Nu',
    stageSleep: ({ s }) => ({ deep: 'Diepe slaap', light: 'Lichte slaap', rem: 'REM-slaap', wake: 'Wakker' })[s] || stageName(s),
    strainAt: 'Strain {v}',
    aria: ({ nice, peak }) => `Hartslag op ${nice}${peak ? `, met een piek van ${peak}` : ''}, in slagen per minuut. Lees de waarden af met de pijltjestoetsen.`,
  },
});
// session names come from the data source, so they are escaped before going into the tooltip's markup
const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const ZONE_COLOR = [0, 1, 2, 3, 4, 5].map((z) => `var(--z${z})`);   // theme tokens, rest → max
let uid = 0;

export function createRiver(root) {
  const id = `rv${++uid}`;
  const svg = h('svg', { class: 'river-svg', role: 'img' });
  const tip = h('div', { class: 'river-tip', 'aria-hidden': 'true' });
  root.append(svg, tip);

  const grad = h('linearGradient', { id: `${id}-line`, gradientUnits: 'userSpaceOnUse', x1: 0, x2: 0 });
  const fill = h('linearGradient', { id: `${id}-fill`, gradientUnits: 'userSpaceOnUse', x1: 0, x2: 0 });
  const clipRect = h('rect', { x: 0, y: 0, height: 9999, width: 9999 });
  const defs = h('defs', {}, grad, fill, h('clipPath', { id: `${id}-clip` }, clipRect));
  const gBack = h('g'), gGrid = h('g', { class: 'river-grid' }), gMarks = h('g');
  const area = h('path', { class: 'river-area', fill: `url(#${id}-fill)` });
  const line = h('path', { class: 'river-line', stroke: `url(#${id}-line)` });
  const build = h('path', { class: 'river-build' });
  const gDraw = h('g', { 'clip-path': `url(#${id}-clip)` }, area, line, build);
  const gTop = h('g'), cursor = h('g', { class: 'river-cursor' });
  const cLine = h('line'), cDot = h('circle', { r: 4.5 });
  cursor.append(cLine, cDot);
  svg.append(defs, gBack, gGrid, gMarks, gDraw, gTop, cursor);

  let W = 0, H = 0, PL = 0, PR = 56, PT = 34, PB = 26;
  let model = null;          // the day being shown
  let shape = null;          // { hr, lo, hi } currently drawn (may be mid-morph)
  let first = true;

  const X = (m) => PL + (m / 1440) * (W - PL - PR);
  const Y = (bpm, s) => PT + (1 - (bpm - s.lo) / (s.hi - s.lo)) * (H - PT - PB);

  function scaleFor(day) {
    const vals = day.hr.filter(isNum);
    const reserve = day.hrMax - day.rhrUsed;
    const lo = Math.floor((Math.min(day.rhrUsed - 6, ...(vals.length ? vals : [day.rhrUsed])) - 2) / 5) * 5;
    const hi = Math.ceil(Math.max(day.rhrUsed + reserve * 0.64, (day.peakHr || 0) + 8) / 5) * 5;
    return { lo, hi };
  }

  function paths(hr, s, cumulative) {
    const plotW = W - PL - PR;
    const step = Math.max(1, Math.round(1440 / (plotW / 1.6)));
    const base = H - PB;
    let dl = '', da = '', db = '', pen = false, runStart = 0, lastX = 0, bpen = false;
    for (let m = 0; m < 1440; m += step) {
      let sum = 0, n = 0;
      for (let k = m; k < Math.min(1440, m + step); k++) if (isNum(hr[k])) { sum += hr[k]; n++; }
      const x = X(m + step / 2);
      if (!n) { if (pen) da += `L${lastX.toFixed(1)} ${base}L${runStart.toFixed(1)} ${base}Z`; pen = false; }
      else {
        const y = Y(sum / n, s).toFixed(1);
        if (!pen) { dl += `M${x.toFixed(1)} ${y}`; da += `M${x.toFixed(1)} ${y}`; runStart = x; pen = true; }
        else { dl += `L${x.toFixed(1)} ${y}`; da += `L${x.toFixed(1)} ${y}`; }
        lastX = x;
      }
      const c = cumulative && cumulative[Math.min(1439, m + step - 1)];
      if (isNum(c) && n) {
        const y = (PT + (1 - c / 21) * (H - PT - PB)).toFixed(1);
        db += `${bpen ? 'L' : 'M'}${x.toFixed(1)} ${y}`; bpen = true;
      }
    }
    if (pen) da += `L${lastX.toFixed(1)} ${base}L${runStart.toFixed(1)} ${base}Z`;
    return { dl, da, db };
  }

  function paintGradients(day, s) {
    const top = Y(s.hi, s), bot = Y(s.lo, s);
    for (const g of [grad, fill]) { g.setAttribute('y1', top); g.setAttribute('y2', bot); g.replaceChildren(); }
    const reserve = day.hrMax - day.rhrUsed;
    const stops = [];
    for (let z = 5; z >= 0; z--) {
      const centre = z === 0 ? day.rhrUsed + reserve * 0.12 : z === 5 ? day.rhrUsed + reserve * 0.93 : day.rhrUsed + reserve * (ZONES[z].lo + ZONES[z].hi) / 2;
      stops.push([clamp((s.hi - centre) / (s.hi - s.lo), 0, 1), ZONE_COLOR[z]]);
    }
    for (const [o, c] of stops) {
      grad.append(h('stop', { offset: o.toFixed(3), style: { stopColor: c } }));
      fill.append(h('stop', { offset: o.toFixed(3), style: { stopColor: c }, 'stop-opacity': (0.34 - o * 0.3).toFixed(3) }));
    }
  }

  function paintShape(day, s, hr, cumulative) {
    paintGradients(day, s);
    const p = paths(hr, s, cumulative);
    line.setAttribute('d', p.dl); area.setAttribute('d', p.da); build.setAttribute('d', p.db);
    shape = { hr, lo: s.lo, hi: s.hi };
  }

  function paintFurniture(day, s) {
    gBack.replaceChildren(); gGrid.replaceChildren(); gMarks.replaceChildren(); gTop.replaceChildren();
    const base = H - PB, d0 = dayStartMs(day.date);
    const minuteOf = (ms) => clamp((ms - d0) / 60000, 0, 1440);
    const narrow = W < 620;

    // hours
    for (let hr = 0; hr <= 24; hr += narrow ? 6 : 3) {
      const x = X(hr * 60);
      gGrid.append(h('line', { x1: x, x2: x, y1: PT, y2: base, class: 'hour' }));
      gGrid.append(h('text', { x: hr === 24 ? x - 2 : x + (hr === 0 ? 0 : 0), y: H - 7, 'text-anchor': hr === 24 ? 'end' : hr === 0 ? 'start' : 'middle', class: 'axis', text: `${String(hr).padStart(2, '0')}:00` }));
    }
    // zone thresholds
    const reserve = day.hrMax - day.rhrUsed;
    for (const z of ZONES.slice(1)) {
      const bpm = day.rhrUsed + z.lo * reserve;
      if (bpm <= s.lo || bpm >= s.hi) continue;
      const y = Y(bpm, s);
      gGrid.append(h('line', { x1: PL, x2: W - PR, y1: y, y2: y, class: 'zone' }));
      gGrid.append(h('text', { x: W - PR + 8, y: y + 4, class: 'axis zone-label', text: narrow ? Math.round(bpm) : `${zoneName(z)} ${Math.round(bpm)}` }));
    }
    const yr = Y(day.rhrUsed, s);
    gGrid.append(h('line', { x1: PL, x2: W - PR, y1: yr, y2: yr, class: 'zone rest' }));
    gGrid.append(h('text', { x: W - PR + 8, y: yr + 4, class: 'axis zone-label', text: narrow ? Math.round(day.rhrUsed) : t('rest', { bpm: Math.round(day.rhrUsed) }) }));

    // sleep: the night that ended this morning, and tonight if it has begun
    const nights = [day.sleep, day.nextSleep].filter(Boolean);
    for (const sl of nights) {
      const a = minuteOf(sl.start), b = minuteOf(sl.end);
      if (b - a < 5) continue;
      gBack.append(h('rect', { x: X(a), y: PT, width: X(b) - X(a), height: base - PT, class: 'sleep-block' }));
      for (const st of sl.stages) {
        const sa = minuteOf(st.t0), sb = minuteOf(st.t1);
        if (sb <= sa) continue;
        gMarks.append(h('rect', { x: X(sa), y: base - 5, width: Math.max(0.5, X(sb) - X(sa)), height: 5, class: `stage ${st.s}` }));
      }
      if (X(b) - X(a) > 90) gTop.append(h('text', { x: X(a) + 10, y: PT + 18, class: 'mark-label sleep', text: sl === day.sleep ? t('asleepFor', { dur: fmtDur(sl.asleepMin) }) : t('asleep') }));
    }
    // sessions
    let lastEnd = -1e9;
    for (const w of day.workouts) {
      const a = minuteOf(w.t0), b = minuteOf(w.t1);
      const xa = X(a), xb = X(b);
      gBack.append(h('rect', { x: xa, y: PT, width: Math.max(1, xb - xa), height: base - PT, class: 'work-block' }));
      gTop.append(h('path', { d: `M${xa} ${PT + 5}V${PT - 1}H${xb}V${PT + 5}`, class: 'work-bracket' }));
      const label = narrow ? (isNum(w.strain) ? num(w.strain, 1) : '') : `${w.name}${isNum(w.strain) ? ' ' + num(w.strain, 1) : ''}`;
      const need = label.length * 6.6 + 10;
      const lx = Math.max(xa, lastEnd + 8);
      if (lx + need < W - PR + 40) { gTop.append(h('text', { x: lx, y: PT - 8, class: 'mark-label work', text: label })); lastEnd = lx + need; }
    }
    // now
    if (day.partial) {
      const lastMin = day.hr.reduce((acc, v, i) => (isNum(v) ? i : acc), -1);
      if (lastMin > 0) {
        const x = X(lastMin + 1);
        gTop.append(h('line', { x1: x, x2: x, y1: PT, y2: base, class: 'now' }));
        gTop.append(h('text', { x: x + 6, y: PT + 12, class: 'mark-label nowlab', text: t('now') }));
      }
    }
    // strain end label
    const lastC = day.cumulative.reduce((acc, v, i) => (isNum(v) && isNum(day.hr[i]) ? i : acc), -1);
    if (lastC > 0 && isNum(day.strain)) {
      const y = PT + (1 - day.strain / 21) * (H - PT - PB);
      gTop.append(h('circle', { cx: X(lastC), cy: y, r: 3.5, class: 'build-end' }));
    }
  }

  function measure() {
    W = root.clientWidth; H = root.clientHeight;
    PR = W < 620 ? 34 : 86;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
    clipRect.setAttribute('height', H);
  }

  function render(animate) {
    if (!model || !root.clientWidth) return;
    measure();
    const s = scaleFor(model);
    paintFurniture(model, s);
    const from = shape;
    if (!animate || reduced() || !from) {
      paintShape(model, s, model.hr, model.cumulative);
      if (animate && first && !reduced()) {
        tween(clipRect, { from: 0, to: W, dur: 1700, delay: 250, easing: ease.inOut, update: (w) => clipRect.setAttribute('width', w), done: () => clipRect.setAttribute('width', 99999) });
      } else clipRect.setAttribute('width', 99999);
      first = false;
      return;
    }
    first = false;
    clipRect.setAttribute('width', 99999);
    const a = from.hr, b = model.hr;
    tween(line, {
      from: 0, to: 1, dur: 720, easing: ease.inOut,
      update: (t) => {
        const hr = new Array(1440);
        for (let m = 0; m < 1440; m++) hr[m] = isNum(b[m]) ? (isNum(a[m]) ? a[m] + (b[m] - a[m]) * t : b[m]) : (t < 0.5 && isNum(a[m]) ? a[m] : null);
        const sc = { lo: from.lo + (s.lo - from.lo) * t, hi: from.hi + (s.hi - from.hi) * t };
        paintShape(model, sc, hr, t > 0.98 ? model.cumulative : null);
        if (t >= 1) paintShape(model, s, model.hr, model.cumulative);
      },
    });
  }

  // reading the line: pointer, touch and keyboard
  let at = null;
  function showAt(min) {
    if (!model) return;
    let m = clamp(Math.round(min), 0, 1439);
    if (!isNum(model.hr[m])) {
      let best = null;
      for (let k = 1; k < 40; k++) { if (isNum(model.hr[m - k])) { best = m - k; break; } if (isNum(model.hr[m + k])) { best = m + k; break; } }
      if (best == null) { hide(); return; }
      m = best;
    }
    at = m;
    const s = { lo: shape.lo, hi: shape.hi }, x = X(m), y = Y(model.hr[m], s);
    cLine.setAttribute('x1', x); cLine.setAttribute('x2', x); cLine.setAttribute('y1', PT); cLine.setAttribute('y2', H - PB);
    cDot.setAttribute('cx', x); cDot.setAttribute('cy', y);
    const zone = zoneOf(reserveShare(model.hr[m], model.rhrUsed, model.hrMax));
    const ms = dayStartMs(model.date) + m * 60000;
    const sl = [model.sleep, model.nextSleep].filter(Boolean).find((n) => ms >= n.start && ms < n.end);
    const stage = sl && sl.stages.find((st) => ms >= st.t0 && ms < st.t1);
    const work = model.workouts.find((w) => ms >= w.t0 && ms < w.t1);
    tip.innerHTML = `<b>${fmtMinuteOfDay(m)}</b><span class="tip-bpm">${model.hr[m]} <small>bpm</small></span>`
      + `<span>${stage ? t('stageSleep', { s: stage.s }) : work ? esc(work.name) : zoneName(zone)}</span>`
      + `<span class="tip-strain">${t('strainAt', { v: isNum(model.cumulative[m]) ? num(model.cumulative[m], 1) : '–' })}</span>`;
    const tw = tip.offsetWidth || 150;
    tip.style.transform = `translate(${clamp(x - tw / 2, 4, W - tw - 4)}px, ${Math.max(0, y - 74)}px)`;
    root.classList.add('reading');
  }
  function hide() { at = null; root.classList.remove('reading'); }
  const minuteAt = (e) => { const r = svg.getBoundingClientRect(); return ((e.clientX - r.left - PL) / (W - PL - PR)) * 1440; };
  svg.addEventListener('pointermove', (e) => showAt(minuteAt(e)));
  svg.addEventListener('pointerdown', (e) => showAt(minuteAt(e)));
  svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hide(); });
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const stepBy = (e.shiftKey ? 60 : 10) * (e.key === 'ArrowLeft' ? -1 : 1);
    showAt((at ?? 12 * 60) + stepBy);
  });
  root.addEventListener('blur', hide);

  let rz = 0;
  new ResizeObserver(() => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { if (model && root.clientWidth !== W) { hide(); render(false); } }); }).observe(root);

  return {
    set(day, { animate = true } = {}) {
      model = day; hide();
      svg.setAttribute('aria-label', t('aria', { day: day.date, nice: date(fromKey(day.date), { weekday: 'long', day: 'numeric', month: 'long' }), peak: day.peakHr || '' }));
      render(animate);
    },
  };
}
