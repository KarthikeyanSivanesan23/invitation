import { Instagram } from 'lucide-react'
import { wedding, type Person } from '../data/wedding'
import { useInvitation } from '../context/InvitationContext'
import { useContent } from '../context/ContentContext'
import { validUrl } from '../lib/assets'
import { Botanical, Kolam, Lotus } from './Ornaments'
import { ImageWithFallback, Reveal, SectionHeading, TiltCard } from './UI'

function Profile({ person, bride = false, portrait }: { person: Person; bride?: boolean; portrait?: string }) {
  const { t, l } = useInvitation()
  return <TiltCard className={`profile-card ${bride ? 'bride-card' : ''}`}>
    <div className="profile-portrait"><ImageWithFallback src={portrait || person.portrait} alt={l(person.name)} fallback={<div className="initial-portrait"><Botanical /><span>{person.initial}</span><Lotus /><small>{t('portraitSoon')}</small></div>} /><div className="portrait-frame" /><span className="profile-role">{t(bride ? 'bride' : 'groom')}</span></div>
    <div className="profile-copy"><span className="eyebrow">{t(bride ? 'bride' : 'groom')}</span><h3>{l(person.name)}</h3><span className="profile-parents">{l(person.parents)}</span><p>{l(person.introduction)}</p>{validUrl(person.instagram) && <a className="profile-social" href={person.instagram} target="_blank" rel="noopener noreferrer" aria-label={`${t('instagram')}: ${l(person.name)}`}><Instagram size={17} /></a>}</div>
  </TiltCard>
}

export default function CoupleSection() {
  const { l } = useInvitation()
  const { groomPortrait, bridePortrait } = useContent()
  return <section id="couple" className="section couple-section">
    <div className="container"><SectionHeading eyebrow="coupleEyebrow" title="coupleTitle" accent="coupleAccent" description="coupleText" />
      <div className="couple-grid"><Reveal><Profile person={wedding.groom} portrait={groomPortrait} /></Reveal><div className="couple-ampersand" aria-hidden="true"><span>&</span><Lotus /></div><Reveal delay={.12}><Profile person={wedding.bride} bride portrait={bridePortrait} /></Reveal></div>
      <Reveal className="tamil-blessing"><Kolam /><blockquote lang="ta">{wedding.intro.tamilBlessing}</blockquote><p>{l(wedding.intro.blessingTranslation)}</p><cite>{l(wedding.intro.blessingSource)}</cite></Reveal>
    </div>
  </section>
}
