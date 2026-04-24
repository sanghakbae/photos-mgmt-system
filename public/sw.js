const APP_CACHE = 'gallery-app-v1';
const RUNTIME_CACHE = 'gallery-runtime-v1';
const IMAGE_CACHE = 'gallery-images-v1';

const APP_SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
  '/app-icon.svg',
  '/mask-icon.svg',
];

function isSuccessful(response) {
  return response && (response.ok || response.type === 'opaque');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![APP_CACHE, RUNTIME_CACHE, IMAGE_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (isSuccessful(response)) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }

  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (isSuccessful(response)) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkPromise;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (isSuccessful(response)) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, APP_CACHE));
    return;
  }

  if (
    url.pathname.startsWith('/assets/')
    || url.pathname.endsWith('.js')
    || url.pathname.endsWith('.css')
    || url.pathname.endsWith('.woff2')
    || url.pathname.endsWith('.woff')
  ) {
    event.respondWith(cacheFirst(request, APP_CACHE));
    return;
  }

  if (
    url.pathname.includes('/uploads/')
    || url.pathname.includes('/thumbnails/')
    || request.destination === 'image'
  ) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  if (
    url.pathname.endsWith('/api/public/photos')
    || url.pathname.endsWith('/api/public/status')
    || url.pathname.endsWith('/api/public/settings')
  ) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
  }
});
