#!/usr/bin/env python3
"""Agreement, equivalence, timing and skill-versus-control statistics for estimated motion.

Pure standard library, so it runs anywhere:  python3 motion_validate.py --selftest

Input for the subcommands is a CSV with a header and the columns  subject,ref,est
(one row per paired value, for example one peak angle per pitch, ref = reference system,
est = the estimate being judged).  Lengths are whatever unit the numbers are in; say it in the report.

  agree  FILE.csv                      bias, MAE, RMSE, 95% limits of agreement, Pearson r, ICC(3,1) and ICC(2,1)
  equiv  FILE.csv --bound 5            paired TOST: is the mean difference inside +-bound? (90% CI shown)
  lag    FILE.csv --max-lag 10         lag, in samples, that best aligns est to ref (rows must be one ordered series)
  skill  FILE.csv --control mean       skill of est against a no-model control (mean of ref, or persistence)
"""
import argparse
import csv
import json
import math
import random
import statistics as st
import sys


# ---------------------------------------------------------------- t distribution (no scipy)
def _betacf(a, b, x):
    tiny, qab, qap, qam = 1e-30, a + b, a + 1.0, a - 1.0
    c, d = 1.0, 1.0 - qab * x / qap
    d = 1.0 / (d if abs(d) > tiny else tiny)
    h = d
    for m in range(1, 300):
        m2 = 2 * m
        aa = m * (b - m) * x / ((qam + m2) * (a + m2))
        d = 1.0 + aa * d; d = 1.0 / (d if abs(d) > tiny else tiny)
        c = 1.0 + aa / c; c = c if abs(c) > tiny else tiny
        h *= d * c
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
        d = 1.0 + aa * d; d = 1.0 / (d if abs(d) > tiny else tiny)
        c = 1.0 + aa / c; c = c if abs(c) > tiny else tiny
        delta = d * c
        h *= delta
        if abs(delta - 1.0) < 3e-12:
            break
    return h


def betainc(a, b, x):
    if x <= 0: return 0.0
    if x >= 1: return 1.0
    bt = math.exp(math.lgamma(a + b) - math.lgamma(a) - math.lgamma(b) + a * math.log(x) + b * math.log(1 - x))
    if x < (a + 1) / (a + b + 2):
        return bt * _betacf(a, b, x) / a
    return 1.0 - bt * _betacf(b, a, 1 - x) / b


def t_cdf(t, df):
    p = 0.5 * betainc(df / 2.0, 0.5, df / (df + t * t))
    return 1.0 - p if t > 0 else p


def t_ppf(p, df):
    lo, hi = -50.0, 50.0
    for _ in range(200):
        mid = (lo + hi) / 2
        if t_cdf(mid, df) < p: lo = mid
        else: hi = mid
    return (lo + hi) / 2


# ---------------------------------------------------------------- agreement
def icc(rows):
    """Shrout & Fleiss intraclass correlations for an n-subjects x k-raters table (list of rows)."""
    n, k = len(rows), len(rows[0])
    if n < 2 or k < 2: raise ValueError('need at least 2 subjects and 2 raters')
    gm = sum(map(sum, rows)) / (n * k)
    rm = [sum(r) / k for r in rows]
    cm = [sum(r[j] for r in rows) / n for j in range(k)]
    ssr = k * sum((m - gm) ** 2 for m in rm)
    ssc = n * sum((m - gm) ** 2 for m in cm)
    sst = sum((x - gm) ** 2 for r in rows for x in r)
    sse, ssw = sst - ssr - ssc, sst - ssr
    msr, msc, mse, msw = ssr / (n - 1), ssc / (k - 1), sse / ((n - 1) * (k - 1)), ssw / (n * (k - 1))
    return {'ICC(1,1)': (msr - msw) / (msr + (k - 1) * msw),
            'ICC(2,1)': (msr - mse) / (msr + (k - 1) * mse + k * (msc - mse) / n),
            'ICC(3,1)': (msr - mse) / (msr + (k - 1) * mse),
            'ICC(1,k)': (msr - msw) / msr,
            'ICC(2,k)': (msr - mse) / (msr + (msc - mse) / n),
            'ICC(3,k)': (msr - mse) / msr}


def pearson(x, y):
    mx, my = st.fmean(x), st.fmean(y)
    sx, sy = math.sqrt(sum((a - mx) ** 2 for a in x)), math.sqrt(sum((b - my) ** 2 for b in y))
    return sum((a - mx) * (b - my) for a, b in zip(x, y)) / (sx * sy)


def agree(ref, est):
    d = [e - r for r, e in zip(ref, est)]
    bias, sd = st.fmean(d), st.stdev(d)
    table = [[r, e] for r, e in zip(ref, est)]
    ic = icc(table)
    return {'n': len(d), 'bias': bias, 'sd_diff': sd, 'mae': st.fmean(abs(x) for x in d), 'rmse': math.sqrt(st.fmean(x * x for x in d)),
            'loa_low': bias - 1.96 * sd, 'loa_high': bias + 1.96 * sd, 'pearson_r': pearson(ref, est),
            'ICC(3,1)': ic['ICC(3,1)'], 'ICC(2,1)': ic['ICC(2,1)']}


