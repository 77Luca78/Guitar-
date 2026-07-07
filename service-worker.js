const CACHE = 'luca-guitar-github-pages-v3-microphone-pro';
const CORE = [
  './','./index.html','./styles.css','./app.js','./mic-pro.js','./manifest.json','./icon.svg',
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

async function injectMicrophonePro(response){
  if(!response) return response;
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html')) return response;
  let html=await response.text();
  if(!html.includes('mic-pro.js')){
    html=html.replace(/<\/body>/i,'<script src="mic-pro.js"><\/script>\n<\/body>');
  }
  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=utf-8');
  headers.set('x-luca-microphone-pro','enabled');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method !== 'GET') return;
  const url = new URL(request.url);
  if(url.origin !== self.location.origin) return;

  if(request.mode === 'navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      let response=null;
      try{
        response=await fetch(request,{cache:'no-store'});
        if(response&&response.ok)await cache.put('./index.html',response.clone());
      }catch{}
      if(!response||!response.ok)response=await cache.match('./index.html');
      if(!response)response=new Response('Offline. Bitte die App einmal vollständig online starten.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      return injectMicrophonePro(response);
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached = await caches.match(request);
    if(cached){
      event.waitUntil(fetch(request).then(async response=>{
        if(response&&response.ok){const cache=await caches.open(CACHE);await cache.put(request,response.clone())}
      }).catch(()=>null));
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

self.addEventListener('message', event => {
  if(event.data === 'SKIP_WAITING') self.skipWaiting();
});