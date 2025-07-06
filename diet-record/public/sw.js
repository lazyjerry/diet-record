const CACHE_NAME = "diet-cache-v1";
const urlsToCache = [
  "/",
  "/logs.html",
  "/report.html",
  "/css/style.css",
  "/js/main.js",
  "/js/logs-form.js",
  "/js/logs-table.js",
  "/js/nutrition.js",
  "/js/auth.js",
  "/js/user-profile.js",
  "/js/report.js",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(
      (response) => response || fetch(event.request)
    )
  );
});