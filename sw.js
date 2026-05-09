// Service Worker — Familie Club 2000
// Cache strategy: cache-first for assets, network-first for data
// Bump CACHE_NAME version when deploying updates

const CACHE_NAME = 'familie-club2000-v6';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/style.css',
  './src/main.js',
  './src/data/characters.js',
  './src/data/symbols.js',
  './src/game/state.js',
  './src/game/engine.js',
  './src/game/reels.js',
  './src/game/gamble.js',
  './src/game/feature.js',
  './src/game/audio.js',
  './src/ui/meters.js',
  './src/ui/upper-panel.js',
  './src/ui/reels-ui.js',
  './src/ui/controls.js',
  './src/ui/popups.js',
  // PWA icons
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon-32.png',
  './assets/icons/favicon-16.png',
  // Familieleden (alle 23)
  './assets/familie/Moek.png',
  './assets/familie/Kawita.png',
  './assets/familie/Shreya.png',
  './assets/familie/Geetha.png',
  './assets/familie/Sindy.png',
  './assets/familie/Roy.png',
  './assets/familie/Richella.png',
  './assets/familie/Bella.png',
  './assets/familie/Naleya.png',
  './assets/familie/Devan.png',
  './assets/familie/Jennifer.png',
  './assets/familie/loek.png',
  './assets/familie/Amaya.png',
  './assets/familie/Anisa.png',
  './assets/familie/Armando.png',
  './assets/familie/Berry.png',
  './assets/familie/Chella.png',
  './assets/familie/Chlo├®.png',
  './assets/familie/Daan.png',
  './assets/familie/Ervina.png',
  './assets/familie/Gaby.png',
  './assets/familie/Shira.png',
  './assets/familie/Stich.png',
];

// Install event: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching assets');
      return cache.addAll(ASSETS).catch(err => {
        console.error('[SW] Cache failed:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event: cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => 
      Promise.all(
        names.filter(name => name !== CACHE_NAME)
             .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch event: cache-first
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Optionally cache new resources
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
