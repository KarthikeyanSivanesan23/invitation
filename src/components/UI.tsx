import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useInvitation } from '../context/InvitationContext'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { hasAsset } from '../lib/assets'
import { Lotus } from './Ornaments'
import type { TranslationKey } from '../data/translations'

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion()
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .12 }} transition={{ duration: .75, delay, ease: [.22, 1, .36, 1] }}>{children}</motion.div>
}

export function SectionHeading({ eyebrow, title, accent, description, align = 'center', light = false }: { eyebrow: TranslationKey; title: TranslationKey; accent: TranslationKey; description?: TranslationKey; align?: 'center' | 'left'; light?: boolean }) {
  const { t } = useInvitation()
  return <Reveal className={`section-heading ${align === 'left' ? 'text-left' : 'text-center'} ${light ? 'heading-light' : ''}`}>
    <span className="eyebrow"><span />{t(eyebrow)}<span /></span>
    <h2>{t(title)} <em>{t(accent)}</em></h2>
    {description && <p>{t(description)}</p>}
  </Reveal>
}

export function ImageWithFallback({ src, alt, className = '', fallback, eager = false }: { src: string; alt: string; className?: string; fallback: ReactNode; eager?: boolean }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  if (!src || failed || (!hasAsset(src) && !src.startsWith('https://'))) return <>{fallback}</>
  return <img src={src} alt={alt} className={className} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />
}

export function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  return <div ref={ref} className={`tilt-card ${className}`} onPointerMove={event => {
    if (reduced || event.pointerType !== 'mouse' || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--tilt-x', `${-(event.clientY - rect.top - rect.height / 2) / rect.height * 5}deg`)
    ref.current.style.setProperty('--tilt-y', `${(event.clientX - rect.left - rect.width / 2) / rect.width * 5}deg`)
  }} onPointerLeave={() => {
    ref.current?.style.setProperty('--tilt-x', '0deg')
    ref.current?.style.setProperty('--tilt-y', '0deg')
  }}>{children}</div>
}

export function Modal({ children, onClose, label, className = '' }: { children: ReactNode; onClose: () => void; label: string; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { t } = useInvitation()
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement
    dialog?.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = overflow
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])
  return <dialog ref={ref} className={`modal ${className}`} aria-label={label} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="modal-inner"><button className="icon-button modal-close" onClick={onClose} aria-label={t('close')}><X size={22} /></button>{children}</div>
  </dialog>
}

export function Petals({ count = 12, className = '' }: { count?: number; className?: string }) {
  return <div className={`css-petals ${className}`} aria-hidden="true">{Array.from({ length: count }, (_, i) => <span key={i} style={{ '--x': `${(i * 17.7 + 3) % 100}%`, '--delay': `${i * -2.1}s`, '--duration': `${18 + i % 5 * 3}s`, '--size': `${5 + i % 4 * 2}px`, '--drift': `${(i % 2 ? 1 : -1) * (30 + i * 5)}px` } as CSSProperties} />)}</div>
}

export function OrnamentDivider() {
  return <div className="ornament-divider" aria-hidden="true"><span /><Lotus /><span /></div>
}
