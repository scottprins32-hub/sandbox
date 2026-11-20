// The game and the team, on screen: the chip on Today, your level and week,
// how a day scored, the weekly standings, the weekly challenge, the
// leaderboards, streaks, medals, and a toast when something new is earned.

import { DAY_MAX } from '../core/game.js';
import { BOARDS, challengeBoard, leaderboard, pastWinners, weekBoard, winCounts } from '../core/team.js';
import { addDays, fmtDur, fromKey, isNum } from '../core/util.js';
import { $, h, polar, reduced, roll } from './motion.js?v=13';
import { date as fmtDate, num, strings } from '../i18n.js';

const t = strings({
  en: {
    chipLevel: 'Level {n} · {name}', chipWeek: '{p} / {max} points this week', chipRank: '#{place} in the team',
    chipAria: 'Level {n}, {name}. {week}. Open the team.',
    lede: 'Level <b>{n}</b>, {name}: <b>{xp}</b> XP. This week <b>{p}</b> of {max} points.',
    ledeTeam: ' You are <b>#{place}</b> of {of} in the team.',
    xp: '{xp} XP', toNext: '{m} XP to level {n}, {name}', top: 'Highest level reached',
    weekDayAria: '{day}: {p} points',
    todaySoFar: 'Today so far', howScored: 'How {day} scored',
    open: '+{p} open', soFar: ' pts so far', thatDay: ' pts that day',
    best: 'best {n}', days: ({ n }) => (n === 1 ? 'day' : 'days'), dotsAria: 'Last {n} days: {hits} hits',
    countOf: '{n} of {of}', earnedOn: 'Earned {day}', dismiss: 'Dismiss',
    welcome: 'Level {n}: {name}', welcomeText: '{n} of {of} medals earned. Every day earns up to 10 points: train inside your target, sleep well, keep moving.',
    levelUp: 'Level up: {name}', levelUpText: 'Level {n} with {xp} XP.',
    medal: 'Medal: {name}', newMedals: '{n} new medals', newMedalsText: '{list} and {last}. See them in the team tab.',
    you: 'you', points: '{p} pts', wins: ({ n }) => `${n} ${n === 1 ? 'week' : 'weeks'} won`,
    boardMeta: 'Week of {from} · {left}', daysLeft: ({ n }) => (n <= 0 ? 'last day' : `${n} ${n === 1 ? 'day' : 'days'} to go`),
    lastWinner: 'Last week: {names} won with {p} points.', lastNone: 'No winner last week yet.',
    demoTeam: 'Example team with made-up members. Connect your Google account to play with real people.',
    joinTitle: 'Join the team',
    joinText: 'Compete with everyone who uses this Oranje link: weekly standings on day points, a weekly challenge and leaderboards.',
    joinShares: 'When you join, the others see your first name and per day: points, strain, recovery, sleep score, resting heart rate, HRV, sleep duration, zone minutes and steps. No heart-rate curves, sleep stages or workouts.',
    joinName: 'Name in the team', join: 'Join', joining: 'Joining…', members: ({ n }) => `${n} ${n === 1 ? 'member' : 'members'} so far.`,
    signInFirst: 'Sign in with your Google account to join the team.',
    leave: 'Leave and erase', leaveConfirm: 'Leave the team and erase everything you shared? Your own data in this browser stays.',
    sharing: 'You share your day scores with the team.', syncing: 'Updating the team…', teamError: 'The team could not be loaded. Try again later.',
    alone: 'You are the only member so far. Send the link to someone and ask them to join.',
    challenge: { sleep: 'Sleep week', target: 'On-target week', azm: 'Zone-minute week', recovery: 'Recovery week', steps: 'Step week' },
    challengeText: {
      sleep: 'Highest average sleep score this week.', target: 'Most days inside your strain target this week.', azm: 'Most zone minutes this week.',
      recovery: 'Highest average recovery this week.', steps: 'Most steps this week.',
    },
    unit: { '%': '%', days: ' days', min: ' min', steps: ' steps' },
    boardName: { recovery: 'Recovery', strain: 'Strain', sleep: 'Sleep', hrv: 'HRV', rhr: 'Resting HR', sleepMin: 'Sleep time' },
    boardsLede: 'Average over the last 7 days.', boardsLower: 'Average over the last 7 days. Lower is better.',
    noValue: 'no data',
  },
  nl: {
    chipLevel: 'Level {n} · {name}', chipWeek: '{p} / {max} punten deze week', chipRank: '#{place} in het team',
    chipAria: 'Level {n}, {name}. {week}. Open het team.',
    lede: 'Level <b>{n}</b>, {name}: <b>{xp}</b> XP. Deze week <b>{p}</b> van de {max} punten.',
    ledeTeam: ' Je staat <b>#{place}</b> van {of} in het team.',
    xp: '{xp} XP', toNext: 'Nog {m} XP tot level {n}, {name}', top: 'Hoogste level bereikt',
    weekDayAria: '{day}: {p} punten',
    todaySoFar: 'Vandaag tot nu toe', howScored: 'Zo scoorde {day}',
    open: '+{p} open', soFar: ' pt tot nu toe', thatDay: ' pt die dag',
    best: 'beste {n}', days: ({ n }) => (n === 1 ? 'dag' : 'dagen'), dotsAria: 'Laatste {n} dagen: {hits} keer gehaald',
    countOf: '{n} van {of}', earnedOn: 'Behaald op {day}', dismiss: 'Sluiten',
    welcome: 'Level {n}: {name}', welcomeText: '{n} van {of} medailles behaald. Elke dag levert tot 10 punten op: train binnen je doel, slaap goed, blijf bewegen.',
    levelUp: 'Level omhoog: {name}', levelUpText: 'Level {n} met {xp} XP.',
    medal: 'Medaille: {name}', newMedals: '{n} nieuwe medailles', newMedalsText: '{list} en {last}. Bekijk ze in het tabblad Team.',
    you: 'jij', points: '{p} pt', wins: ({ n }) => `${n} ${n === 1 ? 'week' : 'weken'} gewonnen`,
    boardMeta: 'Week van {from} · {left}', daysLeft: ({ n }) => (n <= 0 ? 'laatste dag' : `nog ${n} ${n === 1 ? 'dag' : 'dagen'}`),
    lastWinner: 'Vorige week won {names} met {p} punten.', lastNone: 'Nog geen winnaar van vorige week.',
    demoTeam: 'Voorbeeldteam met verzonnen leden. Koppel je Google-account om met echte mensen te spelen.',
    joinTitle: 'Doe mee met het team',
    joinText: 'Speel tegen iedereen die deze Oranje-link gebruikt: een weekklassement op dagpunten, een uitdaging per week en ranglijsten.',
    joinShares: 'Als je meedoet, zien de anderen je voornaam en per dag: punten, strain, herstel, slaapscore, rusthartslag, HRV, slaapduur, zoneminuten en stappen. Geen hartslagcurves, slaapfases of trainingen.',
    joinName: 'Naam in het team', join: 'Meedoen', joining: 'Bezig…', members: ({ n }) => `Al ${n} ${n === 1 ? 'deelnemer' : 'deelnemers'}.`,
    signInFirst: 'Log in met je Google-account om mee te doen met het team.',
    leave: 'Stoppen en wissen', leaveConfirm: 'Stoppen met het team en alles wissen wat je hebt gedeeld? Je eigen gegevens in deze browser blijven.',
    sharing: 'Je deelt je dagscores met het team.', syncing: 'Team bijwerken…', teamError: 'Het team kon niet laden. Probeer het later opnieuw.',
    alone: 'Je bent nog de enige. Stuur de link naar iemand en vraag of die meedoet.',
    challenge: { sleep: 'Slaapweek', target: 'Doelweek', azm: 'Zoneminutenweek', recovery: 'Herstelweek', steps: 'Stappenweek' },
    challengeText: {
      sleep: 'Hoogste gemiddelde slaapscore deze week.', target: 'De meeste dagen binnen je strain-doel deze week.', azm: 'De meeste zoneminuten deze week.',
      recovery: 'Hoogste gemiddelde herstel deze week.', steps: 'De meeste stappen deze week.',
    },
    unit: { '%': '%', days: ' dagen', min: ' min', steps: ' stappen' },
    boardName: { recovery: 'Herstel', strain: 'Strain', sleep: 'Slaap', hrv: 'HRV', rhr: 'Rusthartslag', sleepMin: 'Slaapduur' },
    boardsLede: 'Gemiddelde over de laatste 7 dagen.', boardsLower: 'Gemiddelde over de laatste 7 dagen. Lager is beter.',
    noValue: 'geen gegevens',
  },
});
const tt = (group, key) => t(group)?.[key] ?? key;   // nested tables (challenge names, units, boards)

