#!/usr/bin/env node
/**
 * Local article editor for أثر.
 *
 * Starts a small, dependency-free Node.js server that writes article modules
 * and keeps src/data/registry.ts in sync. It is intentionally local-only.
 */

import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')
const articlesDir = path.join(projectRoot, 'src', 'articles')
const registryPath = path.join(projectRoot, 'src', 'data', 'registry.ts')
const editorHtmlPath = path.join(scriptDir, 'article-editor.html')
const editorCssPath = path.join(scriptDir, 'article-editor.css')
const editorJsPath = path.join(scriptDir, 'article-editor.js')
const logoMarkPath = path.join(projectRoot, 'public', 'athar_logo_without_wordmark.png')
const port = Number(process.env.ARTICLE_EDITOR_PORT ?? 4317)
const host = process.env.ARTICLE_EDITOR_HOST ?? '127.0.0.1'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function validateArticleInput(input = {}) {
  const data = input && typeof input === 'object' ? input : {}
  const errors = []
  const slug = String(data.slug ?? '').trim()
  const title = String(data.title ?? '').trim()
  const summary = String(data.summary ?? '').trim()
  const category = String(data.category ?? '').trim()
  const content = String(data.content ?? '').trim()
  const sources = parseSources(data.sources)

  if (!slugPattern.test(slug)) errors.push('يجب أن يكون المعرّف slug أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط.')
  if (!title) errors.push('عنوان المقال مطلوب.')
  if (!summary) errors.push('الملخص مطلوب.')
  if (!category) errors.push('التصنيف مطلوب.')
  if (!content) errors.push('محتوى المقال مطلوب.')
  if (summary.length > 280) errors.push('الملخص طويل جدًا (الحد الأقصى 280 حرفًا).')
  if (hasInvalidSourceLine(data.sources)) errors.push('كل مصدر يجب أن يكتب بهذا الشكل: العنوان | https://example.com')

  return { errors, value: { ...data, slug, title, summary, category, content, sources } }
}

export function escapeTemplateLiteral(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${')
}

export function toArticleModule(input) {
  const tags = parseTags(input.tags)
  const sources = parseSources(input.sources)
  const date = String(input.date ?? '').trim() || new Date().toISOString().slice(0, 10)
  const readingTime = clampInteger(input.readingTime, 1, 120, 5)
  const optionalLines = [
    String(input.author ?? '').trim() ? `  author: ${JSON.stringify(String(input.author).trim())},` : '',
    tags.length > 0 ? `  tags: ${JSON.stringify(tags)},` : '  tags: [],',
    sources.length > 0 ? `  sources: ${JSON.stringify(sources)},` : '',
  ].filter(Boolean)

  return `import { defineArticle } from '../data/types.ts'

export default defineArticle({
  slug: ${JSON.stringify(input.slug)},
  title: ${JSON.stringify(input.title)},
  summary: ${JSON.stringify(input.summary)},
  category: ${JSON.stringify(input.category)},
${optionalLines.join('\n')}
  date: ${JSON.stringify(date)},
  readingTime: ${readingTime},

  render() {
    return \`${escapeTemplateLiteral(input.content.trim())}\`
  },
})
`
}

export function toRegistryEntry(input) {
  const tags = parseTags(input.tags)
  const date = String(input.date ?? '').trim() || new Date().toISOString().slice(0, 10)
  const readingTime = clampInteger(input.readingTime, 1, 120, 5)
  const fields = [
    `    slug: ${JSON.stringify(input.slug)},`,
    `    title: ${JSON.stringify(input.title)},`,
    `    summary: ${JSON.stringify(input.summary)},`,
    `    category: ${JSON.stringify(input.category)},`,
    `    tags: ${JSON.stringify(tags)},`,
    `    date: ${JSON.stringify(date)},`,
    `    readingTime: ${readingTime},`,
    String(input.author ?? '').trim() ? `    author: ${JSON.stringify(String(input.author).trim())},` : '',
    `    load: () => import('../articles/${input.slug}.ts'),`,
  ].filter(Boolean)
  return `  {\n${fields.join('\n')}\n  },`
}

export function parseTags(value) {
  if (Array.isArray(value)) return value.map((tag) => String(tag).trim()).filter(Boolean)
  return String(value ?? '').split(/[,،]/).map((tag) => tag.trim()).filter(Boolean)
}

export function parseSources(value) {
  if (Array.isArray(value)) return value
  return String(value ?? '').split('\n').map((line) => line.trim()).filter(Boolean).flatMap((line) => {
    const [title, url] = line.split('|').map((part) => part.trim())
    return title && url ? [{ title, url }] : []
  })
}

function hasInvalidSourceLine(value) {
  if (Array.isArray(value)) return value.some((source) => !source?.title || !isHttpUrl(source.url))
  return String(value ?? '').split('\n').map((line) => line.trim()).filter(Boolean).some((line) => {
    const [title, url] = line.split('|').map((part) => part.trim())
    return !title || !isHttpUrl(url)
  })
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value))
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function clampInteger(value, min, max, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

async function readArticles() {
  const registrySource = await fs.readFile(registryPath, 'utf8')
  return [...registrySource.matchAll(/^\s+slug:\s*['"]([^'"]+)['"]/gm)].map((match) => match[1]).sort()
}

async function createArticle(input) {
  const { errors, value } = validateArticleInput(input)
  if (errors.length > 0) return { ok: false, status: 400, errors }

  const articlePath = path.join(articlesDir, `${value.slug}.ts`)
  const registrySource = await fs.readFile(registryPath, 'utf8')
  const registryMarker = 'export const registry: RegistryEntry[] = ['
  if (!registrySource.includes(registryMarker)) {
    return { ok: false, status: 500, errors: ['تعذر العثور على نقطة إدراج registry.ts.'] }
  }
  if (new RegExp(`slug:\\s*['"]${value.slug}['"]`).test(registrySource)) {
    return { ok: false, status: 409, errors: ['يوجد إدخال بهذا المعرّف في registry.ts بالفعل.'] }
  }

  const entry = toRegistryEntry(value)
  const nextRegistry = registrySource.replace(registryMarker, `${registryMarker}\n${entry}`)
  await fs.mkdir(articlesDir, { recursive: true })
  try {
    await fs.writeFile(articlePath, toArticleModule(value), { encoding: 'utf8', flag: 'wx' })
  } catch (error) {
    if (error?.code === 'EEXIST') return { ok: false, status: 409, errors: ['يوجد مقال بهذا المعرّف بالفعل. اختر معرّفًا آخر.'] }
    throw error
  }
  try {
    await fs.writeFile(registryPath, nextRegistry, 'utf8')
  } catch (error) {
    await fs.rm(articlePath, { force: true })
    throw error
  }

  return { ok: true, slug: value.slug, articlePath: path.relative(projectRoot, articlePath), registryPath: path.relative(projectRoot, registryPath) }
}

async function readBody(request) {
  let body = ''
  for await (const chunk of request) {
    body += chunk
    if (body.length > 1_000_000) throw new Error('Request body too large')
  }
  return JSON.parse(body)
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload)
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(body)
}

