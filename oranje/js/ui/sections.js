// Everything below the hero: where the strain came from, what recovery is
// made of, how the night went, each vital with its fortnight, and the trend.

import { FLOOR, ZONES, loadFromStrain, minuteLoad, zoneBpm } from '../core/strain.js';
import { addDays, clamp, fmtClock, fmtDur, fromKey, isNum, mean } from '../core/util.js';
import { date, num, signedNum, strings } from '../i18n.js';
import { bandName, recoveryName, stageName, term, zoneName } from '../terms.js';
import { STAGE_COLORS, consistency, hypnogram, sparkline, strainCurve, trendChart } from './charts.js?v=14';
import { $, h, roll } from './motion.js?v=14';

const t = strings({
  en: {
    aimAria: 'Target strain {lo} to {hi}; current {cur}',
    aimDoneOver: 'You went <b>{v} past</b> the top of it.',
    aimDoneUnder: 'You finished <b>{v} short</b> of it, an easier day than you had in you.',
    aimDoneIn: 'You <b>finished inside it</b>.',
    aimNowOver: 'You are <b>{v} past</b> it already. Anything more today is borrowed from tomorrow.',
    aimNowIn: 'You are <b>inside it</b> now. This is a good place to stop.',
    aimNowUnder: 'You are at {s}, with <b>{v} to go</b>: about {dur} at tempo effort.',

    noHr: 'No heart-rate data for this day, so there is no strain to work out. Was the band on your wrist?',
    strainWhoop: ({ v, band, partial }) => `<b>${v}</b> of 21, ${band}, as scored by WHOOP${partial ? ' so far' : ''}.`,
    strainOwn: ({ v, band, dur, pct, partial }) => `<b>${v}</b> of 21, ${band}. Built from <b>${dur}</b> above ${pct}% of your heart-rate range${partial ? ' so far' : ''}.`,
    ofStrain: '{pct}% of strain',
    zonesRest: 'Resting, below {bpm} bpm: {dur}, which adds nothing.',
    zonesOff: ' Band off the wrist for about {dur}, so the true figure may be higher.',
    zonesMax: ' Max heart rate {max} bpm, resting {rest}.',
    noSessionsStrain: 'No sessions recorded. This strain came from getting on with the day.',
    noSessions: 'No sessions recorded.',
    avgBpm: 'avg {v} bpm',
    sessionTitle: 'Strain from this session alone',
    curveTop: 'The scale tops out at 21. There is nowhere left to go today.',
    curveNote: 'The curve flattens as it climbs. From here, reaching {next} would take about {more} more at tempo effort; the first point of the day took about {first}.',
    curveEmpty: 'Nothing to plot without heart rate.',

    devHrv: 'Heart-rate variability', devRhr: 'Resting heart rate', devBr: 'Breathing rate',
    recLearning: 'Recovery compares each morning with your own normal, so it needs a few nights first.',
    recNone: 'No overnight readings for this day, so recovery cannot be worked out.',
    recLearningNote: 'Learning your baseline: {n} of 3 nights so far. Wear the band to bed and this fills in.',
    recNoneNote: 'Heart-rate variability and resting heart rate are both missing. They are measured while you sleep.',
    why: ({ name, up }) => `${name} ${up ? 'helping' : 'holding it back'} most`,
    recWhoop: '<b>{v}%</b>, {band}, as scored by WHOOP.',
    recOwn: '<b>{v}%</b>, {band}. {why}',
    weight: '{pct}% of the score',
    devAria: ({ name, up }) => `${name}: ${up ? 'better' : 'worse'} than usual`,
    usual: 'usual {v} {unit}',
    needMet: 'of need met',
    skinNote: 'Skin temperature ran {v} °C from your baseline last night. It is not part of the score, but a jump like that often comes with illness.',
    noTarget: 'A strain target appears once recovery is known.',
    targetLine: ({ r, lo, hi, partial }) => `On ${r}% recovery, a strain of <b>${lo}–${hi}</b> ${partial ? 'is' : 'was'} the range that trains without digging a hole.`,

    sleepWhoop: ({ pct, dur }) => `Sleep <b>${pct}%</b>, as scored by WHOOP${dur ? `, with <b>${dur}</b> asleep` : ''}. The band recorded no night, so there are no stages here.`,
    sleepUnsynced: 'Last night has not synced yet. Open the Google Health app on your phone to push it through.',
    sleepNone: 'No sleep was recorded for this night.',
    nothingRecorded: 'Nothing recorded.',
    sleepLede: '<b>{dur}</b> asleep, {from} to {to}. That met <b>{pct}%</b> of what last night called for.',
    noStages: 'This night was recorded without stages.',
    asleep: 'Asleep',
    needOf: 'of {dur}',
    inBed: 'Time in bed', efficiency: 'Asleep while in bed', restorative: 'Deep and REM', ofSleep: '{pct}% of sleep',
    stillOwed: 'Still owed', owed: 'Owed', nothing: 'nothing',

    vRhr: 'Resting heart rate', vHrv: 'Heart-rate variability', vSpo2: 'Blood oxygen', vBr: 'Breathing rate',
    vSkin: 'Skin temperature', vVo2: 'Cardio fitness', vSteps: 'Steps', vDistance: 'Distance', vCalories: 'Energy burned', vAzm: 'Zone minutes',
    uPerMin: 'per min', uSkin: '°C from baseline',
    allOff: 'Every vital is switched off. Choose what shows here to bring some back.',
    notShared: 'Not shared: permission was not granted',
    couldNotLoad: 'Could not load ({why})', network: 'network',
    afterSync: 'Arrives after the night syncs',
    noReading: 'No reading',
    range: 'range {lo}–{hi}',
    azm: '{mod} moderate · {vig} vigorous',
    own30: 'against your own 30 nights',
    building: 'building your average',
    level: 'level with your usual',
    vsFull: 'vs a full day', vsUsual: 'vs your usual',

    trendsFew: 'A few more days and patterns start to show here.',
    trendsLede: 'Over {n} days to {end}: average strain <b>{s}</b> on <b>{r}</b> recovery. You pushed past your target on <b>{over}</b> of them.',
    avgStrain: 'Average strain', avgRecovery: 'Average recovery', avgSleep: 'Average sleep', avgRhr: 'Resting heart rate',
  },
  nl: {
    aimAria: 'Strain-doel {lo} tot {hi}; nu {cur}',
    aimDoneOver: 'Je eindigde <b>{v} boven</b> je doel.',
    aimDoneUnder: 'Je bleef <b>{v} onder</b> je doel: een rustigere dag dan erin zat.',
    aimDoneIn: 'Je <b>eindigde binnen je doel</b>.',
    aimNowOver: 'Je zit er al <b>{v} boven</b>. Wat je vandaag nog doet, leen je van morgen.',
    aimNowIn: 'Je zit nu <b>binnen je doel</b>. Een mooi moment om te stoppen.',
    aimNowUnder: 'Je staat op {s}, nog <b>{v} te gaan</b>: zo’n {dur} op tempo.',

    noHr: 'Geen hartslag voor deze dag, dus er valt geen strain te berekenen. Zat de band wel om je pols?',
    strainWhoop: ({ v, band, partial }) => `<b>${v}</b> van 21${partial ? ' tot nu toe' : ''}, ${band}, volgens WHOOP.`,
    strainOwn: ({ v, band, dur, pct, partial }) => `<b>${v}</b> van 21, ${band}. Opgebouwd uit <b>${dur}</b> boven ${pct}% van je hartslagbereik${partial ? ' tot nu toe' : ''}.`,
    ofStrain: '{pct}% van de strain',
    zonesRest: 'In rust, onder {bpm} bpm: {dur}. Dat telt niet mee.',
    zonesOff: ' De band zat zo’n {dur} niet om je pols, dus het echte getal ligt misschien hoger.',
    zonesMax: ' Maximale hartslag {max} bpm, rusthartslag {rest}.',
    noSessionsStrain: 'Geen trainingen vastgelegd. Deze strain komt gewoon uit je dag.',
    noSessions: 'Geen trainingen vastgelegd.',
    avgBpm: 'gem. {v} bpm',
    sessionTitle: 'Strain van alleen deze training',
    curveTop: 'De schaal houdt op bij 21. Hoger kan vandaag niet.',
    curveNote: 'De curve vlakt af naarmate hij stijgt. Vanaf hier kost {next} halen nog zo’n {more} op tempo; het eerste punt van vandaag kostte zo’n {first}.',
    curveEmpty: 'Zonder hartslag valt er niets te tekenen.',

    devHrv: 'Hartslagvariabiliteit', devRhr: 'Rusthartslag', devBr: 'Ademhaling',
    recLearning: 'Herstel vergelijkt elke ochtend met wat voor jou normaal is, dus het heeft eerst een paar nachten nodig.',
    recNone: 'Geen nachtmetingen voor deze dag, dus herstel valt niet te berekenen.',
    recLearningNote: 'Oranje leert wat normaal is voor jou: {n} van de 3 nachten. Slaap met je band om en dit vult zich vanzelf.',
    recNoneNote: 'Hartslagvariabiliteit en rusthartslag ontbreken allebei. Die worden gemeten terwijl je slaapt.',
    why: ({ name, up }) => `${name} ${up ? 'helpt het meest' : 'houdt het meest tegen'}`,
    recWhoop: '<b>{v}%</b>, {band}, volgens WHOOP.',
    recOwn: '<b>{v}%</b>, {band}. {why}',
    weight: '{pct}% van de score',
    devAria: ({ name, up }) => `${name}: ${up ? 'beter' : 'slechter'} dan normaal`,
    usual: 'normaal {v} {unit}',
    needMet: 'van je behoefte',
    skinNote: 'Je huidtemperatuur week afgelopen nacht {v} °C af van je normaal. Het telt niet mee in de score, maar zo’n sprong gaat vaak samen met ziekte.',
    noTarget: 'Een strain-doel verschijnt zodra je herstel bekend is.',
    targetLine: ({ r, lo, hi, partial }) => `Bij ${r}% herstel ${partial ? 'is' : 'was'} een strain van <b>${lo}–${hi}</b> het bereik waarmee je traint zonder jezelf te slopen.`,

    sleepWhoop: ({ pct, dur }) => `Slaap <b>${pct}%</b> volgens WHOOP${dur ? `, met <b>${dur}</b> geslapen` : ''}. De band heeft geen nacht vastgelegd, dus hier staan geen slaapfases.`,
    sleepUnsynced: 'Afgelopen nacht is nog niet gesynchroniseerd. Open de Google Health-app op je telefoon om hem door te sturen.',
    sleepNone: 'Voor deze nacht is geen slaap vastgelegd.',
    nothingRecorded: 'Niets vastgelegd.',
    sleepLede: '<b>{dur}</b> geslapen, van {from} tot {to}. Dat is <b>{pct}%</b> van wat je afgelopen nacht nodig had.',
    noStages: 'Deze nacht is zonder slaapfases vastgelegd.',
    asleep: 'Geslapen',
    needOf: 'van {dur}',
    inBed: 'Tijd in bed', efficiency: 'Geslapen terwijl je in bed lag', restorative: 'Diep en REM', ofSleep: '{pct}% van je slaap',
    stillOwed: 'Nog tekort', owed: 'Tekort', nothing: 'niets',

    vRhr: 'Rusthartslag', vHrv: 'Hartslagvariabiliteit', vSpo2: 'Bloedzuurstof', vBr: 'Ademhaling',
    vSkin: 'Huidtemperatuur', vVo2: 'Conditie', vSteps: 'Stappen', vDistance: 'Afstand', vCalories: 'Verbruikte energie', vAzm: 'Zoneminuten',
    uPerMin: 'per min', uSkin: '°C t.o.v. normaal',
    allOff: 'Alle lichaamswaarden staan uit. Met “Kies wat je ziet” haal je ze terug.',
    notShared: 'Niet gedeeld: geen toestemming gegeven',
    couldNotLoad: 'Kon niet laden ({why})', network: 'netwerk',
    afterSync: 'Komt binnen zodra de nacht gesynchroniseerd is',
    noReading: 'Geen meting',
    range: 'bereik {lo}–{hi}',
    azm: '{mod} matig · {vig} intensief',
    own30: 'tegenover je eigen 30 nachten',
    building: 'je gemiddelde wordt nog opgebouwd',
    level: 'gelijk aan je normaal',
    vsFull: 't.o.v. een hele dag', vsUsual: 't.o.v. je normaal',

    trendsFew: 'Nog een paar dagen en hier verschijnen patronen.',
    trendsLede: 'In {n} dagen tot {end}: gemiddeld <b>{s}</b> strain bij <b>{r}</b> herstel. Op <b>{over}</b> daarvan ging je over je doel heen.',
    avgStrain: 'Gemiddelde strain', avgRecovery: 'Gemiddeld herstel', avgSleep: 'Gemiddelde slaap', avgRhr: 'Rusthartslag',
  },
});

