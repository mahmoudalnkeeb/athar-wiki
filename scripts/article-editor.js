const form = document.querySelector('#article-form')
const editor = document.querySelector('#content-editor')
const contentField = document.querySelector('#content')
const preview = document.querySelector('#preview')
const previewPanel = document.querySelector('#preview-panel')
const editorWorkspace = document.querySelector('#editor-workspace')
const previewToggle = document.querySelector('#toggle-preview')
const closePreview = document.querySelector('#close-preview')
const status = document.querySelector('#status')
const summaryCount = document.querySelector('#summary-count')
const draftLabel = document.querySelector('#draft-label')
const wordCount = document.querySelector('#word-count')
const readingEstimate = document.querySelector('#reading-estimate')
const draftKey = 'athar-article-editor-draft-v2'
const today = new Date().toISOString().slice(0, 10)
let savedRange

document.querySelector('#date').value = today

function values() {
  syncContent()
  return Object.fromEntries(new FormData(form).entries())
}

function valuesWithoutSync() {
  return Object.fromEntries(new FormData(form).entries())
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
}

function sanitizeContent(value) {
  const root = document.createElement('div')
  root.innerHTML = value
  root.querySelectorAll('script,style,iframe,object,embed,form').forEach((node) => node.remove())
  root.querySelectorAll('*').forEach((element) => {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase()
      const unsafeUrl = attribute.value.trim().toLowerCase().startsWith('javascript:')
      if (name.startsWith('on') || unsafeUrl) element.removeAttribute(attribute.name)
    }
  })
  return root.innerHTML
}

function syncContent() {
  normalizeHeadings()
  contentField.value = editor.innerHTML.trim()
}

function normalizeHeadings() {
  const usedIds = new Set()
  for (const [index, heading] of [...editor.querySelectorAll('h2, h3')].entries()) {
    const originalId = heading.id.trim()
    const id = originalId && !usedIds.has(originalId) ? originalId : `section-${index + 1}`
    heading.id = id
    usedIds.add(id)
  }
}

function renderPreview() {
  syncContent()
  const data = valuesWithoutSync()
  updateWritingStats()
  summaryCount.textContent = `${String(data.summary || '').length}/280`
  preview.innerHTML = `<div class="preview__meta"><span class="preview__category">${escapeHtml(data.category || 'التصنيف')}</span><span>${escapeHtml(data.date || today)}</span><span>${escapeHtml(data.readingTime || '5')} دقائق قراءة</span></div><h3 class="preview__title">${escapeHtml(data.title || 'عنوان المقال')}</h3><p class="preview__summary">${escapeHtml(data.summary || 'سيظهر الملخص هنا.')}</p><div class="preview__content">${sanitizeContent(data.content || '<p>ابدأ بكتابة محتوى المقال.</p>')}</div>`
}

function updateWritingStats() {
  const words = (editor.innerText.trim().match(/\S+/g) || []).length
  const minutes = Math.max(1, Math.ceil(words / 180))
  wordCount.textContent = `${words.toLocaleString('ar-EG')} كلمة`
  readingEstimate.textContent = minutes === 1 ? 'دقيقة قراءة واحدة' : `${minutes.toLocaleString('ar-EG')} دقائق قراءة`
}

function saveDraft() {
  localStorage.setItem(draftKey, JSON.stringify(values()))
  draftLabel.textContent = 'آخر حفظ محلي: الآن'
}

function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(draftKey) || 'null')
    if (!draft) return
    for (const field of form.querySelectorAll('input, textarea')) {
      if (field.name !== 'content' && draft[field.name] !== undefined) field.value = draft[field.name]
    }
    if (draft.content) editor.innerHTML = draft.content
  } catch {
    localStorage.removeItem(draftKey)
  }
}

function setStatus(message, state = '') {
  status.textContent = message
  status.dataset.state = state
}

function focusEditor() {
  editor.focus()
  const selection = window.getSelection()
  if (savedRange && selection) {
    selection.removeAllRanges()
    selection.addRange(savedRange)
  }
}

