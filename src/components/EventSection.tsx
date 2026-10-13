import { CalendarPlus, MapPin, Clock3, ArrowUpRight, CircleDot, Leaf, Sun, Sparkles, Flame, Utensils } from 'lucide-react'
import { wedding } from '../data/wedding'
import { useInvitation } from '../context/InvitationContext'
import { downloadCalendar } from '../lib/calendar'
import { validUrl } from '../lib/assets'
import { Reveal, SectionHeading, TiltCard } from './UI'

const motifs = { rings: CircleDot, leaf: Leaf, sun: Sun, sparkles: Sparkles, flame: Flame, meal: Utensils }

export default function EventSection() {
  const { t, l, language, notify } = useInvitation()
  const events = wedding.events.filter(event => event.enabled)
  if (!events.length) return null
  return <section id="events" className="section events-section"><div className="container">
    <SectionHeading eyebrow="eventsEyebrow" title="eventsTitle" accent="eventsAccent" description="eventsText" />
    <div className="events-grid">{events.map((event, index) => {
      const Icon = motifs[event.motif]
      return <Reveal key={event.id} delay={index % 3 * .06}><TiltCard className={`event-card event-${event.id}`}>
        <div className="event-top"><span className="event-index">0{index + 1}</span><Icon size={34} strokeWidth={1} /><span className="event-spark">✧</span></div>
        <span className="eyebrow">{l(event.subtitle)}</span><h3>{l(event.title)}</h3><p className="event-description">{l(event.description)}</p>
        <div className="event-details"><div><CalendarPlus size={15} /><span>{l(event.date)}</span></div><div><Clock3 size={15} /><span>{l(event.time)}</span></div><div><MapPin size={15} /><span>{l(event.venue)}</span></div></div>
        <p className="event-dress"><span>{t('dressCode')}</span>{l(event.dressCode)}</p><div className="event-actions"><button onClick={() => { if (!downloadCalendar(event, language)) notify(t('dateSoon')) }}><CalendarPlus size={14} />{t('addCalendar')}</button>{validUrl(event.mapsUrl) ? <a href={event.mapsUrl} target="_blank" rel="noopener noreferrer">{t('viewLocation')}<ArrowUpRight size={14} /></a> : <button onClick={() => notify(t('locationSoon'))}>{t('viewLocation')}<ArrowUpRight size={14} /></button>}</div>
      </TiltCard></Reveal>
    })}</div>
  </div></section>
}
