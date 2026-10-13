import { useEffect } from 'react'

/** Lightweight per-page metadata for the public album routes. */
export function useAlbumSeo(title: string, description: string) {
  useEffect(() => {
    document.title = title
    const meta = (name: string) => document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"], meta[property="${name}"]`)
    const setMeta = (name: string, content: string) => {
      const element = meta(name) ?? (() => { const tag = document.createElement('meta'); tag.setAttribute(name.includes(':') ? 'property' : 'name', name); document.head.appendChild(tag); return tag })()
      element.setAttribute('content', content)
    }
    setMeta('description', description)
    setMeta('og:title', title)
    setMeta('og:description', description)
    setMeta('og:url', window.location.href)
  }, [title, description])
}