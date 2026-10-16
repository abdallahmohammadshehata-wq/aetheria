// Aetheria service worker: lets the app itself load with no network, which is what makes the offline audio and
// artwork packages usable on a plane. `vite build` stamps the build id and the list of built files into the two
// placeholders below; in development the worker is never registered.
//
//  - The whole build is precached on install (including the lazy screens), so every screen opens offline.
//  - Page loads go to the network first (always fresh when online) and fall back to the cached shell.
//  - Built assets and static files are served cache-first; Google Fonts are cached the first time they load.
//  - The free voices' engine files (ONNX Runtime, the Kokoro build, the espeak data) come from jsDelivr at exact versions,
//    which never change: they are kept the first time they load, so the voices work with no network afterwards.
//  - Everything else (Gemini, the image service, ...) is left alone and goes straight to the network.
//
// A new worker waits before taking over, so a running tab never has its files swapped underneath it: until every tab is
// closed, or until the page - after the reader presses Reload on the "new version is ready" notice - sends SKIP_WAITING.

const BUILD_ID = 'e6db908ba2'; /* __BUILD_ID__ */
const PRECACHE = ["assets/AnimationPlayer-Bn3ptaW7.js","assets/AnimationPlayer-CdzH2pbY.css","assets/Field-b5voMAZK.js","assets/FilmViewer-key7jIo4.css","assets/FilmViewer-pi9OComr.js","assets/OfflineSheet-Dgb6FYlh.js","assets/SettingsScreen-BCgYQgoT.css","assets/SettingsScreen-BvwAltb9.js","assets/StoryCard-Cg8ops1o.js","assets/StoryCard-wbc3AgRA.css","assets/StoryExplore-EBbApDKR.css","assets/StoryExplore-vs5CApHa.js","assets/StoryLibrary-BUE1e32C.css","assets/StoryLibrary-oswxxgZT.js","assets/StoryReader-BXPGFyeS.css","assets/StoryReader-DfUbTQkY.js","assets/StoryStudio-CbyTV4QU.css","assets/StoryStudio-D45wQN5M.js","assets/chevron-left-4JneL2b6.js","assets/chevron-right-BUHT8a79.js","assets/circle-check-BCRpDrZt.js","assets/clapperboard-A8yiMHjk.js","assets/export-C2k3xolA.js","assets/export-GdTV3gg2.js","assets/hfToken-JLmhMWjG.js","assets/index-BUnLsie7.js","assets/index-CNyhTzb0.css","assets/soundscapeStore-BAEwZSiA.js","assets/storyAi-DyXsmZCB.js","assets/storyWriter-CM-KwrMR.js","assets/studioIntent-Qi8jktdm.js","assets/trash-BGAjRx6c.js","assets/upload-CTroKhX_.js"]; /* __PRECACHE__ */

const SHELL_CACHE = `aetheria-shell-${BUILD_ID}`;
const FONT_CACHE = 'aetheria-fonts-v1';
const CDN_CACHE = 'aetheria-cdn-v1';
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
  } else if (url.hostname === 'cdn.jsdelivr.net' && /@\d+\.\d+\.\d+[^/]*\//.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CDN_CACHE));
  }
  // anything else: not intercepted
});