const dayLabel = (key) => fmtDate(fromKey(key), { weekday: 'short', day: 'numeric', month: 'short' });
const pts = (p) => num(p);

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

// ───────── chip on Today: level and this week's points ─────────
export function renderChip(game, team) {
  const chip = $('#climb-chip');
  if (!chip) return;
  const L = game.level;
  roll($('#cc-alt'), L.n, { format: (v) => String(Math.round(v)), dur: 700, key: 'cc-alt' });
  $('#cc-level').textContent = L.name;
  const week = t('chipWeek', { p: pts(game.week.points), max: game.week.max });
  $('#cc-next').textContent = week;
  requestAnimationFrame(() => { $('#cc-fill').style.transform = `scaleX(${Math.min(1, game.week.points / game.week.max).toFixed(3)})`; });
  const me = team?.board?.find((r) => r.me);
  $('#cc-streak').textContent = me?.place && team.members.length > 1 ? t('chipRank', { place: me.place }) : '';
  chip.setAttribute('aria-label', t('chipAria', { n: L.n, name: L.name, week }));
}

// one ranked list: place, name, bar, value
function rows(list, { max, format, wins }) {
  return list.map((r) => h('li', { class: `b-row${r.me ? ' me' : ''}${r.place === 1 ? ' first' : ''}` },
    h('span', { class: 'b-place', text: r.place ? String(r.place) : '–' }),
    h('span', { class: 'b-name' }, h('b', { text: r.name }), r.me ? h('small', { text: t('you') }) : null,
      wins && wins[r.id] ? h('small', { class: 'b-wins', text: t('wins', { n: wins[r.id] }) }) : null),
    h('span', { class: 'b-bar' }, h('i', { style: { width: `${Math.max(0, Math.min(100, (isNum(r.value) && max ? r.value / max : 0) * 100))}%` } })),
    h('span', { class: 'b-val', text: isNum(r.value) ? format(r.value) : t('noValue') })));
}

