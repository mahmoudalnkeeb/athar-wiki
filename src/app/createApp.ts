import { renderLayout } from '../components/WikiLayout.ts'
import { renderWikiArticle } from '../components/WikiArticle.ts'
import { renderWikiHome, renderWikiList } from '../components/WikiList.ts'
import { renderLoadError, renderLoading, renderNotFound } from '../components/StatusStates.ts'
import { getByCategory, getBySlug, registry, search } from '../data/registry.ts'
import { loadArticle } from '../lib/article-loader.ts'
import { isSlowConnection, onIdle } from '../lib/loader.ts'
import { getRoute, onRouteChange } from '../lib/router.ts'
import { brand } from '../data/brand.ts'
import type { Route } from '../lib/router.ts'
import type { WikiArticleDefinition } from '../data/types.ts'

export function mountApp(app: HTMLDivElement): void {
  const layout = renderLayout(app)
  const { mainEl } = layout
  let renderVersion = 0
  let cleanupArticle: (() => void) | undefined
  let cleanupView: (() => void) | undefined

  const handleRoute = async (route: Route): Promise<void> => {
    const currentRender = ++renderVersion

    cleanupArticle?.()
    cleanupArticle = undefined
    cleanupView?.()
    cleanupView = undefined
    layout.setArticleContext()
    layout.closeMenu(false)
    layout.setSearchQuery(route.name === 'search' ? route.q : '')
    layout.setRoute(route)
    updateDocumentTitle(route)
    mainEl.setAttribute('aria-busy', 'true')

    try {
      switch (route.name) {
        case 'home':
          cleanupView = renderWikiHome(mainEl, registry)
          break
        case 'all':
          renderWikiList(mainEl, registry, {
            title: 'كل المقالات',
            subtitle: 'تصفح الموسوعة كاملة. كل مقال يُحمَّل عند الطلب.',
          })
          break
        case 'category':
          renderWikiList(mainEl, getByCategory(route.category), {
            title: route.category,
            subtitle: `تصنيف: ${route.category}`,
            emptyText: `لا توجد مقالات في تصنيف "${route.category}" بعد.`,
          })
          break
        case 'search': {
          const entries = search(route.q)
          renderWikiList(mainEl, entries, {
            title: route.q ? `نتائج البحث: "${route.q}"` : 'البحث',
            subtitle: route.q ? `${entries.length} نتيجة` : 'اكتب كلمة للبحث في العناوين والملخصات والوسوم',
            emptyText: `لا توجد نتائج لـ "${route.q}"`,
          })
          break
        }
        case 'article': {
          const entry = getBySlug(route.slug)
          if (!entry) {
            updateDocumentTitle(route)
            renderNotFound(mainEl, `المقال غير موجود: "${route.slug}"`)
            break
          }

          layout.setRoute(route, entry.category)
          updateDocumentTitle(route, entry.title)
          renderLoading(mainEl, entry.title)
          try {
            const article = await loadArticle(entry)
            if (currentRender !== renderVersion) return
            updateDocumentTitle(route, article.title, article.summary, article)
            cleanupArticle = renderWikiArticle(mainEl, article, {
              onSidebarContext: layout.setArticleContext,
            })
          } catch (error) {
            if (currentRender !== renderVersion) return
            console.error(error)
            renderLoadError(mainEl, entry.slug, String(error))
          }
          break
        }
        case 'not-found':
          renderNotFound(mainEl, `الصفحة غير موجودة: ${route.path}`)
          break
      }
    } finally {
      if (currentRender !== renderVersion) return
      mainEl.setAttribute('aria-busy', 'false')
      mainEl.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
  }

  void handleRoute(getRoute())
  onRouteChange((route) => { void handleRoute(route) })

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      void navigator.serviceWorker.register('/sw.js').catch(() => {})
    })
  }

  if (!isSlowConnection()) {
    onIdle(() => {
      for (const entry of registry.slice(0, 2)) void entry.load().catch(() => {})
    })
  }
}

function updateDocumentTitle(
  route: Route,
  articleTitle?: string,
  description?: string,
  article?: WikiArticleDefinition,
): void {
  let title: string = brand.title
  switch (route.name) {
    case 'all':
      title = `كل المقالات | ${brand.name}`
      break
    case 'category':
      title = `${route.category} | ${brand.name}`
      break
    case 'search':
      title = route.q ? `البحث عن ${route.q} | ${brand.name}` : `البحث | ${brand.name}`
      break
    case 'article':
      title = `${articleTitle ?? route.slug} | ${brand.name}`
      break
    case 'not-found':
      title = `404 | ${brand.name}`
      break
  }
  const routeDescription = description ?? brand.description
  const isPrivateRoute = route.name === 'search' || route.name === 'not-found'
  document.title = title
  document.querySelector('meta[name="description"]')?.setAttribute('content', routeDescription)
  document.querySelector('meta[name="robots"]')?.setAttribute('content', isPrivateRoute ? 'noindex,follow' : 'index,follow')
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', routeDescription)
  document.querySelector('meta[property="og:type"]')?.setAttribute('content', route.name === 'article' ? 'article' : 'website')
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', location.href)

  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.append(canonical)
  }
  const canonicalUrl = new URL(location.href)
  canonicalUrl.hash = ''
  canonicalUrl.search = ''
  canonical.href = canonicalUrl.href

  const structuredData = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.summary,
        inLanguage: 'ar',
        url: location.href,
        mainEntityOfPage: location.href,
        datePublished: article.date,
        dateModified: article.lastReviewed ?? article.date,
        author: { '@type': 'Organization', name: article.author ?? brand.name },
        publisher: {
          '@type': 'Organization',
          name: brand.name,
          logo: { '@type': 'ImageObject', url: new URL('athar_logo.png', document.baseURI).href },
        },
        isAccessibleForFree: true,
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: brand.name,
        description: brand.description,
        inLanguage: 'ar',
        url: new URL(location.href).origin,
      }
  let jsonLd = document.querySelector<HTMLScriptElement>('#seo-structured-data')
  if (!jsonLd) {
    jsonLd = document.createElement('script')
    jsonLd.id = 'seo-structured-data'
    jsonLd.type = 'application/ld+json'
    document.head.append(jsonLd)
  }
  jsonLd.textContent = JSON.stringify(structuredData).replace(/</g, '\\u003c')
}