function setPreviewVisible(isVisible) {
  previewPanel.hidden = !isVisible
  editorWorkspace.classList.toggle('has-preview', isVisible)
  previewToggle.setAttribute('aria-expanded', String(isVisible))
  previewToggle.textContent = isVisible ? 'إخفاء المعاينة' : 'عرض المعاينة'
  if (isVisible) previewPanel.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

function insertHtml(html) {
  focusEditor()
  document.execCommand('insertHTML', false, html)
  syncContent()
  renderPreview()
  saveDraft()
}

function insertImage() {
  const source = window.prompt('أدخل مسار الصورة أو رابطها (https://… أو /images/…)')?.trim()
  if (!source || !/^(https?:\/\/|\/)/i.test(source)) return
  const alt = window.prompt('اكتب وصفًا بديلًا للصورة')?.trim()
  if (!alt) return
  insertHtml(`<figure class="wiki-figure"><img src="${escapeHtml(source)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async"><figcaption>${escapeHtml(alt)}</figcaption></figure><p><br></p>`)
}

function applyCommand(command) {
  focusEditor()
  if (command === 'blockquote') document.execCommand('formatBlock', false, 'blockquote')
  else if (command === 'lead') insertHtml('<p class="lead">فقرة افتتاحية…</p><p><br></p>')
  else if (command === 'callout') insertHtml('<div class="callout callout--info"><strong>معلومة:</strong> اكتب المعلومة المهمة هنا.</div><p><br></p>')
  else if (command === 'insertImage') insertImage()
  else if (command === 'createLink') {
    const url = window.prompt('أدخل الرابط (https://…)')?.trim()
    if (!url || !/^https?:\/\//i.test(url)) return
    document.execCommand('createLink', false, url)
  } else document.execCommand(command, false)
  syncContent()
  renderPreview()
  saveDraft()
  updateToolbarState()
}

function updateToolbarState() {
  for (const button of document.querySelectorAll('[data-command]')) {
    if (['bold', 'italic', 'underline', 'insertUnorderedList'].includes(button.dataset.command)) {
      button.setAttribute('aria-pressed', String(document.queryCommandState(button.dataset.command)))
    }
  }
}

for (const field of form.querySelectorAll('input, textarea')) field.addEventListener('input', () => { renderPreview(); saveDraft() })
editor.addEventListener('input', () => { syncContent(); renderPreview(); saveDraft() })
editor.addEventListener('keyup', updateToolbarState)
editor.addEventListener('mouseup', updateToolbarState)
document.addEventListener('selectionchange', () => {
  if (document.activeElement === editor) {
    const selection = window.getSelection()
    if (selection?.rangeCount) savedRange = selection.getRangeAt(0).cloneRange()
    updateToolbarState()
  }
})
editor.addEventListener('paste', (event) => {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') ?? ''
  document.execCommand('insertText', false, text)
})
for (const button of document.querySelectorAll('[data-command]')) {
  button.addEventListener('mousedown', (event) => event.preventDefault())
  button.addEventListener('click', () => applyCommand(button.dataset.command))
}
previewToggle.addEventListener('click', () => setPreviewVisible(previewPanel.hidden))
closePreview.addEventListener('click', () => setPreviewVisible(false))
document.querySelector('#block-format').addEventListener('change', (event) => {
  focusEditor()
  document.execCommand('formatBlock', false, event.target.value)
  syncContent(); renderPreview(); saveDraft()
})
form.addEventListener('invalid', (event) => {
  const details = event.target.closest('details')
  if (details) details.open = true
}, true)
document.addEventListener('keydown', (event) => {
  if (!(event.metaKey || event.ctrlKey)) return
  if (event.key.toLowerCase() === 's') {
    event.preventDefault()
    form.requestSubmit()
  } else if (event.shiftKey && event.key.toLowerCase() === 'p') {
    event.preventDefault()
    setPreviewVisible(previewPanel.hidden)
  }
})
document.querySelector('#clear-draft').addEventListener('click', () => {
  localStorage.removeItem(draftKey)
  form.reset()
  document.querySelector('#date').value = today
  document.querySelector('#readingTime').value = '5'
  editor.innerHTML = ''
  setStatus('تم مسح المسودة.')
  renderPreview()
})
form.addEventListener('submit', async (event) => {
  event.preventDefault()
  if (!editor.innerText.trim()) {
    setStatus('أضف محتوى المقال قبل الحفظ.', 'error')
    editor.focus()
    return
  }
  setStatus('جارٍ حفظ المقال…')
  const button = form.querySelector('button[type="submit"]')
  button.disabled = true
  try {
    const response = await fetch('/api/articles', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(values()) })
    const result = await response.json()
    if (!response.ok) throw new Error((result.errors || ['تعذر حفظ المقال.']).join(' '))
    setStatus(`تم الحفظ: ${result.articlePath} وتحديث ${result.registryPath}`, 'success')
    localStorage.removeItem(draftKey)
    await loadExisting()
  } catch (error) {
    setStatus(error.message || 'تعذر حفظ المقال.', 'error')
  } finally {
    button.disabled = false
  }
})

async function loadExisting() {
  try {
    const response = await fetch('/api/articles')
    const result = await response.json()
    document.querySelector('#existing-list').innerHTML = result.articles.map((slug) => `<li>${escapeHtml(slug)}</li>`).join('') || '<li>لا توجد مقالات بعد.</li>'
  } catch {
    document.querySelector('#existing-list').innerHTML = '<li>تعذر تحميل القائمة.</li>'
  }
}

loadDraft()
if (!editor.innerHTML.trim()) editor.innerHTML = '<p class="lead">فقرة افتتاحية تعرّف بالموضوع وأهميته.</p><h2 id="muqadima">مقدمة</h2><p>اكتب هنا محتوى المقال بلغة واضحة ومباشرة.</p><h2 id="masadir">المصادر</h2><ul><li>أضف المصادر وروابطها هنا.</li></ul>'
syncContent()
renderPreview()
loadExisting()