let boardPick = 'recovery';

// ───────── the Team tab ─────────
// team: { mode: 'demo' | 'signedOut' | 'join' | 'joined' | 'loading' | 'error', members, count, name, busy }
export function renderGame(day, game, team, on) {
  if (!$('#view-team')) return;
  const L = game.level, scored = game.byDate[day.date];
  const members = team?.members || [];
  const week = game.week.start;
  const board = week && members.length ? weekBoard(members, week) : [];
  const me = board.find((r) => r.me);
  if (team) team.board = board;
  $('#team-lede').innerHTML = t('lede', { n: L.n, name: L.name, xp: num(game.xp), p: pts(game.week.points), max: game.week.max })
    + (me?.place && members.length > 1 ? t('ledeTeam', { place: me.place, of: members.length }) : '');

  // level and XP
  $('#lv-n').textContent = String(L.n);
  $('#lv-name').textContent = L.name;
  $('#lv-xp').textContent = t('xp', { xp: num(game.xp) });
  requestAnimationFrame(() => { $('#lv-fill').style.transform = `scaleX(${L.progress.toFixed(3)})`; });
  $('#lv-next').textContent = L.next ? t('toNext', { m: num(L.toGo), n: L.next.n, name: L.next.name }) : t('top');
  roll($('#week-pts'), game.week.points, { format: (v) => pts(Math.round(v)), dur: 700, key: 'week-pts' });
  $('#week-max').textContent = `/ ${game.week.max}`;
  const wk = $('#week-days');
  wk.replaceChildren(...Array.from({ length: 7 }, (_, i) => {
    const key = addDays(week || day.date, i), e = game.byDate[key];
    const label = fmtDate(fromKey(key), { weekday: 'narrow' });
    return h('button', { type: 'button', class: `wd-col${key === day.date ? ' sel' : ''}${e?.partial ? ' open' : ''}${!e ? ' none' : ''}`, disabled: !e, 'aria-label': e ? t('weekDayAria', { day: dayLabel(key), p: e.points }) : label, onclick: () => e && on.pick(key) },
      h('span', { class: 'wd-bar' }, h('i', { style: { height: `${e ? (e.points / DAY_MAX) * 100 : 0}%` } })), h('span', { class: 'wd-p', text: e ? String(e.points) : '' }), h('span', { class: 'wd-l', text: label }));
  }));

  // how the selected day scored
  $('#earn-title').textContent = day.partial ? t('todaySoFar') : t('howScored', { day: dayLabel(day.date) });
  $('#earn').replaceChildren(...scored.parts.map((p) => h('li', { class: p.got ? 'got' : p.open ? 'open' : 'miss' },
    h('span', { class: 'e-mark', 'aria-hidden': 'true' }),
    h('span', { class: 'e-what' }, p.label, h('small', { text: p.detail })),
    h('span', { class: 'e-m', text: p.got ? `+${p.points}` : p.open ? t('open', { p: p.max }) : `0 / ${p.max}` }))));
  roll($('#earn-total'), scored.points, { format: (v) => `+${Math.round(v)}`, dur: 700, key: 'earn-total' });
  $('#earn-unit').textContent = t(day.partial ? 'soFar' : 'thatDay');

  renderTeam(team, game, day, on, board);

  // streaks
  $('#streaks').replaceChildren(...Object.values(game.streaks).map((s) => {
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
    medal(b), h('h4', { text: b.name }), h('p', { class: 'b-desc', text: b.desc }),
    h('p', { class: 'b-state', text: b.earned ? t('earnedOn', { day: dayLabel(b.at) }) : b.label }))));
  if (!grid._io && 'IntersectionObserver' in window) {
    grid._io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { grid.classList.add('lit'); grid._io.disconnect(); } }, { threshold: 0.2 });
    grid._io.observe(grid);
  } else if (!('IntersectionObserver' in window)) grid.classList.add('lit');
}

