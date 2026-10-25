
const CACHE_NAME = "liquidos-v07";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg"
];

// Installation : mise en cache des fichiers principaux
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activation : suppression des anciens caches LiquidOS
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) =>
              key.startsWith("liquidos-") &&
              key !== CACHE_NAME
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Chargement : réseau en priorité, cache en secours
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  ) {
    return;
  }

  // Les pages HTML sont actualisées depuis le réseau
  // lorsque celui-ci est disponible.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, copy));

          }

          return response;
        })
        .catch(async () => {
          return (
            await caches.match(request)
          ) || (
            await caches.match("./index.html")
          );
        })
    );

    return;
  }

  // Pour les autres fichiers : cache en priorité
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, copy));
          }

          return response;
        });
      })
  );
});
