/* Service worker Atelier: приложение открывается без сети (оболочка и фото вещей из кэша), страницы сначала из сети.
   Версию CACHE меняем при каждом релизе, чтобы старый кэш очищался */
const CACHE = 'atelier-v2'
const SHELL = ['/app/', '/app/offline.html', '/icons/icon-192.png', '/icons/icon-512.png', '/favicon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return
  if (req.mode === 'navigate') {
    // страница: сеть 4 секунды, потом кэш, потом заглушка «Нет интернета»
    e.respondWith(
      Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))])
        .then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)); return r })
        .catch(() => caches.match(req).then((r) => r || caches.match('/app/') || caches.match('/app/offline.html')).then((r) => r || caches.match('/app/offline.html'))),
    )
    return
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)) } return r })),
  )
})
