// Root-level cleanup worker for old No Moon deployments.
// The real game worker now lives at /no-moon/no-moon-sw.js.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith('no-moon-')).map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) client.navigate(client.url);
    } catch (_) {}
  })());
});
