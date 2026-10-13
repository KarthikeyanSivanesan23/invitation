import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { DevicePerformance } from '../hooks/useDevicePerformance'
import { useVisibility } from '../hooks/useVisibility'
import { useInvitation } from '../context/InvitationContext'
import { wedding } from '../data/wedding'
import { SceneBoundary } from './SceneBoundary'
import { Lotus } from './Ornaments'
import TemplePoster from './TemplePoster'

gsap.registerPlugin(ScrollTrigger)
const TempleJourney = lazy(() => import('../three/TempleJourney'))

export default function JourneySection({ device }: { device: DevicePerformance }) {
  const { t } = useInvitation()
  const section = useRef<HTMLElement>(null)
  const progress = useRef(0)
  const [failed, setFailed] = useState(false)
  const { ref, visible, seen } = useVisibility<HTMLDivElement>('250px')
  const simple = device.simple || failed
  useEffect(() => {
    const context = gsap.context(() => {
      gsap.to(progress, { current: 1, ease: 'none', scrollTrigger: { trigger: section.current, start: 'top top', end: 'bottom bottom', scrub: simple ? true : 1.5 } })
      if (!simple) {
        gsap.to('.journey-copy', { opacity: 0, y: -35, ease: 'none', scrollTrigger: { trigger: section.current, start: 'top -20%', end: 'top -75%', scrub: 1 } })
        gsap.fromTo('.journey-arrival', { opacity: 0, y: 20 }, { opacity: 1, y: 0, scrollTrigger: { trigger: section.current, start: 'bottom 145%', end: 'bottom 110%', scrub: 1 } })
      }
    }, section)
    return () => context.revert()
  }, [simple])
  const poster = <TemplePoster />
  return <section ref={section} id="journey" className={`journey-section ${simple ? 'journey-gentle' : ''}`} aria-label={t('journeyStep1')}>
    <div className="journey-sticky" ref={ref}>
      <div className="journey-canvas">{simple || !seen ? poster : <SceneBoundary fallback={poster} onError={() => setFailed(true)}><Suspense fallback={poster}><TempleJourney progress={progress} active={visible} device={device} onFailure={() => setFailed(true)} /></Suspense></SceneBoundary>}</div>
      <div className="journey-vignette" />
      <div className="journey-copy"><span className="eyebrow">01 — {t('journeyStep1')}</span><h2>{t('journeyTitle')}<br /><em>{t('journeyAccent')}</em></h2><p>{t('journeyText')}</p><span className="journey-coordinate">{wedding.hashtag}</span></div>
      <div className="journey-arrival"><Lotus /><span className="eyebrow">{t('invitation')}</span><p>{t('presence')}</p></div>
      <div className="journey-bottom"><span className="journey-chapters"><b>01</b><span />02<span />03</span><a href="#couple">{t('skipJourney')}<ArrowDown size={15} /></a></div>
    </div>
  </section>
}
