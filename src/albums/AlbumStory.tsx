import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDown, ChevronLeft } from 'lucide-react'
import { wedding } from '../data/wedding'
import { useInvitation } from '../context/InvitationContext'
import { useReducedMotion } from '../hooks/useReducedMotion'
import type { TranslationKey } from '../data/translations'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { pushRoute } from '../lib/navigate'
import type { Album, AlbumPhoto } from '../lib/albums'
import { buildStoryBlocks, type StoryBlock } from './storyBlocks'
import { MissingPhotoFrame, PhotoBackdrop, PhotoFrame } from './PhotoEffects'
import AlbumLightbox, { type LightboxTranslation } from './AlbumLightbox'
import { Lotus } from '../components/Ornaments'

gsap.registerPlugin(ScrollTrigger)

const CHUNK = 6
const EARLY_BLOCKS = 3

const hasImage = (photo: AlbumPhoto) => Boolean(photo.imageUrl.trim())

/** A figure with the framed photo (or its quiet fallback) and an optional caption. */
function StoryFigure({ photo, label, eager = false, onOpen, captionBelow = false }: {
  photo: AlbumPhoto
  label: string
  eager?: boolean
  onOpen?: () => void
  captionBelow?: boolean
}) {
  return <figure className="story-figure">
    <div className="story-slot">
      {hasImage(photo) ? <PhotoFrame photo={photo} eager={eager} onClick={onOpen} label={label} /> : <MissingPhotoFrame label={label} />}
    </div>
    {captionBelow && (photo.caption.en || photo.location) && <figcaption>{photo.caption.en}{photo.location && <span className="story-figure-location">{photo.location}</span>}</figcaption>}
  </figure>
}

function Block({ block, photos, album, onOpen, t, l, i }: {
  block: StoryBlock
  photos: AlbumPhoto[]
  album: Album
  onOpen: (index: number) => void
  t: (key: TranslationKey) => string
  l: (value: { en: string; ta: string }) => string
  i: number
}) {
  const entry = block.indexes[0] !== undefined ? photos[block.indexes[0]] : undefined
  const title = entry ? l(entry.title) || l(album.title) : ''
  const caption = entry ? l(entry.caption) : ''
  const story = entry ? l(entry.storyText) : ''
  const label = (photo: AlbumPhoto, index: number) => `${photo.title.en || photo.caption.en || album.title.en} — ${index + 1} ${t('photoOf')} ${photos.length}`

  switch (block.kind) {
    case 'lead': {
      const lead = photos[block.indexes[0]]
      return <section className="alb-blk alb-lead" aria-label={l(album.title)}>
        {lead && hasImage(lead) && <> <PhotoBackdrop photo={lead} eager /> <div className="alb-lead-shade" /> </>}
        <div className="alb-lead-copy blk-reveal">
          <span className="alb-eyebrow">{l(album.subtitle) || album.eventType.replace('-', ' ')}</span>
          <h1>{l(album.title)}</h1>
          {l(album.description) && <p>{l(album.description)}</p>}
          <span className="alb-lead-count">{photos.length} {t('albumCount')}</span>
        </div>
        <span className="alb-scroll-hint">{t('albumScroll')}<ArrowDown size={15} /></span>
      </section>
    }
    case 'split': {
      const photo = photos[block.indexes[0]]
      const side = i % 2 === 0
      return <section className={`alb-blk alb-split ${side ? '' : 'alt'}`}>
        <div className="blk-reveal alb-split-media">{hasImage(photo) ? <PhotoFrame photo={photo} onClick={() => onOpen(block.indexes[0])} label={label(photo, block.indexes[0])} /> : <MissingPhotoFrame label={title} />}</div>
        <div className="alb-split-copy blk-reveal">
          {story || caption ? <><span className="alb-eyebrow">{title}</span><h2>{story || caption}</h2>{photo.location && <span className="alb-split-location">{photo.location}</span>}</> : <><span className="alb-eyebrow">{l(album.subtitle)}</span><h2>{l(album.title)}</h2></>}
        </div>
      </section>
    }
    case 'full': {
      const photo = photos[block.indexes[0]]
      return <section className="alb-blk alb-full">
        <div className="alb-full-media">{hasImage(photo) ? <PhotoFrame photo={photo} onClick={() => onOpen(block.indexes[0])} label={label(photo, block.indexes[0])} /> : <MissingPhotoFrame label={title} />}</div>
        {(story || caption) && <div className="alb-full-copy blk-reveal"><span className="alb-eyebrow">{title}</span><p>{story || caption}</p></div>}
      </section>
    }
    case 'duo': {
      const [a, b] = block.indexes
      const first = photos[a]; const second = photos[b]
      return <section className="alb-blk alb-duo">
        <StoryFigure photo={first} label={label(first, a)} onOpen={() => onOpen(a)} captionBelow />
        {second && <StoryFigure photo={second} label={label(second, b)} onOpen={() => onOpen(b)} captionBelow />}
      </section>
    }
    case 'film': {
      return <section className="alb-blk alb-film">
        <div className="alb-film-track">
          {block.indexes.map(idx => { const photo = photos[idx]; return <div className="alb-film-card" key={photo.id}><div className="story-slot">{hasImage(photo) ? <PhotoFrame photo={photo} onClick={() => onOpen(idx)} label={label(photo, idx)} /> : <MissingPhotoFrame label={photo.title.en || l(album.title)} />}</div><p>{photo.caption.en || photo.title.en}</p></div> })}
        </div>
      </section>
    }
    case 'caption': {
      const photo = photos[block.indexes[0]]
      return <section className="alb-blk alb-caption"><StoryFigure photo={photo} label={label(photo, block.indexes[0])} onOpen={() => onOpen(block.indexes[0])} captionBelow /></section>
    }
    case 'quote': {
      return <section className="alb-blk alb-quote blk-reveal">
        <Lotus /><span className="alb-eyebrow">{title}</span><blockquote>{caption || story || l(album.description)}</blockquote>{entry?.location && <span className="alb-quote-location">{entry.location}</span>}
      </section>
    }
    case 'closing': {
      return <section className="alb-blk alb-closing blk-reveal">
        <Lotus /><span className="alb-eyebrow">{l(album.subtitle) || wedding.hashtag}</span>
        <p className="alb-closing-line">{l(album.description) || t('albumBackToAlbums')}</p>
        <a className="alb-back-link" href="/albums" onClick={event => { event.preventDefault(); pushRoute('/albums') }}><ChevronLeft size={15} /> {t('albumBackToAlbums')}</a>
      </section>
    }
    default:
      return null
  }
}

