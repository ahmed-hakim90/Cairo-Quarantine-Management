/* eslint-disable */
// Cairo Quarantine Administration — service worker.
// Strategy:
//   - Network-first for HTML navigations (with offline.html fallback).
//   - Stale-while-revalidate for static assets (images, fonts, JS, CSS).
//   - Bypass non-GET requests, Server Actions, API routes, and Next.js
//     internals like /_next/data and HMR endpoints.

const VERSION = "v1";
const STATIC_CACHE = `cqm-static-${VERSION}`;
const RUNTIME_CACHE = `cqm-runtime-${VERSION}`;
const HTML_CACHE = `cqm-html-${VERSION}`;

const PRECACHE_URLS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
];

const OFFLINE_HTML = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>غير متصل — Offline</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0c2340;
      color: #fff;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      padding: 24px;
      text-align: center;
    }
    .card { max-width: 28rem; }
    h1 { font-size: 1.5rem; margin: 0 0 .5rem; }
    p { opacity: .85; line-height: 1.6; margin: .25rem 0; }
    button {
      margin-top: 1.25rem;
      background: #fff;
      color: #0c2340;
      border: 0;
      padding: .75rem 1.25rem;
      border-radius: .5rem;
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>أنت غير متصل بالإنترنت</h1>
    <p>تعذّر تحميل هذه الصفحة. تحقق من اتصالك ثم حاول مرة أخرى.</p>
    <p style="font-size:.9rem">You are offline. Please check your connection.</p>
    <p style="font-size:.9rem">您当前处于离线状态，请检查网络连接。</p>
    <button onclick="location.reload()">إعادة المحاولة · Retry</button>
  </div>
</body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("cqm-") &&
                ![STATIC_CACHE, RUNTIME_CACHE, HTML_CACHE].includes(key)
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isHtmlNavigation(request) {
  if (request.mode === "navigate") return true;
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|css|js|map)$/.test(
      url.pathname
    )
  );
}

function shouldBypass(request, url) {
  if (request.method !== "GET") return true;
  if (url.origin !== self.location.origin) return true;
  if (url.pathname.startsWith("/api/")) return true;
  if (url.pathname.startsWith("/_next/data/")) return true;
  if (url.pathname.startsWith("/_next/webpack-hmr")) return true;
  if (url.pathname === "/sw.js") return true;
  // Server Actions are POSTs (already bypassed) but Next also issues
  // RSC fetches with these headers.
  if (request.headers.get("next-action")) return true;
  if (request.headers.get("rsc")) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (shouldBypass(request, url)) return;

  if (isHtmlNavigation(request)) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(HTML_CACHE);
          cache.put(request, response.clone()).catch(() => undefined);
          return response;
        } catch (err) {
          const cache = await caches.open(HTML_CACHE);
          const cached = await cache.match(request);
          if (cached) return cached;
          return new Response(OFFLINE_HTML, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }
      })()
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone()).catch(() => undefined);
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkPromise;
      })()
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
