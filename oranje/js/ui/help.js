// Short explanations behind the small "?" buttons, in English and Dutch.
// Any element with data-help="key" gets a button; one shared popover shows
// the text in the current language. On phones the popover sits above the
// tab bar, where the thumb is.

import { getLang, strings } from '../i18n.js';
import { h } from './motion.js?v=11';

const ui = strings({
  en: { close: 'Close', label: 'Explain: {title}', tip: 'What does this mean?' },
  nl: { close: 'Sluiten', label: 'Uitleg: {title}', tip: 'Wat betekent dit?' },
});

export const HELP_TEXT = {
  en: {
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
  asleep: ['Asleep', ['How long you actually slept, not counting the times you lay awake.']],
  inbed: ['Time in bed', ['From the moment your band saw you settle down to sleep until you got up, including time awake.']],
  efficiency: ['Asleep while in bed', ['How much of your time in bed you actually slept. Around 85–95% is good; lower means a lot of lying awake, which lowers your sleep score.']],
  restorative: ['Deep and REM', ['How much of your sleep was deep or REM sleep, the two stages in which you recover most. Around 40% makes a good night.']],
  owed: ['Still owed', ['How much sleep you are still short of what you needed. Part of it is added to the next night\'s need.']],
  avgsleep: ['Average sleep', ['How long you slept per night on average over the chosen period.']],
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
  },
  nl: {
  strain: ['Strain', [
    'Hoe hard je hart vandaag heeft gewerkt, op een schaal van 0 tot 21.',
    'Elke minuut dat je hartslag boven 30% van je werkbereik zit (van rusthartslag tot maximale hartslag) telt mee, en zware minuten tellen veel zwaarder dan rustige. Bovenaan loopt de schaal steeds langzamer op: van 18 naar 19 kost veel meer dan van 5 naar 6.',
    'Ter indruk: een uur wandelen ≈ 6,5, een uur hardlopen ≈ 12, een marathon ≈ 20. Onder 10 is licht, 10–14 gemiddeld, 14–18 zwaar en vanaf 18 alles gegeven.',
    'Is WHOOP gekoppeld, dan zie je de strain van WHOOP zelf. Anders is het de schatting van Oranje op basis van je Fitbit-hartslag.',
  ]],
  recovery: ['Herstel', [
    'Hoe klaar je lichaam vandaag is voor inspanning, van 0 tot 100%.',
    'Elke ochtend vergelijkt Oranje je hartslagvariabiliteit van afgelopen nacht (die telt voor de helft), je rusthartslag, je slaap en je ademhaling met je eigen laatste 30 dagen. Beter dan normaal duwt de score omhoog, slechter trekt hem omlaag.',
    'Vanaf 67%: hersteld. 34–66%: stabiel. Onder 34%: uitgeput. De app heeft drie nachten nodig om te leren wat normaal is voor jou.',
    'Is WHOOP gekoppeld, dan zie je het herstel van WHOOP zelf.',
  ]],
  sleep: ['Slaap', [
    'Hoeveel van de slaap die je nodig had je echt hebt gekregen, van 0 tot 100%.',
    'De score gaat tot 30% omlaag als de nacht onrustig was, er weinig diepe slaap en REM-slaap in zat, of je op een ongewoon tijdstip sliep. Je slaapbehoefte begint bij 7 u 36 m en wordt groter na een zware dag of als je nog slaap tekortkomt van de nacht ervoor.',
    'Vanaf 85%: goed uitgerust. 70–84%: genoeg. Onder 70%: te kort.',
    'Is WHOOP gekoppeld, dan zie je de slaapscore van WHOOP zelf.',
  ]],
  target: ['Doel van vandaag', [
    'De strain waarmee je traint zonder jezelf te slopen, gebaseerd op je herstel van vanochtend.',
    'Hoe beter je hersteld bent, hoe hoger het doel: onder ongeveer 10 als je uitgeput bent, rond 13–15 als je hersteld bent, en hoger op hele goede ochtenden. Het vakje is het doel; het oranje streepje is waar je nu staat.',
    'Eindig je binnen het doel, dan levert dat de meeste meters op in de klim.',
  ]],
  day: ['De dag, slag voor slag', [
    'Je hartslag minuut voor minuut, van middernacht tot middernacht.',
    'De labels rechts zijn je hartslagzones. De stippellijn laat zien hoe je strain door de dag heen oploopt, het gekleurde vlak is slaap en de gemarkeerde blokken zijn trainingen.',
    'Beweeg je vinger of muis over de grafiek om elk moment af te lezen.',
  ]],
  vitals: ['Lichaamswaarden', [
    'Elke meting die je band doet, met een klein lijntje van de laatste twee weken.',
    'De regel onder het getal vergelijkt vandaag met wat normaal is voor jou. Met "Kies wat je ziet" verberg je de waarden die je niet interesseren.',
  ]],
  trends: ['Strain tegenover herstel', [
    'De staven zijn de strain van elke dag, de lijn is het herstel van die ochtend.',
    'Let op het patroon: als zware dagen steeds gevolgd worden door een laag herstel, train je harder dan je herstelt. Tik op een dag om die te openen.',
  ]],
  'vital-rhr': ['Rusthartslag', ['Je laagste stabiele hartslag, gemeten terwijl je slaapt. Lager dan normaal is meestal een goed teken; een sprong van 5 slagen of meer komt vaak door stress, alcohol, een zware dag of een opkomende verkoudheid.']],
  'vital-hrv': ['Hartslagvariabiliteit (HRV)', ['De kleine verschillen in tijd tussen je hartslagen, gemeten tijdens je slaap, in milliseconden. Hoger dan je eigen normaal betekent dat je lichaam ontspannen is en herstelt. Vergelijk het alleen met jezelf: normale waarden verschillen sterk per persoon.']],
  'vital-spo2': ['Zuurstof in je bloed', ['Hoeveel zuurstof je bloed meedraagt, gemiddeld over de nacht. Bij de meeste mensen is dat 95–100%. Herhaaldelijk lage nachten zijn het bespreken met een arts waard.']],
  'vital-br': ['Ademhaling', ['Het aantal ademhalingen per minuut tijdens je slaap. Dat is bij de meeste mensen heel stabiel, dus een duidelijke stijging boven je normaal kan een vroeg teken van ziekte zijn.']],
  'vital-skinTemp': ['Huidtemperatuur', ['Hoeveel warmer of kouder je huid afgelopen nacht was dan normaal, in °C. Kleine schommelingen zijn gewoon; een sprong van meer dan ongeveer een halve graad komt vaak door ziekte, alcohol of je menstruatiecyclus.']],
  'vital-vo2max': ['Conditie (VO₂ max)', ['Een schatting van je VO₂ max: hoeveel zuurstof je lichaam bij maximale inspanning kan gebruiken. Hoger betekent fitter. Het verandert langzaam, over weken training.']],
  'vital-steps': ['Stappen', ['Het aantal stappen van vandaag. De regel eronder vergelijkt het met een normale volle dag.']],
  'vital-distance': ['Afstand', ['Hoe ver je vandaag bent gekomen, in kilometers, op basis van je stappen en eventuele trainingen.']],
  'vital-calories': ['Verbruikte energie', ['Alles wat je lichaam vandaag heeft verbrand, ook wat het in rust verbruikt. Het grootste deel is rustverbruik, dus het is nooit nul.']],
  'vital-azm': ['Zoneminuten', ['Minuten waarin je hartslag in de vetverbrandings-, cardio- of piekzone zat, zoals Fitbit ze telt. Het gezondheidsadvies is 150 per week, ongeveer 22 per dag.']],
  asleep: ['Geslapen', ['Hoe lang je echt sliep, zonder de momenten dat je wakker lag.']],
  inbed: ['Tijd in bed', ['Van het moment dat je band zag dat je ging slapen tot je opstond, inclusief wakker liggen.']],
  efficiency: ['Geslapen terwijl je in bed lag', ['Welk deel van je tijd in bed je echt sliep. Rond 85–95% is goed; lager betekent veel wakker liggen, en dat haalt je slaapscore omlaag.']],
  restorative: ['Diep en REM', ['Welk deel van je slaap diepe slaap of REM-slaap was, de twee fases waarin je het meest herstelt. Rond 40% is een goede nacht.']],
  owed: ['Nog tekort', ['Hoeveel slaap je nog tekortkomt ten opzichte van wat je nodig had. Een deel daarvan komt bij je slaapbehoefte van de volgende nacht.']],
  avgsleep: ['Gemiddelde slaap', ['Hoe lang je gemiddeld per nacht sliep in de gekozen periode.']],
  zones: ['Tijd in elke zone', [
    'Hoe lang je hartslag vandaag in elke zone zat, van rustig tot maximaal, en hoeveel elke zone aan je strain heeft bijgedragen.',
    'Zones zijn een deel van je hartslagbereik, tussen rust en maximaal: Rustig 30–45%, Duur 45–60%, Tempo 60–72%, Zwaar 72–85%, Max boven 85%. Onder 30% telt niet mee voor strain.',
  ]],
  sessions: ['Trainingen', ['De trainingen die je band vandaag heeft opgenomen, met de strain die elke training op zichzelf opleverde.']],
  curve: ['Waarom de laatste punten het zwaarst zijn', ['Strain stijgt niet in een rechte lijn. De eerste punten komen snel; elk volgend punt kost meer moeite dan het vorige. De stip laat zien waar je vandaag op de curve staat.']],
  aim: ['Wat vandaag aankan', ['Je strain-doel voor vandaag en hoeveel er nog te gaan is. Het volgt uit je herstel van vanochtend.']],
  normal: ['Tegenover je eigen normaal', ['Waar je herstel van vanochtend uit bestaat. Elke balk laat zien hoe ver een meting van je 30-daagse gemiddelde af zit. Balken naar rechts hielpen je herstel, balken naar links kostten herstel. Grotere balken telden zwaarder.']],
  stages: ['Fase voor fase', ['Hoe je nacht wisselde tussen wakker, REM-slaap, lichte en diepe slaap. Diepe slaap herstelt je lichaam en komt vooral vroeg in de nacht; REM-slaap, voor je hoofd, komt meer tegen de ochtend.']],
  nightsplit: ['Waar de nacht heen ging', ['De tijd in elke slaapfase. Als vuistregel zijn diepe slaap en REM-slaap samen ongeveer 40% van een goede nacht.']],
  need: ['Geslapen tegenover nodig', ['Hoe lang je sliep vergeleken met wat afgelopen nacht nodig was: een basis van 7 u 36 m, meer na een zware dag, plus een deel van de slaap die je nog tekortkwam.']],
  bedtimes: ['Bed- en wektijden', ['Wanneer je in slaap viel en wakker werd, de afgelopen week. Vaste tijden helpen je slaapscore; een nacht ver van je gewone tijden haalt hem omlaag.']],
  climb: ['De klim', [
    'Een klein spel. Goede dagen leveren meters op, en zo klim je van de Zuidplaspolder, het laagste punt van Nederland, richting de Alpe d\'Huez.',
    'Je verdient meters door binnen je strain-doel te trainen, goed te slapen, genoeg te bewegen en de band \'s nachts te dragen. Onderweg kom je bekende toppen tegen.',
  ]],
  profile: ['Vanuit de polder', ['Elke helling is één dag: hoe meer meters die dag opleverde, hoe steiler en feller. Vlaggetjes markeren de toppen die je hebt gehaald. Tik op een dag om te zien wat die opleverde.']],
  earn: ['Wat deze dag oplevert', ['Wat deze dag in de klim oplevert, en wat nog open staat. Binnen je doel: 12 m (er dichtbij: 5 m). 85%+ geslapen: 8 m (70%+: 4 m). 22+ zoneminuten: 4 m. Band \'s nachts gedragen: 2 m. Meerdere dagen achter elkaar binnen je doel geven een bonus van maximaal 5 m.']],
  streaks: ['Reeksen', ['Hoeveel dagen op rij je elke gewoonte haalde, met je beste reeks. De bolletjes zijn de laatste twee weken.']],
  medals: ['Medailles', ['Acht Hollandse uitdagingen, van vier dagen op rij 12.000 stappen (Vierdaagse) tot een strain van 18 of meer (Oranjeboven). De ring om elke medaille loopt vol naarmate je dichterbij komt.']],
  },
};
const entry = (key) => HELP_TEXT[getLang()]?.[key] || HELP_TEXT.en[key];

