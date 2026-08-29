/**
 * WikiCard: بطاقة مقال خفيفة
 * Reusable card: minimal DOM, lazy image, prefetch on hover
 */
import type { RegistryEntry } from '../data/types.ts'
import { prefetchArticle } from '../lib/router.ts'
import { escapeHtml } from '../lib/dom.ts'

export function wikiCard(
  entry: RegistryEntry,
  options: { showTags?: boolean; compact?: boolean } = {},
): string {
  const cardClasses = [
    'wiki-card',
    entry.cover ? 'wiki-card--with-cover' : 'wiki-card--textual',
    options.compact ? 'wiki-card--compact' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return `
    <article class="${cardClasses}" data-slug="${escapeAttr(entry.slug)}">
      <a class="wiki-card__link" href="#/wiki/${encodeURIComponent(entry.slug)}"
         data-prefetch-slug="${escapeAttr(entry.slug)}"
         aria-label="${escapeAttr(entry.title)}">
        ${
          entry.cover
            ? `<div class="wiki-card__media">
               <img data-src="${escapeAttr(entry.cover)}"
                    alt="" loading="lazy" decoding="async"
                    width="400" height="220"
                    class="wiki-card__cover img-placeholder" />
             </div>`
            : ''
        }
        <div class="wiki-card__body">
          <div class="wiki-card__meta">
            <span class="wiki-card__category">${escapeHtml(entry.category)}</span>
            ${entry.readingTime ? `<span class="wiki-card__time">${entry.readingTime} د</span>` : ''}
          </div>
          <h3 class="wiki-card__title">${escapeHtml(entry.title)}</h3>
          <p class="wiki-card__summary">${escapeHtml(entry.summary)}</p>
          ${
            options.showTags !== false && entry.tags?.length
              ? `<div class="wiki-card__tags">${entry.tags
                  .slice(0, 3)
                  .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
                  .join('')}</div>`
              : ''
          }
        </div>
      </a>
    </article>
  `
}

export function wikiFeaturedCard(
  entry: RegistryEntry,
  options: { showDate?: boolean } = {},
): string {
  const visual = entry.cover
    ? `<img data-src="${escapeAttr(entry.cover)}" alt="" loading="lazy" decoding="async" width="640" height="420" class="wiki-featured-card__cover img-placeholder" />`
    : `<span class="wiki-featured-card__mark" aria-hidden="true">◆</span>`
  const visualClass = visualClassForCategory(entry.category)

  return `
    <article class="wiki-featured-card" data-slug="${escapeAttr(entry.slug)}">
      <a class="wiki-featured-card__link" href="#/wiki/${encodeURIComponent(entry.slug)}"
         data-prefetch-slug="${escapeAttr(entry.slug)}" aria-label="${escapeAttr(entry.title)}">
        <div class="wiki-featured-card__body">
          <div class="wiki-card__meta">
            <span class="wiki-card__category">${escapeHtml(entry.category)}</span>
            ${entry.readingTime ? `<span class="wiki-card__time">${entry.readingTime} د قراءة</span>` : ''}
            ${options.showDate !== false && entry.date ? `<time class="wiki-card__time" datetime="${escapeAttr(entry.date)}">${formatCardDate(entry.date)}</time>` : ''}
          </div>
          <h3 class="wiki-featured-card__title">${escapeHtml(entry.title)}</h3>
          <p class="wiki-featured-card__summary">${escapeHtml(entry.summary)}</p>
          <span class="wiki-featured-card__cta">اقرأ المقال <span aria-hidden="true">←</span></span>
        </div>
        <div class="wiki-featured-card__visual ${entry.cover ? '' : `wiki-featured-card__visual--placeholder ${visualClass}`}"${entry.cover ? '' : ` data-category-visual="${escapeAttr(entry.category)}"`}>${visual}</div>
      </a>
    </article>
  `
}

/** Attach prefetch listeners to cards already in DOM. */
export function attachCardPrefetch(
  root: ParentNode = document,
  entries: RegistryEntry[] = [],
): void {
  const links = root.querySelectorAll<HTMLAnchorElement>('[data-prefetch-slug]')
  const loaders = new Map(entries.map((entry) => [entry.slug, entry.load]))
  for (const a of links) {
    let prefetched = false
    const doPrefetch = (): void => {
      if (prefetched) return
      prefetched = true
      const slug = a.dataset.prefetchSlug
      const load = slug ? loaders.get(slug) : undefined
      if (load) prefetchArticle(load)
    }
    a.addEventListener('mouseenter', doPrefetch, { once: true })
    a.addEventListener('focus', doPrefetch, { once: true })
    // Also prefetch on touchstart for mobile
    a.addEventListener('touchstart', doPrefetch, { once: true, passive: true })
  }
}

function escapeAttr(s: string): string {
  return escapeHtml(s)
}

function visualClassForCategory(category: string): string {
  const value = category.trim()
  if (value.includes('علم')) return 'wiki-featured-card__visual--scholars'
  if (value.includes('مدين') || value.includes('حاضر')) return 'wiki-featured-card__visual--cities'
  if (value.includes('دول') || value.includes('سلال')) return 'wiki-featured-card__visual--states'
  if (value.includes('سيرة')) return 'wiki-featured-card__visual--biography'
  return 'wiki-featured-card__visual--default'
}

function formatCardDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
