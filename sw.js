// ZMIENIAJ TEN NUMER za każdym razem, gdy wrzucasz dużą aktualizację na GitHuba!
const CACHE_NAME = 'grafik-cache-v2'; 

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/js/app.js',
  '/js/calculator.js',
  '/js/excel-gen.js',
  '/js/firebase.js'
];

// Instalacja i zapisywanie plików do pamięci (Cache)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Zapisywanie plików w Cache');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting(); // Wymusza natychmiastową instalację nowej wersji
});

// Aktywacja i USUWANIE STARYCH WERSJI
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Usuwanie starego Cache:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim(); // Przejmuje kontrolę nad wszystkimi otwartymi kartami
});

// Serwowanie plików (najpierw sieć, potem Cache - tzw. Network First)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});