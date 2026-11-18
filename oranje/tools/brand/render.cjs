// Renders the brand SVGs to PNG at exact pixel sizes with Chromium.
// The share image embeds Archivo for its tagline via @font-face.
const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const B = '/home/user/sandbox/oranje/brand/';
const I = '/home/user/sandbox/oranje/icons/';
const FONT = 'file:///home/user/sandbox/oranje/fonts/Archivo-100-900.woff2';

const jobs = [
  // [svg, out, width, height, transparent]
  [B + 'oranje-icon.svg', B + 'oranje-icon-1024.png', 1024, 1024, true],
  [B + 'oranje-icon.svg', B + 'oranje-icon-512.png', 512, 512, true],
  [B + 'oranje-icon-square.svg', B + 'oranje-google-logo-120.png', 120, 120, false],
  [B + 'oranje-icon-square.svg', B + 'oranje-icon-square-1024.png', 1024, 1024, false],
  [B + 'oranje-icon-maskable.svg', B + 'oranje-icon-maskable-512.png', 512, 512, false],
  [B + 'oranje-logo-on-navy.svg', B + 'oranje-logo-on-navy.png', 1600, 0, false],
  [B + 'oranje-logo-on-cream.svg', B + 'oranje-logo-on-cream.png', 1600, 0, false],
  [B + 'oranje-logo-dark-bg.svg', B + 'oranje-logo-dark-bg.png', 1600, 0, true],
  [B + 'oranje-logo-light-bg.svg', B + 'oranje-logo-light-bg.png', 1600, 0, true],
  [B + 'oranje-mark-dark-bg.svg', B + 'oranje-mark-dark-bg.png', 512, 512, true],
  [B + 'oranje-mark-light-bg.svg', B + 'oranje-mark-light-bg.png', 512, 512, true],
  [B + 'oranje-share.svg', B + 'oranje-share-1200x630.png', 1200, 630, false],
  // the app's own icons
  [B + 'oranje-icon-square.svg', I + 'icon-180.png', 180, 180, false],
  [B + 'oranje-icon.svg', I + 'icon-192.png', 192, 192, true],
  [B + 'oranje-icon.svg', I + 'icon-512.png', 512, 512, true],
  [B + 'oranje-icon-maskable.svg', I + 'icon-maskable-512.png', 512, 512, false],
  [B + 'oranje-icon-square.svg', B + 'favicon-48.png', 48, 48, false],
  [B + 'oranje-icon-square.svg', B + 'favicon-32.png', 32, 32, false],
  [B + 'oranje-icon-square.svg', B + 'favicon-16.png', 16, 16, false],
];

(async () => {
  const b = await chromium.launch();
  for (const [src, out, w, h0, transparent] of jobs) {
    let svg = readFileSync(src, 'utf8');
    const vb = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
    const h = h0 || Math.round((w * vb[3]) / vb[2]);
    svg = svg.replace(/<svg([^>]*?)( width="[^"]*" height="[^"]*")?>/, `<svg$1 width="${w}" height="${h}">`);
    const page = await b.newPage({ viewport: { width: w, height: h } });
    await page.setContent(`<style>@font-face{font-family:Archivo;src:url(${FONT}) format('woff2');font-weight:100 900;font-stretch:62% 125%}html,body{margin:0;background:transparent}svg{display:block}</style>${svg}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(80);
    await page.screenshot({ path: out, omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
    await page.close();
    console.log(out.replace(/.*\//, ''), `${w}x${h}`);
  }
  await b.close();
})();
