const CACHE_NAME = 'no-moon-consolidated-v200';
const ASSETS = [
  './',
  './index.html',
  '../assets/no-moon/characters/rook-portrait.webp',
  '../assets/no-moon/characters/nyx-portrait.webp',
  '../assets/no-moon/characters/sol-portrait.webp',
  '../assets/no-moon/characters/mire-portrait.webp',
  '../assets/no-moon/characters/moots-portrait.webp',
  '../assets/no-moon/characters/vesper-portrait.webp',
  '../assets/no-moon/characters/nadir-portrait.webp',
  '../assets/no-moon/title/no-moon-title-desktop.webp',
  '../assets/no-moon/title/no-moon-title-mobile.webp',
  '../assets/no-moon/title/no-moon-title-poster.webp',
  '../assets/no-moon/bosses/card-back.webp',
  '../assets/no-moon/bosses/false-moon-card.webp',
  '../assets/no-moon/bosses/warden-card.webp',
  '../assets/no-moon/bosses/night-ferry-card.webp',
  '../assets/no-moon/bosses/archon-card.webp',
  '../assets/no-moon/bosses/spiggot-card.webp',
  '../assets/no-moon/bosses/sun-card.webp',
  '../assets/no-moon/bosses/drowned-sun-card.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key.startsWith('no-moon-'))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  const isGameDocument = request.mode === 'navigate' || url.pathname.endsWith('/no-moon/') || url.pathname.endsWith('/no-moon/index.html') || url.pathname.endsWith('/index.html');
  const isCharacterArt = url.pathname.includes('/assets/no-moon/characters/') && url.pathname.endsWith('.webp');
  const isTitleArt = url.pathname.includes('/assets/no-moon/title/') && url.pathname.endsWith('.webp');
  const isBossArt = url.pathname.includes('/assets/no-moon/bosses/') && url.pathname.endsWith('.webp');
  if (!isGameDocument && !isCharacterArt && !isTitleArt && !isBossArt) return;

  if (isCharacterArt || isTitleArt || isBossArt) {
    event.respondWith(
      caches.match(request)
        .then((cached) => cached || fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }))
    );
    return;
  }

  event.respondWith(
    fetch(request, { cache: 'no-store' })
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
  );
});