function renderTeam(team, game, day, on, board) {
  const mode = team?.mode || 'loading';
  const members = team?.members || [];
  const week = game.week.start;
  const playing = mode === 'joined' || mode === 'demo';
  const join = $('#team-join'), status = $('#team-status');
  $('#team-card').dataset.mode = mode;
  for (const el of ['#board', '#challenge-card', '#boards-card']) $(el).hidden = !playing;
  status.textContent = mode === 'demo' ? t('demoTeam') : mode === 'error' ? t('teamError') : mode === 'joined' ? (team.busy ? t('syncing') : members.length < 2 ? t('alone') : t('sharing')) : '';
  status.hidden = !status.textContent;

  // join, or ask to sign in first
  join.hidden = !(mode === 'join' || mode === 'signedOut');
  if (!join.hidden) {
    const input = h('input', { id: 'team-name', type: 'text', maxlength: 24, autocomplete: 'given-name', value: team.name || '' });
    join.replaceChildren(
      h('p', { class: 'tj-title', text: t('joinTitle') }),
      h('p', { text: t('joinText') }),
      h('p', { class: 'hint', text: t('joinShares') }),
      ...(mode === 'signedOut' ? [h('p', { class: 'hint', text: t('signInFirst') })] : [
        h('label', { class: 'field', for: 'team-name', text: t('joinName') }),
        h('div', { class: 'field-row' }, input,
          h('button', { class: 'btn primary small', type: 'button', disabled: !!team.busy, text: team.busy ? t('joining') : t('join'), onclick: () => on.join(input.value) })),
        team.count ? h('p', { class: 'hint', text: t('members', { n: team.count }) }) : null,
      ]));
  }
  $('#team-leave').hidden = mode !== 'joined';
  $('#team-leave').textContent = t('leave');
  $('#team-leave').onclick = () => { if (window.confirm(t('leaveConfirm'))) on.leave(); };
  if (!playing || !week) return;

  // weekly standings
  const end = addDays(week, 6);
  const left = Math.round((fromKey(end) - fromKey(day.date > end ? end : game.timeline.at(-1).date)) / 86400000);
  $('#board-meta').textContent = t('boardMeta', { from: fmtDate(fromKey(week), { day: 'numeric', month: 'short' }), left: t('daysLeft', { n: left }) });
  const wins = winCounts(members, week);
  $('#board').replaceChildren(...rows(board, { max: 7 * DAY_MAX, format: (v) => t('points', { p: pts(v) }), wins }));
  const last = pastWinners(members, week, 1)[0];
  const lastP = last?.winners[0] ? weekBoard(members, last.week).find((r) => r.id === last.winners[0].id)?.value : null;
  $('#board-last').textContent = last?.winners.length ? t('lastWinner', { names: last.winners.map((r) => r.name).join(' & '), p: pts(lastP) }) : t('lastNone');

  // challenge of the week
  const ch = challengeBoard(members, week);
  $('#ch-title').textContent = tt('challenge', ch.challenge.id);
  $('#ch-text').textContent = tt('challengeText', ch.challenge.id);
  const chMax = Math.max(1, ...ch.rows.map((r) => (isNum(r.value) ? r.value : 0)));
  const unit = tt('unit', ch.challenge.unit);
  $('#ch-board').replaceChildren(...rows(ch.rows, { max: ch.challenge.unit === '%' ? 100 : chMax, format: (v) => `${num(v)}${unit}` }));

  // leaderboards
  const lastDay = game.timeline.at(-1).date;
  const pick = $('#board-pick');
  if (!pick.childElementCount || pick.dataset.lang !== t('you')) {
    pick.dataset.lang = t('you');
    pick.replaceChildren(...BOARDS.map((b) => h('button', { type: 'button', 'data-board': b.id, text: tt('boardName', b.id), onclick: () => { boardPick = b.id; renderTeam(team, game, day, on, board); } })));
  }
  for (const b of pick.children) b.setAttribute('aria-pressed', String(b.dataset.board === boardPick));
  const lb = leaderboard(members, lastDay, boardPick);
  $('#boards-lede').textContent = t(lb.board.better === 'low' ? 'boardsLower' : 'boardsLede');
  const fmt = lb.board.id === 'sleepMin' ? (v) => fmtDur(v) : lb.board.id === 'rhr' ? (v) => `${num(v)} bpm` : lb.board.id === 'hrv' ? (v) => `${num(v)} ms`
    : lb.board.id === 'strain' ? (v) => num(v, 1) : (v) => `${num(v)}%`;
  const vals = lb.rows.map((r) => r.value).filter(isNum);
  const lbMax = lb.board.better === 'low' ? Math.max(...vals, 1) : lb.board.id === 'strain' ? 21 : lb.board.id === 'sleepMin' ? Math.max(...vals, 480) : lb.board.id === 'hrv' ? Math.max(...vals, 1) : 100;
  // for "lower is better" the bar grows as the value falls
  const shown = lb.board.better === 'low' ? lb.rows.map((r) => ({ ...r, bar: isNum(r.value) ? lbMax - r.value + Math.min(...vals) : null })) : lb.rows;
  $('#lb').replaceChildren(...rows(shown.map((r) => ({ ...r, value: r.value })), { max: lbMax, format: fmt }));
  if (lb.board.better === 'low') [...$('#lb').children].forEach((li, i) => { const v = shown[i].value; if (isNum(v)) $('.b-bar i', li).style.width = `${Math.max(8, (Math.min(...vals) / v) * 100)}%`; });
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

const levelArt = (n) => medal({ progress: 1, earned: true, glyph: String(n) }, 52);

// `scope` keeps demo and real data apart.
export function announce(game, scope, { delay = 1600 } = {}) {
  const all = readSeen() || {};
  const seen = all[scope];
  const earned = game.badges.filter((b) => b.earned);
  const now = { badges: earned.map((b) => b.id), level: game.level.n, v: 2 };
  all[scope] = now;
  writeSeen(all);
  if (!seen || seen.v !== 2) {
    toast({ art: levelArt(game.level.n), title: t('welcome', { n: game.level.n, name: game.level.name }), text: t('welcomeText', { n: earned.length, of: game.badges.length }) }, delay);
    return;
  }
  let k = 0;
  if (now.level > seen.level) toast({ art: levelArt(game.level.n), title: t('levelUp', { name: game.level.name }), text: t('levelUpText', { n: game.level.n, xp: num(game.xp) }) }, delay + 900 * k++);
  const fresh = earned.filter((b) => !seen.badges.includes(b.id));
  if (fresh.length === 1) toast({ art: medal(fresh[0], 52), title: t('medal', { name: fresh[0].name }), text: fresh[0].desc }, delay + 900 * k++);
  else if (fresh.length > 1) {
    const names = fresh.map((b) => b.name);
    toast({ art: medal(fresh[0], 52), title: t('newMedals', { n: fresh.length }), text: t('newMedalsText', { list: names.slice(0, -1).join(', '), last: names[names.length - 1] }) }, delay + 900 * k++);
  }
}
