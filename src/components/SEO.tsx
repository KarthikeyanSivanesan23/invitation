import { useEffect } from 'react'
import { wedding } from '../data/wedding'
import { useInvitation } from '../context/InvitationContext'
import { structuredData } from '../lib/metadata'
import { hasAsset } from '../lib/assets'

export default function SEO() {
  const { language } = useInvitation()
  useEffect(() => {
    const title = `${wedding.groom.name[language]} & ${wedding.bride.name[language]} — ${wedding.title[language]}`
    document.title = title
    const update = (selector: string, content: string) => document.querySelector(selector)?.setAttribute('content', content)
    update('meta[name="description"]', wedding.description[language]); update('meta[property="og:title"]', title); update('meta[name="twitter:title"]', title)
    update('meta[property="og:description"]', wedding.description[language]); update('meta[name="twitter:description"]', wedding.description[language])
    const image = new URL(hasAsset(wedding.ogImage) ? wedding.ogImage : '/images/og-wedding.svg', wedding.siteUrl).href
    update('meta[property="og:image"]', image); update('meta[name="twitter:image"]', image); update('meta[property="og:url"]', wedding.siteUrl)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', `${wedding.siteUrl}/`)
    let script = document.getElementById('wedding-structured-data') as HTMLScriptElement | null
    if (!script) { script = document.createElement('script'); script.id = 'wedding-structured-data'; script.type = 'application/ld+json'; document.head.appendChild(script) }
    script.textContent = JSON.stringify(structuredData(language)).replaceAll('<', '\\u003c')
  }, [language])
  return null
}
