// Everything below the hero: where the strain came from, what recovery is
// made of, how the night went, each vital with its fortnight, and the trend.

import { recoveryBand } from '../core/scores.js';
import { FLOOR, ZONES, loadFromStrain, minuteLoad, zoneBpm } from '../core/strain.js';
import { addDays, clamp, fmtClock, fmtDur, fromKey, isNum, mean } from '../core/util.js';
import { STAGE_COLORS, consistency, hypnogram, sparkline, strainCurve, trendChart } from './charts.js?v=10';
import { $, h, roll } from './motion.js?v=10';

const ZONE_COLOR = [0, 1, 2, 3, 4, 5].map((z) => `var(--z${z})`);
const one = (v) => (isNum(v) ? v.toFixed(1) : '–');
const signed = (v, digits = 0) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v).toFixed(digits)}`;
const dayName = (key) => fromKey(key).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const later = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

// The target band on a 0–21 rail, and one line on where the day stands against it.
export function aimParts(day) {
  const pct = (s) => `${(s / 21) * 100}%`;
  const scale = h('div', { class: 'aim-scale', role: 'img', 'aria-label': `Target strain ${day.target.lo} to ${day.target.hi}; current ${one(day.strain)}` },
    ...[0, 7, 14, 21].map((s) => h('span', { class: 'lab', style: { left: pct(s) }, text: s })),
    h('div', { class: 'rail' }),
    h('div', { class: 'band', style: { left: pct(day.target.lo), width: pct(day.target.hi - day.target.lo) } }),
    isNum(day.strain) ? h('div', { class: 'pin', style: { left: pct(day.strain) } }) : null);
  const s = day.strain ?? 0;
  let line;
  if (!day.partial) line = s > day.target.hi ? `You went <b>${one(s - day.target.hi)} past</b> the top of it.` : s < day.target.lo ? `You finished <b>${one(day.target.lo - s)} short</b> of it, an easier day than you had in you.` : 'You <b>finished inside it</b>.';
  else if (s > day.target.hi) line = `You are <b>${one(s - day.target.hi)} past</b> it already. Anything more today is borrowed from tomorrow.`;
  else if (s >= day.target.lo) line = 'You are <b>inside it</b> now. This is a good place to stop.';
  else line = `You are at ${one(s)}, with <b>${one(day.target.lo - s)} to go</b>: about ${fmtDur(Math.max(1, Math.ceil((loadFromStrain(day.target.lo) - (day.src?.strain === 'whoop' ? loadFromStrain(s) : day.load)) / minuteLoad(0.66))))} at tempo effort.`;
  return { scale, line };
}

// ───────── Strain ─────────
export function renderStrain(day) {
  const lede = $('#strain-lede');
  if (!isNum(day.strain)) {
    lede.textContent = 'No heart-rate data for this day, so there is no strain to work out. Was the band on your wrist?';
  } else if (day.src?.strain === 'whoop') {
    lede.innerHTML = `<b>${one(day.strain)}</b> of 21, ${day.band.name.toLowerCase()}, as scored by WHOOP${day.partial ? ' so far' : ''}.`;
  } else {
    const active = day.zoneMin.slice(1).reduce((a, b) => a + b, 0);
    lede.innerHTML = `<b>${one(day.strain)}</b> of 21, ${day.band.name.toLowerCase()}. Built from <b>${fmtDur(active)}</b> above ${Math.round(FLOOR * 100)}% of your heart-rate range${day.partial ? ' so far' : ''}.`;
  }

  const zones = $('#zones');
  const rows = ZONES.slice(1).reverse();
  const maxMin = Math.max(1, ...rows.map((z) => day.zoneMin[z.id]));
  const totalLoad = day.load || 0;
  if (!zones.children.length) {
    for (const z of rows) {
      zones.append(h('div', { class: 'zone-row', 'data-z': z.id, style: { '--zc': ZONE_COLOR[z.id] } },
        h('div', { class: 'name' }, z.name, h('small')),
        h('div', { class: 'track' }, h('div', { class: 'fill' })),
        h('div', { class: 'val' }, h('b'), h('small'))));
    }
  }
  for (const z of rows) {
    const row = $(`[data-z="${z.id}"]`, zones), b = zoneBpm(z, day.rhrUsed, day.hrMax);
    $('.name small', row).textContent = z.id === 5 ? `${b.lo}+ bpm` : `${b.lo}–${b.hi} bpm`;
    $('.val b', row).textContent = fmtDur(day.zoneMin[z.id]);
    $('.val small', row).textContent = totalLoad > 0.5 ? `${Math.round((day.zoneLoad[z.id] / totalLoad) * 100)}% of strain` : '';
    later(() => { $('.fill', row).style.width = `${(day.zoneMin[z.id] / maxMin) * 100}%`; });
  }
  const off = (day.partial ? day.hr.findLastIndex(isNum) + 1 : 1440) - day.worn;
  $('#zones-note').textContent = `Resting, below ${zoneBpm(ZONES[1], day.rhrUsed, day.hrMax).lo} bpm: ${fmtDur(day.zoneMin[0])}, which adds nothing.`
    + (off > 45 ? ` Band off the wrist for about ${fmtDur(off)}, so the true figure may be higher.` : '')
    + ` Max heart rate ${day.hrMax} bpm, resting ${Math.round(day.rhrUsed)}.`;

  const list = $('#sessions');
  list.replaceChildren();
  if (!day.workouts.length) {
    list.append(h('li', {}, h('p', { class: 'empty', text: isNum(day.strain) ? 'No sessions recorded. This strain came from getting on with the day.' : 'No sessions recorded.' })));
  }
  for (const w of day.workouts) {
    const bits = [`${fmtClock(w.t0)}–${fmtClock(w.t1)}`, fmtDur(w.durMin)];
    if (isNum(w.avgHr)) bits.push(`avg ${w.avgHr} bpm`);
    if (isNum(w.km) && w.km > 0) bits.push(`${w.km.toFixed(1)} km`);
    if (isNum(w.kcal)) bits.push(`${w.kcal} kcal`);
    list.append(h('li', {},
      h('span', { class: 's-name', text: w.name }),
      h('span', { class: 's-strain', title: 'Strain from this session alone', text: one(w.strain) }),
      h('span', { class: 's-meta', text: bits.join(' · ') })));
  }

  const curve = $('#curve');
  if (isNum(day.strain)) {
    strainCurve(curve, day.load, day.strain);
    const more = (to) => Math.ceil((loadFromStrain(to) - day.load) / minuteLoad(0.66));
    const next = Math.min(21, Math.floor(day.strain) + 1);
    $('#curve-note').textContent = day.strain >= 20.9
      ? 'The scale tops out at 21. There is nowhere left to go today.'
      : `The curve flattens as it climbs. From here, reaching ${next}.0 would take about ${fmtDur(Math.max(1, more(next)))} more at tempo effort; the first point of the day took about ${fmtDur(Math.ceil(loadFromStrain(1) / minuteLoad(0.66)))}.`;
  } else { curve.replaceChildren(h('p', { class: 'empty', text: 'Nothing to plot without heart rate.' })); $('#curve-note').textContent = ''; }
}

// ───────── Recovery ─────────
const DEV_HELP = { hrv: 'vital-hrv', rhr: 'vital-rhr', sleep: 'sleep', br: 'vital-br' };
const DEV = {
  hrv: { name: 'Heart-rate variability', unit: 'ms', get: (d) => d.hrv, base: (b) => b.hrv },
  rhr: { name: 'Resting heart rate', unit: 'bpm', get: (d) => d.rhr, base: (b) => b.rhr },
  sleep: { name: 'Sleep', unit: '%', get: (d) => d.sleepPct, base: () => null },
  br: { name: 'Breathing rate', unit: '/min', get: (d) => d.br, base: (b) => b.br },
};

export function renderRecovery(day, ctx) {
  const lede = $('#recovery-lede'), devs = $('#devs'), aim = $('#aim');
  const nights = ctx.days.filter((d) => d.date < day.date && (isNum(d.hrv) || isNum(d.rhr))).length;
  devs.replaceChildren();
  if (!isNum(day.recovery)) {
    const learning = nights < 3;
    lede.textContent = learning ? 'Recovery compares each morning with your own normal, so it needs a few nights first.' : 'No overnight readings for this day, so recovery cannot be worked out.';
    devs.append(h('p', { class: 'empty', text: learning ? `Learning your baseline: ${nights} of 3 nights so far. Wear the band to bed and this fills in.` : 'Heart-rate variability and resting heart rate are both missing. They are measured while you sleep.' }));
  } else {
    const lead = [...day.recoveryParts].sort((a, b) => Math.abs(b.z * b.w) - Math.abs(a.z * a.w))[0];
    const why = lead ? `${DEV[lead.key].name.toLowerCase()} ${lead.z >= 0 ? 'helping' : 'holding it back'} most` : '';
    lede.innerHTML = day.src?.recovery === 'whoop'
      ? `<b>${day.recovery}%</b>, ${recoveryBand(day.recovery).toLowerCase()}, as scored by WHOOP.`
      : `<b>${day.recovery}%</b>, ${recoveryBand(day.recovery).toLowerCase()}. ${why ? why[0].toUpperCase() + why.slice(1) + '.' : ''}`;
    for (const p of day.recoveryParts) {
      const def = DEV[p.key], v = def.get(day), b = def.base(day.baseline);
      const width = clamp(Math.abs(p.z) / 3, 0.02, 1) * 50;
      const bar = h('div', { class: `dev-bar${p.z < 0 ? ' neg' : ''}` });
      devs.append(h('div', { class: 'dev-row' },
        h('div', { class: 'name' }, h('span', { text: def.name, 'data-help': DEV_HELP[p.key] }), h('small', { text: `${Math.round(p.w * 100)}% of the score` })),
        h('div', { class: 'axis-track', role: 'img', 'aria-label': `${def.name}: ${p.z >= 0 ? 'better' : 'worse'} than usual` }, bar),
        h('div', { class: 'val' }, `${isNum(v) ? (p.key === 'br' ? v.toFixed(1) : Math.round(v)) : '–'}`, h('small', { text: b ? `usual ${p.key === 'br' ? b.mean.toFixed(1) : Math.round(b.mean)} ${def.unit}` : p.key === 'sleep' ? 'of need met' : def.unit }))));
      later(() => { bar.style.width = `${width}%`; if (p.z < 0) bar.style.left = `${50 - width}%`; });
    }
    if (isNum(day.skinTemp) && Math.abs(day.skinTemp) >= 0.6) devs.append(h('p', { class: 'note', text: `Skin temperature ran ${signed(day.skinTemp, 1)} °C from your baseline last night. It is not part of the score, but a jump like that often comes with illness.` }));
  }

  aim.replaceChildren();
  if (!day.target) { aim.append(h('p', { class: 'empty', text: 'A strain target appears once recovery is known.' })); return; }
  const { scale, line } = aimParts(day);
  aim.append(scale, h('p', { html: `On ${day.recovery}% recovery, a strain of <b>${day.target.lo}–${day.target.hi}</b> ${day.partial ? 'is' : 'was'} the range that trains without digging a hole.` }), h('p', { html: line }));
}

// ───────── Sleep ─────────
export function renderSleep(day, ctx) {
  const s = day.sleepInfo, lede = $('#sleep-lede');
  const hyp = $('#hypno'), stages = $('#stages'), need = $('#need');
  const week = [];
  for (let i = 6; i >= 0; i--) { const k = addDays(day.date, -i); week.push({ date: k, sleep: ctx.byDate[k]?.sleep || null, selected: k === day.date }); }
  consistency($('#consistency'), week);
  if (!s) {
    const w = day.src?.sleep === 'whoop' ? day.whoop : null;
    if (w) lede.innerHTML = `Sleep <b>${day.sleepPct}%</b>, as scored by WHOOP${isNum(w.sleepMinutes) ? `, with <b>${fmtDur(w.sleepMinutes)}</b> asleep` : ''}. The band recorded no night, so there are no stages here.`;
    else lede.textContent = day.partial ? 'Last night has not synced yet. Open the Google Health app on your phone to push it through.' : 'No sleep was recorded for this night.';
    hyp.replaceChildren(h('p', { class: 'empty', text: 'Nothing recorded.' }));
    stages.replaceChildren(h('p', { class: 'empty', text: '–' })); need.replaceChildren(h('p', { class: 'empty', text: '–' }));
    return;
  }
  lede.innerHTML = `<b>${fmtDur(s.asleep)}</b> asleep, ${fmtClock(day.sleep.start)} to ${fmtClock(day.sleep.end)}. That met <b>${Math.round(s.parts.sufficiency * 100)}%</b> of what last night called for.`;
  if (day.sleep.stages.length) hypnogram(hyp, day.sleep); else hyp.replaceChildren(h('p', { class: 'empty', text: 'This night was recorded without stages.' }));

  stages.replaceChildren();
  const order = s.hasStages ? ['deep', 'rem', 'light', 'wake'] : ['light', 'wake'];
  const names = { deep: 'Deep', rem: 'REM', light: s.hasStages ? 'Light' : 'Asleep', wake: 'Awake' };
  for (const k of order) {
    const min = s.stageMin[k] || 0, fill = h('div', { class: 'fill' });
    stages.append(h('div', { class: 'stage-row', style: { '--zc': STAGE_COLORS[k] } }, h('span', { text: names[k] }), h('div', { class: 'track' }, fill),
      h('span', { class: 'val' }, fmtDur(min), h('small', { text: `${Math.round((min / Math.max(1, s.inBed)) * 100)}%` }))));
    later(() => { fill.style.width = `${(min / Math.max(1, s.inBed)) * 100}%`; });
  }

  const fill = h('div', { class: 'fill' });
  const scaleMax = Math.max(s.need, s.asleep) * 1.12;
  need.replaceChildren(
    h('p', { class: 'big' }, fmtDur(s.asleep), h('small', { text: `of ${fmtDur(s.need)}` })),
    h('div', { class: 'need-track' }, fill, h('div', { class: 'mark', style: { left: `${(s.need / scaleMax) * 100}%` } })),
    h('dl', { class: 'kv' },
      h('dt', { text: 'Time in bed', 'data-help': 'inbed' }), h('dd', { text: fmtDur(s.inBed) }),
      h('dt', { text: 'Asleep while in bed', 'data-help': 'efficiency' }), h('dd', { text: isNum(s.efficiency) ? `${Math.round(s.efficiency * 100)}%` : '–' }),
      h('dt', { text: 'Deep and REM', 'data-help': 'restorative' }), h('dd', { text: isNum(s.restorative) ? `${Math.round(s.restorative * 100)}% of sleep` : '–' }),
      h('dt', { text: s.debt > 5 ? 'Still owed' : 'Owed', 'data-help': 'owed' }), h('dd', { text: s.debt > 5 ? fmtDur(s.debt) : 'nothing' })));
  later(() => { fill.style.width = `${(s.asleep / scaleMax) * 100}%`; });
}

// ───────── Vitals ─────────
export const VITAL_DEFS = {
  rhr: { name: 'Resting heart rate', unit: 'bpm', get: (d) => d.rhr, base: 'rhr', good: -1, fmt: (v) => Math.round(v) },
  hrv: { name: 'Heart-rate variability', unit: 'ms', get: (d) => d.hrv, base: 'hrv', good: 1, fmt: (v) => Math.round(v) },
  spo2: { name: 'Blood oxygen', unit: '%', get: (d) => d.spo2?.avg, base: 'spo2', good: 1, fmt: (v) => v.toFixed(1), digits: 1 },
  br: { name: 'Breathing rate', unit: 'per min', get: (d) => d.br, base: 'br', good: 0, fmt: (v) => v.toFixed(1), digits: 1 },
  skinTemp: { name: 'Skin temperature', unit: '°C from baseline', get: (d) => d.skinTemp, base: null, good: 0, fmt: (v) => signed(v, 1), digits: 1 },
  vo2max: { name: 'Cardio fitness', unit: 'VO₂ max', get: (d) => d.vo2max, base: 'vo2max', good: 1, fmt: (v) => v.toFixed(1), digits: 1 },
  steps: { name: 'Steps', unit: '', get: (d) => d.steps, base: 'steps', good: 1, fmt: (v) => Math.round(v).toLocaleString('en-GB'), total: true },
  distance: { name: 'Distance', unit: 'km', get: (d) => d.distance, base: 'distance', good: 1, fmt: (v) => v.toFixed(1), digits: 1, total: true },
  calories: { name: 'Energy burned', unit: 'kcal', get: (d) => d.calories, base: 'calories', good: 0, fmt: (v) => Math.round(v).toLocaleString('en-GB'), total: true },
  azm: { name: 'Zone minutes', unit: 'min', get: (d) => d.azm?.total, base: 'azm', good: 1, fmt: (v) => Math.round(v), total: true },
};

export function renderVitals(day, ctx, hidden, issues) {
  const wrap = $('#tiles');
  const keys = Object.keys(VITAL_DEFS).filter((k) => !hidden.includes(k));
  const have = [...wrap.children].map((c) => c.dataset.k).join();
  if (have !== keys.join()) {
    wrap.replaceChildren(...keys.map((k) => h('article', { class: 'tile', 'data-k': k },
      h('h3', { text: VITAL_DEFS[k].name, 'data-help': `vital-${k}` }), h('p', { class: 't-num' }, h('span', { class: 'v' }), h('small', { text: VITAL_DEFS[k].unit })),
      h('p', { class: 't-delta' }), h('div', { class: 't-spark' }))));
    if (!keys.length) wrap.append(h('article', { class: 'tile' }, h('p', { class: 'empty', text: 'Every vital is switched off. Choose what shows here to bring some back.' })));
  }
  const idx = ctx.days.findIndex((d) => d.date === day.date);
  const span = ctx.days.slice(Math.max(0, idx - 13), idx + 1);
  for (const k of keys) {
    const def = VITAL_DEFS[k], tile = $(`[data-k="${k}"]`, wrap), v = def.get(day), num = $('.v', tile), delta = $('.t-delta', tile);
    const b = def.base ? day.baseline[def.base] : null;
    const setDelta = () => {
      delta.className = 't-delta';
      if (!isNum(v)) {
        const bad = issues.find((i) => !i.ok && TYPE_OF[k] === i.type);
        delta.textContent = bad ? (bad.status === 403 ? 'Not shared: permission was not granted' : `Could not load (${bad.status || 'network'})`) : day.partial && !def.total ? 'Arrives after the night syncs' : 'No reading';
        return;
      }
      if (k === 'spo2' && isNum(day.spo2.min)) { delta.textContent = `range ${day.spo2.min.toFixed(1)}–${isNum(day.spo2.max) ? day.spo2.max.toFixed(1) : '–'}`; return; }
      if (k === 'azm') { delta.textContent = `${day.azm.fatBurn} moderate · ${day.azm.cardio + day.azm.peak} vigorous`; return; }
      if (!b || !isNum(b.mean)) { delta.textContent = k === 'skinTemp' ? 'against your own 30 nights' : 'building your average'; return; }
      const diff = v - b.mean, small = Math.abs(diff) < Math.max(10 ** -(def.digits || 0) / 2, Math.abs(b.mean) * 0.01);
      const tone = small || !def.good ? 'flat' : (diff > 0) === (def.good > 0) ? 'up' : 'down';
      delta.classList.add(tone);
      const amount = def.total ? Math.round(Math.abs(diff)).toLocaleString('en-GB') : Math.abs(diff).toFixed(def.digits || 0);
      delta.textContent = small ? 'level with your usual' : `${diff > 0 ? '▲' : '▼'} ${amount} ${def.total && day.partial ? 'vs a full day' : 'vs your usual'}`;
    };
    if (isNum(v)) roll(num, v, { format: def.fmt, dur: 700 }); else { num.textContent = '–'; num._v = null; }
    setDelta();
    const vals = span.map((d) => def.get(d));
    sparkline($('.t-spark', tile), vals, {
      baseline: b?.mean, labels: span.map((d) => dayName(d.date)),
      onRead: (val, label) => {
        if (val == null) { if (isNum(v)) num.textContent = def.fmt(v); else num.textContent = '–'; setDelta(); return; }
        num.textContent = def.fmt(val); delta.className = 't-delta'; delta.textContent = label;
      },
    });
  }
}
const TYPE_OF = { rhr: 'daily-resting-heart-rate', hrv: 'daily-heart-rate-variability', spo2: 'daily-oxygen-saturation', br: 'daily-respiratory-rate', skinTemp: 'daily-sleep-temperature-derivations', vo2max: 'daily-vo2-max', steps: 'steps', distance: 'distance', calories: 'total-calories', azm: 'active-zone-minutes' };

// ───────── Trends ─────────
export function renderTrends(day, ctx, range, onPick) {
  const end = ctx.days[ctx.days.length - 1].date;
  const days = ctx.days.slice(-range);
  trendChart($('#trend'), days, day.date, onPick);
  const done = days.filter((d) => !d.partial);
  const avg = (f) => mean(done.map(f));
  const strain = avg((d) => d.strain), rec = avg((d) => d.recovery), sleep = avg((d) => d.sleepInfo?.asleep), rhr = avg((d) => d.rhr);
  const over = done.filter((d) => d.target && isNum(d.strain) && d.strain > d.target.hi).length;
  $('#trends-lede').innerHTML = done.length < 3 ? 'A few more days and patterns start to show here.'
    : `Over ${done.length} days to ${dayName(end)}: average strain <b>${one(strain)}</b> on <b>${isNum(rec) ? Math.round(rec) + '%' : '–'}</b> recovery. You pushed past your target on <b>${over}</b> of them.`;
  $('#averages').replaceChildren(
    h('div', {}, h('dt', { text: 'Average strain', 'data-help': 'strain' }), h('dd', { text: one(strain) })),
    h('div', {}, h('dt', { text: 'Average recovery', 'data-help': 'recovery' }), h('dd', {}, isNum(rec) ? Math.round(rec) : '–', h('small', { text: '%' }))),
    h('div', {}, h('dt', { text: 'Average sleep', 'data-help': 'avgsleep' }), h('dd', { text: isNum(sleep) ? fmtDur(sleep) : '–' })),
    h('div', {}, h('dt', { text: 'Resting heart rate', 'data-help': 'vital-rhr' }), h('dd', {}, isNum(rhr) ? Math.round(rhr) : '–', h('small', { text: 'bpm' }))));
}
