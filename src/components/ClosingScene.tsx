import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ArrowUp, Heart } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { wedding } from '../data/wedding'
import { useInvitation } from '../context/InvitationContext'
import { useVisibility } from '../hooks/useVisibility'
import type { DevicePerformance } from '../hooks/useDevicePerformance'
import { SceneBoundary } from './SceneBoundary'
import { Lotus } from './Ornaments'
import TemplePoster from './TemplePoster'

const TempleJourney = lazy(() => import('../three/TempleJourney'))
gsap.registerPlugin(ScrollTrigger)

export default function ClosingScene({ device }: { device: DevicePerformance }) {
  const { t, l } = useInvitation()
  const progress = useRef(0)
  const { ref, visible, seen } = useVisibility<HTMLElement>('180px')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const context = gsap.context(() => {
      gsap.to(progress, { current: 1, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom bottom', scrub: 1.8 } })
    }, ref)
    return () => context.revert()
  }, [ref])
  const poster = <TemplePoster night />
  return <footer ref={ref} className="closing-scene"><div className="closing-canvas">{device.simple || failed || !seen ? poster : <SceneBoundary fallback={poster} onError={() => setFailed(true)}><Suspense fallback={poster}><TempleJourney progress={progress} active={visible} device={device} night onFailure={() => setFailed(true)} /></Suspense></SceneBoundary>}</div><div className="closing-shade" /><div className="closing-copy"><Lotus /><span className="eyebrow">{t('withLove')}</span><h2>{t('thanks')}<em>.</em></h2><p>{l(wedding.closing)}</p><span className="closing-monogram">{wedding.groom.initial}<i>&</i>{wedding.bride.initial}</span><span className="closing-hashtag">{wedding.hashtag}</span><a className="back-top" href="#home" aria-label={t('backTop')}><ArrowUp size={19} /></a></div><div className="footer-bottom"><span><Heart size={11} />{t('madeWith')}</span><span>{l(wedding.hostedBy)}</span></div></footer>
}
