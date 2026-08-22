/*
 * ADIMS service worker.
 *
 * Two jobs only:
 *   1. Satisfy the browser's installability criteria (a registered worker with
 *      a fetch handler) so Chrome/Edge/Android fire `beforeinstallprompt`.
 *   2. Make the shell feel instant offline — hashed build assets are served
 *      from cache, and a dropped connection shows /offline.html instead of the
 *      browser's dinosaur.
 *
 * It deliberately never caches HTML, RSC payloads or API responses. This is a
 * multi-user portal behind Supabase auth: a cached page from one account could
 * otherwise be replayed to the next person signing in on the same device.
 */

const VERSION = "v1";
const STATIC_CACHE = `adims-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      // `reload` bypasses the HTTP cache so an update never precaches a stale copy.
      .then((cache) =>
        cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" }))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)),
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })(),
  );
});

/** Content-hashed build output and static icons — safe to serve cache-first. */
function isImmutableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const isDev = self.location.search.includes("dev=1");

  // In development, never cache so HMR works without interference.
  if (isDev) {
    return;
  }

  // Leave everything we do not explicitly handle to the network: non-GET,
  // cross-origin (Supabase, fonts), range requests and auth callbacks.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    request.headers.has("range") ||
    url.pathname.startsWith("/auth") ||
    url.pathname.startsWith("/api")
  ) {
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Page loads: always network (never cached — see the note at the top), with
  // the offline page as the only fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloaded = await event.preloadResponse;
          return preloaded || (await fetch(request));
        } catch {
          const cache = await caches.open(STATIC_CACHE);
          return (
            (await cache.match(OFFLINE_URL)) ??
            new Response("Offline", { status: 503, statusText: "Offline" })
          );
        }
      })(),
    );
  }
});

// Lets the page trigger an immediate update instead of waiting for a reload.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
