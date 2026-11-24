// Generates dist/sitemap.xml from the same public route list the prerender
// step uses (scripts/routes.mjs). Runs as part of `npm run build`.
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { routes, SITE_URL } from './routes.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const today = new Date().toISOString().slice(0, 10)

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const urls = routes
  .map(
    (r) =>
      `  <url>\n    <loc>${esc(SITE_URL)}${r.path === '/' ? '/' : esc(r.path)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`,
  )
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
writeFileSync(join(root, 'dist', 'sitemap.xml'), xml)
console.log(`sitemap: ${routes.length} URLs written to dist/sitemap.xml`)
