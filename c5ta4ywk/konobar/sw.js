/* Konobar service worker – verzija 20261107d */
const CACHE = 'konobar-20261107d';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'ikona-192.png', 'ikona-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('konobar-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Firebase biblioteke (verzionirane, nepromjenjive): cache-first
  if (url.hostname === 'www.gstatic.com' && url.pathname.includes('/firebasejs/')) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res;
    }));
    return;
  }
  // Ostalo van sajta (Firestore, Auth, Storage, slike...) ne diramo
  if (url.origin !== location.origin) return;
  // Vlastiti fajlovi: prvo mreža (uvijek najnovije), pa keš kad nema interneta
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html', { ignoreSearch: true }) : Response.error()))));
});
