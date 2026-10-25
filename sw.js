
const CACHE_NAME = "liquidos-v06";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) {
            return name !== CACHE_NAME;
          })
          .map(function(name) {
            return caches.delete(name);
          })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).then(function(response) {
      if (response && response.ok && new URL(event.request.url).origin === self.location.origin) {
        var copy = response.clone();

        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, copy);
        });
      }

      return response;
    }).catch(function() {
      return caches.match(event.request).then(function(cached) {
        if (cached) return cached;

        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }

        return Response.error();
      });
    })
  );
});
