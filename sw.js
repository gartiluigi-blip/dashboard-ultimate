/* Service Worker — Ultimate Dashboard
   Stratégies :
   - HTML : network-first (toujours frais, fallback cache si offline)
   - /assets/* : cache-first (immutable, hash-named)
   - /netlify/functions/* : network-only (pas de cache pour les API)
   - autres : stale-while-revalidate
*/
const CACHE_VERSION = 'ud-v3';
const CACHE_HTML = `${CACHE_VERSION}-html`;
const CACHE_ASSETS = `${CACHE_VERSION}-assets`;
const CACHE_OTHER = `${CACHE_VERSION}-other`;

// Install : skip waiting pour activer immédiatement
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate : nettoyer les vieux caches
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(
        keys.filter(k => !k.startsWith(CACHE_VERSION)).map(k => caches.delete(k))
      )),
      self.clients.claim()
    ])
  );
});

// Fetch : router selon le type de ressource
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  
  const url = new URL(req.url);
  
  // Skip cross-origin
  if (url.origin !== location.origin) return;
  
  // Netlify functions : network-only
  if (url.pathname.startsWith('/.netlify/functions/')) return;
  
  // Assets hashés : cache-first (immutable 1 an)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(req, CACHE_ASSETS));
    return;
  }
  
  // HTML root : network-first (toujours fresh, fallback cache)
  if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(req, CACHE_HTML));
    return;
  }
  
  // Reste : stale-while-revalidate
  event.respondWith(staleWhileRevalidate(req, CACHE_OTHER));
});

// Stratégies
async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return new Response('Asset offline', { status: 503 });
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(req);
    if (hit) return hit;
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/html' } });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const fetchPromise = fetch(req).then(res => {
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  }).catch(() => hit);
  return hit || fetchPromise;
}

// Message pour invalider le cache si besoin (debug)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});
