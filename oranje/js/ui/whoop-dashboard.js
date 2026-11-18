import { fmtDur, isNum } from '../core/util.js';
import { $, $$, h } from './motion.js?v=8';

const number = (value, digits = 0, unit = '') => isNum(value) ? `${value.toFixed(digits)}${unit}` : '–';

function card(title, ...children) {
  return h('article', { class: 'card span-6' }, h('h3', { text: title }), children);
}

function metrics(values) {
  return h('dl', { class: 'wearable-metrics' }, values.flatMap(([label, value]) => [
    h('dt', { text: label }), h('dd', { text: value }),
  ]));
}

function workouts(items) {
  if (!items.length) return h('p', { class: 'empty', text: 'WHOOP did not report any workouts for this cycle.' });
  return h('ol', { class: 'sessions' }, items.map((item) => h('li', {},
    h('span', { class: 's-name', text: item.name }),
    h('span', { class: 's-strain', text: number(item.strain, 1) }),
    h('span', { class: 's-meta', text: [
      isNum(item.minutes) ? fmtDur(item.minutes) : null,
      isNum(item.averageHeartRate) ? number(item.averageHeartRate, 0, ' bpm avg.') : null,
    ].filter(Boolean).join(' · ') }),
  )));
}

export function renderWhoopDashboard(day) {
  const resting = number(day.restingHeartRate, 0, ' bpm');
  const hrv = number(day.hrv, 0, ' ms');
  const average = number(day.averageHeartRate, 0, ' bpm');
  const sleep = fmtDur(day.sleepMinutes);
  $('#whoop-overview').replaceChildren(h('h3', { text: 'Vitals' }), metrics([
    ['Resting heart rate', resting], ['HRV', hrv], ['Average heart rate', average], ['Time asleep', sleep],
  ]));
  $('#whoop-strain-details').replaceChildren(
    card('Day strain', h('p', { class: 'big', text: number(day.strain, 1) }),
      metrics([['Average heart rate', average]])),
    card('Workouts', workouts(day.workouts || [])),
    h('p', { class: 'note span-12', text: 'WHOOP shares heart rate averages for this view. Continuous heart rate and time-in-zone charts are unavailable.' }),
  );
  $('#whoop-recovery-details').replaceChildren(
    card('Recovery score', h('p', { class: 'big', text: number(day.recovery, 0, '%') })),
    card('Recovery metrics', metrics([['Resting heart rate', resting], ['HRV', hrv]])),
  );
  $('#whoop-sleep-details').replaceChildren(
    card('Sleep score', h('p', { class: 'big', text: number(day.sleep, 0, '%') })),
    card('Sleep duration', h('p', { class: 'big', text: sleep })),
  );
}

export function clearWhoopDetails() {
  $$('[data-whoop-data]').forEach((el) => el.replaceChildren());
}
