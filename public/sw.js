/**
 * Minimal Service Worker — for bad connections & offline
 * Strategy:
 * - Precache: shell (index.html, manifest)
 * - Cache-first for assets (JS/CSS) — versioned by hash, safe to cache long
 * - Network-first for article chunks with cache fallback — so visited articles work offline
 * - No heavy precaching — keep install fast on 2G
 */
const CACHE = 'wiki-v1'
const SHELL = ['./', './index.html', './manifest.json', './athar_logo_without_wordmark.png']

function offlineResponse(request) {
  const acceptsHtml = request.headers.get('accept')?.includes('text/html')
  const body = acceptsHtml
    ? '<!doctype html><meta charset="utf-8"><title>أثر غير متاح مؤقتًا</title><p dir="rtl">تعذر الوصول إلى هذا المحتوى دون اتصال.</p>'
    : ''
  return new Response(body, {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': acceptsHtml ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8',
    },
  })
}

function cacheResponse(request, response) {
  void caches
    .open(CACHE)
    .then((c) => c.put(request, response))
    .catch(() => {})
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Only handle same-origin GET
  if (req.method !== 'GET' || url.origin !== location.origin) return

  // For hashed assets (e.g. /assets/*.js with hash) — cache-first
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit
        return fetch(req)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone()
              cacheResponse(req, clone)
            }
            return res
          })
          .catch(() => hit ?? offlineResponse(req))
      }),
    )
    return
  }

  // For navigations / article chunks — network-first with cache fallback
  event.respondWith(
    fetch(req)
      .then((res) => {
        // Cache successful responses
        if (
          res.ok &&
          (url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.html') ||
            url.pathname.endsWith('.json'))
        ) {
          const clone = res.clone()
          cacheResponse(req, clone)
        }
        return res
      })
      .catch(() =>
        caches
          .match(req)
          .then((hit) => hit ?? caches.match('./index.html'))
          .then((hit) => hit ?? offlineResponse(req)),
      ),
  )
})
