// Korte uitleg achter de kleine "?"-knopjes, in het Nederlands. Elk element
// met data-help="sleutel" krijgt een knopje; één gedeelde popover toont de
// tekst. Op de telefoon staat die boven de tabbalk, waar je duim zit.
// De titels gebruiken dezelfde woorden als de app zelf (Strain, Recovery …),
// zodat je ziet waar de uitleg bij hoort.

import { h } from './motion.js?v=10';

export const HELP = {
  strain: ['Strain', [
    'Hoe hard je hart vandaag heeft gewerkt, op een schaal van 0 tot 21.',
    'Elke minuut dat je hartslag boven 30% van je werkbereik zit (van rusthartslag tot maximale hartslag) telt mee, en zware minuten tellen veel zwaarder dan rustige. Bovenaan loopt de schaal steeds langzamer op: van 18 naar 19 kost veel meer dan van 5 naar 6.',
    'Ter indruk: een uur wandelen ≈ 6,5, een uur hardlopen ≈ 12, een marathon ≈ 20. Onder 10 is licht (Light), 10–14 gemiddeld (Moderate), 14–18 zwaar (High) en vanaf 18 alles gegeven (All out).',
    'Is WHOOP gekoppeld, dan zie je de strain van WHOOP zelf. Anders is het de schatting van Oranje op basis van je Fitbit-hartslag.',
  ]],
  recovery: ['Recovery (herstel)', [
    'Hoe klaar je lichaam vandaag is voor inspanning, van 0 tot 100%.',
    'Elke ochtend vergelijkt Oranje je hartslagvariabiliteit van afgelopen nacht (die telt voor de helft), je rusthartslag, je slaap en je ademhaling met je eigen laatste 30 dagen. Beter dan normaal duwt de score omhoog, slechter trekt hem omlaag.',
    'Vanaf 67%: hersteld (Recovered). 34–66%: stabiel (Steady). Onder 34%: uitgeput (Run down). De app heeft drie nachten nodig om te leren wat normaal is voor jou.',
    'Is WHOOP gekoppeld, dan zie je de recovery van WHOOP zelf.',
  ]],
  sleep: ['Sleep (slaap)', [
    'Hoeveel van de slaap die je nodig had je echt hebt gekregen, van 0 tot 100%.',
    'De score gaat tot 30% omlaag als de nacht onrustig was, er weinig diepe slaap en REM-slaap in zat, of je op een ongewoon tijdstip sliep. Je slaapbehoefte begint bij 7 u 36 m en wordt groter na een zware dag of als je nog slaap tekortkomt van de nacht ervoor.',
    'Vanaf 85%: goed uitgerust (Well rested). 70–84%: genoeg (Enough). Onder 70%: te kort (Short).',
    'Is WHOOP gekoppeld, dan zie je de slaapscore van WHOOP zelf.',
  ]],
  target: ['Today\'s target (doel van vandaag)', [
    'De strain waarmee je traint zonder jezelf te slopen, gebaseerd op je recovery van vanochtend.',
    'Hoe beter je hersteld bent, hoe hoger het doel: onder ongeveer 10 als je uitgeput bent, rond 13–15 als je hersteld bent, en hoger op hele goede ochtenden. Het vakje is het doel; het oranje streepje is waar je nu staat.',
    'Eindig je binnen het doel, dan levert dat de meeste meters op in de klim.',
  ]],
  day: ['De dag, slag voor slag', [
    'Je hartslag minuut voor minuut, van middernacht tot middernacht.',
    'De labels rechts zijn je hartslagzones. De stippellijn laat zien hoe je strain door de dag heen oploopt, het gekleurde vlak is slaap en de gemarkeerde blokken zijn trainingen.',
    'Beweeg je vinger of muis over de grafiek om elk moment af te lezen.',
  ]],
  vitals: ['Vitals (lichaamswaarden)', [
    'Elke meting die je band doet, met een klein lijntje van de laatste twee weken.',
    'De regel onder het getal vergelijkt vandaag met wat normaal is voor jou. Met "Choose what shows" verberg je de waarden die je niet interesseren.',
  ]],
  trends: ['Strain tegenover recovery', [
    'De staven zijn de strain van elke dag, de lijn is de recovery van die ochtend.',
    'Let op het patroon: als zware dagen steeds gevolgd worden door een lage recovery, train je harder dan je herstelt. Tik op een dag om die te openen.',
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
    'Zones zijn een deel van je hartslagbereik, tussen rust en maximaal: Easy 30–45%, Steady 45–60%, Tempo 60–72%, Hard 72–85%, Max boven 85%. Onder 30% telt niet mee voor strain.',
  ]],
  sessions: ['Trainingen', ['De trainingen die je band vandaag heeft opgenomen, met de strain die elke training op zichzelf opleverde.']],
  curve: ['Waarom de laatste punten het zwaarst zijn', ['Strain stijgt niet in een rechte lijn. De eerste punten komen snel; elk volgend punt kost meer moeite dan het vorige. De stip laat zien waar je vandaag op de curve staat.']],
  aim: ['Wat vandaag aankan', ['Je strain-doel voor vandaag en hoeveel er nog te gaan is. Het volgt uit je recovery van vanochtend.']],
  normal: ['Tegenover je eigen normaal', ['Waar je recovery van vanochtend uit bestaat. Elke balk laat zien hoe ver een meting van je 30-daagse gemiddelde af zit. Balken naar rechts hielpen je herstel, balken naar links kostten herstel. Grotere balken telden zwaarder.']],
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
};

let pop, current = null;

function build() {
  pop = h('div', { class: 'help-pop', id: 'help-pop', lang: 'nl', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'help-title', hidden: true, tabindex: '-1' },
    h('div', { class: 'help-head' },
      h('h4', { id: 'help-title' }),
      h('button', { class: 'help-close', type: 'button', 'aria-label': 'Sluiten', onclick: () => close(true) },
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
    class: 'help-btn', type: 'button', 'data-help-key': key, 'aria-label': `Uitleg: ${title}`,
    'aria-expanded': 'false', 'aria-controls': 'help-pop', title: 'Wat betekent dit?',
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
