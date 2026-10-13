import { useEffect, useState } from 'react'
import { albumRepository } from '../services/albumRepository'
import { useInvitation } from '../context/InvitationContext'
import { useAlbumSeo } from './useAlbumSeo'
import AlbumsIndex from './AlbumsIndex'
import AlbumStory from './AlbumStory'
import type { Album, AlbumPhoto } from '../lib/albums'
import { ChevronLeft } from 'lucide-react'
import { pushRoute } from '../lib/navigate'
import { wedding } from '../data/wedding'
import './albums.css'

function AlbumView({ slug }: { slug: string }) {
  const { t, l } = useInvitation()
  const [state, setState] = useState<{ album: Album; photos: AlbumPhoto[] } | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  useEffect(() => {
    let cancelled = false
    setStatus('loading'); setState(null)
    albumRepository().getPublishedAlbumBySlug(slug)
      .then(result => { if (cancelled) return; if (!result) { setStatus('missing'); return } setState(result); setStatus('ready') })
      .catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true }
  }, [slug])

  useAlbumSeo(state ? `${l(state.album.title)} — ${wedding.title.en}` : t('albumError'), state ? l(state.album.description) : '')

  if (status === 'loading') return <div className="alb-loginless alb-loading-page"><div className="alb-loading-book" aria-label="Loading" /></div>
  if (status === 'missing' || status === 'error') return <div className="alb-loginless alb-empty-page">
    <span className="eyebrow"><span />{t('albumEyebrow')}<span /></span><h1>{t('albumTitle')}</h1><p>{t('albumError')}</p>
    <a className="alb-back-link" href="/albums" onClick={event => { event.preventDefault(); pushRoute('/albums') }}><ChevronLeft size={15} /> {t('albumBackToAlbums')}</a>
  </div>
  return <AlbumStory album={state!.album} photos={state!.photos} />
}

function PublicAlbumApp() {
  const { notify } = useInvitation()
  const path = window.location.pathname
  useEffect(() => {
    const listener = (event: Event) => { const message = (event as CustomEvent).detail; if (typeof message === 'string') notify(message) }
    window.addEventListener('album-notify', listener)
    return () => window.removeEventListener('album-notify', listener)
  }, [notify])

  const slug = path.startsWith('/albums/') ? path.slice('/albums/'.length).split('/')[0] : ''
  return slug ? <AlbumView key={slug} slug={slug} /> : <AlbumsIndex />
}

export default function AlbumsApp() {
  return <PublicAlbumApp />
}

export { AlbumView }