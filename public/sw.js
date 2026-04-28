const CACHE = 'wave-ai-v6';
const OFFLINE_URLS = ['/'];

// ── Install: pre-cache shell ─────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ───────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for HTML, cache-first for static assets ─────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Never cache cross-origin requests (API calls, fonts CDN handled by browser)
  if (url.origin !== location.origin) return;

  // Never cache auth or API routes
  if (url.pathname.startsWith('/auth/') || url.pathname.startsWith('/api/')) return;

  // Navigation requests: network-first, fallback to cache root
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Cache fresh HTML
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match('/').then(r => r || new Response('Offline', { status: 503 })))
    );
    return;
  }

  // Static assets: cache-first, update in background
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(res => {
        if (res.ok && res.status < 400) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
