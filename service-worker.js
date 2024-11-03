const CACHE_NAME = 'app-cache-v1';
const OFFLINE_URLS = ['index.html', 'uebung_page.html'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.all(
          OFFLINE_URLS.map(url => {
            return fetch(url).then(response => {
              if (!response.ok) {
                throw new TypeError('Failed to fetch ' + url);
              }
              return cache.put(url, response);
            });
          })
        );
      })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Bereitstellung der Datei hallo.txt
  if (url.pathname === '/hallo.txt') {
    const response = new Response('Dies ist der Inhalt von hallo.txt', {
      headers: { 'Content-Type': 'text/plain' }
    });
    event.respondWith(response);
    return;
  }

  // Stale-While-Revalidate für test.json
  if (url.pathname === '/test.json') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Offline-Unterstützung für Navigationen
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('index.html');
      })
    );
    return;
  }

  // Standardverhalten für alle anderen Anfragen
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});
