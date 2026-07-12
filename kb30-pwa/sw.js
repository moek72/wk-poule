// sw.js — cache-first service worker. Volledig offline na de eerste load.
const CACHE = 'kb30-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/ui.js',
  './js/store.js',
  './js/db.js',
  './js/safety.js',
  './js/gates.js',
  './js/swingLedger.js',
  './js/voice.js',
  './js/coach.js',
  './js/listen.js',
  './js/program.js',
  './js/bridge.js',
  './js/engine.js',
  './js/illustrations.js',
  './js/data/exercises.js',
  './js/screens/onboarding.js',
  './js/screens/main.js',
  './js/screens/player.js',
  './js/screens/more.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          // Cache nieuwe same-origin GET's mee (bijv. dynamische imports).
          if (res.ok && new URL(request.url).origin === self.location.origin) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => cached || Response.error());
    }),
  );
});