const ZONE_COLOR = [0, 1, 2, 3, 4, 5].map((z) => `var(--z${z})`);
const one = (v) => (isNum(v) ? num(v, 1) : '–');
// a value that is already rounded to one decimal (targets): 13 stays "13", 13.2 reads "13.2" / "13,2"
const dec = (v) => (isNum(v) ? num(v, Number.isInteger(v) ? 0 : 1) : String(v));
const dayName = (key) => date(fromKey(key), { weekday: 'short', day: 'numeric', month: 'short' });
const later = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

// The target band on a 0–21 rail, and one line on where the day stands against it.
export function aimParts(day) {
  const pct = (s) => `${(s / 21) * 100}%`;
  const scale = h('div', { class: 'aim-scale', role: 'img', 'aria-label': t('aimAria', { lo: dec(day.target.lo), hi: dec(day.target.hi), cur: one(day.strain) }) },
    ...[0, 7, 14, 21].map((s) => h('span', { class: 'lab', style: { left: pct(s) }, text: s })),
    h('div', { class: 'rail' }),
    h('div', { class: 'band', style: { left: pct(day.target.lo), width: pct(day.target.hi - day.target.lo) } }),
    isNum(day.strain) ? h('div', { class: 'pin', style: { left: pct(day.strain) } }) : null);
  const s = day.strain ?? 0;
  let line;
  if (!day.partial) line = s > day.target.hi ? t('aimDoneOver', { v: one(s - day.target.hi) }) : s < day.target.lo ? t('aimDoneUnder', { v: one(day.target.lo - s) }) : t('aimDoneIn');
  else if (s > day.target.hi) line = t('aimNowOver', { v: one(s - day.target.hi) });
  else if (s >= day.target.lo) line = t('aimNowIn');
  else line = t('aimNowUnder', { s: one(s), v: one(day.target.lo - s), dur: fmtDur(Math.max(1, Math.ceil((loadFromStrain(day.target.lo) - (day.src?.strain === 'whoop' ? loadFromStrain(s) : day.load)) / minuteLoad(0.66)))) });
  return { scale, line };
}

