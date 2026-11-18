// The climb, on screen: the hero chip, the stage profile, today's earnings,
// streaks, medals, and a toast when something new is earned.

import { LEVELS, levelAt } from '../core/game.js';
import { clamp, fromKey, isNum } from '../core/util.js';
import { $, h, polar, reduced, roll } from './motion.js';

const fmtAlt = (m) => `${m < 0 ? '−' : ''}${Math.abs(m) >= 100 ? Math.round(Math.abs(m)).toLocaleString('en-GB') : Math.abs(m).toFixed(m > -10 && m < 10 && m % 1 ? 1 : 0)}`;
const dayLabel = (key) => fromKey(key).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ───────── medal: the strain dial in miniature, its ring lit to progress ─────────
export function medal(b, size = 88) {
  const C = 50, N = 40, lit = Math.round(b.progress * N);
  const svg = h('svg', { viewBox: '0 0 100 100', width: size, height: size, class: `medal${b.earned ? ' earned' : ''}`, 'aria-hidden': 'true' });
  const ring = h('g', { class: 'm-ring' });
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 360;
    const [x1, y1] = polar(C, C, 41, a), [x2, y2] = polar(C, C, 48, a);
    ring.append(h('line', { x1: x1.toFixed(2), y1: y1.toFixed(2), x2: x2.toFixed(2), y2: y2.toFixed(2), class: i < lit ? 'on' : null, style: { '--i': i } }));
  }
  const glyph = String(b.glyph);
  svg.append(ring, h('circle', { cx: C, cy: C, r: 35, class: 'm-disc' }),
    h('text', { x: C, y: C + (glyph.length > 2 ? 7 : 9), 'text-anchor': 'middle', class: 'm-glyph', style: { fontSize: glyph.length > 2 ? '22px' : '27px' }, text: glyph }));
  return svg;
}

// ───────── hero chip ─────────
export function renderChip(game) {
  const chip = $('#climb-chip');
  if (!chip) return;
  const L = game.level;
  roll($('#cc-alt'), game.alt, { format: fmtAlt, dur: 1100, key: 'cc-alt' });
  $('#cc-level').textContent = L.level.name;
  $('#cc-next').textContent = L.next ? `${Math.ceil(L.toGo)} m to ${L.next.name}` : 'Top reached';
  requestAnimationFrame(() => { $('#cc-fill').style.transform = `scaleX(${L.progress.toFixed(3)})`; });
  const s = game.streaks.target.current;
  $('#cc-streak').textContent = s >= 2 ? `${s} days on target` : `${game.badges.filter((b) => b.earned).length}/${game.badges.length} medals`;
  chip.setAttribute('aria-label', `Climb: ${Math.round(game.alt)} metres, at ${L.level.name}. ${$('#cc-next').textContent}. Open the climb.`);
}

