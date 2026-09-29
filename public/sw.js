const SHELL_CACHE = 'nightflow-shell-v1';
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_URLS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== SHELL_CACHE).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

const isProtectedRequest = request => {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return true;
  if (url.pathname.startsWith('/v1/')) return true;
  if (request.headers.has('Authorization')) return true;
  if (request.headers.has('X-Business-Id')) return true;
  return false;
};

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (isProtectedRequest(request)) return;

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

  const url = new URL(request.url);
  const isStaticAsset = url.pathname.startsWith('/assets/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/favicon.svg' ||
    url.pathname === '/icons.svg';

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached ||
        fetch(request).then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then(cache => cache.put(request, copy)).catch(() => undefined);
          }
          return response;
        })
      )
    );
  }
});
