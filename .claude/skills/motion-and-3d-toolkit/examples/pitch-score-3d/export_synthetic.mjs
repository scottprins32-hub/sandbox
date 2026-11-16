// Write the Pitch Lab skeleton as a Motion Studio trial (Halpe-style names, metres, z up) at 120 fps.
// SYNTHETIC: a scripted pitcher, so the repo example carries no real person's data.
//   node export_synthetic.mjs ../pitch-lab/index.html synthetic_trial.js
import { createRequire } from 'module'; import { writeFileSync } from 'fs'; import { pathToFileURL, fileURLToPath } from 'url'; import { resolve } from 'path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [,, page, out] = process.argv; const RATE = 120, SECONDS = 2.5, N = RATE * SECONDS;
const b = await chromium.launch(); const p = await b.newPage(); await p.goto(pathToFileURL(resolve(page)).href); await p.waitForFunction(() => window.__ready === true);
const trial = await p.evaluate(({ N }) => {
  const pose = window.__pitchlab.pose, add = (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
  const names = ['Head', 'Neck', 'Hip', 'RShoulder', 'RElbow', 'RWrist', 'LShoulder', 'LElbow', 'LWrist', 'RHip', 'RKnee', 'RAnkle', 'RHeel', 'RBigToe', 'LHip', 'LKnee', 'LAnkle', 'LHeel', 'LBigToe'];
  const frames = [];
  for (let i = 0; i < N; i++) {
    const q = pose(i / (N - 1)), f = q.f0.f;
    const foot = (a) => [add([a[0], .03, a[2]], f, -.05), add([a[0], .02, a[2]], f, .17)];
    const [rh, rt] = foot(q.aR), [lh, lt] = foot(q.aL);
    const P = { Head: q.head, Neck: q.neck, Hip: q.P, RShoulder: q.shR, RElbow: q.eR, RWrist: q.wR, LShoulder: q.shL, LElbow: q.eL, LWrist: q.wL,
      RHip: q.hipR, RKnee: q.kR, RAnkle: q.aR, RHeel: rh, RBigToe: rt, LHip: q.hipL, LKnee: q.kL, LAnkle: q.aL, LHeel: lh, LBigToe: lt };
    frames.push(names.map(n => { const v = P[n]; return [+(v[0]).toFixed(5), +(-v[2]).toFixed(5), +(v[1]).toFixed(5)]; }));   // (x, y, z) -> (x, -z, y): z up, proper rotation
  }
  return { title: 'Synthetic pitcher (Pitch Lab)', source: 'synthetic', rate: 120, points: names, frames };
}, { N });
await b.close(); writeFileSync(out, 'window.TRIAL = ' + JSON.stringify(trial) + ';'); console.log('wrote', out, trial.frames.length, 'frames at', trial.rate, 'fps');
