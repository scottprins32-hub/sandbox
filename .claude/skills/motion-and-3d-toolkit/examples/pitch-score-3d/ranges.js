/* Pitch ranges: the swing-score structure seen in a phone-to-3D swing app (a card per phase, green/yellow, one cue,
   a 0-100 score with phase bars), filled with the reference ranges Motion Studio uses for pitching (biomech.py REFERENCES).
   Input: Motion Studio biomech metrics. Output: cards, phase scores and an overall score that only counts what could be
   judged at the recording's frame rate. Works in the browser (window.PitchRanges) and in Node (module.exports). */
(function (root) {
  'use strict';
  // minFps per phase is this engine's judgement, not Motion Studio's: Motion Studio declines the whole read-out below 45 fps.
  var PHASES = [
    { id: 'stride', label: 'Stride', moment: 'FOOT CONTACT', minFps: 25, why: 'the front foot is planted and moves slowly' },
    { id: 'rotation', label: 'Rotation', moment: 'FOOT CONTACT', minFps: 25, why: 'pelvis and trunk turn slower than the arm' },
    { id: 'arm', label: 'Arm', moment: 'FOOT CONTACT', minFps: 45, why: 'the arm is already moving fast; Motion Studio asks for 45 fps or more' },
    { id: 'release', label: 'Release', moment: 'RELEASE', minFps: 100, why: 'the arm travels tens of centimetres between frames below about 100 fps' }];
  var METRICS = {
    stride_length_pct: { phase: 'stride', title: 'Stride length', unit: '% of height', max: 120,
      cue: { low: 'Push the stride a little further down the mound.', ok: 'Stride length sits in the usual range.', high: 'A slightly shorter stride lets the front side block.' } },
    lead_knee_flexion_fc: { phase: 'stride', title: 'Front knee at landing', unit: '°', max: 90,
      cue: { low: 'Land with a little more bend in the front knee.', ok: 'Front knee lands with a usual amount of bend.', high: 'Land a little firmer on the front leg.' } },
    separation_fc: { phase: 'rotation', title: 'Hip-shoulder separation', unit: '°', max: 90,
      cue: { low: 'Let the hips open while the chest stays closed a beat longer.', ok: 'Hips lead the shoulders by a usual amount.', high: 'Large separation; check the trunk still catches up.' } },
    shoulder_abduction_fc: { phase: 'arm', title: 'Shoulder abduction', unit: '°', max: 150,
      cue: { low: 'Get the elbow up toward shoulder height by foot contact.', ok: 'Elbow near shoulder height at foot contact.', high: 'Elbow sits above shoulder height at foot contact.' } },
    elbow_flexion_fc: { phase: 'arm', title: 'Elbow bend at landing', unit: '°', max: 180,
      cue: { low: 'The arm is fairly straight when the front foot lands.', ok: 'Elbow bend at foot contact is usual.', high: 'The elbow is tightly bent at foot contact.' } },
    trunk_forward_tilt_br: { phase: 'release', title: 'Trunk tilt at release', unit: '°', max: 90,
      cue: { low: 'Get over the front leg more at release.', ok: 'Trunk tilt at release is usual.', high: 'The trunk tilts far forward at release.' } },
    lead_knee_flexion_br: { phase: 'release', title: 'Front knee at release', unit: '°', max: 90,
      cue: { low: 'The front leg is already straight at release.', ok: 'Front knee at release is usual.', high: 'The front knee keeps bending into release; firm it up.' } },
    shoulder_abduction_br: { phase: 'release', title: 'Shoulder abduction at release', unit: '°', max: 150,
      cue: { low: 'Arm slot sits low relative to the trunk at release.', ok: 'Shoulder abduction at release is usual.', high: 'Arm sits high relative to the trunk at release.' } },
    elbow_flexion_br: { phase: 'release', title: 'Elbow bend at release', unit: '°', max: 90,
      cue: { low: 'Arm almost straight at release.', ok: 'Elbow bend at release is usual.', high: 'Elbow still bent at release.' } },
    max_external_rotation: { phase: 'release', title: 'Max external rotation', unit: '°', max: 210,
      cue: { low: 'Less layback than usual.', ok: 'Layback is in the usual range.', high: 'More layback than usual.' } }
  };
  var CLOSE = 0.25;
  var MIN_PHASES = 3;  // a total from fewer scored phases would hide most of the delivery, so none is given   // within a quarter of the range width outside it counts as "close" (yellow)
  function judge(value, low, high) {
    var width = high - low, dist = value < low ? low - value : (value > high ? value - high : 0);
    var score = Math.max(0, Math.round(100 - 100 * dist / width));
    var status = dist === 0 ? 'ok' : (dist <= CLOSE * width ? 'close' : 'out');
    return { dist: dist, score: score, status: status, side: value < low ? 'low' : (value > high ? 'high' : 'ok') };
  }
  function evaluate(metrics, fps) {
    var byKey = {}; (metrics || []).forEach(function (m) { byKey[m.key] = m; });
    var phases = PHASES.map(function (p) {
      var scored = fps >= p.minFps, cards = [];
      Object.keys(METRICS).forEach(function (k) {
        var def = METRICS[k], m = byKey[k];
        if (def.phase !== p.id || !m || !m.reference || typeof m.value !== 'number') return;
        var j = judge(m.value, m.reference.low, m.reference.high);
        cards.push({ key: k, phase: p.id, moment: p.moment, title: def.title, unit: def.unit, max: def.max, value: m.value, frame: m.frame,
          low: m.reference.low, high: m.reference.high, source: m.reference.source, scored: scored,
          status: scored ? j.status : 'na', score: scored ? j.score : null, cue: scored ? def.cue[j.side] : 'Not scored at ' + fps + ' fps: ' + p.why + '.' });
      });
      var s = cards.filter(function (c) { return c.scored; });
      return { id: p.id, label: p.label, moment: p.moment, scored: scored && s.length > 0, minFps: p.minFps, why: p.why, cards: cards,
        score: s.length ? Math.round(s.reduce(function (a, c) { return a + c.score; }, 0) / s.length) : null };
    });
    var sp = phases.filter(function (p) { return p.scored; });
    var partial = sp.length ? Math.round(sp.reduce(function (a, p) { return a + p.score; }, 0) / sp.length) : null;
    return { fps: fps, phases: phases, overall: sp.length >= MIN_PHASES ? partial : null, partial: partial, scoredPhases: sp.length,
      reason: sp.length >= MIN_PHASES ? '' : sp.length + ' of ' + phases.length + ' phases scored; a total needs ' + MIN_PHASES,
      measures: sp.reduce(function (a, p) { return a + p.cards.length; }, 0), unscored: phases.filter(function (p) { return !p.scored; }).map(function (p) { return p.label; }) };
  }
  var api = { PHASES: PHASES, METRICS: METRICS, CLOSE: CLOSE, MIN_PHASES: MIN_PHASES, judge: judge, evaluate: evaluate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PitchRanges = api;
})(typeof window !== 'undefined' ? window : this);
