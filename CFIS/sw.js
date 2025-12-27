const CACHE_NAME = 'cfis-archive-v2.1.1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './site_config.json',
    'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500&family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    // Network First Strategy
    e.respondWith(
        fetch(e.request)
            .then((response) => {
                // If the fetch is successful, clone it and update the cache
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // If fetch fails, fall back to the cache
                return caches.match(e.request);
            })
    );
});
