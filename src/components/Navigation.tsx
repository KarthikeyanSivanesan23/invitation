import { useEffect, useState } from 'react'
import { ArrowUpRight, Menu, Sparkles, Leaf } from 'lucide-react'
import { wedding } from '../data/wedding'
import { useInvitation } from '../context/InvitationContext'
import { useContent } from '../context/ContentContext'
import type { DevicePerformance } from '../hooks/useDevicePerformance'
import type { TranslationKey } from '../data/translations'
import { pushRoute } from '../lib/navigate'
import LanguageSwitcher from './LanguageSwitcher'
import { Modal } from './UI'
import { Lotus } from './Ornaments'

interface NavItem { id: string; key: TranslationKey; path?: string }
const links: NavItem[] = [{ id: 'home', key: 'home' }, { id: 'couple', key: 'couple' }, { id: 'story', key: 'story' }, { id: 'events', key: 'events' }, { id: 'venue', key: 'venue' }, { id: 'gallery', key: 'gallery' }, { id: 'albums', key: 'albumsNav', path: '/albums' }, { id: 'rsvp', key: 'rsvp' }]

export default function Navigation({ device }: { device: DevicePerformance }) {
  const { t } = useInvitation()
  const { gallery } = useContent()
  const eventsAvailable = wedding.events.some(event => event.enabled)
  const galleryAvailable = gallery.length > 0
  const availableLinks = links.filter(link => (link.id !== 'events' || eventsAvailable) && (link.id !== 'gallery' || galleryAvailable))

  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('home')
  useEffect(() => {
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id) }) }, { rootMargin: '-15% 0px -65% 0px' })
    availableLinks.forEach(({ id }) => { const element = document.getElementById(id); if (element) observer.observe(element) })
    return () => observer.disconnect()
  }, [])
  const navLinks = availableLinks.map(({ id, key, path }) => path
    ? <a key={id} href={path} onClick={event => { event.preventDefault(); setOpen(false); pushRoute(path) }}>{t(key)}</a>
    : <a key={id} href={`#${id}`} onClick={() => setOpen(false)} aria-current={active === id ? 'location' : undefined}>{t(key)}{id === 'rsvp' && <ArrowUpRight size={13} />}</a>)
  return <>
    <a href="#couple" className="skip-link">{t('skip')}</a>
    <header className="site-header"><a className="brand" href="#home" aria-label={`${wedding.groom.name.en} & ${wedding.bride.name.en} · ${t('home')}`}><span className="brand-monogram">{wedding.groom.initial}<i>&</i>{wedding.bride.initial}</span><span className="brand-label">{t('weddingCelebration')}</span></a>
      <nav className="desktop-nav" aria-label={t('menu')}>{navLinks}</nav>
      <div className="header-controls"><LanguageSwitcher /><button className="mode-button icon-button" onClick={() => device.setGentle(!device.gentle)} aria-label={`${t('experienceMode')}: ${device.simple ? t('cinematicMode') : t('simpleMode')}`} aria-pressed={device.simple} disabled={device.reducedMotion || !device.webgl || device.lowPower} title={device.simple ? t('simpleMode') : t('cinematicMode')}>{device.simple ? <Leaf size={16} /> : <Sparkles size={16} />}</button><button className="mobile-menu-button icon-button" onClick={() => setOpen(true)} aria-label={t('menu')} aria-expanded={open}><Menu size={21} /></button></div>
    </header>
    {open && <Modal onClose={() => setOpen(false)} label={t('menu')} className="navigation-modal"><Lotus /><span className="eyebrow">{t('weddingCelebration')}</span><nav aria-label={t('menu')}>{navLinks}</nav><span className="menu-hashtag">{wedding.hashtag}</span></Modal>}
  </>
}
