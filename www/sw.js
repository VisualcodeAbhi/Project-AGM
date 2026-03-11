const CACHE_NAME = 'agape-v5';
const ASSETS = [
    '/',
    '/index.html',
    '/songs.html',
    '/events.html',
    '/bible.html',
    '/prayer.html',
    '/live.html',
    '/contact.html',
    '/admin.html',
    '/style.css',
    '/app.js',
    '/assets/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // API requests: Network first, then cache
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response.ok && event.request.method === 'GET') {
                        const resClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Static assets: Stale-While-Revalidate
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse.ok) {
                    const resClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
                }
                return networkResponse;
            });
            return cachedResponse || fetchPromise;
        })
    );
});

