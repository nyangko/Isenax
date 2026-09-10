// Bump when the caching strategy below changes -- activate() drops every cache
// that isn't in the whitelist, so a new name is a clean slate.
const CACHE_NAME = 'isenax-v4';

// Get the base path from the service worker's location
const swPath = self.location.pathname;
const basePath = swPath.substring(0, swPath.lastIndexOf('/') + 1);

// ponytail: rsbuild content-hashes static/css and static/js filenames
// (e.g. index.<hash>.js), so they can't be precached by a fixed path here
// without a build step to read the real manifest. Only precache the
// unhashed public/ assets up front; hashed bundles get picked up lazily by
// the fetch handler below (cache-first, populated on first real request).
const urlsToCache = [
  `${basePath}manifest.json`,
  `${basePath}favicon.ico`,
  `${basePath}logo192.png`,
  `${basePath}logo512.png`
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      // Take over as soon as this version is installed. Without it the new
      // worker sits in "waiting" until every tab of the app is closed, which
      // in practice means a returning user never gets an update.
      //
      // Deliberately NOT paired with clients.claim(): claiming would put a
      // page that loaded *without* a controller under this worker mid-session,
      // which is a behaviour change for the very first visit and nothing here
      // needs it -- the document that has to come from the network is fetched
      // on the next navigation, by which point this worker is already in
      // control. (E2E caught the difference: claiming mid-session broke node
      // placement partway through a run.)
      .then(() => self.skipWaiting())
  );
});

// The document is the one thing that must NOT be cache-first: it names the
// content-hashed bundles, so serving a stale index.html pins the whole app to
// the old build forever, refresh or not. Network-first here, cache only as the
// offline fallback. Hashed assets stay cache-first -- a new build gives them
// new URLs, so there is nothing stale to serve.
const isDocumentRequest = request =>
  request.mode === 'navigate' || request.destination === 'document';

self.addEventListener('fetch', event => {
  if (isDocumentRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match(basePath)))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
