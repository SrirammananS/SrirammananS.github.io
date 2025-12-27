const CACHE_NAME = 'cfis-archive-v1';
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
    // Simple Cache First Strategy
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
