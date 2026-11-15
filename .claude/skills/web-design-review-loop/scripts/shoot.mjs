#!/usr/bin/env node
// Screenshot a page at several widths and colour schemes, audit it with a machine, and make a squint image.
//
//   node shoot.mjs PAGE_URL --out ./review [--widths 375,768,1440] [--schemes light,dark] [--tabs 25]
//
// Writes  review/<scheme>-<width>.png, review/<scheme>-<width>-squint.png  and  review/audit.json.
// Exit code 1 when a MUST finding exists. Findings are evidence for a human or a model to judge, never a score.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');

const args = process.argv.slice(2), url = args[0];
const opt = (n, d) => { const k = args.indexOf('--' + n); return k < 0 ? d : args[k + 1]; };
if (!url) { console.error('usage: node shoot.mjs PAGE_URL --out DIR [--widths 375,768,1440] [--schemes light,dark] [--tabs 25]'); process.exit(2); }
const out = opt('out', './review'), widths = opt('widths', '375,768,1440').split(',').map(Number), schemes = opt('schemes', 'light,dark').split(','), tabs = Number(opt('tabs', 25));
mkdirSync(out, { recursive: true });

// Runs inside the page. Returns plain data.
const audit = ({ tabs }) => {
  const res = { must: [], should: [], info: [] };
  const vw = document.documentElement.clientWidth, short = (el) => { const id = el.id ? '#' + el.id : ''; const c = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''; return el.tagName.toLowerCase() + id + c; };
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgba = (css) => { cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = css; cv.fillRect(0, 0, 1, 1); const d = cv.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
  const over = (top, bottom) => { const a = top[3]; return [0, 1, 2].map(i => top[i] * a + bottom[i] * (1 - a)).concat(1); };
  const backdrop = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none') return null; const c = rgba(cs.backgroundColor); if (c[3] > 0) { stack.push(c); if (c[3] >= .999) break; } } let base = [255, 255, 255, 1]; for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base); return base; };
  if (document.documentElement.scrollWidth > vw + 1) res.must.push({ rule: 'horizontal-scroll', detail: `page is ${document.documentElement.scrollWidth}px wide in a ${vw}px viewport` });
  const wide = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > vw + 1 && getComputedStyle(e).position !== 'fixed' && !e.closest('[style*="overflow"],svg') ; }).slice(0, 6).map(short);
  if (wide.length) res.should.push({ rule: 'wider-than-viewport', detail: wide.join(', ') });
  // contrast of visible text
  let checked = 0, skipped = 0; const bad = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    if (!n.nodeValue.trim()) continue; const el = n.parentElement; if (!el || el.closest('script,style,noscript')) continue;
    const cs = getComputedStyle(el), r = el.getBoundingClientRect(); if (cs.visibility === 'hidden' || cs.display === 'none' || r.width === 0 || +cs.opacity === 0) continue;
    const bg = backdrop(el); if (!bg) { skipped++; continue; }
    const fg = over(rgba(cs.color), bg), size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700, large = size >= 24 || (size >= 18.66 && bold);
    const cr = ratio(fg, bg), need = large ? 3 : 4.5; checked++;
    if (cr < need) bad.push({ el: short(el), text: n.nodeValue.trim().slice(0, 40), ratio: +cr.toFixed(2), need });
  }
  if (bad.length) res.must.push({ rule: 'text-contrast', detail: bad.slice(0, 8), count: bad.length });
  res.info.push({ rule: 'contrast-checked', detail: `${checked} text nodes checked, ${skipped} skipped (gradient or image behind)` });
  // targets and names
  const tiny = [], small = [], unnamed = [];
  for (const el of document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button],[tabindex]:not([tabindex="-1"])')) {
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
    if (r.width < 24 || r.height < 24) tiny.push(short(el)); else if (r.width < 44 || r.height < 44) small.push(short(el));
    const name = (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.labels?.[0]?.textContent || el.textContent || el.getAttribute('title') || el.getAttribute('alt') || '').trim();
    if (!name) unnamed.push(short(el));
  }
  if (tiny.length) res.must.push({ rule: 'target-under-24px', detail: tiny.slice(0, 8) });
  if (small.length) res.should.push({ rule: 'target-under-44px', detail: small.slice(0, 8) });
  if (unnamed.length) res.must.push({ rule: 'no-accessible-name', detail: unnamed.slice(0, 8) });
  const noAlt = [...document.images].filter(i => !i.hasAttribute('alt')).map(short); if (noAlt.length) res.must.push({ rule: 'image-without-alt', detail: noAlt });
  if (!document.documentElement.lang) res.should.push({ rule: 'no-lang', detail: 'html has no lang attribute (the host page may set it)' });
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1]); for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) { res.should.push({ rule: 'heading-skip', detail: `h${hs[i - 1]} then h${hs[i]}` }); break; }
  if (document.querySelectorAll('h1').length !== 1) res.should.push({ rule: 'h1-count', detail: `${document.querySelectorAll('h1').length} h1 elements` });
  const meta = document.querySelector('meta[name=viewport]'); if (!meta) res.should.push({ rule: 'no-viewport-meta', detail: 'missing' });
  return res;
};

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const report = { url, runs: [] }; let musts = 0;
for (const scheme of schemes) for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: width < 500 ? 800 : 900 }, colorScheme: scheme, deviceScaleFactor: 1 });
  const problems = []; page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  page.on('pageerror', e => problems.push('pageerror: ' + e.message)); page.on('requestfailed', r => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') problems.push('request failed: ' + r.url().slice(-80)); });   // a media request cancelled by the browser is not a failure
  await page.goto(url); await page.waitForTimeout(600);
  const res = await page.evaluate(audit, { tabs });
  // keyboard sweep: every tab stop must show a visible focus indicator
  const hidden = [];
  for (let i = 0; i < tabs; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      return { tag: e.tagName.toLowerCase() + (e.id ? '#' + e.id : ''), media: /^(VIDEO|AUDIO)$/.test(e.tagName) && e.controls, outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2, shadow: cs.boxShadow !== 'none', w: r.width, h: r.height, key: e.tagName + e.id + (e.className || '') + Math.round(r.x) + Math.round(r.y) }; });
    if (!f) break; if (hidden.some(h => h.key === f.key)) break; if (!f.outline && !f.shadow && !f.media) hidden.push(f);   // native <video controls>/<audio controls> draw their own focus ring inside a shadow tree
  }
  if (hidden.length) res.must.push({ rule: 'focus-not-visible', detail: hidden.map(h => h.tag) });
  if (problems.length) res.should.push({ rule: 'page-problems', detail: problems.slice(0, 6) });
  const name = `${scheme}-${width}`, png = join(out, name + '.png');
  await page.screenshot({ path: png, fullPage: true });
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', 'format=gray,gblur=sigma=7', join(out, name + '-squint.png')]);
  musts += res.must.length; report.runs.push({ scheme, width, ...res }); await page.close();
}
await browser.close();
writeFileSync(join(out, 'audit.json'), JSON.stringify(report, null, 1));
for (const r of report.runs) console.log(`${r.scheme.padEnd(5)} ${String(r.width).padStart(4)}px  must ${r.must.length}  should ${r.should.length}` + (r.must.length ? '  <- ' + r.must.map(m => m.rule).join(', ') : ''));
console.log(musts ? `${musts} MUST finding(s): see ${join(out, 'audit.json')}` : 'no MUST findings (that is the floor, not a verdict: look at the screenshots and the squint images)');
process.exit(musts ? 1 : 0);
