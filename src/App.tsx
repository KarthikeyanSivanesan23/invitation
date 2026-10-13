import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { InvitationProvider } from './context/InvitationContext'
import { ContentProvider } from './context/ContentContext'
import { useDevicePerformance } from './hooks/useDevicePerformance'
import { useWeddingAudio } from './hooks/useWeddingAudio'
import LoadingScreen from './components/LoadingScreen'
import Navigation from './components/Navigation'
import OpeningCard3D from './components/OpeningCard3D'
import JourneySection from './components/JourneySection'
import CoupleSection from './components/CoupleSection'
import StoryTimeline from './components/StoryTimeline'
import EventSection from './components/EventSection'
import MandapamSection from './components/MandapamSection'
import Countdown from './components/Countdown'
import VenueSection from './components/VenueSection'
import Gallery from './components/Gallery'
import RSVPForm from './components/RSVPForm'
import BlessingWall from './components/BlessingWall'
import ShareInvitation from './components/ShareInvitation'
import ClosingScene from './components/ClosingScene'
import MusicControl from './components/MusicControl'
import ScrollProgress from './components/ScrollProgress'
import SEO from './components/SEO'

const AdminApp = lazy(() => import('./admin/AdminApp'))
const AlbumsApp = lazy(() => import('./albums/AlbumsApp'))

function Invitation() {
  const device = useDevicePerformance()
  const audio = useWeddingAudio()
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  return <div className={`invitation-app ${device.simple ? 'gentle-experience' : ''}`}>
    <SEO /><LoadingScreen sceneReady={ready} /><ScrollProgress /><Navigation device={device} />
    <main><OpeningCard3D device={device} onReady={onReady} onOpen={() => audio.start(true)} /><JourneySection device={device} /><CoupleSection /><StoryTimeline /><EventSection /><MandapamSection device={device} /><Countdown /><VenueSection /><Gallery /><RSVPForm /><BlessingWall /><ShareInvitation /></main>
    <ClosingScene device={device} /><MusicControl audio={audio} />
  </div>
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash.startsWith('#admin'))
  const [pathname, setPathname] = useState(() => window.location.pathname)
  useEffect(() => {
    const syncHash = () => setIsAdmin(window.location.hash.startsWith('#admin'))
    const syncPath = () => setPathname(window.location.pathname)
    window.addEventListener('hashchange', syncHash)
    window.addEventListener('popstate', syncPath)
    return () => { window.removeEventListener('hashchange', syncHash); window.removeEventListener('popstate', syncPath) }
  }, [])
  const albumRoute = pathname.startsWith('/albums')
  return <InvitationProvider><MotionConfig reducedMotion="user"><ContentProvider>
    {isAdmin ? <Suspense fallback={<div className="admin-app" aria-busy="true"><p className="admin-loading">Loading admin…</p></div>}><AdminApp /></Suspense>
      : albumRoute ? <Suspense fallback={<div className="alb-loginless alb-loading-page" aria-busy="true"><div className="alb-loading-book" /></div>}><AlbumsApp key={pathname} /></Suspense>
      : <Invitation />}
  </ContentProvider></MotionConfig></InvitationProvider>
}