export default function AlbumStory({ album, photos }: { album: Album; photos: AlbumPhoto[] }) {
  const { t, l } = useInvitation()
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<'cover' | 'story'>(photos.length ? 'cover' : 'story')
  const [opening, setOpening] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [visible, setVisible] = useState(() => Math.min(photos.length ? EARLY_BLOCKS : 0, 999))
  const root = useRef<HTMLElement>(null)
  const sentinel = useRef<HTMLDivElement>(null)
  const lastVisible = useRef(0)

  const blocks = useMemo(() => buildStoryBlocks(photos, album.layoutType), [photos, album.layoutType])
  useEffect(() => { if (blocks.length) setVisible(current => Math.min(current, blocks.length)) }, [blocks.length])

  useEffect(() => {
    if (photos.length) setPhase('cover'); else setPhase('story')
  }, [photos.length])

  useEffect(() => {
    document.title = `${l(album.title)} — ${wedding.title.en}`
  }, [album, l])

  const open = useCallback(() => {
    if (reduced) { setPhase('story'); return }
    setOpening(true)
    window.setTimeout(() => setPhase('story'), 1000)
  }, [reduced])

  useEffect(() => {
    if (phase !== 'story') return
    const target = Math.ceil(window.innerHeight / 900) + EARLY_BLOCKS
    setVisible(current => Math.max(current, Math.min(target, Math.max(blocks.length, 1))))
  }, [phase, blocks.length])

  // Incremental mounting: reveal more blocks as the reader approaches the end.
  useEffect(() => {
    if (phase !== 'story' || !sentinel.current) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisible(count => Math.min(blocks.length, count + CHUNK))
    }, { rootMargin: '700px 0px' })
    observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [phase, blocks.length, visible])

  // Warm the next chunk's gallery copies while the current chunk scrolls in.
  useEffect(() => {
    if (phase !== 'story') return
    const next = blocks.slice(lastVisible.current, Math.min(blocks.length, lastVisible.current + CHUNK))
    lastVisible.current = Math.max(lastVisible.current, visible)
    next.forEach(block => block.indexes.forEach(index => { const url = photos[index]?.imageUrl; if (url) { const image = new Image(); image.src = url } }))
  }, [phase, visible, blocks, photos])

  // Scroll storytelling + parallax depth, scoped for safe teardown.
  useEffect(() => {
    if (phase !== 'story' || reduced) return
    let timer = 0
    const context = gsap.context(() => {
      root.current?.querySelectorAll<HTMLElement>('.alb-blk').forEach(block => {
        gsap.from(block.querySelector('.blk-reveal'), { opacity: 0, y: 30, ease: 'none', scrollTrigger: { trigger: block, start: 'top 88%', once: true } })
      })
      root.current?.querySelectorAll<HTMLElement>('.effect-parallax-depth .ph-parallax-ok').forEach(image => {
        const block = image.closest('.alb-blk')
        gsap.fromTo(image, { yPercent: -9 }, { yPercent: 9, ease: 'none', scrollTrigger: { trigger: block ?? image.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1 } })
      })
    }, root)
    timer = window.setTimeout(() => ScrollTrigger.refresh(), 400)
    return () => { window.clearTimeout(timer); context.revert() }
  }, [phase, reduced, visible])

  const lightboxI18n = (): LightboxTranslation => ({
    close: t('close'), previous: t('previous'), next: t('next'), photoOf: t('photoOf'),
    share: t('albumShare'), copyLink: t('copyLink'), copied: t('copied'), download: t('albumDownload'),
    resetZoom: t('albumZoomReset'), zoomIn: t('albumZoomIn'), zoomOut: t('albumZoomOut'),
  })

  return <div className={`album-story theme-${album.theme} layout-${album.layoutType}`}>
    {phase === 'cover' && <Cover album={album} opening={opening} onOpen={open} t={t} l={l} reduced={reduced} />}
    {phase === 'story' && <>
      <header className="alb-story-header">
        <a className="alb-header-back" href="/albums" onClick={event => { event.preventDefault(); pushRoute('/albums') }}><ChevronLeft size={15} /> {t('albumBackToAlbums')}</a>
        <span className="alb-header-title">{l(album.title)}</span>
        <LanguageSwitcher />
      </header>
      <main ref={root}>
        {blocks.slice(0, visible).map((block, index) => <Block key={index} block={block} photos={photos} album={album} onOpen={setLightbox} t={t} l={l} i={index} />)}
        {visible < blocks.length && <div ref={sentinel} className="alb-chunk-sentinel" aria-hidden="true" />}
        <p className="alb-story-hashtag">{wedding.hashtag}</p>
      </main>
    </>}
    {lightbox !== null && photos[lightbox] && <AlbumLightbox photos={photos} index={lightbox} onClose={() => setLightbox(null)} onNavigate={setLightbox} album={album} t={lightboxI18n()} />}
  </div>
}