// ───────── Strain ─────────
export function renderStrain(day) {
  const lede = $('#strain-lede');
  if (!isNum(day.strain)) {
    lede.textContent = t('noHr');
  } else if (day.src?.strain === 'whoop') {
    lede.innerHTML = t('strainWhoop', { v: one(day.strain), band: bandName(day.band).toLowerCase(), partial: day.partial });
  } else {
    const active = day.zoneMin.slice(1).reduce((a, b) => a + b, 0);
    lede.innerHTML = t('strainOwn', { v: one(day.strain), band: bandName(day.band).toLowerCase(), dur: fmtDur(active), pct: Math.round(FLOOR * 100), partial: day.partial });
  }

  const zones = $('#zones');
  const rows = ZONES.slice(1).reverse();
  const maxMin = Math.max(1, ...rows.map((z) => day.zoneMin[z.id]));
  const totalLoad = day.load || 0;
  if (!zones.children.length) {
    for (const z of rows) {
      zones.append(h('div', { class: 'zone-row', 'data-z': z.id, style: { '--zc': ZONE_COLOR[z.id] } },
        h('div', { class: 'name' }, h('span', { class: 'zn' }), h('small')),
        h('div', { class: 'track' }, h('div', { class: 'fill' })),
        h('div', { class: 'val' }, h('b'), h('small'))));
    }
  }
  for (const z of rows) {
    const row = $(`[data-z="${z.id}"]`, zones), b = zoneBpm(z, day.rhrUsed, day.hrMax);
    $('.name .zn', row).textContent = zoneName(z);
    $('.name small', row).textContent = z.id === 5 ? `${b.lo}+ bpm` : `${b.lo}–${b.hi} bpm`;
    $('.val b', row).textContent = fmtDur(day.zoneMin[z.id]);
    $('.val small', row).textContent = totalLoad > 0.5 ? t('ofStrain', { pct: Math.round((day.zoneLoad[z.id] / totalLoad) * 100) }) : '';
    later(() => { $('.fill', row).style.width = `${(day.zoneMin[z.id] / maxMin) * 100}%`; });
  }
  const off = (day.partial ? day.hr.findLastIndex(isNum) + 1 : 1440) - day.worn;
  $('#zones-note').textContent = t('zonesRest', { bpm: zoneBpm(ZONES[1], day.rhrUsed, day.hrMax).lo, dur: fmtDur(day.zoneMin[0]) })
    + (off > 45 ? t('zonesOff', { dur: fmtDur(off) }) : '')
    + t('zonesMax', { max: day.hrMax, rest: Math.round(day.rhrUsed) });

  const list = $('#sessions');
  list.replaceChildren();
  if (!day.workouts.length) {
    list.append(h('li', {}, h('p', { class: 'empty', text: isNum(day.strain) ? t('noSessionsStrain') : t('noSessions') })));
  }
  for (const w of day.workouts) {
    const bits = [`${fmtClock(w.t0)}–${fmtClock(w.t1)}`, fmtDur(w.durMin)];
    if (isNum(w.avgHr)) bits.push(t('avgBpm', { v: w.avgHr }));
    if (isNum(w.km) && w.km > 0) bits.push(`${num(w.km, 1)} km`);
    if (isNum(w.kcal)) bits.push(`${w.kcal} kcal`);
    list.append(h('li', {},
      h('span', { class: 's-name', text: w.name }),
      h('span', { class: 's-strain', title: t('sessionTitle'), text: one(w.strain) }),
      h('span', { class: 's-meta', text: bits.join(' · ') })));
  }

  const curve = $('#curve');
  if (isNum(day.strain)) {
    strainCurve(curve, day.load, day.strain);
    const more = (to) => Math.ceil((loadFromStrain(to) - day.load) / minuteLoad(0.66));
    const next = Math.min(21, Math.floor(day.strain) + 1);
    $('#curve-note').textContent = day.strain >= 20.9
      ? t('curveTop')
      : t('curveNote', { next: num(next, 1), more: fmtDur(Math.max(1, more(next))), first: fmtDur(Math.ceil(loadFromStrain(1) / minuteLoad(0.66))) });
  } else { curve.replaceChildren(h('p', { class: 'empty', text: t('curveEmpty') })); $('#curve-note').textContent = ''; }
}

