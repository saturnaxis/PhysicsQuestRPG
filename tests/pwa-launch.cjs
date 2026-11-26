'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('docs/sw.js', 'utf8');

async function checkLaunch(scope) {
 const listeners = new Map();
 const cached = new Map();
 const home = new URL(scope).href;
 const alias = new URL('index.html', scope).href;
 const installed = [];
 const fetched = [];
 let skipped = false;
 let online = true;
 const freshPage = {redirected: false, page: 'fresh'};
 const audio = new URL('audio/music/observatory_lobby.flac', scope).href;
 const track = {status:200,redirected:false,clone(){return this;}};
 const redirectPage = {redirected: true, page: 'redirect'};
 const offlinePage = {redirected: false, page: 'cached'};
 const cache = {
  async addAll(requests) {
   for (const request of requests) {
    installed.push(request.url);
    if (request.url === home) {
     assert.equal(request.redirect, 'error');
     cached.set(request.url, offlinePage);
    }
    if (request.url === alias) cached.set(request.url, redirectPage);
    for (const script of ['observatory.js','field-events.js']) {
     if (request.url === new URL(script, scope).href) {
      cached.set(request.url, {script: fs.readFileSync('docs/'+script,'utf8')});
     }
    }
   }
  },
  async match(url) { return cached.get(url); },
  async put(url,response) { cached.set(url,response); }
 };
 vm.runInNewContext(source, {
  URL, Request,
  self: {registration: {scope}, addEventListener: (event, listener) => listeners.set(event, listener), async skipWaiting(){skipped=true;}},
  caches: {open: async () => cache},
  fetch: async request => {
   fetched.push(request.url);
   if (!online) throw new Error('Network unavailable');
   return request.url===audio?track:freshPage;
  },
 });
 let done;
 listeners.get('install')({waitUntil: promise => { done = promise; }});
 await done;
 assert.ok(installed.includes(home));
 assert.ok(!installed.includes(alias));
 assert.ok(!installed.includes(audio));
 assert.ok(!installed.includes(new URL('update.html', scope).href));
 listeners.get('message')({data:'activate-update',waitUntil:promise=>{done=promise;}});
 await done;
 assert.equal(skipped,true);
 for (const path of ['field-events.js','quest-extras.js','art/observatory-night.webp','art/observatory-failure.webp','art/nacre-arrival.webp']) {
  assert.ok(installed.includes(new URL(path, scope).href), path+' is available offline');
 }
 for (const name of ['elio','kez','niko','orin','sana','suri','tamsin','vega','vega-explaining','vela','vela-happy']) {
  assert.ok(installed.includes(new URL('art/portraits/'+name+'.webp', scope).href), name+' is available offline');
 }

 function navigate(url) {
  let response;
  const request = {url, mode: 'navigate', method: 'GET', headers: new Headers()};
  listeners.get('fetch')({request, respondWith: promise => { response = promise; }});
  return response;
 }
 assert.equal(navigate(new URL('update.html', scope).href),undefined);
 assert.equal(await navigate(audio),track);
 assert.equal(await navigate(audio),track);
 assert.equal(fetched.filter(url=>url===audio).length,1);
 online = false;
 const offlineObservatory=(await navigate(new URL('observatory.js', scope).href)).script;
 assert.match(offlineObservatory,/function reportEvidence/);
 assert.match(offlineObservatory,/study-followup-/);
 assert.match((await navigate(new URL('field-events.js', scope).href)).script,/function dispatch/);
 assert.equal(await navigate(home), offlinePage);
 assert.equal(await navigate(home+'?test=observatory'), offlinePage);
 assert.equal(await navigate(alias), offlinePage);
 online = true;
 cached.set(home, redirectPage);
 assert.equal(await navigate(home), freshPage);
}

(async () => {
 await checkLaunch('https://example.test/');
 await checkLaunch('https://example.test/PhysicsQuest/');
 console.log('Passed canonical launch caching, Observatory test link, offline launch and Observatory scripts, and unsafe redirect fallback.');
})().catch(error => { console.error(error); process.exitCode = 1; });
