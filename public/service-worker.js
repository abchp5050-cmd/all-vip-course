// Minimal PWA service worker.
// Intentionally clears any stale caches and does not cache HTTP responses
// so that deployed updates are always served immediately to users.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', () => {
  // Network passthrough: let the browser handle all requests directly.
});
