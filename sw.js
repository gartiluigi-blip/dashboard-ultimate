const CACHE = 'ultimate-dashboard-v7.0.0-nexus';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/v7/app.css?v=7.0.0',
  '/v7/app.js?v=7.0.0',
  '/v7/content.js',
  '/v7/engine.js',
  '/v7/ui.js',
  '/v7/views.js',
  '/v7/views/shared.js',
  '/v7/views/overlays.js',
  '/v7/views/today.js',
  '/v7/views/health.js',
  '/v7/views/learn.js',
  '/v7/views/culture.js',
  '/v7/views/body.js',
  '/v7/views/money.js',
  '/v7/views/trading.js',
  '/v7/views/review.js',
  '/v7/views/settings.js',
  '/v6/store.js',
  '/v6/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, fallback) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request) || caches.match(fallback);
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then(async response => {
      if (response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  return cached || network || Response.error();
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, '/index.html'));
    return;
  }
  if (['script', 'style', 'worker'].includes(event.request.destination)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
