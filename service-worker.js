const CACHE = 'luca-guitar-github-pages-v1';
const CORE = [
  './','./index.html','./styles.css','./app.js','./manifest.json','./icon.svg',
  './personal_catalog.json',
  './icon-180.png','./icon-192.png','./icon-512.png','./icon-1024.png',
  './ipad-pro-13-portrait.png','./ipad-pro-13-landscape.png'
];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method !== 'GET') return;
  const url = new URL(request.url);
  if(url.origin !== self.location.origin) return;

  if(request.mode === 'navigate'){
    event.respondWith((async()=>{
      const cached = await caches.match('./index.html');
      const fresh = fetch(request).then(async response => {
        if(response && response.ok){const cache=await caches.open(CACHE);await cache.put('./index.html',response.clone())}
        return response;
      }).catch(()=>null);
      return cached || await fresh || new Response('Offline. Bitte die App einmal vollständig online starten.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached = await caches.match(request);
    if(cached){
      event.waitUntil(fetch(request).then(async response=>{if(response&&response.ok){const cache=await caches.open(CACHE);await cache.put(request,response.clone())}}).catch(()=>null));
      return cached;
    }
    try{
      const response=await fetch(request);
      if(response&&response.ok){const cache=await caches.open(CACHE);await cache.put(request,response.clone())}
      return response;
    }catch{
      return new Response('',{status:504,statusText:'Offline'});
    }
  })());
});
self.addEventListener('message', event => {if(event.data === 'SKIP_WAITING') self.skipWaiting()});
