/**
 * WikiList: قائمة مقالات / شبكة بطاقات
 * Renders a responsive grid of wiki cards with empty state.
 */
import type { RegistryEntry } from '../data/types.ts'
import { wikiCard, wikiFeaturedCard, attachCardPrefetch } from './WikiCard.ts'
import { observeLazyImages } from '../lib/loader.ts'
import { escapeHtml } from '../lib/dom.ts'
import { brand } from '../data/brand.ts'
import { navigate } from '../lib/router.ts'
import { createIcons, Search } from 'lucide'

const LIST_BATCH_SIZE = 12

export function renderWikiList(
  container: HTMLElement,
  entries: RegistryEntry[],
  opts: { title?: string; subtitle?: string; emptyText?: string } = {},
): void {
  if (entries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__mark" aria-hidden="true">◈</div>
        <h1 class="empty-state__title">${escapeHtml(opts.title ?? 'لا توجد نتائج')}</h1>
        <p class="empty-state__text">${escapeHtml(opts.emptyText ?? 'جرّب كلمات بحث أخرى أو تصفح التصنيفات.')}</p>
        <a href="#/" class="btn btn--primary">العودة للرئيسية</a>
      </div>
    `
    return
  }

  const orderedEntries = [...entries].sort(
    (a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.title.localeCompare(b.title, 'ar'),
  )

  container.innerHTML = `
    ${
      opts.title
        ? `
      <header class="list-header corner-ornament">
        <h1 class="list-header__title">${escapeHtml(opts.title)}</h1>
        ${opts.subtitle ? `<p class="list-header__subtitle">${escapeHtml(opts.subtitle)}</p>` : ''}
        <p class="list-header__count">${arabicCount(entries.length)}</p>
      </header>
    `
        : ''
    }
    ${
      orderedEntries.length === 1
        ? `<div class="list-featured">${wikiFeaturedCard(orderedEntries[0])}</div>`
        : `<div class="wiki-grid wiki-grid--listing" id="article-list" role="list">
          ${orderedEntries.map((e, index) => `<div role="listitem" data-list-item${index >= LIST_BATCH_SIZE ? ' hidden' : ''}>${wikiCard(e)}</div>`).join('')}
        </div>
        ${
          orderedEntries.length > LIST_BATCH_SIZE
            ? `
          <div class="list-pagination">
            <p class="list-pagination__status" id="article-list-status" role="status" aria-live="polite">${visibleCountText(LIST_BATCH_SIZE, orderedEntries.length)}</p>
            <button class="btn btn--ghost list-pagination__button" type="button" aria-controls="article-list">عرض مقالات أخرى</button>
          </div>
        `
            : ''
        }`
    }
  `

  attachCardPrefetch(container, orderedEntries)
  observeLazyImages(container)

  const listItems = Array.from(container.querySelectorAll<HTMLElement>('[data-list-item]'))
  const loadMoreButton = container.querySelector<HTMLButtonElement>('.list-pagination__button')
  const progress = container.querySelector<HTMLElement>('.list-pagination__status')
  let visibleCount = Math.min(LIST_BATCH_SIZE, listItems.length)

  loadMoreButton?.addEventListener('click', () => {
    const nextCount = Math.min(visibleCount + LIST_BATCH_SIZE, listItems.length)
    listItems.slice(visibleCount, nextCount).forEach((item) => {
      item.hidden = false
    })
    visibleCount = nextCount
    if (progress) progress.textContent = visibleCountText(visibleCount, listItems.length)
    if (visibleCount >= listItems.length) loadMoreButton.hidden = true
  })
}

export function renderWikiHome(container: HTMLElement, entries: RegistryEntry[]): () => void {
  if (entries.length === 0) {
    container.innerHTML = `
      <section class="hero arch-bg">
        <div class="hero__content">
          <p class="hero__kicker">${brand.slogan}</p>
          <h1 class="hero__title"><img class="hero__logo" src="/athar_logo.png" alt="${brand.name}" width="2172" height="724" /></h1>
          <p class="hero__subtitle">${brand.description}</p>
          <div class="bismillah-divider pattern-heavy" aria-hidden="true"><span class="dot"></span><span>◆</span><span class="dot"></span></div>
          <p class="hero__hint">تُبنى الموسوعة على مهل، مع عناية بالمصادر وسهولة الوصول إلى المعلومة.</p>
          <div class="hero__actions">
            <a href="#/wiki" class="btn btn--primary">${brand.browseCta} (${entries.length})</a>
            <a href="#/wiki" class="btn btn--ghost">استكشف المقالات</a>
          </div>
        </div>
      </section>

      <section class="home-empty">
        <div class="callout callout--info">
          <strong>قريبًا:</strong> ستجد هنا مقالات موثقة عن السيرة، والدول، والعلماء، والمدن، والأفكار التي صنعت الحضارة الإسلامية.
        </div>
      </section>
    `
    return () => {}
  }

  // Give a single article, or an explicitly featured article, an editorial treatment.
  const featuredEntry = entries.length === 1 ? entries[0] : entries.find((entry) => entry.featured)
  const latest = [...entries]
    .filter((entry) => entry !== featuredEntry)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 6)

  container.innerHTML = `
    <section class="hero arch-bg">
      <div class="hero__content">
        <p class="hero__kicker">${brand.slogan}</p>
        <h1 class="hero__title"><img class="hero__logo" src="/athar_logo.png" alt="${brand.name}" width="2172" height="724" /></h1>
        <p class="hero__subtitle">${brand.description}</p>
        <div class="wiki-search hero__search" role="search">
          <label for="hero-search" class="sr-only">ابحث في التاريخ الإسلامي</label>
          <i class="wiki-search__icon" data-lucide="search" aria-hidden="true"></i>
          <input id="hero-search" class="wiki-search__input wiki-search__input--hero" type="search" inputmode="search" name="q" autocomplete="off" placeholder="ابحث عن شخصية، مدينة، حدث، أو موضوع…" aria-label="ابحث في التاريخ الإسلامي" />
        </div>
        <p class="hero__hint">
          <span class="hero__hint-primary">${arabicCount(entries.length)} <span class="hero__hint-separator" aria-hidden="true">·</span> ${brand.scope}</span>
          <span class="hero__hint-secondary">${brand.offlineNote}</span>
        </p>
      </div>
    </section>

    <section class="home-section home-section--articles">
      <div class="home-section__header">
        <h2 class="home-section__title">أحدث المقالات</h2>
        <a class="home-section__link" href="#/wiki">عرض الكل <span aria-hidden="true">←</span></a>
      </div>
      ${featuredEntry ? `<div class="home-featured" role="list">${wikiFeaturedCard(featuredEntry, { showDate: false })}</div>` : ''}
      ${
        latest.length > 0
          ? `
        <div class="wiki-grid wiki-grid--home" role="list">
          ${latest.map((e) => `<div role="listitem">${wikiCard(e, { showTags: false, compact: true })}</div>`).join('')}
        </div>
      `
          : ''
      }
    </section>
  `

  createIcons({ icons: { Search }, root: container })
  attachCardPrefetch(container, entries)
  observeLazyImages(container)

  const heroSearch = container.querySelector<HTMLInputElement>('#hero-search')
  let searchTimer: number | undefined
  const searchDebounce = 500
  heroSearch?.addEventListener('input', () => {
    window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => {
      const q = heroSearch.value.trim()
      if (q) navigate({ name: 'search', q })
    }, searchDebounce)
  })

  heroSearch?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    window.clearTimeout(searchTimer)
    const q = heroSearch.value.trim()
    if (q) navigate({ name: 'search', q })
  })

  return () => window.clearTimeout(searchTimer)
}

export function arabicCount(n: number): string {
  const count = new Intl.NumberFormat('ar-EG').format(n)
  if (n === 0) return 'لا توجد مقالات'
  if (n === 1) return 'مقال واحد'
  if (n === 2) return 'مقالان'
  if (n >= 3 && n <= 10) return `${count} مقالات`
  return `${count} مقالاً`
}

function visibleCountText(visible: number, total: number): string {
  const formatter = new Intl.NumberFormat('ar-EG')
  return `عرض ${formatter.format(visible)} من ${formatter.format(total)}`
}
