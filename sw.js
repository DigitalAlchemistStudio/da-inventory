// Digital Alchemists Guild — service worker (offline shell)
// Network-first for the app HTML so you always get the latest deploy; cache
// fallback keeps the shell usable offline. Cross-origin calls (Supabase, CDNs)
// are never intercepted, so live data always goes to the network.
const CACHE = 'da-guild-v11';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './da-icon-192.png',
  './da-icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Only handle same-origin GETs; let Supabase/CDN requests pass straight through.
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put('./index.html', cp)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(caches.match(req).then((c) => c || fetch(req)));
});
