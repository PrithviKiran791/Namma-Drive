const CACHE_NAME = 'namma-drive-v1';
const ASSETS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      try {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, copy));
      } catch (e) {}
      return res;
    })).catch(() => caches.match('/'))
  );
});
