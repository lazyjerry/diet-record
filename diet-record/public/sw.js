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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/api/')) return  // ⛔ 不攔截 API 請求

  event.respondWith(
    (async () => {
      const response = await fetch(event.request)
      if (response.redirected) {
        return fetch(response.url)  // 重新請求最終資源
      }
      return response
    })()
  )
})