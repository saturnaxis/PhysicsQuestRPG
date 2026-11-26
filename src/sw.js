'use strict';

// BEGIN GENERATED PRECACHE
const buildVersion = "0bce2fff038cc1f647e1";
const assets = [
  "art/cart.png",
  "art/foreground.png",
  "art/guardian-comic.webp",
  "art/guardian.png",
  "art/inez-directions.png",
  "art/mira-directions.png",
  "art/nacre-arrival.webp",
  "art/observatory-failure.webp",
  "art/observatory-night.webp",
  "art/portraits/ada.webp",
  "art/portraits/alex.webp",
  "art/portraits/ari.webp",
  "art/portraits/bea.webp",
  "art/portraits/dev.webp",
  "art/portraits/eli.webp",
  "art/portraits/elio.webp",
  "art/portraits/ellis.webp",
  "art/portraits/fen.webp",
  "art/portraits/finn.webp",
  "art/portraits/inez-concerned.webp",
  "art/portraits/inez-happy.webp",
  "art/portraits/inez-thinking.webp",
  "art/portraits/inez.webp",
  "art/portraits/jo.webp",
  "art/portraits/joss.webp",
  "art/portraits/june.webp",
  "art/portraits/kez.webp",
  "art/portraits/kit.webp",
  "art/portraits/leah.webp",
  "art/portraits/lena.webp",
  "art/portraits/lin.webp",
  "art/portraits/mina.webp",
  "art/portraits/mira-celebratory.webp",
  "art/portraits/mira-concerned.webp",
  "art/portraits/mira-determined.webp",
  "art/portraits/mira-explaining.webp",
  "art/portraits/mira-happy.webp",
  "art/portraits/mira-relieved.webp",
  "art/portraits/mira-surprised.webp",
  "art/portraits/mira-thinking.webp",
  "art/portraits/mira.webp",
  "art/portraits/neri.webp",
  "art/portraits/nia.webp",
  "art/portraits/niko.webp",
  "art/portraits/noah.webp",
  "art/portraits/orin.webp",
  "art/portraits/owen.webp",
  "art/portraits/pax.webp",
  "art/portraits/priya.webp",
  "art/portraits/ren.webp",
  "art/portraits/rory.webp",
  "art/portraits/rowan-concerned.webp",
  "art/portraits/rowan-happy.webp",
  "art/portraits/rowan-thinking.webp",
  "art/portraits/rowan.webp",
  "art/portraits/sage-concerned.webp",
  "art/portraits/sage-happy.webp",
  "art/portraits/sage-thinking.webp",
  "art/portraits/sage.webp",
  "art/portraits/sam.webp",
  "art/portraits/sana.webp",
  "art/portraits/sol-concerned.webp",
  "art/portraits/sol-happy.webp",
  "art/portraits/sol-thinking.webp",
  "art/portraits/sol.webp",
  "art/portraits/suri.webp",
  "art/portraits/tali.webp",
  "art/portraits/tamsin.webp",
  "art/portraits/teo.webp",
  "art/portraits/tess.webp",
  "art/portraits/uma.webp",
  "art/portraits/vega-explaining.webp",
  "art/portraits/vega.webp",
  "art/portraits/vela-happy.webp",
  "art/portraits/vela.webp",
  "art/portraits/zoe.webp",
  "art/receiver.png",
  "art/room-0.webp",
  "art/room-1.webp",
  "art/room-10.webp",
  "art/room-11.webp",
  "art/room-12.webp",
  "art/room-13.webp",
  "art/room-14.webp",
  "art/room-15.webp",
  "art/room-16.webp",
  "art/room-17.webp",
  "art/room-18.webp",
  "art/room-19.webp",
  "art/room-2.webp",
  "art/room-20.webp",
  "art/room-21.webp",
  "art/room-22.webp",
  "art/room-23.webp",
  "art/room-3.webp",
  "art/room-4.webp",
  "art/room-5.webp",
  "art/room-6.webp",
  "art/room-7.webp",
  "art/room-8.webp",
  "art/room-9.webp",
  "art/rowan-directions.png",
  "art/sage-directions.png",
  "art/teo-directions.png",
  "art/valley.webp",
  "audio/music-manager.js",
  "audio/music/challenge_room.flac",
  "audio/music/mechanics_exterior.flac",
  "audio/music/mechanics_interior.flac",
  "audio/music/observatory_challenge.flac",
  "audio/music/observatory_lobby.flac",
  "audio/music/observatory_signal.flac",
  "audio/music/observatory_study.flac",
  "audio/music/overworld.flac",
  "comic.webp",
  "field-events.js",
  "gameplay.js",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "index.html",
  "manifest.webmanifest",
  "observatory.js",
  "portraits.js",
  "pwa-layout.css",
  "pwa.js",
  "quest-extras.js",
  "scenery.js",
  "science-labs.js",
  "study-labs.js",
  "update.html",
  "valley-investigations.js"
];
// END GENERATED PRECACHE

const scope = new URL(self.registration.scope);
const cachePrefix = 'physicsquest:mechanics-castle:' + scope.pathname + ':';
const cacheName = cachePrefix + buildVersion;
const home = scope.href;
const index = new URL('index.html', scope).href;
const updatePage = new URL('update.html', scope).href;
const audio = new Set(assets.filter(path => path.endsWith('.flac')).map(path => new URL(path, scope).href));
// Static hosts may redirect index.html. Cache the canonical launch URL directly.
const precache = new Set(assets.map(path => path === 'index.html' ? home : new URL(path, scope).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    // Reload fresh files from the host, even if the browser has an older HTTP cache.
    const required = [...precache].filter(url => !audio.has(url) && url !== updatePage);
    await cache.addAll(required.map(url => new Request(url, { cache: 'reload', redirect: url === home ? 'error' : 'follow' })));
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'activate-update') event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(cachePrefix) && key !== cacheName).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('Range')) return;
  const url = new URL(request.url);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  const assetUrl = new URL(url.pathname, scope).href;
  const key = assetUrl === index ? home : assetUrl;
  if (key === updatePage || !precache.has(key)) return;

  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(key);
    if (cached && !(request.mode === 'navigate' && cached.redirected)) return cached;
    const response = await fetch(request);
    if (audio.has(key) && response.status === 200 && !response.redirected) {
      try { await cache.put(key, response.clone()); } catch {}
    }
    return response;
  })());
});
