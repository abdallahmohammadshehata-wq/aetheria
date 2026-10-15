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

const BUILD_ID = 'c821008992'; /* __BUILD_ID__ */
const PRECACHE = ["assets/AnimationPlayer-BIUMA1mt.css","assets/AnimationPlayer-CQEO-PX8.js","assets/Field-BHpe-XUa.js","assets/OfflineSheet-CXm5Mr8y.js","assets/SettingsScreen-CWQGdX7w.css","assets/SettingsScreen-Cwb7Qdm4.js","assets/StoryCard-BRfQjI46.js","assets/StoryCard-wbc3AgRA.css","assets/StoryExplore-B-lyEZh8.js","assets/StoryExplore-EBbApDKR.css","assets/StoryLibrary-BUE1e32C.css","assets/StoryLibrary-WoBFw_jl.js","assets/StoryReader-BXPGFyeS.css","assets/StoryReader-D35TOYPV.js","assets/StoryStudio-CZWb9o8Q.js","assets/StoryStudio-CbyTV4QU.css","assets/chevron-left-B01oOfgD.js","assets/chevron-right-BrmCG1GM.js","assets/circle-check-Qe75qPTP.js","assets/clapperboard-BkFeoZlD.js","assets/export-CUbpFCfk.js","assets/export-DPtvFgRG.js","assets/freeVoice-BE4ocAgE.js","assets/index-CNyhTzb0.css","assets/index-CRdZ5zX0.js","assets/ort-wasm-simd-threaded-DcHrbrbl.wasm","assets/soundscapeStore-BjT-5O9q.js","assets/storyAi-CUSmnHF9.js","assets/studioIntent-LbrD79co.js","assets/trash-BQaS_-UR.js","assets/upload-C3ZoJSuG.js"]; /* __PRECACHE__ */

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
