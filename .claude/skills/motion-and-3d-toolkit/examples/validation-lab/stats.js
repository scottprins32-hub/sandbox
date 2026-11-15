// Port of the deterministic statistics in estimated-motion-validation/scripts/motion_validate.py.
// Cross-checked against the Python output by crosscheck.mjs. The bootstrap is NOT ported: Python's random stream cannot be reproduced here.
(function (root) {
  function betacf(a, b, x) {
    var tiny = 1e-30, qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    d = 1 / (Math.abs(d) > tiny ? d : tiny); var h = d;
    for (var m = 1; m < 300; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; d = 1 / (Math.abs(d) > tiny ? d : tiny); c = 1 + aa / c; c = Math.abs(c) > tiny ? c : tiny; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; d = 1 / (Math.abs(d) > tiny ? d : tiny); c = 1 + aa / c; c = Math.abs(c) > tiny ? c : tiny;
      var delta = d * c; h *= delta; if (Math.abs(delta - 1) < 3e-12) break;
    }
    return h;
  }
  function lgamma(x) { var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5], y = x, t = x + 5.5; t -= (x + .5) * Math.log(t); var s = 1.000000000190015; for (var j = 0; j < 6; j++) s += c[j] / ++y; return -t + Math.log(2.5066282746310005 * s / x); }
  function betainc(a, b, x) { if (x <= 0) return 0; if (x >= 1) return 1; var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
  function tCdf(t, df) { var p = 0.5 * betainc(df / 2, 0.5, df / (df + t * t)); return t > 0 ? 1 - p : p; }
  function tPpf(p, df) { var lo = -50, hi = 50; for (var i = 0; i < 200; i++) { var mid = (lo + hi) / 2; if (tCdf(mid, df) < p) lo = mid; else hi = mid; } return (lo + hi) / 2; }
  var mean = function (a) { return a.reduce(function (s, v) { return s + v; }, 0) / a.length; };
  var stdev = function (a) { var m = mean(a); return Math.sqrt(a.reduce(function (s, v) { return s + (v - m) * (v - m); }, 0) / (a.length - 1)); };
  function icc(rows) {
    var n = rows.length, k = rows[0].length, gm = 0, i, j;
    rows.forEach(function (r) { r.forEach(function (v) { gm += v; }); }); gm /= n * k;
    var rm = rows.map(function (r) { return mean(r); }), cm = []; for (j = 0; j < k; j++) cm.push(mean(rows.map(function (r) { return r[j]; })));
    var ssr = k * rm.reduce(function (s, m) { return s + (m - gm) * (m - gm); }, 0), ssc = n * cm.reduce(function (s, m) { return s + (m - gm) * (m - gm); }, 0), sst = 0;
    rows.forEach(function (r) { r.forEach(function (v) { sst += (v - gm) * (v - gm); }); });
    var sse = sst - ssr - ssc, ssw = sst - ssr, msr = ssr / (n - 1), msc = ssc / (k - 1), mse = sse / ((n - 1) * (k - 1)), msw = ssw / (n * (k - 1));
    return { icc11: (msr - msw) / (msr + (k - 1) * msw), icc21: (msr - mse) / (msr + (k - 1) * mse + k * (msc - mse) / n), icc31: (msr - mse) / (msr + (k - 1) * mse) };
  }
  function pearson(x, y) { var mx = mean(x), my = mean(y), a = 0, b = 0, c = 0; for (var i = 0; i < x.length; i++) { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) * (x[i] - mx); c += (y[i] - my) * (y[i] - my); } return a / Math.sqrt(b * c); }
  function agree(ref, est) {
    var d = est.map(function (e, i) { return e - ref[i]; }), bias = mean(d), sd = stdev(d), ic = icc(ref.map(function (r, i) { return [r, est[i]]; }));
    return { n: d.length, bias: bias, sd_diff: sd, mae: mean(d.map(Math.abs)), rmse: Math.sqrt(mean(d.map(function (x) { return x * x; }))), loa_low: bias - 1.96 * sd, loa_high: bias + 1.96 * sd, pearson_r: pearson(ref, est), icc31: ic.icc31, icc21: ic.icc21 };
  }
  function tost(diffs, bound, alpha) {
    alpha = alpha || 0.05; var n = diffs.length, m = mean(diffs), sd = stdev(diffs), se = sd / Math.sqrt(n), df = n - 1;
    var pLow = 1 - tCdf((m + bound) / se, df), pHigh = tCdf((m - bound) / se, df), q = tPpf(1 - alpha, df);
    return { n: n, mean_diff: m, p_lower: pLow, p_upper: pHigh, p_tost: Math.max(pLow, pHigh), ci90: [m - q * se, m + q * se], equivalent: Math.max(pLow, pHigh) < alpha };
  }
  function bestLag(ref, est, maxLag) {
    var best = null;
    for (var lag = -maxLag; lag <= maxLag; lag++) {
      var s = 0, c = 0; for (var i = 0; i < ref.length; i++) { var j = i + lag; if (j >= 0 && j < est.length) { s += (ref[i] - est[j]) * (ref[i] - est[j]); c++; } }
      if (c < Math.floor(ref.length / 2)) continue; var mse = s / c; if (best === null || mse < best.mse) best = { lag: lag, mse: mse };
    }
    return { lag_samples: best.lag, mse_at_lag: best.mse };
  }
  function skillMean(ref, est) { var m = mean(ref), me = 0, mc = 0; for (var i = 0; i < ref.length; i++) { me += (est[i] - ref[i]) * (est[i] - ref[i]); mc += (m - ref[i]) * (m - ref[i]); } return 1 - me / mc; }
  var Stats = { agree: agree, tost: tost, bestLag: bestLag, skillMean: skillMean, icc: icc, tCdf: tCdf, tPpf: tPpf, mean: mean, stdev: stdev };
  if (typeof module !== 'undefined' && module.exports) module.exports = Stats; else root.Stats = Stats;
})(typeof window !== 'undefined' ? window : globalThis);