let pop, current = null;

function build() {
  pop = h('div', { class: 'help-pop', id: 'help-pop', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'help-title', hidden: true, tabindex: '-1' },
    h('div', { class: 'help-head' },
      h('h4', { id: 'help-title' }),
      h('button', { class: 'help-close', type: 'button', 'aria-label': ui('close'), onclick: () => close(true) },
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
  const [title, body] = entry(btn.dataset.helpKey) || [];
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
  const title = entry(key)?.[0] || key;
  return h('button', {
    class: 'help-btn', type: 'button', 'data-help-key': key, 'aria-label': ui('label', { title }),
    'aria-expanded': 'false', 'aria-controls': 'help-pop', title: ui('tip'),
    onclick: (e) => { e.preventDefault(); e.stopPropagation(); if (current === e.currentTarget) close(true); else open(e.currentTarget); },
  }, '?');
}

// Add a "?" to every [data-help] element that does not have one yet.
export function initHelp(root = document) {
  if (!pop) build();
  for (const el of root.querySelectorAll('[data-help]')) {
    const btn = el.querySelector(':scope > .help-btn');
    if (!btn) { el.append(helpButton(el.dataset.help)); continue; }
    // after a language switch: the label follows the language
    btn.setAttribute('aria-label', ui('label', { title: entry(el.dataset.help)?.[0] || el.dataset.help }));
    btn.title = ui('tip');
  }
  pop.querySelector('.help-close').setAttribute('aria-label', ui('close'));
  if (current) open(current);
}
