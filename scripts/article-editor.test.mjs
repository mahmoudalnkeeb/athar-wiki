import test from 'node:test'
import assert from 'node:assert/strict'
import {
  escapeTemplateLiteral,
  parseSources,
  parseTags,
  toArticleModule,
  toRegistryEntry,
  validateArticleInput,
} from './article-editor.mjs'

test('validates required fields and slug format', () => {
  const result = validateArticleInput({
    slug: 'Bad Slug',
    title: '',
    summary: '',
    category: '',
    content: '',
  })
  assert.equal(result.errors.length, 5)
})

test('parses comma-separated tags', () => {
  assert.deepEqual(parseTags(' بغداد، علوم, , '), ['بغداد', 'علوم'])
})

test('parses structured sources', () => {
  assert.deepEqual(
    parseSources('Britannica | https://www.britannica.com\nArchive | https://example.com'),
    [
      { title: 'Britannica', url: 'https://www.britannica.com' },
      { title: 'Archive', url: 'https://example.com' },
    ],
  )
})

test('escapes template literal content before writing a module', () => {
  const content = '`quoted` ${unsafe} \\ path'
  const escaped = escapeTemplateLiteral(content)
  assert.equal(escaped, '\\`quoted\\` \\${unsafe} \\\\ path')
  assert.match(
    toArticleModule({
      slug: 'test-article',
      title: 'عنوان',
      summary: 'ملخص',
      category: 'عام',
      content,
    }),
    /render\(\)/,
  )
})

test('generates a registry entry with dynamic import', () => {
  const entry = toRegistryEntry({
    slug: 'new-article',
    title: 'عنوان',
    summary: 'ملخص',
    category: 'عام',
    tags: 'أ، ب',
    date: '2026-08-28',
    readingTime: '7',
  })
  assert.match(entry, /slug: "new-article"/)
  assert.match(entry, /import\('\.\.\/articles\/new-article\.ts'\)/)
  assert.match(entry, /tags: \["أ","ب"\]/)
})
