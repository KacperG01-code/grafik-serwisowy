self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open('grafik-store').then((cache) => cache.addAll([
            './index.html',
            './css/style.css',
            './js/app.js',
            './js/calculator.js',
            './js/excel-gen.js'
        ]))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});