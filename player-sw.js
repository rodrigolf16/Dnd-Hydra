// Service Worker para Ronda — Guía Móvil de Jugadores (cache offline)
const CACHE_NAME = 'ronda-player-v3';
const ASSETS = [
  './player.html',
  './player-manifest.webmanifest',
  './lib/peerjs.min.js',
  './src/styles/player/main.css',
  './src/presentation/player-pwa/main.js',
  './assets/icons/icon48.png',
  './assets/icons/icon128.png',
  './assets/portraits/khael.svg',
  './assets/portraits/ojo.svg',
  './assets/portraits/doozer.svg',
  './assets/portraits/volstagg.svg',
  './assets/portraits/clive.svg',
  './assets/portraits/kygan.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML/JS/CSS so updates from GitHub Pages arrive immediately, falling back to cache offline
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
