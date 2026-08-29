/**
 * WikiArticle: مكون المقال القابل لإعادة الاستخدام
 * Reusable: render any WikiArticleDefinition with TOC, breadcrumbs, lazy images, perf-safe
 *
 * Usage:
 *   import { renderWikiArticle } from './components/WikiArticle.ts'
 *   renderWikiArticle(container, articleDef)
 *
 * The component is framework-free: HTML string plus small JS enhancements.
 */
import type { ArticleSource, TocItem, WikiArticleDefinition } from '../data/types.ts'
import type { ArticleSidebarContext } from './WikiLayout.ts'
import { observeLazyImages } from '../lib/loader.ts'
import { escapeHtml } from '../lib/dom.ts'
import { showToast } from '../lib/feedback.ts'

const READING_SETTINGS_KEY = 'athar-reading-settings'

type ReadingSettings = {
  fontScale: 1 | 1.1 | 1.2
  lineHeight: 1.9 | 2.1 | 2.3
  readingWidth: 'standard' | 'wide'
}

const DEFAULT_READING_SETTINGS: ReadingSettings = {
  fontScale: 1,
  lineHeight: 1.9,
  readingWidth: 'standard',
}

export interface WikiArticleRenderOptions {
  onSidebarContext?: (context: ArticleSidebarContext) => void
}

export function renderWikiArticle(
  container: HTMLElement,
  article: WikiArticleDefinition,
  options: WikiArticleRenderOptions = {},
): () => void {
  // Extract TOC from rendered HTML if not provided
  const rawHtml = toHtml(article.render())
  const contentHtml = `${rawHtml}${renderSources(article.sources)}`
  const toc = article.toc ?? extractToc(contentHtml)

  container.innerHTML = `
    <article class="wiki-article-page" dir="rtl" lang="ar">
      <nav class="breadcrumbs" aria-label="مسار التنقل">
        <a href="#/">الرئيسية</a>
        <span aria-hidden="true">‹</span>
        <a href="#/category/${encodeURIComponent(article.category)}">${escapeHtml(article.category)}</a>
        <span class="breadcrumbs__current-separator" aria-hidden="true">‹</span>
        <span class="breadcrumbs__current" aria-current="page">${escapeHtml(article.title)}</span>
      </nav>

      <header class="wiki-article__header corner-ornament">
        <div class="wiki-article__meta">
          <span class="wiki-article__category">${escapeHtml(article.category)}</span>
          ${article.readingTime ? `<span class="reading-time">${article.readingTime} دقائق قراءة</span>` : ''}
          ${article.date ? `<time datetime="${article.date}">${formatDate(article.date)}</time>` : ''}
        </div>
        <h1 class="wiki-article__title">${escapeHtml(article.title)}</h1>
        <p class="wiki-article__summary">${escapeHtml(article.summary)}</p>
        ${renderTrustMetadata(article)}
      </header>

      ${renderReadingSettings()}

      ${toc.length > 0 ? renderTocHtml(toc, article.slug) : ''}

      <div class="wiki-article__content prose justify-ar" id="article-content">
        ${contentHtml}
      </div>

      <footer class="wiki-article__footer">
        <div class="gold-divider"></div>
        <div class="wiki-article__actions">
          <button class="btn btn--primary" id="share-btn" type="button">مشاركة</button>
          <button class="btn btn--ghost" id="copy-link-btn" type="button">نسخ الرابط</button>
          <a href="#/wiki" class="btn btn--ghost wiki-article__back">العودة إلى المقالات <span aria-hidden="true">←</span></a>
        </div>
      </footer>
    </article>
  `

  options.onSidebarContext?.({ slug: article.slug, category: article.category, toc })

  const events = new AbortController()
  observeLazyImages(container)
  setupReadingSettings(container, events.signal)
  setupTocDisclosure(container, events.signal)
  const cleanupProgress = setupReadingProgress(container)

  document.querySelectorAll<HTMLAnchorElement>('[data-article-section]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.dataset.articleSection
      if (!id) return
      event.preventDefault()
      document.getElementById(id)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      })
      setActiveToc(id)
      const sectionHash = `#/wiki/${encodeURIComponent(article.slug)}?section=${encodeURIComponent(id)}`
      if (location.hash !== sectionHash) history.pushState(null, '', sectionHash)
    }, { signal: events.signal })
  })

  // Share / copy
  const shareBtn = container.querySelector<HTMLButtonElement>('#share-btn')
  const copyBtn = container.querySelector<HTMLButtonElement>('#copy-link-btn')
  const url = `${location.origin}${location.pathname}#/wiki/${encodeURIComponent(article.slug)}`

  shareBtn?.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, text: article.summary, url })
        showToast('تمت المشاركة.', container)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        showToast('تعذرت المشاركة. استخدم «نسخ الرابط».', container)
      }
    } else {
      showToast(await copyUrl(url) ? 'تم نسخ الرابط.' : 'تعذر نسخ الرابط. انسخه يدويًا من شريط العنوان.', container)
    }
  }, { signal: events.signal })
  copyBtn?.addEventListener('click', async () => {
    showToast(await copyUrl(url) ? 'تم نسخ الرابط.' : 'تعذر نسخ الرابط. انسخه يدويًا من شريط العنوان.', container)
  }, { signal: events.signal })

  const cleanupTocHighlight = setupTocHighlight(toc)
  const section = new URLSearchParams(location.hash.split('?')[1] ?? '').get('section')
  if (section && toc.some((item) => item.id === section)) {
    setActiveToc(section)
    requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView({ block: 'start' }))
  }

  return () => {
    events.abort()
    cleanupProgress()
    cleanupTocHighlight()
  }
}

