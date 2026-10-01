const SHELL_CACHE = 'nightflow-shell-v2';
const FONT_CACHE = 'nightflow-fonts-v1';
const FONT_MAX_ENTRIES = 32;
const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons.svg',
  '/nightflow-logo.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache =>
      Promise.allSettled(SHELL_URLS.map(url => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== SHELL_CACHE && key !== FONT_CACHE).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/**
 * Fail-closed: todo lo que no esté listado se ignora y pasa directo al
 * navegador — nunca se intercepta ni se cachea. Rutas de negocio (/v1/),
 * peticiones autenticadas y cualquier origen que no sean las fuentes
 * públicas de Google quedan fuera del alcance del Service Worker.
 */
const isForbidden = request => {
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/v1/')) return true;
    if (request.headers.has('Authorization')) return true;
    if (request.headers.has('X-Business-Id')) return true;
    return false;
  }
  return !FONT_HOSTS.includes(url.hostname);
};

const cacheFirst = (event, cacheName, allowOpaque, maxEntries = 0) => {
  const { request } = event;
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        const acceptable = response.ok || (allowOpaque && response.type === 'opaque');
        if (acceptable) {
          caches.open(cacheName).then(async cache => {
            await cache.put(request, response.clone());
            if (maxEntries > 0) {
              const keys = await cache.keys();
              if (keys.length > maxEntries) {
                await Promise.all(keys.slice(0, keys.length - maxEntries).map(key => cache.delete(key)));
              }
            }
          }).catch(() => undefined);
        }
        return response;
      });
    })
  );
};

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (isForbidden(request)) return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    // Solo fuentes públicas de Google (CSS opaco + woff2 con CORS).
    cacheFirst(event, FONT_CACHE, true, FONT_MAX_ENTRIES);
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then(cache => cache.put('/index.html', copy)).catch(() => undefined);
          return response;
        })
        .catch(() =>
          caches.match('/index.html').then(cached => cached || Response.error())
        )
    );
    return;
  }

  const isStaticAsset = url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/favicon.svg' ||
    url.pathname === '/icons.svg' ||
    url.pathname === '/nightflow-logo.svg';

  if (isStaticAsset) {
    cacheFirst(event, SHELL_CACHE, false);
  }
});
