import { lazy, Suspense, useState } from 'react'
import { wedding } from '../data/wedding'
import { useInvitation } from '../context/InvitationContext'
import type { DevicePerformance } from '../hooks/useDevicePerformance'
import { useVisibility } from '../hooks/useVisibility'
import { SceneBoundary } from './SceneBoundary'
import { Lotus } from './Ornaments'
import TemplePoster from './TemplePoster'
import { Reveal } from './UI'

const MandapamScene = lazy(() => import('../three/MandapamScene'))

export default function MandapamSection({ device }: { device: DevicePerformance }) {
  const { t, l } = useInvitation()
  const { ref, seen, visible } = useVisibility<HTMLDivElement>()
  const [failed, setFailed] = useState(false)
  const poster = <TemplePoster night mandapam />
  return <section className="mandapam-section"><div className="mandapam-visual" ref={ref}>{device.simple || failed || !seen ? poster : <SceneBoundary fallback={poster} onError={() => setFailed(true)}><Suspense fallback={poster}><MandapamScene device={device} active={visible} onFailure={() => setFailed(true)} /></Suspense></SceneBoundary>}</div>
    <Reveal className="mandapam-copy"><Lotus /><span className="eyebrow">{t('mandapamEyebrow')}</span><h2>{t('presence')}</h2><span className="gold-line" /><p className="gold-shimmer">{l(wedding.date)}</p><span className="mandapam-venue">{l(wedding.venue.name)}</span></Reveal>
  </section>
}