function renderReadingSettings(): string {
  return `
    <section class="reading-settings" aria-labelledby="reading-settings-title">
      <div class="reading-settings__header">
        <h2 id="reading-settings-title">إعدادات القراءة</h2>
        <button class="reading-settings__toggle" type="button" aria-expanded="false" aria-controls="reading-settings-panel">
          <span>تخصيص القراءة</span>
          <span class="reading-settings__chevron" aria-hidden="true">⌄</span>
        </button>
      </div>
      <div class="reading-settings__panel" id="reading-settings-panel" hidden>
        <fieldset class="reading-settings__group">
          <legend>حجم النص</legend>
          <div class="reading-settings__choices">
            <button type="button" data-reading-setting="fontScale" data-reading-value="1" aria-pressed="true">قياسي</button>
            <button type="button" data-reading-setting="fontScale" data-reading-value="1.1" aria-pressed="false">أكبر</button>
            <button type="button" data-reading-setting="fontScale" data-reading-value="1.2" aria-pressed="false">كبير</button>
          </div>
        </fieldset>
        <fieldset class="reading-settings__group">
          <legend>تباعد الأسطر</legend>
          <div class="reading-settings__choices">
            <button type="button" data-reading-setting="lineHeight" data-reading-value="1.9" aria-pressed="true">معتدل</button>
            <button type="button" data-reading-setting="lineHeight" data-reading-value="2.1" aria-pressed="false">مريح</button>
            <button type="button" data-reading-setting="lineHeight" data-reading-value="2.3" aria-pressed="false">واسع</button>
          </div>
        </fieldset>
        <fieldset class="reading-settings__group">
          <legend>عرض النص</legend>
          <div class="reading-settings__choices">
            <button type="button" data-reading-setting="readingWidth" data-reading-value="standard" aria-pressed="true">قياسي</button>
            <button type="button" data-reading-setting="readingWidth" data-reading-value="wide" aria-pressed="false">أوسع</button>
          </div>
        </fieldset>
        <button class="reading-settings__reset" type="button">استعادة الإعدادات الافتراضية</button>
      </div>
    </section>
  `
}