async function requestHandler(request, response) {
  const url = new URL(request.url ?? '/', `http://${host}:${port}`)
  const staticAssets = new Map([
    ['/', { path: editorHtmlPath, type: 'text/html; charset=utf-8' }],
    ['/article-editor.css', { path: editorCssPath, type: 'text/css; charset=utf-8' }],
    ['/article-editor.js', { path: editorJsPath, type: 'text/javascript; charset=utf-8' }],
    ['/src/styles/tokens.css', { path: path.join(projectRoot, 'src', 'styles', 'tokens.css'), type: 'text/css; charset=utf-8' }],
    ['/athar_logo_without_wordmark.png', { path: logoMarkPath, type: 'image/png' }],
  ])
  const asset = staticAssets.get(url.pathname)
  if (request.method === 'GET' && asset) {
    const content = await fs.readFile(asset.path)
    response.writeHead(200, { 'content-type': asset.type, 'cache-control': 'no-store' })
    response.end(content)
    return
  }
  if (request.method === 'GET' && url.pathname === '/api/articles') {
    sendJson(response, 200, { articles: await readArticles() })
    return
  }
  if (request.method === 'POST' && url.pathname === '/api/articles') {
    try {
      const result = await createArticle(await readBody(request))
      sendJson(response, result.status ?? 201, result)
    } catch (error) {
      console.error(error)
      sendJson(response, 500, { ok: false, errors: ['حدث خطأ غير متوقع أثناء حفظ المقال.'] })
    }
    return
  }
  sendJson(response, 404, { ok: false, errors: ['المسار غير موجود.'] })
}

export function startServer() {
  const server = http.createServer((request, response) => {
    void requestHandler(request, response).catch((error) => {
      console.error(error)
      if (!response.headersSent) sendJson(response, 500, { ok: false, errors: ['تعذر معالجة الطلب.'] })
      else response.end()
    })
  })
  server.listen(port, host, () => {
    console.log(`محرر المقالات يعمل على http://${host}:${port}`)
    console.log('أوقفه عبر Ctrl+C عند الانتهاء.')
  })
  return server
}

if (import.meta.url === `file://${process.argv[1]}`) startServer()
