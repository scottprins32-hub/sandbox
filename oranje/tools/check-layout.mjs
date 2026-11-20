// Finds clipped or overflowing big text at 17 widths from 320 to 1920 px: every
// heading and big number must fit inside its own box and inside the screen,
// also after the reveal animation has run. Needs Playwright and a running
// server: npm run serve, then npm run check:layout. Set CHROMIUM_PATH to use a
// browser other than the one bundled with the installed Playwright. Set
// ORANJE_LANG=nl to check the Dutch text.
import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://localhost:4173/';
const WIDTHS = [320, 360, 375, 390, 430, 600, 768, 820, 900, 1000, 1024, 1100, 1280, 1366, 1440, 1680, 1920];
const PAGES = [['', false], ['', true], ['#strain', true], ['#recovery', true], ['#sleep', true], ['#climb', true], ['privacy.html', false], ['terms.html', false]];
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  let problems = 0;
  for (const [path, demo] of PAGES) {
    for (const w of WIDTHS) {
      const p = await b.newPage({ viewport: { width: w, height: 900 } });
      await p.addInitScript((lang) => { if (lang) localStorage.setItem('oranje.lang', lang); sessionStorage.setItem('oranje.seen', '1'); localStorage.setItem('oranje.game.seen', '{"demo":{"badges":["x"],"level":99}}'); }, process.env.ORANJE_LANG || '');
      await p.goto(BASE + path, { waitUntil: 'load' });
      if (demo) {
        await p.click('#btn-demo'); await p.waitForTimeout(1200);
        const H = await p.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < H; y += 600) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(60); }
        await p.waitForTimeout(1400);
      }
      const found = await p.evaluate(() => {
        const out = [];
        const sel = 'h1, h2, .welcome-title span, .dial-num, .meter-num, .verdict, .big, .t-num, .s-num, .averages dd, .brand-name, .doc h1';
        for (const el of document.querySelectorAll(sel)) {
          if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
          const r = el.getBoundingClientRect();
          if (!r.width) continue;
          const own = el.scrollWidth - el.clientWidth;
          const off = r.right - document.documentElement.clientWidth;
          // the visible area after clip-path, measured on the element
          const cp = getComputedStyle(el).clipPath;
          if (own > 1 || off > 1) out.push(`${el.tagName}.${el.className || ''} "${el.textContent.trim().slice(0, 18)}" overflow ${own}px, past viewport ${Math.round(off)}px, clip ${cp}`);
          // a heading wider than its parent box gets cut by the parent's clipping or overlaps neighbours
          let host = el.parentElement;
          while (host && getComputedStyle(host).display === 'contents') host = host.parentElement;
          const parent = host.getBoundingClientRect();
          if (r.right > parent.right + 1 && el.matches('h2, h1')) out.push(`${el.tagName} "${el.textContent.trim().slice(0, 18)}" wider than its box by ${Math.round(r.right - parent.right)}px`);
        }
        // text whose rendered width exceeds its box (inline content overflowing)
        for (const el of document.querySelectorAll('.view-head h2, .verdict, .ring-num, .doc h1, .welcome-title span')) {
          if (!el.offsetParent) continue;
          const range = document.createRange(); range.selectNodeContents(el);
          const tr = range.getBoundingClientRect(), br = el.getBoundingClientRect();
          if (tr.right > br.right + 1) out.push(`text of "${el.textContent.trim().slice(0, 18)}" runs ${Math.round(tr.right - br.right)}px past its box`);
          if (tr.right > document.documentElement.clientWidth + 1) out.push(`text of "${el.textContent.trim().slice(0, 18)}" runs past the screen`);
        }
        return out;
      });
      if (found.length) { problems += found.length; console.log(`/${path} @${w}px`); for (const f of found) console.log('   ', f); }
      await p.close();
    }
  }
  console.log(problems ? `${problems} problems` : 'no clipped or overflowing text at any width');
  await b.close();
})();