function setupReadingSettings(container: HTMLElement, signal: AbortSignal): void {
  const content = container.querySelector<HTMLElement>('#article-content')
  const toggle = container.querySelector<HTMLButtonElement>('.reading-settings__toggle')
  const panel = container.querySelector<HTMLElement>('.reading-settings__panel')
  const reset = container.querySelector<HTMLButtonElement>('.reading-settings__reset')
  if (!content || !toggle || !panel || !reset) return

  let settings = readReadingSettings()

  const apply = (): void => {
    const fontSize = settings.fontScale === 1
      ? 'var(--text-lg)'
      : settings.fontScale === 1.1
        ? 'var(--text-xl)'
        : 'calc(var(--text-xl) + var(--space-2))'
    const leadFontSize = settings.fontScale === 1
      ? 'var(--text-xl)'
      : settings.fontScale === 1.1
        ? 'calc(var(--text-xl) + var(--space-1))'
        : 'var(--text-2xl)'
    content.style.setProperty('--reading-font-size', fontSize)
    content.style.setProperty('--reading-lead-font-size', leadFontSize)
    content.style.setProperty('--reading-line-height', String(settings.lineHeight))
    content.dataset.readingWidth = settings.readingWidth
    container.querySelectorAll<HTMLButtonElement>('[data-reading-setting]').forEach((button) => {
      const key = button.dataset.readingSetting as keyof ReadingSettings | undefined
      const value = button.dataset.readingValue
      const active = key ? String(settings[key]) === value : false
      button.setAttribute('aria-pressed', String(active))
    })
  }

  const save = (): void => {
    try {
      localStorage.setItem(READING_SETTINGS_KEY, JSON.stringify(settings))
    } catch {
      // Reading preferences remain available for the current page if storage is blocked.
    }
  }

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true'
    toggle.setAttribute('aria-expanded', String(!expanded))
    panel.hidden = expanded
  }, { signal })

  container.querySelectorAll<HTMLButtonElement>('[data-reading-setting]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.readingSetting as keyof ReadingSettings | undefined
      const value = button.dataset.readingValue
      if (!key || !value) return
      if (key === 'fontScale') {
        const parsed = parseFontScale(value)
        if (parsed !== null) settings.fontScale = parsed
      }
      if (key === 'lineHeight') {
        const parsed = parseLineHeight(value)
        if (parsed !== null) settings.lineHeight = parsed
      }
      if (key === 'readingWidth' && isReadingWidth(value)) settings.readingWidth = value
      apply()
      save()
    }, { signal })
  })

  reset.addEventListener('click', () => {
    settings = { ...DEFAULT_READING_SETTINGS }
    apply()
    save()
  }, { signal })

  apply()
}

function readReadingSettings(): ReadingSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(READING_SETTINGS_KEY) ?? 'null') as Partial<ReadingSettings> | null
    return {
      fontScale: stored?.fontScale === 1.1 || stored?.fontScale === 1.2 ? stored.fontScale : 1,
      lineHeight: stored?.lineHeight === 2.1 || stored?.lineHeight === 2.3 ? stored.lineHeight : 1.9,
      readingWidth: stored?.readingWidth === 'wide' ? 'wide' : 'standard',
    }
  } catch {
    return { ...DEFAULT_READING_SETTINGS }
  }
}

function parseFontScale(value: string): ReadingSettings['fontScale'] | null {
  if (value === '1') return 1
  if (value === '1.1') return 1.1
  if (value === '1.2') return 1.2
  return null
}

function parseLineHeight(value: string): ReadingSettings['lineHeight'] | null {
  if (value === '1.9') return 1.9
  if (value === '2.1') return 2.1
  if (value === '2.3') return 2.3
  return null
}

function isReadingWidth(value: string): value is ReadingSettings['readingWidth'] {
  return value === 'standard' || value === 'wide'
}

function toHtml(rendered: string | HTMLElement): string {
  if (typeof rendered === 'string') return rendered
  return rendered.outerHTML
}

function extractToc(html: string): TocItem[] {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  const headings = tmp.querySelectorAll('h2[id], h3[id]')
  return Array.from(headings).map((h) => ({
    id: h.id,
    title: (h.textContent ?? '').trim(),
    level: (h.tagName === 'H3' ? 3 : 2) as 2 | 3,
  }))
}

function renderTocHtml(toc: TocItem[], slug: string): string {
  const expanded = toc.length <= 6
  return `
    <nav class="wiki-toc wiki-toc--main" aria-label="محتويات المقال">
      <button class="wiki-toc__summary" type="button" aria-expanded="${expanded}" aria-controls="article-toc-panel">
        <span>المحتويات</span>
        <span class="wiki-toc__chevron" aria-hidden="true">⌄</span>
      </button>
      <div class="wiki-toc__panel" id="article-toc-panel"${expanded ? '' : ' hidden'}>
        <ol class="wiki-toc__list">
          ${toc.map((i) => `
            <li class="wiki-toc__item wiki-toc__item--${i.level}">
              <a href="#/wiki/${encodeURIComponent(slug)}?section=${encodeURIComponent(i.id)}" data-article-section="${escapeHtml(i.id)}">${escapeHtml(i.title)}</a>
            </li>
          `).join('')}
        </ol>
      </div>
    </nav>
  `
}

function renderTrustMetadata(article: WikiArticleDefinition): string {
  const items = [
    article.author ? `إعداد: ${escapeHtml(article.author)}` : '',
    article.reviewer ? `راجع المحتوى: ${escapeHtml(article.reviewer)}` : '',
    article.lastReviewed ? `آخر مراجعة: ${formatDate(article.lastReviewed)}` : '',
  ].filter(Boolean)
  return items.length > 0
    ? `<div class="wiki-article__trust">${items.map((item) => `<span>${item}</span>`).join('')}</div>`
    : ''
}