function Cover({ album, opening, onOpen, t, l, reduced }: {
  album: Album
  opening: boolean
  onOpen: () => void
  t: (key: TranslationKey) => string
  l: (value: { en: string; ta: string }) => string
  reduced: boolean
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const tiltStyle: CSSProperties = { '--ry': `${tilt.y}deg`, '--rx': `${tilt.x}deg` } as CSSProperties
  return <section className="alb-cover" aria-label={l(album.title)}>
    <header className="alb-story-header">
      <a className="alb-header-back" href="/albums" onClick={event => { event.preventDefault(); pushRoute('/albums') }}><ChevronLeft size={15} /> {t('albumBackToAlbums')}</a>
      <span className="alb-header-title">{l(album.title)}</span>
      <LanguageSwitcher />
    </header>
    <div className="alb-book-stage" onPointerMove={event => { if (reduced || opening) return; const rect = event.currentTarget.getBoundingClientRect(); setTilt({ x: ((event.clientY - rect.top) / rect.height - 0.5) * -4, y: ((event.clientX - rect.left) / rect.width - 0.5) * 4 }) }} onPointerLeave={() => setTilt({ x: 0, y: 0 })}>
      <div className={`alb-book ${opening ? 'is-opening' : ''}`} style={tiltStyle}>
        <div className="alb-book-back" aria-hidden="true" />
        <div className="alb-book-front">
          <div className="alb-book-border"><Lotus /><span className="alb-book-eyebrow">{t('albumEyebrow')}</span><h1>{l(album.title)}</h1><p className="alb-book-sub">{l(album.subtitle)}</p>{album.eventDate && <time className="alb-book-date">{album.eventDate}</time>}<button type="button" className="alb-book-open" onClick={onOpen}>{t('albumOpen')}</button></div>
        </div>
        <div className="alb-book-inside" aria-hidden="true"><span className="alb-inside-scroll">{t('albumScroll')}</span><span className="alb-inside-mark">&</span></div>
      </div>
    </div>
  </section>
}