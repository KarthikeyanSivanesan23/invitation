import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lotus } from './Ornaments'
import { useInvitation } from '../context/InvitationContext'
import { wedding } from '../data/wedding'

export default function LoadingScreen({ sceneReady }: { sceneReady: boolean }) {
  const { t, l } = useInvitation()
  const [fontsReady, setFontsReady] = useState(false)
  const [minimum, setMinimum] = useState(false)
  const [timeout, setTimeoutReached] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    let active = true
    void document.fonts.ready.then(() => { if (active) setFontsReady(true) })
    const fontTimer = window.setTimeout(() => setFontsReady(true), 2200)
    const minTimer = window.setTimeout(() => setMinimum(true), 700)
    const limit = window.setTimeout(() => setTimeoutReached(true), 5500)
    return () => { active = false; [fontTimer, minTimer, limit].forEach(window.clearTimeout) }
  }, [])
  const done = minimum && fontsReady && (sceneReady || timeout)
  useEffect(() => {
    if (!done) return
    const timer = window.setTimeout(() => setDismissed(true), 220)
    return () => window.clearTimeout(timer)
  }, [done])
  const progress = done ? 100 : 15 + (fontsReady ? 35 : 0) + (sceneReady ? 40 : 0) + (minimum ? 9 : 0)
  return <AnimatePresence>{!dismissed && <motion.div className="loading-screen" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: .8 } }} aria-label={t('loading')}>
    <div className="loading-glow" /><Lotus className="loading-lotus" /><span className="eyebrow">{l(wedding.title)}</span><p>{t('preparing')}</p>
    <div className="loading-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={t('loading')}><span style={{ width: `${progress}%` }} /></div>
    <span className="loading-percentage">{progress}%</span>
  </motion.div>}</AnimatePresence>
}