function setupReadingProgress(container: HTMLElement): () => void {
  const content = container.querySelector<HTMLElement>('#article-content')
  const progress = document.querySelector<HTMLElement>('.wiki-header .wiki-reading-progress__bar')
  if (!content || !progress) return () => {}

  let frame = 0
  const update = (): void => {
    frame = 0
    const contentTop = content.getBoundingClientRect().top + window.scrollY
    const scrollableContent = Math.max(1, content.offsetHeight - window.innerHeight * 0.35)
    const start = Math.max(0, contentTop - window.innerHeight * 0.2)
    const documentBottom = document.documentElement.scrollHeight - window.innerHeight
    const atDocumentEnd = window.scrollY >= documentBottom - 2
    const value = atDocumentEnd
      ? 1
      : Math.max(0, Math.min(1, (window.scrollY - start) / scrollableContent))
    progress.style.transform = `scaleX(${value})`
  }
  const requestUpdate = (): void => {
    if (!frame) frame = window.requestAnimationFrame(update)
  }

  window.addEventListener('scroll', requestUpdate, { passive: true })
  window.addEventListener('resize', requestUpdate)
  requestUpdate()
  return () => {
    window.removeEventListener('scroll', requestUpdate)
    window.removeEventListener('resize', requestUpdate)
    if (frame) window.cancelAnimationFrame(frame)
    progress.style.transform = 'scaleX(0)'
  }
}

function setupTocDisclosure(container: HTMLElement, signal: AbortSignal): void {
  const button = container.querySelector<HTMLButtonElement>('.wiki-toc__summary')
  const panel = container.querySelector<HTMLElement>('.wiki-toc__panel')
  if (!button || !panel) return
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true'
    button.setAttribute('aria-expanded', String(!expanded))
    panel.hidden = expanded
  }, { signal })
}

function setupTocHighlight(toc: TocItem[]): () => void {
  if (toc.length === 0) return () => {}

  const headings = toc
    .map(({ id }) => document.getElementById(id))
    .filter((heading): heading is HTMLElement => Boolean(heading))
  if (headings.length === 0) return () => {}

  let frame = 0
  let activeId = ''
  const update = (): void => {
    frame = 0
    const readingLine = Math.max(96, window.innerHeight * 0.22)
    const lastHeading = headings[headings.length - 1]
    const atDocumentEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
    const current = atDocumentEnd
      ? lastHeading
      : [...headings].reverse().find((heading) => heading.getBoundingClientRect().top <= readingLine) ?? headings[0]
    if (current.id === activeId) return
    activeId = current.id
    setActiveToc(activeId)
  }
  const requestUpdate = (): void => {
    if (!frame) frame = window.requestAnimationFrame(update)
  }

  window.addEventListener('scroll', requestUpdate, { passive: true })
  window.addEventListener('resize', requestUpdate)
  const observeFrame = requestAnimationFrame(update)
  return () => {
    cancelAnimationFrame(observeFrame)
    window.removeEventListener('scroll', requestUpdate)
    window.removeEventListener('resize', requestUpdate)
    if (frame) window.cancelAnimationFrame(frame)
  }
}

function setActiveToc(id: string): void {
  document.querySelectorAll<HTMLAnchorElement>('[data-article-section]').forEach((link) => {
    const active = link.dataset.articleSection === id
    link.classList.toggle('is-active', active)
    if (active) link.setAttribute('aria-current', 'location')
    else link.removeAttribute('aria-current')
  })
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso))
  } catch { return iso }
}

function renderSources(sources: ArticleSource[] | undefined): string {
  if (!sources?.length) return ''
  return `
    <section class="wiki-sources" aria-labelledby="article-sources-title">
      <h2 id="article-sources-title">المصادر</h2>
      <ol class="wiki-sources__list">
        ${sources.map((source) => `
          <li class="wiki-source">
            <cite>${escapeHtml(source.title)}</cite>
            <span class="wiki-source__details">${escapeHtml([source.author, source.publication, source.year].filter(Boolean).join('، '))}</span>
            <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">فتح المصدر<span class="sr-only">: ${escapeHtml(source.title)}</span></a>
          </li>
        `).join('')}
      </ol>
    </section>
  `
}

async function copyUrl(url: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      return true
    }
  } catch {
    // Fall through to the browser's legacy copy command.
  }

  const fallback = document.createElement('textarea')
  fallback.value = url
  fallback.className = 'clipboard-fallback'
  fallback.setAttribute('readonly', '')
  document.body.append(fallback)
  fallback.select()
  const copied = document.execCommand('copy')
  fallback.remove()
  return copied
}
