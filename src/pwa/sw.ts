/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import { BYPASS_PATTERNS } from "./bypass";

declare const self: ServiceWorkerGlobalScope;

/** SSR routes to make available offline. Keep in sync with `src/routes`. */
const OFFLINE_PAGES = ["/", "/withholding", "/about"];
const PAGES_CACHE = "pages";

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

/**
 * Cache pages by pathname only so scenario query strings (`/?s=...`) share one
 * entry and still resolve offline; the client reads the scenario from the URL.
 */
const pathnameCacheKey = {
  cacheKeyWillBeUsed: async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    return `${url.origin}${url.pathname}`;
  },
};

// Pages are server-rendered, so they aren't in the build manifest. Fetch them at
// install time so they ship with the matching precached JS/CSS for this version.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGES_CACHE).then((cache) =>
      Promise.all(
        OFFLINE_PAGES.map((path) =>
          fetch(path, { cache: "reload" }).then((res) => {
            if (res.ok) return cache.put(new URL(path, self.location.origin).href, res);
          }),
        ),
      ),
    ),
  );
});

// Network first so online users get fresh SSR; fall back to the cached shell offline.
// Machine-readable endpoints are never served from the pages cache.
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: PAGES_CACHE,
      networkTimeoutSeconds: 3,
      plugins: [new CacheableResponsePlugin({ statuses: [200] }), pathnameCacheKey],
    }),
    { denylist: BYPASS_PATTERNS },
  ),
);

registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com",
  new StaleWhileRevalidate({ cacheName: "google-fonts-stylesheets" }),
);

registerRoute(
  ({ url }) => url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "google-fonts-webfonts",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  }),
);
