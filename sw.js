const CACHE_NAME = 'yi-db-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network-first strategy for dynamic content, fallback to cache
  e.respondWith(
    fetch(e.request)
      .then(response => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          // Cache successful responses only (avoid caching 404s or non-GETs)
          if (e.request.method === 'GET' && response.ok && !e.request.url.includes('supabase.co')) {
            cache.put(e.request, resClone);
          }
        });
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
