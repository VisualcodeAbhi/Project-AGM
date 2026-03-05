const CACHE_NAME = 'agape-v2';
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
    // For API requests, try network first, then cache
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // For other requests (HTML, JS, CSS), use Network First strategy
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Update cache with the fresh fetched version
                if (response.ok) {
                    const resClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, resClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache if offline
                return caches.match(event.request);
            })
    );
});

