import { escapeHtml } from '../lib/dom.ts'
import { navigate } from '../lib/router.ts'

export function renderLoading(container: HTMLElement, title: string): void {
  container.innerHTML = `
    <div class="loading" role="status" aria-label="جاري التحميل">
      <div class="loading__skeleton" aria-hidden="true">
        <span class="loading__skeleton-line loading__skeleton-line--short"></span>
        <span class="loading__skeleton-line"></span>
        <span class="loading__skeleton-line loading__skeleton-line--medium"></span>
      </div>
      <p>جاري تحميل <strong>${escapeHtml(title)}</strong>…</p>
      <p class="status-detail">مصمم للاتصالات البطيئة. يُحمَّل عند الطلب فقط.</p>
    </div>
  `
}

export function renderNotFound(container: HTMLElement, message: string): void {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state__mark" aria-hidden="true">◈</div>
      <h1 class="empty-state__title">٤٠٤: غير موجود</h1>
      <p class="empty-state__text">${escapeHtml(message)}</p>
      <div class="status-actions">
        <a href="#/" class="btn btn--primary">العودة للرئيسية</a>
        <a href="#/wiki" class="btn btn--ghost">تصفح المقالات</a>
      </div>
    </div>
  `
}

export function renderLoadError(container: HTMLElement, slug: string, detail: string): void {
  const offline = !navigator.onLine
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state__mark" aria-hidden="true">⚠</div>
      <h2 class="empty-state__title">${offline ? 'أنت غير متصل' : 'تعذّر تحميل المقال'}</h2>
      <p class="empty-state__text">
        ${offline ? 'تحقق من الاتصال وحاول مجددًا. المقالات المخزَّنة مؤقتًا ستعمل دون اتصال بعد زيارتها مرة واحدة.' : `حدث خطأ أثناء تحميل <code>${escapeHtml(slug)}</code>.`}
      </p>
      <p class="status-detail">${escapeHtml(detail.slice(0, 300))}</p>
      <div class="status-actions">
        <button class="btn btn--primary" id="retry-btn" type="button">إعادة المحاولة</button>
        <a href="#/wiki" class="btn btn--ghost">كل المقالات</a>
      </div>
    </div>
  `
  container.querySelector('#retry-btn')?.addEventListener('click', () => navigate({ name: 'article', slug }))
}
