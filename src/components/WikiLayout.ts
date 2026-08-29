/**
 * WikiLayout: الهيكل العام للموسوعة
 * Reusable layout: header + sidebar + main + footer
 * Islamic design: manuscript header, emerald typography, gold accents
 */
import { getCategories, registry } from '../data/registry.ts'
import { navigate } from '../lib/router.ts'
import { escapeHtml } from '../lib/dom.ts'
import { showToast } from '../lib/feedback.ts'
import { brand } from '../data/brand.ts'
import type { Route } from '../lib/router.ts'
import type { TocItem } from '../data/types.ts'
import { createIcons, Menu, Search, X } from 'lucide'

export interface ArticleSidebarContext {
  slug: string
  category: string
  toc: TocItem[]
}

export interface LayoutController {
  mainEl: HTMLElement
  searchInputs: HTMLInputElement[]
  sidebarEl: HTMLElement
  closeMenu: (restoreFocus?: boolean) => void
  setRoute: (route: Route, category?: string) => void
  setArticleContext: (context?: ArticleSidebarContext) => void
  setSearchQuery: (query: string) => void
}

export function renderLayout(shell: HTMLElement): LayoutController {
  const cacheControl = import.meta.env.DEV
    ? '<a href="#" id="clear-cache-link">مسح التخزين المؤقت</a>'
    : ''

  shell.innerHTML = `
    <a class="skip-link" href="#main-content">تخطَّ إلى المحتوى</a>
    <div class="arabesque-bar" aria-hidden="true"></div>

    <header class="wiki-header" role="banner">
      <div class="wiki-header__inner">
        <a href="#/" class="wiki-brand" aria-label="العودة إلى أثر">
          <img class="wiki-brand__logo wiki-brand__logo--wordmark" src="/athar_logo.png" alt="" width="2172" height="724" />
          <img class="wiki-brand__logo wiki-brand__logo--mark" src="/athar_logo_without_wordmark.png" alt="" width="1254" height="1254" />
          <span class="wiki-brand__descriptor">${brand.descriptor}</span>
        </a>

        <div class="wiki-header__actions">
          <div class="wiki-search wiki-search--header" role="search">
            <label for="wiki-search-input" class="sr-only">ابحث في الموسوعة</label>
            <i class="wiki-search__icon" data-lucide="search" aria-hidden="true"></i>
            <input
              id="wiki-search-input"
              data-wiki-search
              class="wiki-search__input"
              type="search"
              inputmode="search"
              name="q"
              placeholder="ابحث في أثر…"
              autocomplete="off"
              spellcheck="false"
              aria-label="ابحث في الموسوعة"
            />
          </div>
          <button class="wiki-menu-btn" id="menu-toggle" type="button" aria-expanded="false" aria-controls="wiki-sidebar" aria-label="فتح القائمة"><i data-lucide="menu" aria-hidden="true"></i><span class="wiki-action__label">القائمة</span></button>
        </div>
      </div>
      <div class="wiki-reading-progress" aria-hidden="true">
        <span class="wiki-reading-progress__bar"></span>
      </div>
    </header>

    <div class="wiki-drawer-backdrop" id="menu-backdrop" aria-hidden="true"></div>

    <div class="wiki-shell">
      <aside id="wiki-sidebar" class="wiki-sidebar" aria-label="التنقل">
        <div class="wiki-sidebar__inner">
          <div class="wiki-drawer__header">
            <div>
              <p class="wiki-drawer__eyebrow">أثر</p>
              <p class="wiki-drawer__title">القائمة</p>
            </div>
            <button class="wiki-drawer__close" id="menu-close" type="button" aria-label="إغلاق القائمة">
              <i data-lucide="x" aria-hidden="true"></i>
            </button>
          </div>
          <nav class="wiki-nav" aria-label="الأقسام">
          <div class="wiki-search wiki-search--drawer" role="search">
            <label for="wiki-mobile-search-input" class="sr-only">ابحث في الموسوعة</label>
            <i class="wiki-search__icon" data-lucide="search" aria-hidden="true"></i>
            <input
              id="wiki-mobile-search-input"
              data-wiki-search
              class="wiki-search__input"
              type="search"
              inputmode="search"
              name="q"
              placeholder="ابحث عن شخصية، مدينة، حدث، أو موضوع…"
              autocomplete="off"
              spellcheck="false"
              aria-label="ابحث في الموسوعة"
            />
          </div>
          <a href="#/" class="wiki-nav__home">الرئيسية</a>
          <a href="#/wiki" class="wiki-nav__all">كل المقالات <span class="badge">${registry.length.toLocaleString('ar-EG')}</span></a>
          <div class="wiki-nav__global-categories">
            <div class="gold-divider" role="separator"></div>
            <h2 class="wiki-nav__heading">التصنيفات</h2>
            <ul class="wiki-nav__list" id="category-list"></ul>
          </div>
          <section class="wiki-article-nav" id="article-sidebar-navigation" aria-labelledby="article-sidebar-title" hidden>
            <div class="gold-divider" role="separator"></div>
            <h2 class="wiki-nav__heading">التصنيف</h2>
            <a class="wiki-article-nav__category" id="article-sidebar-category" href="#/"></a>
            <div class="wiki-article-nav__toc" id="article-sidebar-toc-group">
              <div class="gold-divider" role="separator"></div>
              <h2 class="wiki-nav__heading" id="article-sidebar-title">في هذا المقال</h2>
              <ol class="wiki-article-nav__list" id="article-sidebar-toc"></ol>
            </div>
          </section>
          </nav>
        </div>
      </aside>

      <main id="main-content" class="wiki-main" tabindex="-1"></main>
    </div>

    <footer class="wiki-footer">
      <div class="bismillah-divider pattern-heavy" aria-hidden="true"><span class="dot"></span> <span>${brand.slogan}</span> <span class="dot"></span></div>
      <div class="wiki-footer__inner">
        <div class="wiki-footer__identity">
          <p class="wiki-footer__text">${brand.footerDescription}</p>
        </div>
        <nav class="wiki-footer__nav" aria-label="روابط التذييل">
          <a href="#/wiki">تصفح كل المقالات</a>
          <span id="footer-count">${registry.length === 0 ? 'لا توجد مقالات بعد' : registry.length === 1 ? 'مقال واحد' : registry.length === 2 ? 'مقالان' : registry.length <= 10 ? registry.length + ' مقالات' : registry.length + ' مقالاً'}</span>
          ${cacheControl}
        </nav>
      </div>
    </footer>
  `

  // Categories
  const catList = shell.querySelector<HTMLUListElement>('#category-list')!
  const cats = getCategories()
  if (cats.length === 0) {
    catList.innerHTML = `<li class="wiki-nav__empty">لا توجد تصنيفات بعد. أضف أول مقال من <code>src/articles/</code></li>`
  } else {
    catList.innerHTML = cats
      .map(
        (c) =>
          `<li><a href="#/category/${encodeURIComponent(c)}" data-category-link>${escapeHtml(c)}</a></li>`,
      )
      .join('')
  }

  // Search wiring: both responsive locations share one URL-driven query.
  const searchInputs = Array.from(shell.querySelectorAll<HTMLInputElement>('[data-wiki-search]'))
  let t: number | undefined
  const setSearchQuery = (query: string): void => {
    window.clearTimeout(t)
    searchInputs.forEach((input) => {
      input.value = query
    })
  }
  const handleSearchInput = (input: HTMLInputElement): void => {
    searchInputs.forEach((other) => {
      if (other !== input) other.value = input.value
    })
    window.clearTimeout(t)
    t = window.setTimeout(() => {
      const q = input.value.trim()
      if (q) navigate({ name: 'search', q })
      else if (location.hash.startsWith('#/search')) navigate({ name: 'home' })
    }, 500)
  }
  searchInputs.forEach((input) => {
    input.addEventListener('input', () => handleSearchInput(input))
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        window.clearTimeout(t)
        const q = input.value.trim()
        if (q) navigate({ name: 'search', q })
      }
    })
  })

  // Mobile drawer
  const menuBtn = shell.querySelector<HTMLButtonElement>('#menu-toggle')!
  const closeBtn = shell.querySelector<HTMLButtonElement>('#menu-close')!
  const sidebar = shell.querySelector<HTMLElement>('#wiki-sidebar')!
  const backdrop = shell.querySelector<HTMLElement>('#menu-backdrop')!
  const refreshIcons = (): void => {
    createIcons({ icons: { Menu, Search, X } })
  }
  refreshIcons()

  const isMobile = (): boolean => window.matchMedia('(max-width: 1199px)').matches
  const setInert = (element: HTMLElement, inert: boolean): void => {
    if ('inert' in element) element.inert = inert
  }
  const syncDrawerMode = (): void => {
    const mobile = isMobile()
    const open = sidebar.classList.contains('is-open')
    setInert(sidebar, mobile && !open)
    sidebar.setAttribute('aria-hidden', String(mobile && !open))
    if (!mobile) {
      sidebar.classList.remove('is-open')
      backdrop.classList.remove('is-visible')
      document.body.classList.remove('drawer-open')
      menuBtn.removeAttribute('aria-hidden')
      menuBtn.removeAttribute('tabindex')
      menuBtn.setAttribute('aria-expanded', 'false')
      menuBtn.setAttribute('aria-label', 'فتح القائمة')
      menuBtn.querySelector<HTMLElement>('[data-lucide]')?.setAttribute('data-lucide', 'menu')
      refreshIcons()
    }
  }
  const closeMenu = (restoreFocus = true): void => {
    sidebar.classList.remove('is-open')
    backdrop.classList.remove('is-visible')
    document.body.classList.remove('drawer-open')
    setInert(sidebar, isMobile())
    sidebar.setAttribute('aria-hidden', String(isMobile()))
    menuBtn.removeAttribute('aria-hidden')
    menuBtn.removeAttribute('tabindex')
    menuBtn.setAttribute('aria-expanded', 'false')
    menuBtn.setAttribute('aria-label', 'فتح القائمة')
    menuBtn.querySelector<HTMLElement>('[data-lucide]')?.setAttribute('data-lucide', 'menu')
    refreshIcons()
    if (restoreFocus) menuBtn.focus()
  }
  const openMenu = (): void => {
    sidebar.classList.add('is-open')
    backdrop.classList.add('is-visible')
    document.body.classList.add('drawer-open')
    setInert(sidebar, false)
    sidebar.setAttribute('aria-hidden', 'false')
    menuBtn.setAttribute('aria-hidden', 'true')
    menuBtn.tabIndex = -1
    menuBtn.setAttribute('aria-expanded', 'true')
    menuBtn.setAttribute('aria-label', 'إغلاق القائمة')
    menuBtn.querySelector<HTMLElement>('[data-lucide]')?.setAttribute('data-lucide', 'x')
    refreshIcons()
    window.requestAnimationFrame(() =>
      sidebar.querySelector<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])')?.focus(),
    )
  }
  const toggleMenu = (): void => {
    if (sidebar.classList.contains('is-open')) closeMenu()
    else openMenu()
  }
  menuBtn.addEventListener('click', toggleMenu)
  closeBtn.addEventListener('click', () => closeMenu())
  backdrop.addEventListener('click', () => closeMenu())

  const handleDrawerKeydown = (e: KeyboardEvent): void => {
    if (!sidebar.classList.contains('is-open') || !isMobile()) return
    if (e.key === 'Escape') {
      e.preventDefault()
      closeMenu()
      return
    }
    if (e.key !== 'Tab') return
    const focusable = Array.from(
      sidebar.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
  document.addEventListener('keydown', handleDrawerKeydown)
  window.addEventListener('resize', syncDrawerMode)

  // Close sidebar when navigating (mobile), without stealing focus from the new route.
  shell.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (target.closest('a[href^="#"]')) {
      closeMenu(false)
    }
  })

  syncDrawerMode()

  // Clear cache link for bad-connection debugging
  shell.querySelector('#clear-cache-link')?.addEventListener('click', (e) => {
    e.preventDefault()
    if ('caches' in window) {
      void caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => {
          showToast('تم مسح التخزين المؤقت.', shell)
          location.reload()
        })
    } else {
      localStorage.clear()
      showToast('تم المسح.', shell)
    }
  })

  const mainEl = shell.querySelector<HTMLElement>('.wiki-main')!
  const sidebarEl = sidebar
  const articleNav = shell.querySelector<HTMLElement>('#article-sidebar-navigation')!
  const articleCategory = shell.querySelector<HTMLAnchorElement>('#article-sidebar-category')!
  const articleTocGroup = shell.querySelector<HTMLElement>('#article-sidebar-toc-group')!
  const articleToc = shell.querySelector<HTMLOListElement>('#article-sidebar-toc')!
  const setArticleContext = (context?: ArticleSidebarContext): void => {
    shell.toggleAttribute('data-article-context', Boolean(context))
    if (!context) {
      articleNav.hidden = true
      articleCategory.textContent = ''
      articleToc.replaceChildren()
      return
    }

    articleCategory.href = `#/category/${encodeURIComponent(context.category)}`
    articleCategory.textContent = context.category
    articleTocGroup.hidden = context.toc.length === 0
    articleToc.innerHTML = context.toc
      .map(
        (item) => `
      <li class="wiki-article-nav__item wiki-article-nav__item--${item.level}">
        <a href="#/wiki/${encodeURIComponent(context.slug)}?section=${encodeURIComponent(item.id)}" data-article-section="${escapeHtml(item.id)}">${escapeHtml(item.title)}</a>
      </li>
    `,
      )
      .join('')
    articleNav.hidden = false
  }
  const setRoute = (route: Route, category?: string): void => {
    shell.dataset.route = route.name
    const currentCategory =
      route.name === 'category' ? route.category : route.name === 'article' ? category : null
    const links: Array<[HTMLElement, boolean]> = [
      [shell.querySelector<HTMLElement>('.wiki-nav__home')!, route.name === 'home'],
      [shell.querySelector<HTMLElement>('.wiki-nav__all')!, route.name === 'all'],
    ]
    for (const link of shell.querySelectorAll<HTMLElement>('[data-category-link]')) {
      const active = currentCategory !== null && link.textContent?.trim() === currentCategory
      links.push([link, Boolean(active)])
    }
    for (const [link, active] of links) {
      link.classList.toggle('is-active', active)
      if (active) link.setAttribute('aria-current', 'page')
      else link.removeAttribute('aria-current')
    }
  }
  return {
    mainEl,
    searchInputs,
    sidebarEl,
    closeMenu,
    setRoute,
    setArticleContext,
    setSearchQuery,
  }
}
