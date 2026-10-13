import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Minus, Plus, RotateCcw, Share2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Album, AlbumPhoto } from '../lib/albums'

export interface LightboxTranslation {
  close: string
  previous: string
  next: string
  photoOf: string
  share: string
  copyLink: string
  copied: string
  download: string
  resetZoom: string
  zoomIn: string
  zoomOut: string
}

/** Full-screen photographic lightbox with zoom/pan, swipe, a contact-sheet
 *  thumbnail strip, share and (when the album allows it) download. */
export default function AlbumLightbox({ photos, index, onClose, onNavigate, album, t }: {
  photos: AlbumPhoto[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
  album: Album
  t: LightboxTranslation
}) {
  const photo = photos[index]
  const count = photos.length
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const pointer = useRef<{ x: number; y: number; zoomed: boolean } | null>(null)
  const stage = useRef<HTMLDivElement>(null)

  const reset = useCallback(() => { setZoom(1); setOffset({ x: 0, y: 0 }) }, [])
  const move = useCallback((direction: number) => {
    setOffset({ x: 0, y: 0 })
    onNavigate((index + direction + count) % count)
  }, [index, count, onNavigate])

  useEffect(() => { setZoom(1); setOffset({ x: 0, y: 0 }) }, [index])

  const pan = useCallback((dx: number, dy: number) => setOffset(current => ({ x: current.x + dx, y: current.y + dy })), [])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowLeft') move(-1)
      else if (event.key === 'ArrowRight') move(1)
      else if (event.key === '+' || event.key === '=') setZoom(value => Math.min(3, value + 0.25))
      else if (event.key === '-') setZoom(value => Math.max(1, value - 0.25))
      else if (event.key === '0') reset()
    }
    window.addEventListener('keydown', handleKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', handleKey); document.body.style.overflow = previous }
  }, [onClose, move, reset])

  const shareOrCopy = async () => {
    const url = window.location.href
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: photo.title.en || album.title.en, text: photo.caption.en || album.subtitle.en, url }); return } catch { /* fall through to copy */ }
    }
    try { await navigator.clipboard.writeText(url); window.dispatchEvent(new CustomEvent('album-notify', { detail: t.copied })) } catch { /* clipboard blocked */ }
  }

  const download = async () => {
    try {
      const response = await fetch(photo.fullUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${album.slug}-${index + 1}.jpg`
      anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch { /* fallback: navigate to the file */ window.open(photo.fullUrl, '_blank') }
  }

  return <div className="alb-lightbox" role="dialog" aria-modal="true" aria-label={photo.title.en || album.title.en}>
    <div className="alb-lightbox-top">
      <div className="alb-lightbox-album"><strong>{album.title.en}</strong><span>{index + 1} {t.photoOf} {count}</span></div>
      <button type="button" className="alb-icon" onClick={onClose} aria-label={t.close}><X size={19} /></button>
    </div>

    <div className="alb-lightbox-stage" ref={stage}
      onPointerDown={event => { pointer.current = { x: event.clientX, y: event.clientY, zoomed: zoom > 1 }; (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId) }}
      onPointerMove={event => {
        if (!pointer.current) return
        const dx = event.clientX - pointer.current.x
        const dy = event.clientY - pointer.current.y
        if (pointer.current.zoomed) pan(dx, dy)
        else if (Math.abs(dx) > 8) { pointer.current = null; move(dx > 0 ? -1 : 1) }
        else if (Math.abs(dy) > 8) { pointer.current = null }
        pointer.current = { x: event.clientX, y: event.clientY, zoomed: Boolean(pointer.current?.zoomed ?? zoom > 1) }
      }}
      onPointerUp={() => { pointer.current = null }}
      onDoubleClick={() => (zoom > 1 ? reset() : setZoom(2))}>
      <div className="alb-lightbox-zoom" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, cursor: zoom > 1 ? 'grab' : 'zoom-in' }}>
        <img src={photo.fullUrl} alt={photo.altText || photo.caption.en || photo.title.en} />
      </div>
    </div>

    <div className="alb-lightbox-caption"><h3>{photo.title.en || album.title.en}</h3><p>{photo.caption.en || photo.storyText.en}</p>{photo.location && <span className="alb-lightbox-location">{photo.location}</span>}</div>

    <div className="alb-lightbox-controls">
      <button type="button" className="alb-icon" onClick={() => move(-1)} aria-label={t.previous}><ChevronLeft size={20} /></button>
      <div className="alb-lightbox-tools">
        <button type="button" className="alb-icon" onClick={() => setZoom(value => Math.max(1, value - 0.25))} aria-label={t.zoomOut}><Minus size={16} /></button>
        <button type="button" className="alb-icon" onClick={() => setZoom(value => Math.min(3, value + 0.25))} aria-label={t.zoomIn}><Plus size={16} /></button>
        <button type="button" className="alb-icon" onClick={reset} aria-label={t.resetZoom}><RotateCcw size={15} /></button>
        <button type="button" className="alb-icon" onClick={shareOrCopy} aria-label={t.share}><Share2 size={16} /></button>
        {album.allowDownload && <button type="button" className="alb-icon" onClick={download} aria-label={t.download}><Download size={16} /></button>}
      </div>
      <button type="button" className="alb-icon" onClick={() => move(1)} aria-label={t.next}><ChevronRight size={20} /></button>
    </div>

    {count > 1 && <div className="alb-lightbox-strip" role="tablist" aria-label={t.photoOf}>
      {photos.map((item, i) => <button type="button" key={item.id} role="tab" aria-selected={i === index} aria-label={`${i + 1}`} className={i === index ? 'active' : ''} onClick={() => onNavigate(i)}><img src={item.thumbnailUrl} alt="" loading="lazy" /></button>)}
    </div>}
  </div>
}

/** Mounts the lightbox with a soft fade, keyed so navigation swaps smoothly. */
export function AnimatedLightbox(props: Parameters<typeof AlbumLightbox>[0]) {
  return <AnimatePresence mode="wait"><motion.div key={props.index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ position: 'fixed', inset: 0, zIndex: 130 }} className="alb-lightbox-animwrap"><AlbumLightbox {...props} /></motion.div></AnimatePresence>
}