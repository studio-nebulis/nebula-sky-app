// Cache simple : l'appli et ses catalogues restent disponibles hors réseau.
// Page d'accueil : réseau d'abord, pour qu'une nouvelle version s'affiche dès son arrivée.
// Le reste : réponse immédiate depuis le cache, mise à jour en arrière-plan.
// Changer CACHE à chaque publication : l'ancien cache (vieux fichiers compris) est effacé.
const CACHE = 'nebulasky-20261121T0120';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // Lecture audio par morceaux (en-tête Range) : laissée au navigateur, une réponse partielle ne se met pas en cache.
  if (req.headers.has('range')) return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(req);
    const fresh = fetch(req).then((res) => {
      if (res.status === 200) cache.put(req, res.clone()).catch(() => {});
      return res;
    }).catch(() => cached || Response.error());
    if (req.mode === 'navigate') return fresh;
    return cached || fresh;
  }));
});
