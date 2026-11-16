/* Attractor score: the nine attractors of the programme as cards, each scored on this demo's proxy and starting range.
   A card is only scored when the proxy is measurable and the frame rate can resolve it; no total below MIN_SCORED.
   Browser: window.AttractorScore. Node: module.exports. */
(function (root) {
  'use strict';
  var CLOSE = 0.25, MIN_SCORED = 5;
  function judge(a) {
    if (a.kind === 'count') { var s = Math.round(100 * a.value / a.high); return { score: s, status: a.value >= a.high ? 'ok' : (a.value >= a.high - 1 ? 'close' : 'out') }; }
    var width = a.high - a.low, dist = a.value < a.low ? a.low - a.value : (a.value > a.high ? a.value - a.high : 0);
    return { score: Math.max(0, Math.round(100 - 100 * dist / width)), status: dist === 0 ? 'ok' : (dist <= CLOSE * width ? 'close' : 'out') };
  }
  function evaluate(list, fps) {
    var cards = (list || []).map(function (a) {
      var c = {}; Object.keys(a).forEach(function (k) { c[k] = a[k]; });
      if (!a.measurable) { c.status = 'nm'; c.score = null; c.note = 'Not measured: ' + a.why + '.'; }
      else if (fps < a.minFps) { c.status = 'na'; c.score = null; c.note = 'Not scored at ' + fps + ' fps: this proxy needs ' + a.minFps + ' fps or more.'; }
      else { var j = judge(a); c.status = j.status; c.score = j.score; }
      return c;
    });
    var s = cards.filter(function (c) { return c.score !== null; });
    var partial = s.length ? Math.round(s.reduce(function (t, c) { return t + c.score; }, 0) / s.length) : null;
    return { fps: fps, cards: cards, scored: s.length, partial: partial, overall: s.length >= MIN_SCORED ? partial : null,
      reason: s.length >= MIN_SCORED ? '' : s.length + ' of ' + cards.length + ' attractors scored; a total needs ' + MIN_SCORED,
      unscored: cards.filter(function (c) { return c.score === null; }).map(function (c) { return c.key; }) };
  }
  var api = { CLOSE: CLOSE, MIN_SCORED: MIN_SCORED, judge: judge, evaluate: evaluate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AttractorScore = api;
})(typeof window !== 'undefined' ? window : this);
