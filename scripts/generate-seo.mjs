import { readFile, writeFile, access } from 'node:fs/promises'
import { wedding } from '../src/data/wedding.ts'
import { structuredData } from '../src/lib/metadata.ts'

const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const title = `${wedding.groom.name.en} & ${wedding.bride.name.en} — ${wedding.title.en}`
const url = new URL(wedding.siteUrl).origin + '/'
let image = '/images/og-wedding.svg'
try { await access(`dist${wedding.ogImage}`); image = wedding.ogImage } catch { /* The original vector preview is the default. */ }
let html = await readFile('dist/index.html', 'utf8')
html = html.replace(/<title>.*?<\/title>/, `<title>${escape(title)}</title>`)
const tags = { description: wedding.description.en, 'og:title': title, 'og:description': wedding.description.en, 'og:image': new URL(image, url).href, 'og:url': url, 'twitter:title': title, 'twitter:description': wedding.description.en, 'twitter:image': new URL(image, url).href }
for (const [name, content] of Object.entries(tags)) html = html.replace(new RegExp(`(<meta (?:name|property)="${name}" content=")[^"]*("[^>]*>)`), `$1${escape(content).replaceAll('$', '$$$$')}$2`)
html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
html = html.replace('</head>', `<script id="wedding-structured-data" type="application/ld+json">${JSON.stringify(structuredData()).replaceAll('<', '\\u003c')}</script>\n</head>`)
await writeFile('dist/index.html', html)
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${url}sitemap.xml\n`)
const today = new Date().toISOString().slice(0, 10)
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(url)}</loc><lastmod>${today}</lastmod></url><url><loc>${escape(new URL('/albums', url).href)}</loc><lastmod>${today}</lastmod></url></urlset>\n`)
console.log('Generated wedding metadata, structured data, robots.txt and sitemap.xml from wedding.ts.')
