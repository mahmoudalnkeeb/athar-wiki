/**
 * Minimal hash router مناسب للويكي بلا خادم.
 * Works on file://, GitHub Pages, and static hosts without server rewrites.
 *
 * Routes:
 *   #/              → home
 *   #/wiki/:slug    → article
 *   #/category/:name→ category listing
 *   #/search?q=...  -> search
 *   #/wiki          → all articles
 */

export type Route =
  | { name: 'home' }
  | { name: 'article'; slug: string }
  | { name: 'category'; category: string }
  | { name: 'search'; q: string }
  | { name: 'all' }
  | { name: 'not-found'; path: string }

function parseHash(hash: string): Route {
  // Hash examples: "#/wiki/article-slug" and "#/search?q=بحث".
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  const [pathnameRaw, searchRaw] = raw.split('?')
  const pathname = pathnameRaw || '/'
  const params = new URLSearchParams(searchRaw ?? '')

  if (pathname === '/' || pathname === '') return { name: 'home' }
  if (pathname === '/wiki') return { name: 'all' }
  if (pathname.startsWith('/wiki/')) {
    const slug = decodeURIComponent(pathname.slice('/wiki/'.length))
    if (slug) return { name: 'article', slug }
  }
  if (pathname.startsWith('/category/')) {
    const cat = decodeURIComponent(pathname.slice('/category/'.length))
    if (cat) return { name: 'category', category: cat }
  }
  if (pathname === '/search') {
    return { name: 'search', q: params.get('q') ?? '' }
  }
  return { name: 'not-found', path: pathname }
}

export function getRoute(): Route {
  return parseHash(location.hash)
}

export function toHash(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/'
    case 'all':
      return '#/wiki'
    case 'article':
      return `#/wiki/${encodeURIComponent(route.slug)}`
    case 'category':
      return `#/category/${encodeURIComponent(route.category)}`
    case 'search':
      return `#/search?q=${encodeURIComponent(route.q)}`
    case 'not-found':
      return `#${route.path}`
  }
}

export function navigate(route: Route, opts?: { replace?: boolean }): void {
  const hash = toHash(route)
  if (opts?.replace) history.replaceState(null, '', hash)
  else location.hash = hash
}

export function onRouteChange(cb: (route: Route) => void): () => void {
  const handler = (): void => cb(getRoute())
  window.addEventListener('hashchange', handler)
  // Also popstate for replaceState
  window.addEventListener('popstate', handler)
  return () => {
    window.removeEventListener('hashchange', handler)
    window.removeEventListener('popstate', handler)
  }
}

/** Prefetch an article through the loader supplied by the registry. */
export function prefetchArticle(load: () => Promise<unknown>): void {
  const doPrefetch = (): void => {
    void load().catch(() => {})
  }
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void })
    .requestIdleCallback
  if (ric) ric(doPrefetch)
  else setTimeout(doPrefetch, 300)
}