// ───────── Recovery ─────────
const DEV_HELP = { hrv: 'vital-hrv', rhr: 'vital-rhr', sleep: 'sleep', br: 'vital-br' };
const DEV = {
  hrv: { get name() { return t('devHrv'); }, unit: 'ms', get: (d) => d.hrv, base: (b) => b.hrv },
  rhr: { get name() { return t('devRhr'); }, unit: 'bpm', get: (d) => d.rhr, base: (b) => b.rhr },
  sleep: { get name() { return term('sleep'); }, unit: '%', get: (d) => d.sleepPct, base: () => null },
  br: { get name() { return t('devBr'); }, unit: '/min', get: (d) => d.br, base: (b) => b.br },
};

export function renderRecovery(day, ctx) {
  const lede = $('#recovery-lede'), devs = $('#devs'), aim = $('#aim');
  const nights = ctx.days.filter((d) => d.date < day.date && (isNum(d.hrv) || isNum(d.rhr))).length;
  devs.replaceChildren();
  if (!isNum(day.recovery)) {
    const learning = nights < 3;
    lede.textContent = learning ? t('recLearning') : t('recNone');
    devs.append(h('p', { class: 'empty', text: learning ? t('recLearningNote', { n: nights }) : t('recNoneNote') }));
  } else {
    const lead = [...day.recoveryParts].sort((a, b) => Math.abs(b.z * b.w) - Math.abs(a.z * a.w))[0];
    const why = lead ? t('why', { name: DEV[lead.key].name.toLowerCase(), up: lead.z >= 0 }) : '';
    lede.innerHTML = day.src?.recovery === 'whoop'
      ? t('recWhoop', { v: day.recovery, band: recoveryName(day.recovery).toLowerCase() })
      : t('recOwn', { v: day.recovery, band: recoveryName(day.recovery).toLowerCase(), why: why ? why[0].toUpperCase() + why.slice(1) + '.' : '' });
    for (const p of day.recoveryParts) {
      const def = DEV[p.key], v = def.get(day), b = def.base(day.baseline);
      const width = clamp(Math.abs(p.z) / 3, 0.02, 1) * 50;
      const bar = h('div', { class: `dev-bar${p.z < 0 ? ' neg' : ''}` });
      devs.append(h('div', { class: 'dev-row' },
        h('div', { class: 'name' }, h('span', { text: def.name, 'data-help': DEV_HELP[p.key] }), h('small', { text: t('weight', { pct: Math.round(p.w * 100) }) })),
        h('div', { class: 'axis-track', role: 'img', 'aria-label': t('devAria', { name: def.name, up: p.z >= 0 }) }, bar),
        h('div', { class: 'val' }, `${isNum(v) ? (p.key === 'br' ? num(v, 1) : Math.round(v)) : '–'}`, h('small', { text: b ? t('usual', { v: p.key === 'br' ? num(b.mean, 1) : Math.round(b.mean), unit: def.unit }) : p.key === 'sleep' ? t('needMet') : def.unit }))));
      later(() => { bar.style.width = `${width}%`; if (p.z < 0) bar.style.left = `${50 - width}%`; });
    }
    if (isNum(day.skinTemp) && Math.abs(day.skinTemp) >= 0.6) devs.append(h('p', { class: 'note', text: t('skinNote', { v: signedNum(day.skinTemp, 1) }) }));
  }

  aim.replaceChildren();
  if (!day.target) { aim.append(h('p', { class: 'empty', text: t('noTarget') })); return; }
  const { scale, line } = aimParts(day);
  aim.append(scale, h('p', { html: t('targetLine', { r: day.recovery, lo: dec(day.target.lo), hi: dec(day.target.hi), partial: day.partial }) }), h('p', { html: line }));
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
    if (w) lede.innerHTML = t('sleepWhoop', { pct: day.sleepPct, dur: isNum(w.sleepMinutes) ? fmtDur(w.sleepMinutes) : '' });
    else lede.textContent = day.partial ? t('sleepUnsynced') : t('sleepNone');
    hyp.replaceChildren(h('p', { class: 'empty', text: t('nothingRecorded') }));
    stages.replaceChildren(h('p', { class: 'empty', text: '–' })); need.replaceChildren(h('p', { class: 'empty', text: '–' }));
    return;
  }
  lede.innerHTML = t('sleepLede', { dur: fmtDur(s.asleep), from: fmtClock(day.sleep.start), to: fmtClock(day.sleep.end), pct: Math.round(s.parts.sufficiency * 100) });
  if (day.sleep.stages.length) hypnogram(hyp, day.sleep); else hyp.replaceChildren(h('p', { class: 'empty', text: t('noStages') }));

  stages.replaceChildren();
  const order = s.hasStages ? ['deep', 'rem', 'light', 'wake'] : ['light', 'wake'];
  for (const k of order) {
    const min = s.stageMin[k] || 0, fill = h('div', { class: 'fill' });
    const name = k === 'light' && !s.hasStages ? t('asleep') : stageName(k);
    stages.append(h('div', { class: 'stage-row', style: { '--zc': STAGE_COLORS[k] } }, h('span', { text: name }), h('div', { class: 'track' }, fill),
      h('span', { class: 'val' }, fmtDur(min), h('small', { text: `${Math.round((min / Math.max(1, s.inBed)) * 100)}%` }))));
    later(() => { fill.style.width = `${(min / Math.max(1, s.inBed)) * 100}%`; });
  }

  const fill = h('div', { class: 'fill' });
  const scaleMax = Math.max(s.need, s.asleep) * 1.12;
  need.replaceChildren(
    h('p', { class: 'big' }, fmtDur(s.asleep), h('small', { text: t('needOf', { dur: fmtDur(s.need) }) })),
    h('div', { class: 'need-track' }, fill, h('div', { class: 'mark', style: { left: `${(s.need / scaleMax) * 100}%` } })),
    h('dl', { class: 'kv' },
      h('dt', { text: t('inBed'), 'data-help': 'inbed' }), h('dd', { text: fmtDur(s.inBed) }),
      h('dt', { text: t('efficiency'), 'data-help': 'efficiency' }), h('dd', { text: isNum(s.efficiency) ? `${Math.round(s.efficiency * 100)}%` : '–' }),
      h('dt', { text: t('restorative'), 'data-help': 'restorative' }), h('dd', { text: isNum(s.restorative) ? t('ofSleep', { pct: Math.round(s.restorative * 100) }) : '–' }),
      h('dt', { text: s.debt > 5 ? t('stillOwed') : t('owed'), 'data-help': 'owed' }), h('dd', { text: s.debt > 5 ? fmtDur(s.debt) : t('nothing') })));
  later(() => { fill.style.width = `${(s.asleep / scaleMax) * 100}%`; });
}

