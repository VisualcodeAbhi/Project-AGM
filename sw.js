const CACHE_NAME = 'agape-v1';
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

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
