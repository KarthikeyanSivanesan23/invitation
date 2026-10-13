import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { wedding } from '../data/wedding'
import { countdownTo } from '../lib/calendar'
import { useInvitation } from '../context/InvitationContext'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { SectionHeading } from './UI'

export default function Countdown() {
  const { t } = useInvitation()
  const reduced = useReducedMotion()
  const [countdown, setCountdown] = useState(() => countdownTo(wedding.dateISO))
  useEffect(() => {
    if (countdown === null || countdown.complete) return
    const tick = () => setCountdown(countdownTo(wedding.dateISO))
    const timer = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', tick) }
  }, [countdown?.complete])
  return <section className="section countdown-section"><div className="container"><SectionHeading eyebrow="countdownEyebrow" title="countdownTitle" accent="countdownAccent" />
    {countdown?.complete ? <p className="countdown-message completed">{t('countdownComplete')}</p> : <>
      <div className="countdown-grid" role="timer" aria-live="off">{(['days', 'hours', 'minutes', 'seconds'] as const).map(unit => <div className="countdown-unit" key={unit}><div className="countdown-number"><AnimatePresence mode="popLayout" initial={false}><motion.span key={countdown?.[unit] ?? 'waiting'} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? {} : { opacity: 0, y: -8 }} transition={{ duration: .25 }}>{countdown ? String(countdown[unit]).padStart(2, '0') : '—'}</motion.span></AnimatePresence></div><span>{t(unit)}</span></div>)}</div>
      <p className="countdown-message">{countdown ? 'IST · UTC +05:30' : t('countdownSoon')}</p>
    </>}
  </div></section>
}