// ───────── Vitals ─────────
// name and unit are getters, so they always read in the current language.
export const VITAL_DEFS = {
  rhr: { get name() { return t('vRhr'); }, unit: 'bpm', get: (d) => d.rhr, base: 'rhr', good: -1, fmt: (v) => Math.round(v) },
  hrv: { get name() { return t('vHrv'); }, unit: 'ms', get: (d) => d.hrv, base: 'hrv', good: 1, fmt: (v) => Math.round(v) },
  spo2: { get name() { return t('vSpo2'); }, unit: '%', get: (d) => d.spo2?.avg, base: 'spo2', good: 1, fmt: (v) => num(v, 1), digits: 1 },
  br: { get name() { return t('vBr'); }, get unit() { return t('uPerMin'); }, get: (d) => d.br, base: 'br', good: 0, fmt: (v) => num(v, 1), digits: 1 },
  skinTemp: { get name() { return t('vSkin'); }, get unit() { return t('uSkin'); }, get: (d) => d.skinTemp, base: null, good: 0, fmt: (v) => signedNum(v, 1), digits: 1 },
  vo2max: { get name() { return t('vVo2'); }, unit: 'VO₂ max', get: (d) => d.vo2max, base: 'vo2max', good: 1, fmt: (v) => num(v, 1), digits: 1 },
  steps: { get name() { return t('vSteps'); }, unit: '', get: (d) => d.steps, base: 'steps', good: 1, fmt: (v) => num(Math.round(v)), total: true },
  distance: { get name() { return t('vDistance'); }, unit: 'km', get: (d) => d.distance, base: 'distance', good: 1, fmt: (v) => num(v, 1), digits: 1, total: true },
  calories: { get name() { return t('vCalories'); }, unit: 'kcal', get: (d) => d.calories, base: 'calories', good: 0, fmt: (v) => num(Math.round(v)), total: true },
  azm: { get name() { return t('vAzm'); }, unit: 'min', get: (d) => d.azm?.total, base: 'azm', good: 1, fmt: (v) => Math.round(v), total: true },
};

