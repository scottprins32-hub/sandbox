// Export joint positions from the Pitch Lab synthetic skeleton for N synthetic "pitchers".
// Every pitcher is the same animated skeleton with trunk twist, lean and arm swing scaled by seeded factors.
// SYNTHETIC: nothing here is a real athlete.
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { pathToFileURL } from 'url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [,, page, out, nSub = '40', nFrames = '60'] = process.argv;
// simple mulberry32 (the one-liner above is not trusted, so use this one)
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const R = mulberry32(20260101);
const browser = await chromium.launch();
const pg = await browser.newPage();
await pg.goto(pathToFileURL(page).href);
await pg.waitForFunction(() => window.__ready === true);
const subjects = [];
for (let s = 0; s < +nSub; s++) {
  const tw = 0.6 + 0.8 * R(), lean = 0.85 + 0.3 * R(), swing = 0.85 + 0.3 * R();
  const joints = await pg.evaluate(({ tw, lean, swing, nFrames }) => {
    const K = window.__pitchlab.K, pose = window.__pitchlab.pose; if (!window.__K0) window.__K0 = JSON.parse(JSON.stringify(K));
    const B = window.__K0;
    K.tw = B.tw.map(v => v * tw); K.lean = B.lean.map(v => v * lean);
    K.rua = B.rua.map(p => [p[0], p[1] * swing]); K.rfa = B.rfa.map(p => [p[0], p[1] * swing]);
    const names = ['P','hipR','hipL','S','shR','shL','eR','wR','eL','wL','kR','aR','kL','aL','head','neck'];
    const out = {}; names.forEach(n => out[n] = []);
    for (let i = 0; i < nFrames; i++) { const q = pose(i / (nFrames - 1)); names.forEach(n => out[n].push(q[n])); }
    return out;
  }, { tw, lean, swing, nFrames: +nFrames });
  subjects.push({ id: 'S' + String(s + 1).padStart(2, '0'), tw_scale: tw, lean_scale: lean, swing_scale: swing, joints });
}
await browser.close();
writeFileSync(out, JSON.stringify({ label: 'SYNTHETIC: Pitch Lab skeleton, scaled per subject; not athlete data', frame_axes: 'x toward plate, y up, z lateral (Pitch Lab)', fps: 60, n_frames: +nFrames, subjects }));
console.log('wrote', out, subjects.length, 'subjects x', nFrames, 'frames');
