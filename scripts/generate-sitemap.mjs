import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')
const registryPath = resolve(projectRoot, 'src/data/registry.ts')
const outputPath = resolve(projectRoot, process.argv[2] ?? 'dist/sitemap.xml')
const robotsPath = resolve(outputPath, '..', 'robots.txt')
const siteUrl = (process.env.SITE_URL ?? 'http://localhost:5173').replace(/\/+$/, '')

const registrySource = await readFile(registryPath, 'utf8')
const registryBody = registrySource.match(/registry: RegistryEntry\[\] = \[([\s\S]*?)\n\]/)?.[1] ?? ''
const entries = registryBody
  .split(/\n\s*},\s*\n/)
  .map((block) => {
    const slug = readField(block, 'slug')
    const date = readField(block, 'date')
    return slug ? { slug, date } : null
  })
  .filter(Boolean)

const urls = [
  { loc: `${siteUrl}/`, changefreq: 'weekly', priority: '1.0' },
  ...entries.map((entry) => ({
    loc: `${siteUrl}/#/wiki/${encodeURIComponent(entry.slug)}`,
    lastmod: entry.date,
    changefreq: 'monthly',
    priority: '0.8',
  })),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `
    <lastmod>${escapeXml(url.lastmod)}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>
`

await mkdir(resolve(outputPath, '..'), { recursive: true })
await writeFile(outputPath, xml, 'utf8')
await writeFile(robotsPath, `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`, 'utf8')
console.log(`Generated ${outputPath} for ${urls.length} URL${urls.length === 1 ? '' : 's'} using SITE_URL=${siteUrl}`)
if (!process.env.SITE_URL) {
  console.warn('Set SITE_URL when building for deployment; the default localhost URL is for local validation only.')
}

function readField(block, field) {
  const match = block.match(new RegExp(`${field}:\\s*([\\'\"])(.*?)\\1`))
  return match?.[2] ?? ''
}

function escapeXml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
}