export function renderVitals(day, ctx, hidden, issues) {
  const wrap = $('#tiles');
  const keys = Object.keys(VITAL_DEFS).filter((k) => !hidden.includes(k));
  const have = [...wrap.children].map((c) => c.dataset.k).join();
  if (have !== keys.join() || !keys.length) {
    wrap.replaceChildren(...keys.map((k) => h('article', { class: 'tile', 'data-k': k },
      h('h3', { text: VITAL_DEFS[k].name, 'data-help': `vital-${k}` }), h('p', { class: 't-num' }, h('span', { class: 'v' }), h('small', { text: VITAL_DEFS[k].unit })),
      h('p', { class: 't-delta' }), h('div', { class: 't-spark' }))));
    if (!keys.length) wrap.append(h('article', { class: 'tile' }, h('p', { class: 'empty', text: t('allOff') })));
  }
  const idx = ctx.days.findIndex((d) => d.date === day.date);
  const span = ctx.days.slice(Math.max(0, idx - 13), idx + 1);
  for (const k of keys) {
    const def = VITAL_DEFS[k], tile = $(`[data-k="${k}"]`, wrap), v = def.get(day), numEl = $('.v', tile), delta = $('.t-delta', tile);
    const b = def.base ? day.baseline[def.base] : null;
    // after a language switch: the heading's first child is its text, the "?" button follows it
    const head = $('h3', tile);
    if (head.firstChild?.nodeType === 3) head.firstChild.nodeValue = def.name;
    $('.t-num small', tile).textContent = def.unit;
    const setDelta = () => {
      delta.className = 't-delta';
      if (!isNum(v)) {
        const bad = issues.find((i) => !i.ok && TYPE_OF[k] === i.type);
        delta.textContent = bad ? (bad.status === 403 ? t('notShared') : t('couldNotLoad', { why: bad.status || t('network') })) : day.partial && !def.total ? t('afterSync') : t('noReading');
        return;
      }
      if (k === 'spo2' && isNum(day.spo2.min)) { delta.textContent = t('range', { lo: num(day.spo2.min, 1), hi: isNum(day.spo2.max) ? num(day.spo2.max, 1) : '–' }); return; }
      if (k === 'azm') { delta.textContent = t('azm', { mod: day.azm.fatBurn, vig: day.azm.cardio + day.azm.peak }); return; }
      if (!b || !isNum(b.mean)) { delta.textContent = k === 'skinTemp' ? t('own30') : t('building'); return; }
      const diff = v - b.mean, small = Math.abs(diff) < Math.max(10 ** -(def.digits || 0) / 2, Math.abs(b.mean) * 0.01);
      const tone = small || !def.good ? 'flat' : (diff > 0) === (def.good > 0) ? 'up' : 'down';
      delta.classList.add(tone);
      const amount = def.total ? num(Math.round(Math.abs(diff))) : num(Math.abs(diff), def.digits || 0);
      delta.textContent = small ? t('level') : `${diff > 0 ? '▲' : '▼'} ${amount} ${def.total && day.partial ? t('vsFull') : t('vsUsual')}`;
    };
    if (isNum(v)) roll(numEl, v, { format: def.fmt, dur: 700 }); else { numEl.textContent = '–'; numEl._v = null; }
    setDelta();
    const vals = span.map((d) => def.get(d));
    sparkline($('.t-spark', tile), vals, {
      baseline: b?.mean, labels: span.map((d) => dayName(d.date)),
      onRead: (val, label) => {
        if (val == null) { if (isNum(v)) numEl.textContent = def.fmt(v); else numEl.textContent = '–'; setDelta(); return; }
        numEl.textContent = def.fmt(val); delta.className = 't-delta'; delta.textContent = label;
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
  $('#trends-lede').innerHTML = done.length < 3 ? t('trendsFew')
    : t('trendsLede', { n: done.length, end: dayName(end), s: one(strain), r: isNum(rec) ? Math.round(rec) + '%' : '–', over });
  $('#averages').replaceChildren(
    h('div', {}, h('dt', { text: t('avgStrain'), 'data-help': 'strain' }), h('dd', { text: one(strain) })),
    h('div', {}, h('dt', { text: t('avgRecovery'), 'data-help': 'recovery' }), h('dd', {}, isNum(rec) ? Math.round(rec) : '–', h('small', { text: '%' }))),
    h('div', {}, h('dt', { text: t('avgSleep'), 'data-help': 'avgsleep' }), h('dd', { text: isNum(sleep) ? fmtDur(sleep) : '–' })),
    h('div', {}, h('dt', { text: t('avgRhr'), 'data-help': 'vital-rhr' }), h('dd', {}, isNum(rhr) ? Math.round(rhr) : '–', h('small', { text: 'bpm' }))));
}
