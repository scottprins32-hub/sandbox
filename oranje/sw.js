// Lets Oranje open like an app, and open at all without a connection.
// Network first for everything, so a new version is never hidden behind an
// old copy; the cache is only the fallback. Sign-in and Google are never cached.

const CACHE = 'oranje-shell-v11';
const SHELL = [
  './', 'index.html', 'whoop.html', 'css/whoop.css?v=11', 'config.js', 'manifest.webmanifest', 'css/style.css?v=11',
  'js/boot.js?v=11', 'js/main.js?v=11', 'js/i18n.js', 'js/i18n-page.js', 'js/legal.js?v=11', 'js/terms.js', 'js/whoop.js?v=11',
  'js/core/game.js', 'js/core/scores.js', 'js/core/sources.js', 'js/core/strain.js', 'js/core/util.js',
  'js/data/auth.js', 'js/data/demo.js', 'js/data/health.js', 'js/data/store.js', 'js/data/whoop.js',
  'js/ui/charts.js?v=11', 'js/ui/dial.js?v=11', 'js/ui/game.js?v=11', 'js/ui/help.js?v=11', 'js/ui/motion.js?v=11', 'js/ui/river.js?v=11', 'js/ui/ring.js?v=11', 'js/ui/sections.js?v=11',
  'fonts/Archivo-100-900.woff2', 'fonts/BarlowSemiCondensed-600.woff2', 'fonts/IBMPlexMono-400.woff2', 'fonts/IBMPlexMono-500.woff2',
  'icons/icon.svg', 'icons/favicon.ico', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((url) => new Request(url, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/functions/')) return;
  const key = req.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/index.html') ? 'index.html' : req;
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(key, copy));
      }
      return res;
    } catch {
      const hit = await caches.match(key, { ignoreSearch: true });
      return hit || Response.error();
    }
  })());
});
