/**
 * Wiki Types: أنواع بيانات الموسوعة
 * Keep minimal for bad connections: no heavy fields.
 */

export type Locale = 'ar'

export interface ArticleMeta {
  /** URL slug, used in #/wiki/:slug. */
  slug: string
  /** Arabic title */
  title: string
  /** Short description for cards/search. About 140 chars. */
  summary: string
  /** Category for grouping */
  category: string
  /** Tags for search filtering */
  tags?: string[]
  /** ISO date for sorting. */
  date?: string
  /** Estimated reading time in minutes, shown in the UI. */
  readingTime?: number
  /** Optional low-resolution cover image, lazy-loaded. */
  cover?: string
  /** Author */
  author?: string
  /** Editorial reviewer, shown with the last review date. */
  reviewer?: string
  /** ISO date of the latest editorial review. */
  lastReviewed?: string
  /** Structured sources used to verify the article. */
  sources?: ArticleSource[]
  /** Whether article is featured on home */
  featured?: boolean
}

export interface ArticleSource {
  title: string
  author?: string
  publication?: string
  year?: string
  url: string
}

/** Full article definition in a lazy-loaded chunk. */
export interface WikiArticleDefinition extends ArticleMeta {
  /** Render function returns HTML or DOM. Prefer an HTML string to keep the bundle small. */
  render: () => string | HTMLElement
  /** Optional table of contents override; auto-generated from h2/h3 if omitted */
  toc?: TocItem[]
}

export interface TocItem {
  id: string
  title: string
  level: 2 | 3
}

/** Lightweight registry entry that imports article code only when needed. */
export interface RegistryEntry extends ArticleMeta {
  /** Dynamic importer. Vite code-splits each article into its own chunk. */
  load: () => Promise<{ default: WikiArticleDefinition } | WikiArticleDefinition>
}

/** Helper to define an article with type safety. */
export function defineArticle(def: WikiArticleDefinition): WikiArticleDefinition {
  return def
}

/** Helper that keeps metadata and the loader separate for a small initial payload. */
export function defineRegistryEntry(entry: RegistryEntry): RegistryEntry {
  return entry
}
