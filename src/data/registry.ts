/**
 * Wiki Registry: سجل المقالات
 *
 * Keep this list intentionally empty in the open-source starter repository.
 * To add an article, create a module from src/articles/_template.ts and add
 * its metadata plus a lazy import to this array.
 */

import type { RegistryEntry } from './types.ts'

export const registry: RegistryEntry[] = [
  {
    slug: 'prophet-muhammad-birth',
    title: 'مولد رسول الله محمد ﷺ: ما ثبت وما اختلف فيه',
    summary:
      'قراءة موثقة في مولد النبي محمد ﷺ: ما ثبت في يوم الاثنين، وما تذكره كتب السيرة عن عام الفيل ومكة، ولماذا اختلفت الروايات في تحديد اليوم.',
    category: 'السيرة',
    tags: ['مولد النبي', 'السيرة النبوية', 'عام الفيل', 'مكة'],
    date: '2026-08-29',
    readingTime: 20,
    featured: true,
    load: () => import('../articles/prophet-muhammad-birth.ts'),
  },
]

// Derived helpers

export function getBySlug(slug: string): RegistryEntry | undefined {
  return registry.find((article) => article.slug === slug)
}

export function getByCategory(category: string): RegistryEntry[] {
  return registry.filter((article) => article.category === category)
}

export function getCategories(): string[] {
  return [...new Set(registry.map((article) => article.category))].sort((a, b) =>
    a.localeCompare(b, 'ar'),
  )
}

export function search(query: string): RegistryEntry[] {
  const normalizedQuery = normalizeArabic(query)
  if (!normalizedQuery) return registry
  return registry.filter((article) =>
    [article.title, article.summary, article.category, ...(article.tags ?? [])]
      .map(normalizeArabic)
      .join(' ')
      .includes(normalizedQuery),
  )
}

export function getFeatured(): RegistryEntry[] {
  return registry.filter((article) => article.featured)
}

function normalizeArabic(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ـ/g, '')
    .replace(/(^|\s)ال(?=[ء-ي])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}
