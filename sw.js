const CACHE_NAME = 'yi-db-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

function saveSharedData(data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('yi-db-share', 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('shared', { keyPath: 'id' });
    };
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction('shared', 'readwrite');
      tx.objectStore('shared').put({ id: 'latest', ...data });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

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
  const url = new URL(e.request.url);

  // Intercept PWA Share Target POST request
  if (e.request.method === 'POST' && url.pathname === '/share') {
    e.respondWith((async () => {
      try {
        const formData = await e.request.formData();
        const title = formData.get('share_title') || '';
        const text = formData.get('share_text') || '';
        const shareUrl = formData.get('share_url') || '';
        const images = formData.getAll('images'); // array of File objects
        
        await saveSharedData({
          title, text, url: shareUrl, images, timestamp: Date.now()
        });
        
        return Response.redirect('/?share_ready=1', 303);
      } catch (err) {
        return Response.redirect('/?share_err=1', 303);
      }
    })());
    return;
  }

  // Network-first strategy for dynamic content, fallback to cache
  e.respondWith(
    fetch(e.request)
      .then(response => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          if (e.request.method === 'GET' && response.ok && !e.request.url.includes('supabase.co')) {
            cache.put(e.request, resClone);
          }
        });
        return response;
      })
      .catch(() => caches.match(e.request, {ignoreSearch: true}))
  );
});
