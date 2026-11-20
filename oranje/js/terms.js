// The app's own words, in one place, so every view names things the same way.
// js/core keeps English ids (Light, Recovered, Tempo …); these turn them into
// the reader's language at the moment they are shown.

import { strings } from './i18n.js';
import { isNum } from './core/util.js';

export const term = strings({
  en: {
    today: 'Today', strain: 'Strain', recovery: 'Recovery', sleep: 'Sleep', climb: 'Climb',
    Light: 'Light', Moderate: 'Moderate', High: 'High', 'All out': 'All out',
    Recovered: 'Recovered', Steady: 'Steady', 'Run down': 'Run down',
    wellRested: 'Well rested', enough: 'Enough', short: 'Short',
    zoneRest: 'Resting', zoneEasy: 'Easy', zoneSteady: 'Steady', zoneTempo: 'Tempo', zoneHard: 'Hard', zoneMax: 'Max',
    deep: 'Deep', light: 'Light', rem: 'REM', wake: 'Awake',
    whoop: 'WHOOP', oranje: 'Oranje estimate',
  },
  nl: {
    today: 'Vandaag', strain: 'Strain', recovery: 'Herstel', sleep: 'Slaap', climb: 'Klim',
    Light: 'Licht', Moderate: 'Gemiddeld', High: 'Zwaar', 'All out': 'Alles gegeven',
    Recovered: 'Hersteld', Steady: 'Stabiel', 'Run down': 'Uitgeput',
    wellRested: 'Goed uitgerust', enough: 'Genoeg', short: 'Te kort',
    zoneRest: 'Rust', zoneEasy: 'Rustig', zoneSteady: 'Duur', zoneTempo: 'Tempo', zoneHard: 'Zwaar', zoneMax: 'Max',
    deep: 'Diep', light: 'Licht', rem: 'REM', wake: 'Wakker',
    whoop: 'WHOOP', oranje: 'Schatting Oranje',
  },
});

// strain band object from core/strain.js (or its English name) → shown name
export const bandName = (band) => (band ? term(typeof band === 'string' ? band : band.name) : '');
// recovery % → Recovered / Steady / Run down
export const recoveryName = (r) => (!isNum(r) ? '' : term(r >= 67 ? 'Recovered' : r >= 34 ? 'Steady' : 'Run down'));
// sleep % → Well rested / Enough / Short
export const sleepName = (s) => (!isNum(s) ? '' : term(s >= 85 ? 'wellRested' : s >= 70 ? 'enough' : 'short'));
// zone object from core/strain.js ZONES (id 0–5) → shown name
export const zoneName = (z) => term(['zoneRest', 'zoneEasy', 'zoneSteady', 'zoneTempo', 'zoneHard', 'zoneMax'][z.id] || 'zoneRest');
// sleep stage key (deep, light, rem, wake) → shown name
export const stageName = (s) => term(s);
