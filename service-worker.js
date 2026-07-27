'use strict';

const CACHE_VERSION = 'v4-premium-stable';
const CACHE_NAME = `luca-guitar-${CACHE_VERSION}`;

const REQUIRED_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './mic-pro.js',
  './manifest.json',
  './icon.svg'
];

const OPTIONAL_ASSETS = [
  './personal_catalog.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-1024.png',
  './ipad-pro-13-portrait.png',
  './ipad-pro-13-landscape.png'
];

async function cacheAssetsIndividually(cache, assets) {
  await Promise.allSettled(
    assets.map(async asset => {
      const response = await fetch(asset, { cache: 'reload' });
      if (!response.ok) throw new Error(`${asset}: HTTP ${response.status}`);
      await cache.put(asset, response);
    })
  );
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Kerndateien müssen vorhanden sein. Optionale Bilder dürfen die Installation
    // dagegen nicht vollständig blockieren.
    await cache.addAll(REQUIRED_ASSETS);
    await cacheAssetsIndividually(cache, OPTIONAL_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith('luca-guitar-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) await cache.put(fallbackUrl || request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) ||
      (fallbackUrl ? await cache.match(fallbackUrl) : null) ||
      new Response('Offline. Bitte die App einmal vollständig online starten.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const update = fetch(request)
    .then(response => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || await update || new Response('', { status: 504 });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, './index.html'));
    return;
  }

  if (['script', 'style', 'worker'].includes(request.destination)) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_APP_CACHE') {
    event.waitUntil(caches.delete(CACHE_NAME));
  }
});
