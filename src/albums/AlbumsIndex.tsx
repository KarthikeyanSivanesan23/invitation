import { useEffect, useState } from 'react'
import { CalendarDays, ChevronRight, Film } from 'lucide-react'
import { wedding } from '../data/wedding'
import { useInvitation } from '../context/InvitationContext'
import { albumRepository } from '../services/albumRepository'
import { pushRoute } from '../lib/navigate'
import type { Album, AlbumListItem } from '../lib/albums'
import { useAlbumSeo } from './useAlbumSeo'

export type { AlbumListItem }

function AlbumArt({ album }: { album: Album }) {
  if (album.coverImage.trim()) return <div className="alb-card-art"><img src={album.coverImage} alt="" loading="lazy" decoding="async" /></div>
  return <div className="alb-card-art alb-card-art-empty"><span>{album.title.en.slice(0, 1).toUpperCase() || wedding.groom.initial}</span></div>
}

export default function AlbumsIndex() {
  const { t, l } = useInvitation()
  const [albums, setAlbums] = useState<AlbumListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    const repo = albumRepository()
    repo.listPublishedAlbums().then(async list => {
      const withCounts = await repo.countPublishedPhotos(list.map(album => album.id))
      if (cancelled) return
      setAlbums(list.map(album => ({ ...album, photoCount: withCounts[album.id] ?? 0 })))
    }).catch(() => { if (!cancelled) setError(t('albumError')) })
    return () => { cancelled = true }
  }, [t])

  useAlbumSeo(`${l(wedding.title)} — ${t('albumEyebrow')}`, l(wedding.description))

  return <div className="alb-loginless albums-page">
    <header className="alb-page-header">
      <a className="brand" href="/" onClick={event => { event.preventDefault(); pushRoute('/') }} aria-label={`${wedding.groom.name.en} & ${wedding.bride.name.en}`}><span className="brand-monogram">{wedding.groom.initial}<i>&</i>{wedding.bride.initial}</span><span className="brand-label">{t('weddingCelebration')}</span></a>
      <nav className="alb-page-nav" aria-label={t('menu')}><a href="/" onClick={event => { event.preventDefault(); pushRoute('/') }}>{t('home')}</a><span aria-hidden="true">{t('home') !== 'Home' ? '•' : '•'}</span><strong>Albums</strong></nav>
    </header>

    <main className="alb-index-main">
      <section className="alb-index-heading">
        <span className="eyebrow"><span />{t('albumEyebrow')}<span /></span>
        <h1>{t('albumTitle')} <em>{t('albumAccent')}</em></h1>
        <p>{t('albumText')}</p>
      </section>

      {error && <section className="alb-empty" role="alert"><Film size={26} /><p>{error}</p><a className="alb-back-link" href="/" onClick={event => { event.preventDefault(); pushRoute('/') }}><ChevronRight size={15} /> {t('home')}</a></section>}

      {!error && albums === null && <section className="alb-grid" aria-busy="true">{Array.from({ length: 3 }, (_, i) => <div className="alb-card alb-card-skeleton" key={i}><div className="alb-card-art" /><div className="alb-card-line" /><div className="alb-card-line short" /></div>)}</section>}

      {!error && albums?.length === 0 && <section className="alb-empty"><Film size={26} /><p>{t('albumEmpty')}</p></section>}

      {!error && Boolean(albums?.length) && <section className="alb-grid">
        {albums!.map((album, index) => <a key={album.id} className="alb-card" href={`/albums/${album.slug}`} onClick={event => { event.preventDefault(); pushRoute(`/albums/${album.slug}`) }}>
          <AlbumArt album={album} />
          <div className="alb-card-body">
            <span className="alb-card-index">{(index + 1).toString().padStart(2, '0')}</span>
            <h2>{l(album.title)}</h2>
            <p className="alb-card-sub">{l(album.subtitle) || l(album.description)}</p>
            <div className="alb-card-meta">
              {album.eventDate && <span className="alb-card-meta-item"><CalendarDays size={13} />{album.eventDate}</span>}
              {album.photoCount > 0 && <span className="alb-card-meta-item">{album.photoCount} {t('albumCount')}</span>}
            </div>
            <span className="alb-card-open">{t('albumView')}<ChevronRight size={15} /></span>
          </div>
        </a>)}
      </section>}
    </main>
    <footer className="alb-page-footer"><span>{wedding.hashtag}</span><span>{t('withLove')}</span></footer>
  </div>
}