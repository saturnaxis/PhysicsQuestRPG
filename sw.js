'use strict';

// BEGIN GENERATED PRECACHE
const buildVersion = "6d8438f60792c2e6455b";
const assets = [
  "art/cart.png",
  "art/foreground.png",
  "art/guardian-comic.webp",
  "art/guardian.png",
  "art/inez-directions.png",
  "art/inez.png",
  "art/mira-directions.png",
  "art/mira.png",
  "art/portraits/ada.webp",
  "art/portraits/alex.webp",
  "art/portraits/ari.webp",
  "art/portraits/bea.webp",
  "art/portraits/dev.webp",
  "art/portraits/eli.webp",
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
  "art/portraits/noah.webp",
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
  "art/portraits/sol-concerned.webp",
  "art/portraits/sol-happy.webp",
  "art/portraits/sol-thinking.webp",
  "art/portraits/sol.webp",
  "art/portraits/tali.webp",
  "art/portraits/teo.webp",
  "art/portraits/tess.webp",
  "art/portraits/uma.webp",
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
  "art/rowan.png",
  "art/sage-directions.png",
  "art/sage.png",
  "art/teo-directions.png",
  "art/teo.png",
  "art/valley.webp",
  "audio/music-manager.js",
  "audio/music/challenge_room.flac",
  "audio/music/mechanics_exterior.flac",
  "audio/music/mechanics_interior.flac",
  "audio/music/overworld.flac",
  "comic.webp",
  "gameplay.js",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "index.html",
  "manifest.webmanifest",
  "portraits.js",
  "pwa.js",
  "scenery.js",
  "science-labs.js",
  "valley-investigations.js"
];
// END GENERATED PRECACHE

const scope = new URL(self.registration.scope);
const cachePrefix = 'physicsquest:mechanics-castle:' + scope.pathname + ':';
const cacheName = cachePrefix + buildVersion;
const precache = new Set(assets.map(path => new URL(path, scope).href));
const home = new URL('index.html', scope).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    // Reload fresh files from the host, even if the browser has an older HTTP cache.
    await cache.addAll([...precache].map(url => new Request(url, { cache: 'reload' })));
  })());
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
  const key = request.mode === 'navigate' && url.pathname === scope.pathname ? home : assetUrl;
  if (!precache.has(key)) return;

  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    return (await cache.match(key)) ?? fetch(request);
  })());
});
