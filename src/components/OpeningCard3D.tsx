import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUpRight, Sparkles } from 'lucide-react'
import { wedding } from '../data/wedding'
import { useInvitation } from '../context/InvitationContext'
import { useVisibility } from '../hooks/useVisibility'
import type { DevicePerformance } from '../hooks/useDevicePerformance'
import type { CardPhase } from '../three/InvitationScene'
import { SceneBoundary } from './SceneBoundary'
import { Bell, Botanical, Kolam, Lotus } from './Ornaments'
import { Petals } from './UI'

const InvitationScene = lazy(() => import('../three/InvitationScene'))

function CardPoster({ opened }: { opened: boolean }) {
  const { t, l } = useInvitation()
  return <div className={`card-poster ${opened ? 'poster-open' : ''}`}>
    <div className="poster-page"><Lotus /><p>{t('blessingsIntro')}</p><strong>{l(wedding.groom.name)}</strong><em>{t('weds')}</em><strong>{l(wedding.bride.name)}</strong><span>{t('saveDate')}</span><b>{l(wedding.date)}</b></div>
    <div className="poster-cover"><div className="poster-border"><Lotus /><span className="cover-caption">{t('together')}</span><div className="card-monogram">{wedding.groom.initial}<i>&</i>{wedding.bride.initial}</div><span className="cover-caption">{t('saveDate')}</span><em>{l(wedding.title)}</em></div><span className="wax-seal"><Lotus /></span></div>
  </div>
}

export default function OpeningCard3D({ device, onReady, onOpen }: { device: DevicePerformance; onReady: () => void; onOpen: () => void }) {
  const { t, l } = useInvitation()
  const [phase, setPhase] = useState<CardPhase>('closed')
  const [failed, setFailed] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const { ref, visible } = useVisibility<HTMLDivElement>()
  const simple = device.simple || failed
  const timers = useRef<number[]>([])
  const touchY = useRef(0)
  const markReady = useCallback(() => { setSceneReady(true); onReady() }, [onReady])
  useEffect(() => { if (simple) onReady() }, [simple, onReady])
  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])
  const enter = useCallback(() => {
    if (phase !== 'open') return
    setPhase('entering')
    timers.current.push(window.setTimeout(() => {
      document.getElementById('journey')?.scrollIntoView({ behavior: 'instant', block: 'start' })
      setPhase('entered')
    }, simple ? 300 : 1400))
  }, [phase, simple])
  useEffect(() => {
    if (phase !== 'open') return
    const wheel = (event: WheelEvent) => { if (event.deltaY > 15 && window.scrollY < window.innerHeight * .8) enter() }
    window.addEventListener('wheel', wheel, { passive: true })
    return () => window.removeEventListener('wheel', wheel)
  }, [phase, enter])
  const open = () => {
    if (phase !== 'closed') return
    onOpen(); setPhase('opening')
    timers.current.push(window.setTimeout(() => setPhase('open'), simple ? 900 : 2850))
  }
  const opened = phase !== 'closed'
  return <section id="home" className="hero" aria-labelledby="hero-heading" onTouchStart={event => { touchY.current = event.touches[0].clientY }} onTouchEnd={event => { if (phase === 'open' && touchY.current - event.changedTouches[0].clientY > 45) enter() }}>
    <div className="hero-grain" /><Botanical className="hero-botanical botanical-left" /><Botanical className="hero-botanical botanical-right" /><Bell className="hero-bell bell-left" /><Bell className="hero-bell bell-right" />
    <div className="hero-heading"><span className="eyebrow"><span />{l(wedding.intro.eyebrow)}<span /></span><h1 id="hero-heading">{l(wedding.intro.headline)}<br /><em>{l(wedding.intro.headlineAccent)}</em></h1></div>
    <div className="hero-stage">
      <div className="hero-aside aside-left"><span className="tiny-star">✧</span><span className="eyebrow">{t('twoSouls')}</span><p>{t('oneBeginning')}</p><span className="aside-line" /><span className="aside-note">{l(wedding.date)}</span></div>
      <div ref={ref} className={`invitation-stage ${opened ? 'is-open' : ''}`}>
        <div className="card-aura" /><Kolam className="card-kolam" /><div className="card-floor-shadow" />
        {simple ? <CardPoster opened={opened} /> : <SceneBoundary onError={() => { setFailed(true); onReady() }} fallback={<CardPoster opened={opened} />}>
          {!sceneReady && <div className="scene-poster"><CardPoster opened={opened} /></div>}
          <Suspense fallback={null}><InvitationScene phase={phase} device={device} active={visible} onReady={markReady} onFailure={() => setFailed(true)} /></Suspense>
        </SceneBoundary>}
      </div>
      <div className="hero-aside aside-right"><Lotus /><span className="eyebrow">{t('madeOf')}</span><p>{t('madeOfNote')}</p><span className="aside-line" /><span className="aside-note">{l(wedding.title)}</span></div>
    </div>
    <div className="hero-action" aria-live="polite">
      {phase === 'closed' ? <><p>{t('together')}</p><button className="button button-wine magnetic" onClick={open}><span>{t('openInvitation')}</span><ArrowUpRight size={17} /></button><span className="tap-hint"><Sparkles size={12} />{t('tapHint')}</span></> : <>
        <motion.p className="opened-names" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9, delay: simple ? 0 : 1.2 }}>{l(wedding.groom.name)} <em>&</em> {l(wedding.bride.name)}</motion.p>
        <button className="button button-wine" onClick={phase === 'entered' ? () => document.getElementById('journey')?.scrollIntoView({ behavior: device.reducedMotion ? 'instant' : 'smooth' }) : enter} disabled={phase === 'opening' || phase === 'entering'}>{phase === 'opening' ? t('opening') : t('enter')}<ArrowDown size={16} /></button>
        <span className="tap-hint">{t('blessingsIntro')}</span>
      </>}
    </div>
    <div className="hero-footer"><span>{l(wedding.intro.note)}</span><a href="#journey" className="scroll-prompt">{t('scroll')}<ArrowDown size={13} /></a><span className="hero-edition">{wedding.hashtag}</span></div>
    <Petals count={device.simple ? 0 : 9} />
    <AnimatePresence>{phase === 'entering' && <motion.div className="portal-transition" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: simple ? .2 : 1.25 }} aria-hidden="true"><div className="portal-ring ring-one" /><div className="portal-ring ring-two" /><div className="portal-ring ring-three" /><Lotus /><Petals count={simple ? 0 : 26} /></motion.div>}</AnimatePresence>
  </section>
}
