// The climb, on screen: the hero chip, the stage profile, today's earnings,
// streaks, medals, and a toast when something new is earned.

import { LEVELS, levelAt } from '../core/game.js';
import { clamp, fromKey, isNum } from '../core/util.js';
import { $, h, polar, reduced, roll } from './motion.js?v=10';
import { date as fmtDate, getLang, num, strings } from '../i18n.js';

const t = strings({
  en: {
    toGo: '{m} m to {name}', top: 'Top reached', onTarget: '{n} days on target', medalsShort: '{n}/{of} medals',
    chipAria: 'Climb: {alt} metres, at {name}. {next}. Open the climb.',
    profileAria: 'Climb profile over {n} days, from {from} to {to} metres.',
    nextUp: '↑ {name} {alt} m · {m} m to go',
    dayAria: '{day}: plus {m} metres, up to {to}',
    reachedOn: '{name} reached on {day}',
    lede: '<b>{alt} m</b> climbed from the Zuidplaspolder, {note}. ',
    ledeNext: 'Next up: <b>{name}</b>, {note}, <b>{m} m</b> away.',
    ledeTop: 'You have reached the top.',
    ledeLast: ' Last summit: {name}.',
    profileNote: 'Each day is one slope: the more it earned, the steeper and brighter. Flags mark the summits reached. Tap a day to see how it scored.',
    todaySoFar: 'Today so far', howScored: 'How {day} scored',
    open: '+{m} m open', soFar: ' m so far', thatDay: ' m that day',
    best: 'best {n}', days: ({ n }) => (n === 1 ? 'day' : 'days'), dotsAria: 'Last {n} days: {hits} hits',
    countOf: '{n} of {of}', earnedOn: 'Earned {day}',
    dismiss: 'Dismiss',
    welcome: '{alt} m up, at {name}',
    welcomeText: '{n} of {of} medals earned. Good days add metres: train inside your target, sleep well, keep moving.',
    summit: 'Summit: {name}', summitText: '{alt} m, {note}.',
    medal: 'Medal: {name}', newMedals: '{n} new medals', newMedalsText: '{list} and {last}. See them in the climb.',
  },
  nl: {
    toGo: 'Nog {m} m tot {name}', top: 'Top bereikt', onTarget: '{n} dagen binnen doel', medalsShort: '{n}/{of} medailles',
    chipAria: 'Klim: {alt} meter, bij {name}. {next}. Open de klim.',
    profileAria: 'Klimprofiel over {n} dagen, van {from} tot {to} meter.',
    nextUp: '↑ {name} {alt} m · nog {m} m',
    dayAria: '{day}: plus {m} meter, tot {to}',
    reachedOn: '{name} bereikt op {day}',
    lede: '<b>{alt} m</b> geklommen vanaf de Zuidplaspolder, {note}. ',
    ledeNext: 'Hierna: <b>{name}</b>, {note}, nog <b>{m} m</b>.',
    ledeTop: 'Je hebt de top bereikt.',
    ledeLast: ' Laatste top: {name}.',
    profileNote: 'Elke dag is één helling: hoe meer hij opleverde, hoe steiler en feller. Vlaggen tonen de bereikte toppen. Tik op een dag om te zien hoe hij scoorde.',
    todaySoFar: 'Vandaag tot nu toe', howScored: 'Zo scoorde {day}',
    open: '+{m} m open', soFar: ' m tot nu toe', thatDay: ' m die dag',
    best: 'beste {n}', days: ({ n }) => (n === 1 ? 'dag' : 'dagen'), dotsAria: 'Laatste {n} dagen: {hits} keer gehaald',
    countOf: '{n} van {of}', earnedOn: 'Behaald op {day}',
    dismiss: 'Sluiten',
    welcome: '{alt} m hoog, bij {name}',
    welcomeText: '{n} van {of} medailles behaald. Goede dagen leveren meters op: train binnen je doel, slaap goed, blijf bewegen.',
    summit: 'Top: {name}', summitText: '{alt} m, {note}.',
    medal: 'Medaille: {name}', newMedals: '{n} nieuwe medailles', newMedalsText: '{list} en {last}. Bekijk ze bij de klim.',
  },
});

const fmtAlt = (m) => `${m < 0 ? '−' : ''}${Math.abs(m) >= 100 ? num(Math.round(Math.abs(m))) : num(Math.abs(m), m > -10 && m < 10 && m % 1 ? 1 : 0)}`;
const dayLabel = (key) => fmtDate(fromKey(key), { weekday: 'short', day: 'numeric', month: 'short' });
// profile() names its timeline `t`, so it translates with `say`
const say = (k, v) => t(k, v);
const WD = { en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], nl: ['Z', 'M', 'D', 'W', 'D', 'V', 'Z'] };

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
  $('#cc-next').textContent = L.next ? t('toGo', { m: Math.ceil(L.toGo), name: L.next.name }) : t('top');
  requestAnimationFrame(() => { $('#cc-fill').style.transform = `scaleX(${L.progress.toFixed(3)})`; });
  const s = game.streaks.target.current;
  $('#cc-streak').textContent = s >= 2 ? t('onTarget', { n: s }) : t('medalsShort', { n: game.badges.filter((b) => b.earned).length, of: game.badges.length });
  chip.setAttribute('aria-label', t('chipAria', { alt: Math.round(game.alt), name: L.level.name, next: $('#cc-next').textContent }));
}

