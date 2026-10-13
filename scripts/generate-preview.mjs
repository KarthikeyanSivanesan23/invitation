import { access } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import { wedding } from '../src/data/wedding.ts'

await access('public/images')
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const names = `${wedding.groom.name.en} & ${wedding.bride.name.en}`
const browser = await chromium.launch({ channel: 'chrome' })
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  await page.setContent(`<!doctype html><html><head><style>body{margin:0}svg{display:block}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><radialGradient id="bg"><stop stop-color="#713040"/><stop offset="1" stop-color="#401924"/></radialGradient></defs><path fill="url(#bg)" d="M0 0h1200v630H0z"/><g fill="none" stroke="#c3a365"><path d="M25 25h1150v580H25zM35 35h1130v560H35z"/><path d="M600 142c-36-17-21-48 0-72 21 24 36 55 0 72Zm0 0c-34 6-55-25-48-48 30 2 52 22 48 48Zm0 0c34 6 55-25 48-48-30 2-52 22-48 48Z"/><path d="M480 446h240M568 162h64"/></g><g text-anchor="middle" font-family="Georgia,serif"><text x="600" y="216" fill="#d2b880" font-size="14" letter-spacing="5">TOGETHER WITH OUR FAMILIES</text><text x="600" y="309" fill="#f8eedb" font-size="${names.length > 40 ? 49 : 59}">${escape(names)}</text><text x="600" y="378" fill="#d8ba80" font-size="35" font-style="italic">${escape(wedding.title.en)}</text><text x="600" y="498" fill="#ebdcc2" font-size="20">${escape(wedding.dateISO ? wedding.date.en : wedding.intro.note.en)}</text><text x="600" y="543" fill="#c7ad79" font-size="15" letter-spacing="3">${escape(wedding.hashtag)}</text></g></svg></body></html>`)
  await page.screenshot({ path: 'public/images/og-wedding.jpg', type: 'jpeg', quality: 91 })
  console.log('Generated public/images/og-wedding.jpg from wedding.ts (1200 × 630).')
} finally { await browser.close() }
