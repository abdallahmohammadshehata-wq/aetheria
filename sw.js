// Aetheria service worker: lets the app itself load with no network, which is what makes the offline audio and
// artwork packages usable on a plane. `vite build` stamps the build id and the list of built files into the two
// placeholders below; in development the worker is never registered.
//
//  - The whole build is precached on install (including the lazy screens), so every screen opens offline.
//  - Page loads go to the network first (always fresh when online) and fall back to the cached shell.
//  - Built assets and static files are served cache-first; Google Fonts are cached the first time they load.
//  - Everything else (Gemini, the image service, ...) is left alone and goes straight to the network.
//
// A new worker waits before taking over, so a running tab never has its files swapped underneath it: until every tab is
// closed, or until the page - after the reader presses Reload on the "new version is ready" notice - sends SKIP_WAITING.

const BUILD_ID = 'ddc4b6acca'; /* __BUILD_ID__ */
const PRECACHE = ["assets/Field-BH1FE0j9.js","assets/OfflineSheet-CLdjN8M2.js","assets/SettingsScreen-Bl1UlXhG.css","assets/SettingsScreen-D2EfVjOk.js","assets/StoryCard-DmDxZxtk.js","assets/StoryCard-wbc3AgRA.css","assets/StoryExplore-BsyrENZt.js","assets/StoryExplore-EBbApDKR.css","assets/StoryLibrary-BUE1e32C.css","assets/StoryLibrary-mxA2quP8.js","assets/StoryReader-BzjSX-9v.css","assets/StoryReader-Du3gQnSB.js","assets/StoryStudio-B6_Lm7S1.js","assets/StoryStudio-CbyTV4QU.css","assets/chevron-right-Q49926a-.js","assets/circle-check-BMgfBGLa.js","assets/export-GjJbdPGn.js","assets/index-CNyhTzb0.css","assets/index-zsHq8UKf.js","assets/soundscapeStore-DscSpGx2.js","assets/storyAi-XhYSBwt5.js","assets/studioIntent-DlFfabVz.js","assets/trash-BcN6NUao.js","assets/upload-CZ5DopED.js"]; /* __PRECACHE__ */

const SHELL_CACHE = `aetheria-shell-${BUILD_ID}`;
const FONT_CACHE = 'aetheria-fonts-v1';
const NAVIGATION_TIMEOUT_MS = 4000;

const inScope = (path) => new URL(path, self.registration.scope).href;
const isCacheable = (response) => response && (response.ok || response.type === 'opaque');
// Servers (Vite's included) send `Vary: Origin`; a module import then carries a header the precache request did not,
// and the Cache API would treat the stored file as a different resource. We key purely on the URL.
const MATCH = { ignoreVary: true };

self.addEventListener('install', (event) => {
  // addAll is all-or-nothing: if any file fails, the install fails and is retried, so the cache is never half full.
  const urls = [...new Set(['./', 'manifest.json', 'favicon.svg', ...PRECACHE].map(inScope))];
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(urls)));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith('aetheria-shell-') && n !== SHELL_CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, MATCH);
  if (hit) return hit;
  const response = await fetch(request);
  if (isCacheable(response)) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, MATCH);
  const refresh = fetch(request)
    .then((response) => {
      if (isCacheable(response)) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return hit || (await refresh) || Response.error();
}

async function navigation(request) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), NAVIGATION_TIMEOUT_MS);
    try {
      return await fetch(request, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    return (await cache.match(inScope('./'), MATCH)) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(request.mode === 'navigate' ? navigation(request) : cacheFirst(request, SHELL_CACHE));
  } else if (url.hostname === 'fonts.googleapis.com') {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
  } else if (url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, FONT_CACHE));
  }
  // anything else: not intercepted
});
