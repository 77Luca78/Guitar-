const CACHE_PREFIX = 'luca-guitar-interactive-';
const CACHE_VERSION = `${CACHE_PREFIX}5-1-1`;
const CORE = ['./','./index.html','./styles.css','./app.js','./mic-pro.js','./spotify-practice.html','./personal_catalog.json','./manifest.json'];
const OPTIONAL = ['./404.html','./icon.svg','./icon-180.png','./icon-192.png','./icon-512.png','./icon-1024.png','./ipad-pro-13-portrait.png','./ipad-pro-13-landscape.png'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_VERSION);
    await cache.addAll(CORE);
    await Promise.allSettled(OPTIONAL.map(async url=>{
      const response=await fetch(url,{cache:'reload'});
      if(response.ok)await cache.put(url,response);
    }));
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_VERSION).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirst(request,fallbackUrl){
  const cache=await caches.open(CACHE_VERSION);
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response?.ok)await cache.put(request,response.clone());
    return response;
  }catch{
    return (await cache.match(request))
      || (await cache.match(request,{ignoreSearch:true}))
      || (fallbackUrl?await cache.match(fallbackUrl):null);
  }
}

async function staleWhileRevalidate(request){
  const cache=await caches.open(CACHE_VERSION);
  const cached=(await cache.match(request)) || (await cache.match(request,{ignoreSearch:true}));
  const update=fetch(request).then(async response=>{
    if(response?.ok)await cache.put(request,response.clone());
    return response;
  }).catch(()=>null);
  return cached || await update || new Response('',{status:504,statusText:'Offline'});
}

function navigationFallback(url){
  return url.pathname.endsWith('/spotify-practice.html') || url.pathname.endsWith('spotify-practice.html')
    ? './spotify-practice.html'
    : './index.html';
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>await networkFirst(request,navigationFallback(url))||new Response('Offline. Bitte die App einmal vollständig online starten.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}}))());
    return;
  }
  const isCode=/\.(?:js|css|json)$/.test(url.pathname);
  event.respondWith(isCode?networkFirst(request):staleWhileRevalidate(request));
});

self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
