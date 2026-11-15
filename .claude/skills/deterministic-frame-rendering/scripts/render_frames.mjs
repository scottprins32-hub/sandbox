#!/usr/bin/env node
// Render a page frame by frame, so frame i depends on i alone, then encode and sheet it.
//
//   node render_frames.mjs PAGE_URL --frames 150 --fps 30 --size 1280x720 --out ./out [--selector canvas] [--check]
//
// The page must define   window.renderFrame(i)  (sync or returning a promise)  that draws frame i from i alone:
// no Date.now(), no performance.now(), no unseeded Math.random(), no state carried from the previous frame,
// no CSS animation or transition (drive them from i). The page also sets  window.__ready = true  once its assets have loaded.
// --check renders chosen frames twice and out of order and fails if the bytes differ: the proof of determinism.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');   // CommonJS resolution also honours NODE_PATH and global installs
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const args = process.argv.slice(2);
const url = args[0];
const opt = (name, fallback) => { const k = args.indexOf('--' + name); return k < 0 ? fallback : args[k + 1]; };
const flag = (name) => args.includes('--' + name);
if (!url || flag('help')) { console.error(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 12).join('\n')); process.exit(url ? 0 : 2); }
const frames = Number(opt('frames', 90)), fps = Number(opt('fps', 30));
const [width, height] = opt('size', '1280x720').split('x').map(Number);
const out = opt('out', './frames'), selector = opt('selector', null);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
const problems = [];
page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
await page.goto(url + (url.includes('?') ? '&' : '?') + 'render=1');
await page.waitForFunction(() => typeof window.renderFrame === 'function', null, { timeout: 30000 });
await page.waitForFunction(() => window.__ready !== false, null, { timeout: 30000 });
const target = selector ? page.locator(selector).first() : page;
const shot = async (i) => { await page.evaluate(n => window.renderFrame(n), i); return await target.screenshot({ type: 'png', animations: 'disabled', caret: 'hide' }); };
const hash = (b) => createHash('sha256').update(b).digest('hex').slice(0, 16);

if (flag('check')) {
  const picks = [0, Math.floor(frames / 2), frames - 1, 1, Math.floor(frames / 3)];
  const first = new Map();
  for (const i of picks) first.set(i, hash(await shot(i)));
  for (const i of [...picks].reverse()) {
    const again = hash(await shot(i));
    if (again !== first.get(i)) problems.push(`not deterministic: frame ${i} differs between renders (${first.get(i)} vs ${again})`);
  }
  console.log(problems.length ? 'DETERMINISM FAILED' : `deterministic: ${picks.length} frames identical when rendered twice, in a different order`);
}

const t0 = Date.now(), hashes = [];
for (let i = 0; i < frames; i++) {
  const png = await shot(i);
  hashes.push(hash(png));
  writeFileSync(join(out, `${String(i).padStart(5, '0')}.png`), png);
}
await browser.close();
const ms = Date.now() - t0;
const mp4 = join(out, 'render.mp4');
const enc = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(fps), '-i', join(out, '%05d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-movflags', '+faststart', mp4], { encoding: 'utf8' });
if (enc.status !== 0) problems.push('ffmpeg: ' + enc.stderr);
const step = Math.max(1, Math.floor(frames / 12));
const sheet = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', mp4, '-vf', `select='not(mod(n\\,${step}))',scale=420:-1,tile=4x3`, '-frames:v', '1', join(out, 'contact-sheet.png')], { encoding: 'utf8' });
if (sheet.status !== 0) problems.push('sheet: ' + sheet.stderr);
const repeats = hashes.filter((h, i) => i > 0 && h === hashes[i - 1]).length;
writeFileSync(join(out, 'report.json'), JSON.stringify({ frames, fps, size: [width, height], render_ms: ms, ms_per_frame: Math.round(ms / frames), identical_consecutive_frames: repeats, problems }, null, 2));
console.log(`rendered ${frames} frames in ${(ms / 1000).toFixed(1)} s (${Math.round(ms / frames)} ms each); ${repeats} identical consecutive frames; video ${mp4}`);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
