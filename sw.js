const CACHE_NAME = 'cashflow-cache-v2';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// On install, pre-cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// On activate, clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// On fetch, use a stale-while-revalidate strategy
self.addEventListener('fetch', event => {
  // We only want to cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // Return response from cache if available
        if (response) {
          // Revalidate in the background
          const fetchPromise = fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          // Return cached response immediately
          return response;
        }

        // If not in cache, fetch from network
        return fetch(event.request).then(networkResponse => {
          // Cache the new response for future use
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(error => {
        // Fallback for network errors (e.g., offline)
        console.log('Service Worker: Fetch failed; returning offline page instead.', error);
        // You could return a custom offline page here if you had one cached
        // return caches.match('/offline.html');
      });
    })
  );
});