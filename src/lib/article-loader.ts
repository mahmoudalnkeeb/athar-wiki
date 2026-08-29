import type { RegistryEntry, WikiArticleDefinition } from '../data/types.ts'
import { isSlowConnection, withRetry } from './loader.ts'

type LoadedArticle = Awaited<ReturnType<RegistryEntry['load']>>

export async function loadArticle(entry: RegistryEntry): Promise<WikiArticleDefinition> {
  const module = await withRetry(() => entry.load(), isSlowConnection() ? 2 : 1)
  return resolveArticle(module)
}
export function resolveArticle(module: LoadedArticle): WikiArticleDefinition {
  return 'default' in module ? module.default : module
}
