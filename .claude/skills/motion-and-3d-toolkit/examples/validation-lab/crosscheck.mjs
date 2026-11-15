// Verifies that stats.js gives the same numbers as the tested Python script, on the same CSV files.
//   node crosscheck.mjs            (needs python3 and ../pitch-lab/pairs.csv, series.csv)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const S = createRequire(import.meta.url)('./stats.js');
const py = join(here, '../../../estimated-motion-validation/scripts/motion_validate.py');
const csv = (f) => readFileSync(f, 'utf8').trim().split('\n').slice(1).map(l => l.split(',').map(Number));
const run = (...a) => JSON.parse(spawnSync('python3', ['-I', py, ...a], { encoding: 'utf8' }).stdout);
const pairs = join(here, '../pitch-lab/pairs.csv'), series = join(here, '../pitch-lab/series.csv');
const P = csv(pairs), ref = P.map(r => r[1]), est = P.map(r => r[2]), Q = csv(series);
let bad = 0; const near = (name, a, b, tol = 1e-8) => { const ok = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)); if (!ok) bad++; console.log((ok ? 'ok   ' : 'FAIL ') + name.padEnd(22) + String(a).slice(0, 14).padEnd(16) + String(b).slice(0, 14)); };
const A = run('agree', pairs), a = S.agree(ref, est);
near('bias', a.bias, A.bias); near('mae', a.mae, A.mae); near('rmse', a.rmse, A.rmse); near('loa_low', a.loa_low, A.loa_low); near('loa_high', a.loa_high, A.loa_high);
near('pearson_r', a.pearson_r, A.pearson_r); near('ICC(3,1)', a.icc31, A['ICC(3,1)']); near('ICC(2,1)', a.icc21, A['ICC(2,1)']);
for (const b of [5, 3, 1]) { const E = run('equiv', pairs, '--bound', String(b)), t = S.tost(est.map((e, i) => e - ref[i]), b); near(`tost p (+-${b})`, t.p_tost, E.p_tost, 1e-6); near(`tost ci90 low (+-${b})`, t.ci90[0], E.ci90[0]); near(`tost ci90 high (+-${b})`, t.ci90[1], E.ci90[1]); if (t.equivalent !== E.equivalent) { bad++; console.log('FAIL equivalent flag'); } }
near('skill (point)', S.skillMean(ref, est), run('skill', pairs, '--control', 'mean').skill);
const L = run('lag', series, '--max-lag', '8'), l = S.bestLag(Q.map(r => r[1]), Q.map(r => r[2]), 8); near('lag samples', l.lag_samples, L.lag_samples); near('mse at lag', l.mse_at_lag, L.mse_at_lag);
near('t cdf(2.0,10)', S.tCdf(2, 10), 0.963306, 1e-5); near('t ppf(.975,10)', S.tPpf(.975, 10), 2.2281, 1e-4);
const sf = [[9, 2, 5, 8], [6, 1, 3, 2], [8, 4, 6, 8], [7, 1, 2, 6], [10, 5, 6, 9], [6, 2, 4, 7]], ic = S.icc(sf); near('Shrout-Fleiss ICC(2,1)', ic.icc21, .29, 0.02); near('Shrout-Fleiss ICC(3,1)', ic.icc31, .71, 0.01);
console.log(bad ? `${bad} MISMATCH(ES)` : 'stats.js matches the Python script on every deterministic statistic'); process.exit(bad ? 1 : 0);
