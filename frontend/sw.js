const CACHE_NAME = 'ers-cache-v3';
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/style.css',
    '/advanced.css',
    '/mobile-responsive.css',
    '/app.js',
    '/map.js',
    '/panels.js',
    '/advanced.js',
    '/advanced-features.js',
    '/live-tracking.js',
    '/fleet-management.js',
    '/keyboard-shortcuts.js',
    '/realtime-client.js',
    '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys
                .filter((key) => key !== CACHE_NAME)
                .map((key) => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    const requestUrl = new URL(event.request.url);
    const isAppShellAsset = requestUrl.origin === self.location.origin && (
        requestUrl.pathname === '/' ||
        requestUrl.pathname.endsWith('.html') ||
        requestUrl.pathname.endsWith('.js') ||
        requestUrl.pathname.endsWith('.css')
    );

    if (isAppShellAsset) {
        // Network-first for app shell files prevents stale cached JS after updates.
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) {
                return cached;
            }

            return fetch(event.request)
                .then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                })
                .catch(() => caches.match('/index.html'));
        })
    );
});
