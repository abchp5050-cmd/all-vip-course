// Minimal PWA service worker.
// Intentionally does not cache responses so that deployed updates are always
// served immediately and no stale content is shown to users.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Network passthrough: let the browser handle all requests normally.
});