// ───────── stage profile ─────────
function profile(el, game, selected, onPick) {
  const W = Math.max(280, el.clientWidth), H = W < 520 ? 230 : 300;
  const narrow = W < 520;
  const PL = narrow ? 40 : 52, PR = narrow ? 8 : 172, PT = 30, PB = 34;
  const svg = h('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img' });
  el.replaceChildren(svg);
  const t = game.timeline, n = t.length;
  const top = t[n - 1].to, next = levelAt(top).next;
  const showNext = next && next.alt - top < Math.max(160, top * 0.5);
  const lo = Math.min(LEVELS[0].alt, ...t.map((x) => x.from)) - 6;
  const hi = Math.max(top * 1.08, showNext ? next.alt * 1.04 : top + 40);
  const X = (i) => PL + (i / n) * (W - PL - PR);
  const Y = (a) => PT + (1 - (a - lo) / (hi - lo)) * (H - PT - PB);
  const maxGain = 31;
  svg.setAttribute('aria-label', `Climb profile over ${n} days, from ${fmtAlt(t[0].from)} to ${fmtAlt(top)} metres.`);

  // landmark heights, top down; a label too close to the one above it is left out
  let lastY = -Infinity;
  for (const l of [...LEVELS].reverse()) {
    if (l.alt < lo || l.alt > hi) continue;
    const y = Y(l.alt), got = game.reached[l.id] || l.id === 'polder';
    svg.append(h('line', { x1: PL, x2: W - PR, y1: y, y2: y, class: `p-level${got ? ' got' : ''}` }));
    if (y - lastY < 16) continue;
    lastY = y;
    const label = `${l.name} ${fmtAlt(l.alt)} m`;
    if (narrow) svg.append(h('text', { x: PL + 4, y: y - 5, class: `p-lab${got ? ' got' : ''}`, text: label }));
    else svg.append(h('text', { x: W - PR + 10, y: y + 4, class: `p-lab${got ? ' got' : ''}`, text: label }));
  }
  if (next && !showNext) {
    svg.append(h('text', { x: PL + 4, y: PT - 12, class: 'p-lab next', text: `↑ ${next.name} ${fmtAlt(next.alt)} m · ${Math.ceil(next.alt - top)} m to go` }));
  }

  // the climb itself: one segment per day, shaded by how much it earned
  const base = Y(lo);
  t.forEach((d, i) => {
    const x0 = X(i), x1 = X(i + 1);
    const share = clamp(d.metres / maxGain, 0, 1);
    const seg = h('polygon', {
      points: `${x0},${base} ${x0},${Y(d.from)} ${x1},${Y(d.to)} ${x1},${base}`,
      class: `p-seg${d.date === selected ? ' sel' : ''}${d.partial ? ' open' : ''}`,
      style: { fillOpacity: (0.18 + share * 0.82).toFixed(2), '--d': `${i * 18}ms` },
    });
    const hit = h('rect', { x: x0, y: PT - 8, width: Math.max(1, x1 - x0), height: base - PT + 8, class: 'p-hit', tabindex: d.date === selected ? 0 : -1, role: 'button',
      'aria-label': `${dayLabel(d.date)}: plus ${d.metres} metres, up to ${Math.round(d.to)}` }, h('title', { text: `${dayLabel(d.date)} · +${d.metres} m → ${fmtAlt(d.to)} m` }));
    hit.addEventListener('click', () => onPick(d.date));
    hit.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(d.date); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); const j = clamp(i + (e.key === 'ArrowLeft' ? -1 : 1), 0, n - 1); onPick(t[j].date); requestAnimationFrame(() => el.querySelectorAll('.p-hit')[j]?.focus()); }
    });
    svg.append(seg, hit);
    const date = fromKey(d.date);
    if (!narrow || date.getDay() === 1 || i === n - 1) {
      if (n <= 16 || date.getDay() === 1) svg.append(h('text', { x: (x0 + x1) / 2, y: H - 18, 'text-anchor': 'middle', class: 'axis', text: n <= 16 ? WD[date.getDay()] : date.getDate() }));
    }
    if (date.getDay() === 1 && n > 16) svg.append(h('text', { x: (x0 + x1) / 2, y: H - 4, 'text-anchor': 'middle', class: 'axis', text: date.toLocaleDateString('en-GB', { month: 'short' }) }));
  });
  // ridge line
  let ridge = `M${X(0)} ${Y(t[0].from)}`;
  t.forEach((d, i) => { ridge += `L${X(i + 1)} ${Y(d.to)}`; });
  svg.append(h('path', { d: ridge, class: 'p-ridge', pathLength: 1 }));
  // flags where a landmark was reached
  for (const l of LEVELS) {
    const at = game.reached[l.id];
    if (!at) continue;
    const i = t.findIndex((d) => d.date === at);
    if (i < 0) continue;
    const frac = clamp((l.alt - t[i].from) / Math.max(0.01, t[i].to - t[i].from), 0, 1);
    const x = X(i) + frac * (X(i + 1) - X(i)), y = Y(l.alt);
    svg.append(h('path', { d: `M${x} ${y}V${y - 17}l9 3.5-9 3.5`, class: 'p-flag' }, h('title', { text: `${l.name} reached on ${dayLabel(at)}` })));
  }
  // the rider: where the selected day ended
  const si = t.findIndex((d) => d.date === selected);
  if (si >= 0) {
    const x = X(si + 1), y = Y(t[si].to);
    svg.append(h('line', { x1: x, x2: x, y1: y, y2: base, class: 'p-drop' }), h('circle', { cx: x, cy: y, r: 6, class: 'p-rider' }));
  }
  // axis: metres
  for (const a of [0, Math.round(hi / 100) * 100 >= 200 ? Math.round(hi / 200) * 100 : null].filter(isNum)) {
    if (a <= lo || a >= hi) continue;
    svg.append(h('text', { x: PL - 8, y: Y(a) + 4, 'text-anchor': 'end', class: 'axis', text: `${a} m` }));
  }
}

