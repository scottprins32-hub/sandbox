// Short explanations behind the small "?" buttons. Any element with
// data-help="key" gets a button; one shared popover shows the text.
// On phones the popover sits above the tab bar, where the thumb is.

import { h } from './motion.js?v=9';

export const HELP = {
  strain: ['Strain', [
    'How hard your heart worked today, on a scale from 0 to 21.',
    'Every minute your heart rate is above 30% of its working range (from resting to maximum) adds to it, and hard minutes add far more than easy ones. The scale rises more slowly near the top: going from 18 to 19 takes much more than going from 5 to 6.',
    'Rough guide: an hour\'s walk ≈ 6.5, an hour\'s run ≈ 12, a marathon ≈ 20. Light is below 10, moderate 10–14, high 14–18, all out 18 and up.',
    'With WHOOP connected you see WHOOP\'s own strain. Otherwise it is Oranje\'s estimate from your Fitbit heart rate.',
  ]],
  recovery: ['Recovery', [
    'How ready your body is today, from 0 to 100%.',
    'Each morning Oranje compares last night\'s heart-rate variability (half the weight), resting heart rate, sleep and breathing rate with your own last 30 days. Better than your normal pushes it up; worse pulls it down.',
    '67% and up: recovered. 34–66%: steady. Below 34%: run down. It needs three nights of wear to learn your normal.',
    'With WHOOP connected you see WHOOP\'s own recovery.',
  ]],
  sleep: ['Sleep', [
    'How much of the sleep you needed you actually got, from 0 to 100%.',
    'It is marked down by up to 30% when the night was restless, short on deep and REM sleep, or at an unusual time. Your need starts at 7 h 36 m and grows after a hard day, or when you still owe sleep from the night before.',
    '85% and up: well rested. 70–84%: enough. Below 70%: short.',
    'With WHOOP connected you see WHOOP\'s own sleep score.',
  ]],
  target: ['Today\'s target', [
    'The strain that trains you without digging a hole, based on this morning\'s recovery.',
    'The better you recovered, the higher the range: below about 10 when run down, around 13–15 when recovered, more on great mornings. The box is the range; the orange line is where you are now.',
    'Finishing inside it earns the most metres in the climb.',
  ]],
  day: ['Heart rate through the day', [
    'Your heart rate minute by minute, from midnight to midnight.',
    'The labels on the right mark your heart-rate zones. The dashed line shows strain building up through the day, the shaded part is sleep, and the marked blocks are workouts.',
    'Move your finger or mouse across it to read any moment.',
  ]],
  vitals: ['Vitals', [
    'Each measurement your band takes, with its last two weeks as a small line.',
    'The line under the number compares today with your usual. Choose what shows here hides the ones you do not care about.',
  ]],
  trends: ['Strain against recovery', [
    'Bars are each day\'s strain, the line is that morning\'s recovery.',
    'Look for the pattern: hard days followed by low recovery mean you are pushing more than you recover from. Tap a day to open it.',
  ]],
  'vital-rhr': ['Resting heart rate', ['Your lowest steady heart rate, measured while you sleep. Lower than your usual is usually a good sign; a jump of 5 or more beats often means stress, alcohol, a hard day or a cold coming on.']],
  'vital-hrv': ['Heart-rate variability', ['The tiny differences in time between heartbeats, measured during sleep, in milliseconds. Higher than your own normal means your body is relaxed and recovering. Compare it only with yourself: normal values differ a lot between people.']],
  'vital-spo2': ['Blood oxygen', ['How much oxygen your blood carries, averaged over the night. Most people sit around 95–100%. Repeated low nights are worth mentioning to a doctor.']],
  'vital-br': ['Breathing rate', ['Breaths per minute while you sleep. It stays very steady for most people, so a clear rise above your usual can be an early sign of illness.']],
  'vital-skinTemp': ['Skin temperature', ['How much warmer or cooler your skin was last night than your usual, in °C. Small changes are normal; a jump of more than about half a degree often comes with illness, alcohol or the menstrual cycle.']],
  'vital-vo2max': ['Cardio fitness', ['An estimate of VO₂ max: how much oxygen your body can use at full effort. Higher is fitter. It changes slowly, over weeks of training.']],
  'vital-steps': ['Steps', ['Steps counted today. The line compares them with a usual full day.']],
  'vital-distance': ['Distance', ['How far you moved today, in kilometres, from your steps and any recorded workouts.']],
  'vital-calories': ['Energy burned', ['Everything your body burned today, including what it burns at rest. Most of it is resting energy, so it is never zero.']],
  'vital-azm': ['Zone minutes', ['Minutes with your heart rate in the fat-burn, cardio or peak zone, as counted by Fitbit. The health guideline is 150 a week, about 22 a day.']],
  zones: ['Time in each zone', [
    'How long your heart rate spent in each zone today, from easy to max, and how much each zone added to your strain.',
    'Zones are a share of your heart-rate range, between resting and maximum: easy 30–45%, steady 45–60%, tempo 60–72%, hard 72–85%, max above 85%. Below 30% adds nothing to strain.',
  ]],
  sessions: ['Sessions', ['Workouts your band recorded today, with the strain each one added on its own.']],
  curve: ['Why the last points are the hardest', ['Strain does not rise in a straight line. The first points come quickly; each next point needs more effort than the one before. The dot is where you are on the curve today.']],
  aim: ['What today can take', ['Your strain target for today, with how much is still to go. It comes from this morning\'s recovery.']],
  normal: ['Against your own normal', ['What made this morning\'s recovery. Each bar shows how far a measurement sits from your 30-day average. Bars to the right helped recovery, bars to the left cost it. Bigger bars mattered more.']],
  stages: ['Stage by stage', ['How your night moved between awake, REM, light and deep sleep. Deep sleep repairs the body and mostly comes early in the night; REM sleep, for the mind, comes more towards morning.']],
  nightsplit: ['Where the night went', ['Time spent in each sleep stage. As a rough guide, deep and REM together make up about 40% of a good night.']],
  need: ['Had against needed', ['How long you slept compared with what last night called for: a base of 7 h 36 m, more after a hard day, and part of any sleep you still owed.']],
  bedtimes: ['Bed and wake times', ['When you fell asleep and woke up over the last week. Steady times help your sleep score; a night far from your usual timing lowers it.']],
  climb: ['The climb', [
    'A small game. Good days earn metres, climbing from the Zuidplaspolder, the lowest point of the Netherlands, towards the Alpe d\'Huez.',
    'You earn by training inside your strain target, sleeping well, moving enough and wearing the band at night. Landmarks on the way unlock as you pass them.',
  ]],
  profile: ['From the polder', ['Each slope is one day: the more metres it earned, the steeper and brighter. Flags mark the landmarks you reached. Tap a day to see how it scored.']],
  earn: ['Today so far', ['What this day earned in the climb, and what is still open. Inside your target: 12 m (close to it: 5 m). Slept 85%+: 8 m (70%+: 4 m). 22+ zone minutes: 4 m. Band worn at night: 2 m. Days in a row inside your target add a bonus of up to 5 m.']],
  streaks: ['Streaks', ['How many days in a row you hit each habit, with your best run. The dots are the last two weeks.']],
  medals: ['Medals', ['Eight Dutch-themed challenges, from four days of 12,000 steps (Vierdaagse) to a strain of 18 or more (Oranjeboven). The ring around each medal fills as you get closer.']],
};