// ───────── stage profile ─────────
function profile(el, game, selected, onPick) {
  const W = Math.max(280, el.clientWidth), H = W < 520 ? 230 : 300;
  const narrow = W < 520;
  const PL = narrow ? 40 : 52, PR = narrow ? 8 : 172, PT = 30, PB = 34;
  const svg = h('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img' });
  const wd = WD[getLang()] || WD.en;
  el.replaceChildren(svg);
  const t = game.timeline, n = t.length;
  const top = t[n - 1].to, next = levelAt(top).next;
  const showNext = next && next.alt - top < Math.max(160, top * 0.5);
  const lo = Math.min(LEVELS[0].alt, ...t.map((x) => x.from)) - 6;
  const hi = Math.max(top * 1.08, showNext ? next.alt * 1.04 : top + 40);
  const X = (i) => PL + (i / n) * (W - PL - PR);
  const Y = (a) => PT + (1 - (a - lo) / (hi - lo)) * (H - PT - PB);
  const maxGain = 31;
  svg.setAttribute('aria-label', say('profileAria', { n, from: fmtAlt(t[0].from), to: fmtAlt(top) }));

  const flagX = (l) => {
    const i = t.findIndex((d) => d.date === game.reached[l.id]);
    if (!game.reached[l.id] || i < 0) return null;
    const frac = clamp((l.alt - t[i].from) / Math.max(0.01, t[i].to - t[i].from), 0, 1);
    return X(i) + frac * (X(i + 1) - X(i));
  };
  // landmark heights, top down; a label too close to the one above it is left out.
  // On a phone the labels sit inside the chart, so they are drawn last, over the
  // climb, with a halo in the page colour so they stay readable on the slopes.
  let lastY = -Infinity, lastLine = -Infinity;
  const labels = [];
  for (const l of [...LEVELS].reverse()) {
    if (l.alt < lo || l.alt > hi) continue;
    const y = Y(l.alt), got = game.reached[l.id] || l.id === 'polder';
    svg.append(h('line', { x1: PL, x2: W - PR, y1: y, y2: y, class: `p-level${got ? ' got' : ''}` }));
    const label = `${l.name} ${fmtAlt(l.alt)} m`;
    if (!narrow) {
      if (y - lastY < 16) continue;
      lastY = y;
      svg.append(h('text', { x: W - PR + 10, y: y + 4, class: `p-lab${got ? ' got' : ''}`, text: label }));
      continue;
    }
    if (l.alt <= 0) continue;   // the axis already marks 0 m
    if (y - lastLine < 20) continue;   // too close to the line above
    // when this level's flag would sit inside the text, lift the name above the flag
    const fx = flagX(l), wide = label.length * 6.7, x = PL + 4;
    const ty = y - (fx != null && fx > x - 12 && fx < x + wide + 4 ? 23 : 5);
    if (ty - lastY < 15) continue;   // too close to the name above
    lastY = ty; lastLine = y;
    labels.push(h('text', { x, y: ty, class: `p-lab halo${got ? ' got' : ''}`, text: label }));
  }
  if (next && !showNext) {
    svg.append(h('text', { x: PL + 4, y: PT - 12, class: 'p-lab next', text: say('nextUp', { name: next.name, alt: fmtAlt(next.alt), m: Math.ceil(next.alt - top) }) }));
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
      'aria-label': say('dayAria', { day: dayLabel(d.date), m: d.metres, to: Math.round(d.to) }) }, h('title', { text: `${dayLabel(d.date)} · +${d.metres} m → ${fmtAlt(d.to)} m` }));
    hit.addEventListener('click', () => onPick(d.date));
    hit.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(d.date); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); const j = clamp(i + (e.key === 'ArrowLeft' ? -1 : 1), 0, n - 1); onPick(t[j].date); requestAnimationFrame(() => el.querySelectorAll('.p-hit')[j]?.focus()); }
    });
    svg.append(seg, hit);
    const date = fromKey(d.date);
    if (!narrow || date.getDay() === 1 || i === n - 1) {
      if (n <= 16 || date.getDay() === 1) svg.append(h('text', { x: (x0 + x1) / 2, y: H - 18, 'text-anchor': 'middle', class: 'axis', text: n <= 16 ? wd[date.getDay()] : date.getDate() }));
    }
    if (date.getDay() === 1 && n > 16) svg.append(h('text', { x: (x0 + x1) / 2, y: H - 4, 'text-anchor': 'middle', class: 'axis', text: fmtDate(date, { month: 'short' }) }));
  });
  // ridge line
  let ridge = `M${X(0)} ${Y(t[0].from)}`;
  t.forEach((d, i) => { ridge += `L${X(i + 1)} ${Y(d.to)}`; });
  svg.append(h('path', { d: ridge, class: 'p-ridge', pathLength: 1 }));
  // flags where a landmark was reached
  for (const l of LEVELS) {
    const at = game.reached[l.id];
    if (!at) continue;
    const x = flagX(l), y = Y(l.alt);
    if (x == null) continue;
    svg.append(h('path', { d: `M${x} ${y}V${y - 17}l9 3.5-9 3.5`, class: 'p-flag' }, h('title', { text: say('reachedOn', { name: l.name, day: dayLabel(at) }) })));
  }
  // the rider: where the selected day ended
  const si = t.findIndex((d) => d.date === selected);
  if (si >= 0) {
    const x = X(si + 1), y = Y(t[si].to);
    svg.append(h('line', { x1: x, x2: x, y1: y, y2: base, class: 'p-drop' }), h('circle', { cx: x, cy: y, r: 6, class: 'p-rider' }));
  }
  svg.append(...labels);
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
  $('#climb-lede').innerHTML = t('lede', { alt: fmtAlt(game.alt), note: LEVELS[0].note })
    + (L.next ? t('ledeNext', { name: L.next.name, note: L.next.note, m: Math.ceil(L.toGo) }) : t('ledeTop'))
    + (lastReached && lastReached.id !== 'nap' ? t('ledeLast', { name: lastReached.name }) : '');

  profile($('#profile'), game, day.date, onPick);
  $('#profile-note').textContent = t('profileNote');

  // how the selected day scored
  const list = $('#earn');
  $('#earn-title').textContent = day.partial ? t('todaySoFar') : t('howScored', { day: dayLabel(day.date) });
  list.replaceChildren(...today.parts.map((p) => h('li', { class: p.got ? 'got' : p.open ? 'open' : 'miss' },
    h('span', { class: 'e-mark', 'aria-hidden': 'true' }),
    h('span', { class: 'e-what' }, p.label, h('small', { text: p.detail })),
    h('span', { class: 'e-m', text: p.got ? `+${p.metres} m` : p.open ? t('open', { m: p.max }) : `0 / ${p.max}` }))));
  roll($('#earn-total'), today.metres, { format: (v) => `+${Math.round(v)}`, dur: 700, key: 'earn-total' });
  $('#earn-sum').lastChild.textContent = t(day.partial ? 'soFar' : 'thatDay');

  // streaks
  const wrap = $('#streaks');
  wrap.replaceChildren(...Object.values(game.streaks).map((s) => {
    const marks = s.marks.slice(-14);
    return h('div', { class: 'streak' },
      h('div', { class: 's-top' }, h('span', { class: 's-name', text: s.label }), h('span', { class: 's-best', text: t('best', { n: s.best }) })),
      h('p', { class: 's-num' }, String(s.current), h('small', { text: t('days', { n: s.current }) })),
      h('div', { class: 's-dots', role: 'img', 'aria-label': t('dotsAria', { n: marks.length, hits: marks.filter((m) => m === 'hit').length }) }, ...marks.map((m) => h('i', { class: m }))));
  }));

  // medals
  const earned = game.badges.filter((b) => b.earned).length;
  $('#badge-count').textContent = t('countOf', { n: earned, of: game.badges.length });
  const grid = $('#badges');
  grid.replaceChildren(...game.badges.map((b) => h('article', { class: `badge${b.earned ? ' earned' : ''}` },
    medal(b),
    h('h4', { text: b.name }),
    h('p', { class: 'b-desc', text: b.desc }),
    h('p', { class: 'b-state', text: b.earned ? t('earnedOn', { day: dayLabel(b.at) }) : b.label }))));
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
  const close = h('button', { class: 't-close', type: 'button', 'aria-label': t('dismiss') }, h('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, h('path', { d: 'M6 6l12 12M18 6 6 18' })));
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
    toast({ art: summitArt(), title: t('welcome', { alt: Math.round(game.alt), name: game.level.level.name }),
      text: t('welcomeText', { n: earned.length, of: game.badges.length }) }, delay);
    return;
  }
  let k = 0;
  if (now.level > seen.level) toast({ art: summitArt(), title: t('summit', { name: game.level.level.name }), text: t('summitText', { alt: fmtAlt(game.level.level.alt), note: game.level.level.note }) }, delay + 900 * k++);
  const fresh = earned.filter((b) => !seen.badges.includes(b.id));
  // one medal gets its own note; several share one, so the screen stays readable
  if (fresh.length === 1) toast({ art: medal(fresh[0], 52), title: t('medal', { name: fresh[0].name }), text: fresh[0].desc }, delay + 900 * k++);
  else if (fresh.length > 1) {
    const names = fresh.map((b) => b.name);
    toast({ art: medal(fresh[0], 52), title: t('newMedals', { n: fresh.length }), text: t('newMedalsText', { list: names.slice(0, -1).join(', '), last: names[names.length - 1] }) }, delay + 900 * k++);
  }
}

export const altitude = fmtAlt;