def tost(diffs, bound, alpha=0.05):
    """Paired two one-sided tests against +-bound. Equivalent iff both p < alpha, i.e. the (1-2*alpha) CI lies inside."""
    n, m, sd = len(diffs), st.fmean(diffs), st.stdev(diffs)
    se, df = sd / math.sqrt(n), n - 1
    p_low = 1 - t_cdf((m + bound) / se, df)       # H0: mean <= -bound
    p_high = t_cdf((m - bound) / se, df)          # H0: mean >=  bound
    q = t_ppf(1 - alpha, df)
    ci = (m - q * se, m + q * se)
    return {'n': n, 'mean_diff': m, 'bound': bound, 'p_lower': p_low, 'p_upper': p_high, 'p_tost': max(p_low, p_high),
            'ci90': ci, 'equivalent': max(p_low, p_high) < alpha}


def best_lag(ref, est, max_lag):
    """Shift of est (in samples) that minimises the mean squared difference to ref; positive = est is late."""
    best = None
    for lag in range(-max_lag, max_lag + 1):
        pairs = [(ref[i], est[i + lag]) for i in range(len(ref)) if 0 <= i + lag < len(est)]
        if len(pairs) < len(ref) // 2: continue
        mse = st.fmean((a - b) ** 2 for a, b in pairs)
        if best is None or mse < best[1]: best = (lag, mse)
    return {'lag_samples': best[0], 'mse_at_lag': best[1], 'mse_at_zero': st.fmean((a - b) ** 2 for a, b in zip(ref, est))}


def skill(ref, est, control, boot=2000, seed=1):
    """1 - MSE(est)/MSE(control), with a paired bootstrap interval over subjects. Above 0 means better than the control."""
    if control == 'mean':
        ctl = [st.fmean(ref)] * len(ref)
    elif control == 'persistence':
        ctl = [ref[0]] + ref[:-1]
    else:
        raise ValueError('control is mean or persistence')
    me = [(e - r) ** 2 for r, e in zip(ref, est)]
    mc = [(c - r) ** 2 for r, c in zip(ref, ctl)]
    point = 1 - sum(me) / sum(mc)
    rnd, n, vals = random.Random(seed), len(ref), []
    for _ in range(boot):
        idx = [rnd.randrange(n) for _ in range(n)]
        den = sum(mc[i] for i in idx)
        if den > 0: vals.append(1 - sum(me[i] for i in idx) / den)
    vals.sort()
    return {'skill': point, 'ci95': (vals[int(0.025 * len(vals))], vals[int(0.975 * len(vals)) - 1]), 'control': control, 'n': n}


def selftest():
    sf = [[9, 2, 5, 8], [6, 1, 3, 2], [8, 4, 6, 8], [7, 1, 2, 6], [10, 5, 6, 9], [6, 2, 4, 7]]   # Shrout & Fleiss (1979), table 2
    r = icc(sf)
    want = {'ICC(1,1)': .17, 'ICC(2,1)': .29, 'ICC(3,1)': .71, 'ICC(1,k)': .44, 'ICC(2,k)': .62, 'ICC(3,k)': .91}
    for k, v in want.items():
        assert abs(r[k] - v) < 0.006, (k, r[k], v)
    assert abs(t_cdf(2.0, 10) - 0.963306) < 1e-4, t_cdf(2.0, 10)
    assert abs(t_ppf(0.975, 10) - 2.2281) < 1e-3, t_ppf(0.975, 10)
    d = [0.1] * 30 + [-0.1] * 30
    assert tost(d, 1.0)['equivalent'] and not tost([3.0 + x for x in d], 1.0)['equivalent']
    sig = [math.sin(i / 4) for i in range(80)]
    late = sig[:3] + sig[:-3]                      # est is the signal delayed by 3 samples
    assert best_lag(sig, late, 8)['lag_samples'] == 3, best_lag(sig, late, 8)   # positive = est is late
    print('selftest ok: Shrout-Fleiss ICCs, t distribution, TOST decision, lag recovery')


def load(path):
    with open(path, newline='') as f:
        rows = list(csv.DictReader(f))
    return [float(r['ref']) for r in rows], [float(r['est']) for r in rows]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--selftest', action='store_true')
    sub = ap.add_subparsers(dest='cmd')
    for name in ('agree', 'equiv', 'lag', 'skill'):
        p = sub.add_parser(name); p.add_argument('file')
        if name == 'equiv': p.add_argument('--bound', type=float, required=True)
        if name == 'lag': p.add_argument('--max-lag', type=int, default=10)
        if name == 'skill': p.add_argument('--control', default='mean', choices=['mean', 'persistence'])
    a = ap.parse_args()
    if a.selftest: return selftest()
    if not a.cmd: ap.error('give a subcommand or --selftest')
    ref, est = load(a.file)
    out = {'agree': lambda: agree(ref, est), 'equiv': lambda: tost([e - r for r, e in zip(ref, est)], a.bound if a.cmd == 'equiv' else 0),
           'lag': lambda: best_lag(ref, est, getattr(a, 'max_lag', 10)), 'skill': lambda: skill(ref, est, getattr(a, 'control', 'mean'))}[a.cmd]()
    print(json.dumps(out, indent=2))


if __name__ == '__main__':
    main()
