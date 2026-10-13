import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Maximize2, Heart } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { wedding } from '../data/wedding'
import { useInvitation } from '../context/InvitationContext'
import { useContent } from '../context/ContentContext'
import type { GalleryItem } from '../lib/content'
import { Botanical, Kolam, Lotus } from './Ornaments'
import { ImageWithFallback, Modal, Reveal, SectionHeading } from './UI'

function GalleryPlaceholder({ image }: { image: GalleryItem }) {
  const { t, l } = useInvitation()
  return <div className={`gallery-placeholder palette-${image.color}`}>
    <div className="gallery-placeholder-border" />{image.motif === 'lotus' ? <Lotus /> : image.motif === 'leaf' ? <Botanical /> : image.motif === 'kolam' ? <Kolam /> : image.motif === 'rings' ? <div className="ring-motif"><span /><span /></div> : <div className="arch-motif"><span>{wedding.groom.initial}<em>&</em>{wedding.bride.initial}</span></div>}
    <span className="gallery-placeholder-note">{t('memoriesSoon')}</span><span className="sr-only">{l(image.caption)}</span>
  </div>
}

export default function Gallery() {
  const { t, l } = useInvitation()
  const { gallery } = useContent()
  const [active, setActive] = useState<number | null>(null)
  const touch = useRef(0)
  const images = gallery
  const count = images.length
  const move = (direction: number) => setActive(index => index === null ? null : (index + direction + count) % count)
  useEffect(() => {
    if (active === null) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); setActive(index => index === null ? null : (index + (event.key === 'ArrowRight' ? 1 : -1) + count) % count) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [active, count])
  if (!count) return null
  return <section id="gallery" className="section gallery-section"><div className="container"><SectionHeading eyebrow="galleryEyebrow" title="galleryTitle" accent="galleryAccent" description="galleryText" />
    <div className="gallery-grid">{images.map((image, i) => <Reveal className={`gallery-item gallery-item-${i < 5 ? i : 'extra'}`} key={image.id} delay={i % 5 * .04}><button className="gallery-tile" onClick={() => setActive(i)} aria-label={`${t('viewPhoto')}: ${l(image.caption)}`}><ImageWithFallback src={image.src} alt={l(image.caption)} fallback={<GalleryPlaceholder image={image} />} /><div className="gallery-tile-caption"><span>{l(image.caption)}</span><Maximize2 size={16} /></div></button></Reveal>)}</div>
    <p className="gallery-footnote"><Heart size={12} />{wedding.hashtag}</p>
  </div>
    {active !== null && <Modal label={t('gallery')} onClose={() => setActive(null)} className="lightbox"><div className="lightbox-picture" onTouchStart={event => { touch.current = event.touches[0].clientX }} onTouchEnd={event => { const delta = event.changedTouches[0].clientX - touch.current; if (Math.abs(delta) > 45) move(delta > 0 ? -1 : 1) }}><AnimatePresence mode="wait"><motion.div key={active} initial={{ opacity: .3 }} animate={{ opacity: 1 }} exit={{ opacity: .3 }} transition={{ duration: .2 }}><ImageWithFallback src={images[active].src} alt={l(images[active].caption)} eager fallback={<GalleryPlaceholder image={images[active]} />} /></motion.div></AnimatePresence></div><div className="lightbox-controls"><button className="icon-button" onClick={() => move(-1)} aria-label={t('previous')}><ArrowLeft size={22} /></button><div aria-live="polite"><p>{l(images[active].caption)}</p><span>{active + 1} {t('photoOf')} {count}</span></div><button className="icon-button" onClick={() => move(1)} aria-label={t('next')}><ArrowRight size={22} /></button></div></Modal>}
  </section>
}
