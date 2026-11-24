// Build-time prerendering: renders every public route to static HTML so that
// crawlers and link-preview bots see full page content without running JS.
// Runs AFTER `vite build --ssr` (see package.json build script) and reads the
// built shell from dist/index.html as its template — so the favicon, meta
// description, Open Graph tags and all other <head> content are preserved,
// and only the per-route title/meta/canonical/JSON-LD are swapped in.
//
// Per-route render is wrapped in try/catch: a route that fails to prerender
// keeps the plain shell (Vercel's SPA rewrite serves dist/index.html for it)
// and is listed at the end — the build still succeeds.
//
// Route list + SEO copy live in ./routes.mjs (single source of truth, shared
// with the sitemap generator). Slugs come from src/data/sample.ts.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { routes, SITE_URL } from './routes.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
const template = readFileSync(join(dist, 'index.html'), 'utf8')

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// Replace one <meta ... content="..."> tag's content, matched by attribute.
function setMeta(head, attr, name, content) {
  const re = new RegExp(`(<meta ${attr}="${name}" content=")[^"]*(")`)
  if (re.test(head)) return head.replace(re, `$1${esc(content)}$2`)
  return head.replace('</head>', `    <meta ${attr}="${name}" content="${esc(content)}" />\n  </head>`)
}

function buildHead(route) {
  const url = route.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${route.path}`
  const fullTitle = route.path === '/' ? route.title : `${route.title} | SP Academy`
  let head = template.slice(0, template.indexOf('</head>'))
  head = head.replace(/<title>[^<]*<\/title>/, `<title>${esc(fullTitle)}</title>`)
  head = setMeta(head, 'name', 'description', route.description)
  head = setMeta(head, 'property', 'og:title', fullTitle)
  head = setMeta(head, 'property', 'og:description', route.description)
  head = setMeta(head, 'property', 'og:url', url)
  head = setMeta(head, 'name', 'twitter:title', fullTitle)
  head = setMeta(head, 'name', 'twitter:description', route.description)
  head = head.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
  // Per-route JSON-LD (WebPage + BreadcrumbList).
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: fullTitle,
    description: route.description || '',
    url,
    inLanguage: 'bn',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'হোম', item: `${SITE_URL}/` },
        ...(route.path === '/'
          ? []
          : [{ '@type': 'ListItem', position: 2, name: route.title, item: url }]),
      ],
    },
  }
  head += `    <script id="seo-jsonld" type="application/ld+json">${JSON.stringify(data)}</script>\n  `
  return head
}

function buildPage(route, html) {
  const head = buildHead(route)
  const body = template.slice(template.indexOf('</head>'))
  return head + body.replace('<div id="root"></div>', `<div id="root">${html}</div>`)
}

// The SSR bundle is built by `vite build --ssr` into dist-server/.
// If it cannot even be imported (e.g. a dependency touches window at module
// scope), prerendering is skipped entirely and the plain shell stays live.
let render
try {
  const serverDir = join(root, 'dist-server')
  const entry = readdirSync(serverDir).find((f) => f.startsWith('entry-server.') && f.endsWith('.js'))
  if (!entry) throw new Error(`no entry-server bundle in ${serverDir}`)
  ;({ render } = await import(join(serverDir, entry)))
} catch (err) {
  console.error(`prerender: SSR bundle unavailable (${err.message}) — keeping the client shell for all routes`)
  process.exit(0)
}

let ok = 0
const failed = []
for (const route of routes) {
  try {
    const html = await render(route.path)
    if (!html || html.length < 1000) throw new Error(`rendered HTML suspiciously short (${html?.length ?? 0} chars)`)
    // A prerendered page must contain real Bengali content, not just the
    // loading skeleton — the hero/course/book text proves the render worked.
    // (The Suspense fallback string also appears in streamed SSR output
    // alongside the resolved content, so it is not a failure signal.)
    if (!/[\u0980-\u09FF]{3,}/.test(html)) throw new Error('rendered HTML has no Bengali content')
    const out = route.path === '/' ? join(dist, 'index.html') : join(dist, route.path, 'index.html')
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, buildPage(route, html))
    ok++
  } catch (err) {
    failed.push(route.path)
    console.error(`prerender FAIL ${route.path}: ${err.message}`)
  }
}
console.log(`prerender: ${ok}/${routes.length} routes prerendered`)
if (failed.length) console.log(`prerender: fell back to shell for: ${failed.join(', ')}`)