// ───────── the section ─────────
export function renderClimb(day, game, onPick) {
  const sec = $('#view-climb');
  if (!sec) return;
  const L = game.level, today = game.byDate[day.date];
  const reachedList = Object.entries(game.reached).sort((a, b) => (a[1] < b[1] ? -1 : 1));
  const lastReached = reachedList.length ? LEVELS.find((l) => l.id === reachedList[reachedList.length - 1][0]) : null;
  $('#climb-lede').innerHTML = `<b>${fmtAlt(game.alt)} m</b> climbed from the Zuidplaspolder, ${LEVELS[0].note}. `
    + (L.next ? `Next up: <b>${L.next.name}</b>, ${L.next.note}, <b>${Math.ceil(L.toGo)} m</b> away.` : 'You have reached the top.')
    + (lastReached && lastReached.id !== 'nap' ? ` Last summit: ${lastReached.name}.` : '');

  profile($('#profile'), game, day.date, onPick);
  $('#profile-note').textContent = 'Each day is one slope: the more it earned, the steeper and brighter. Flags mark the summits reached. Tap a day to see how it scored.';

  // how the selected day scored
  const list = $('#earn');
  $('#earn-title').textContent = day.partial ? 'Today so far' : `How ${dayLabel(day.date)} scored`;
  list.replaceChildren(...today.parts.map((p) => h('li', { class: p.got ? 'got' : p.open ? 'open' : 'miss' },
    h('span', { class: 'e-mark', 'aria-hidden': 'true' }),
    h('span', { class: 'e-what' }, p.label, h('small', { text: p.detail })),
    h('span', { class: 'e-m', text: p.got ? `+${p.metres} m` : p.open ? `+${p.max} m open` : `0 / ${p.max}` }))));
  roll($('#earn-total'), today.metres, { format: (v) => `+${Math.round(v)}`, dur: 700, key: 'earn-total' });
  $('#earn-sum').lastChild.textContent = ` m ${day.partial ? 'so far' : 'that day'}`;

  // streaks
  const wrap = $('#streaks');
  wrap.replaceChildren(...Object.values(game.streaks).map((s) => {
    const marks = s.marks.slice(-14);
    return h('div', { class: 'streak' },
      h('div', { class: 's-top' }, h('span', { class: 's-name', text: s.label }), h('span', { class: 's-best', text: `best ${s.best}` })),
      h('p', { class: 's-num' }, String(s.current), h('small', { text: s.current === 1 ? 'day' : 'days' })),
      h('div', { class: 's-dots', role: 'img', 'aria-label': `Last ${marks.length} days: ${marks.filter((m) => m === 'hit').length} hits` }, ...marks.map((m) => h('i', { class: m }))));
  }));

  // medals
  const earned = game.badges.filter((b) => b.earned).length;
  $('#badge-count').textContent = `${earned} of ${game.badges.length}`;
  const grid = $('#badges');
  grid.replaceChildren(...game.badges.map((b) => h('article', { class: `badge${b.earned ? ' earned' : ''}` },
    medal(b),
    h('h4', { text: b.name }),
    h('p', { class: 'b-desc', text: b.desc }),
    h('p', { class: 'b-state', text: b.earned ? `Earned ${dayLabel(b.at)}` : b.label }))));
  if (!grid._io && 'IntersectionObserver' in window) {
    grid._io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { grid.classList.add('lit'); grid._io.disconnect(); } }, { threshold: 0.2 });
    grid._io.observe(grid);
  } else if (!('IntersectionObserver' in window)) grid.classList.add('lit');
}

// ───────── toasts for what is new since the last visit ─────────
const KEY = 'oranje.game.seen';
const readSeen = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
const writeSeen = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage off */ } };

function toast({ art, title, text }, delay = 0) {
  const box = $('#toasts');
  if (!box) return;
  const close = h('button', { class: 't-close', type: 'button', 'aria-label': 'Dismiss' }, h('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, h('path', { d: 'M6 6l12 12M18 6 6 18' })));
  const el = h('div', { class: 'toast', role: 'status' }, art, h('div', { class: 't-text' }, h('b', { text: title }), h('span', { text: text })), close);
  let timer = 0;
  const leave = () => { clearTimeout(timer); el.classList.add('out'); setTimeout(() => el.remove(), reduced() ? 0 : 380); };
  const arm = () => { clearTimeout(timer); timer = setTimeout(leave, 7000); };
  close.addEventListener('click', leave);
  el.addEventListener('pointerenter', () => clearTimeout(timer));
  el.addEventListener('pointerleave', arm);
  el.addEventListener('focusin', () => clearTimeout(timer));
  setTimeout(() => { box.append(el); requestAnimationFrame(() => el.classList.add('in')); arm(); }, delay);
}

const summitArt = () => h('svg', { viewBox: '0 0 100 100', width: 52, height: 52, class: 'summit-art', 'aria-hidden': 'true' },
  h('path', { d: 'M6 86 38 34l14 20 12-14 30 46z', class: 'sa-hill' }), h('path', { d: 'M38 34V8l20 7-20 7', class: 'sa-flag' }));

// `scope` keeps demo and real data apart; `fresh` marks a newly generated month.
export function announce(game, scope, { delay = 1600 } = {}) {
  const all = readSeen() || {};
  const seen = all[scope];
  const earned = game.badges.filter((b) => b.earned);
  const now = { badges: earned.map((b) => b.id), level: game.level.index };
  all[scope] = now;
  writeSeen(all);
  if (!seen) {
    toast({ art: summitArt(), title: `${Math.round(game.alt)} m up, at ${game.level.level.name}`,
      text: `${earned.length} of ${game.badges.length} medals earned. Good days add metres: train inside your target, sleep well, keep moving.` }, delay);
    return;
  }
  let k = 0;
  if (now.level > seen.level) toast({ art: summitArt(), title: `Summit: ${game.level.level.name}`, text: `${fmtAlt(game.level.level.alt)} m, ${game.level.level.note}.` }, delay + 900 * k++);
  const fresh = earned.filter((b) => !seen.badges.includes(b.id));
  // one medal gets its own note; several share one, so the screen stays readable
  if (fresh.length === 1) toast({ art: medal(fresh[0], 52), title: `Medal: ${fresh[0].name}`, text: fresh[0].desc }, delay + 900 * k++);
  else if (fresh.length > 1) {
    const names = fresh.map((b) => b.name);
    toast({ art: medal(fresh[0], 52), title: `${fresh.length} new medals`, text: `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}. See them in the climb.` }, delay + 900 * k++);
  }
}

export const altitude = fmtAlt;