let pop, current = null;

function build() {
  pop = h('div', { class: 'help-pop', id: 'help-pop', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'help-title', hidden: true, tabindex: '-1' },
    h('div', { class: 'help-head' },
      h('h4', { id: 'help-title' }),
      h('button', { class: 'help-close', type: 'button', 'aria-label': 'Close', onclick: () => close(true) },
        h('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, h('path', { d: 'M6 6l12 12M18 6 6 18' })))),
    h('div', { class: 'help-body' }));
  document.body.append(pop);
  document.addEventListener('pointerdown', (e) => { if (current && !pop.contains(e.target) && !e.target.closest('.help-btn')) close(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && current) close(true); });
  window.addEventListener('resize', () => { if (current) place(current); });
  window.addEventListener('hashchange', () => close(false));
}

function place(btn) {
  if (window.matchMedia('(max-width: 720px)').matches) { pop.style.left = pop.style.top = ''; pop.classList.add('sheet'); return; }
  pop.classList.remove('sheet');
  const r = btn.getBoundingClientRect(), w = pop.offsetWidth, hgt = pop.offsetHeight, m = 12;
  let left = Math.min(Math.max(m, r.left + r.width / 2 - w / 2), window.innerWidth - w - m);
  let top = r.bottom + 8;
  if (top + hgt > window.innerHeight - m) top = Math.max(m, r.top - hgt - 8);
  pop.style.left = `${left}px`; pop.style.top = `${top}px`;
}

function open(btn) {
  const [title, body] = HELP[btn.dataset.helpKey] || [];
  if (!title) return;
  if (current) current.setAttribute('aria-expanded', 'false');
  current = btn;
  btn.setAttribute('aria-expanded', 'true');
  pop.querySelector('#help-title').textContent = title;
  pop.querySelector('.help-body').replaceChildren(...body.map((t) => h('p', { text: t })));
  pop.hidden = false;
  place(btn);
  requestAnimationFrame(() => pop.classList.add('on'));
  pop.focus({ preventScroll: true });
}

function close(returnFocus) {
  if (!current) return;
  const btn = current;
  current = null;
  btn.setAttribute('aria-expanded', 'false');
  pop.classList.remove('on');
  pop.hidden = true;
  if (returnFocus) btn.focus({ preventScroll: true });
}

export function helpButton(key) {
  const title = HELP[key]?.[0] || key;
  return h('button', {
    class: 'help-btn', type: 'button', 'data-help-key': key, 'aria-label': `What is ${title.toLowerCase().startsWith('what') ? title : `“${title}”`}?`,
    'aria-expanded': 'false', 'aria-controls': 'help-pop', title: 'What does this mean?',
    onclick: (e) => { e.preventDefault(); e.stopPropagation(); if (current === e.currentTarget) close(true); else open(e.currentTarget); },
  }, '?');
}

// Add a "?" to every [data-help] element that does not have one yet.
export function initHelp(root = document) {
  if (!pop) build();
  for (const el of root.querySelectorAll('[data-help]')) {
    if (el.querySelector(':scope > .help-btn')) continue;
    el.append(helpButton(el.dataset.help));
  }
}
