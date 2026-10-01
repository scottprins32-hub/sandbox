// Offline support: cache the game files so it works without internet after the first visit.
const CACHE = 'kartparty-v3';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'vendor/three.module.min.js', 'js/main.js', 'js/race.js', 'js/track.js', 'js/models.js', 'js/audio.js', 'js/data.js', 'js/assets.js', 'vendor/GLTFLoader.js', 'vendor/utils/BufferGeometryUtils.js', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
// network first so updates arrive right away; cache when offline
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok && new URL(e.request.url).origin === location.origin) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
