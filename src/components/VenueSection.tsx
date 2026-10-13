import { useEffect, useState } from 'react'
import { MapPin, Clock3, Navigation, Copy, Radio, ArrowUpRight } from 'lucide-react'
import { wedding } from '../data/wedding'
import { useInvitation } from '../context/InvitationContext'
import { configured, copyText, validUrl } from '../lib/assets'
import { ImageWithFallback, Reveal, SectionHeading } from './UI'
import { Kolam } from './Ornaments'
import TemplePoster from './TemplePoster'

export default function VenueSection() {
  const { t, l, notify } = useInvitation()
  const [qr, setQR] = useState('')
  const hasMap = validUrl(wedding.venue.mapsUrl)
  useEffect(() => {
    let mounted = true
    if (hasMap) void import('qrcode').then(module => module.toDataURL(wedding.venue.mapsUrl, { width: 180, margin: 1, color: { dark: '#551f2c', light: '#fbf7ee' }, errorCorrectionLevel: 'M' })).then(url => { if (mounted) setQR(url) }).catch(() => {})
    return () => { mounted = false }
  }, [hasMap])
  const copyAddress = async () => {
    if (!configured(wedding.venue.address.en)) { notify(t('addressSoon')); return }
    notify(t(await copyText(l(wedding.venue.address)) ? 'copiedAddress' : 'copyFailed'))
  }
  return <section id="venue" className="section venue-section"><div className="container venue-grid">
    <Reveal className="venue-art"><ImageWithFallback src={wedding.venue.image} alt={l(wedding.venue.name)} fallback={<TemplePoster className="venue-temple-poster" label={t('venueIllustration')} />} /><div className="venue-image-caption"><span>✧</span><span>{t('venueEyebrow')}</span><span>✧</span></div><div className="venue-art-frame" /></Reveal>
    <Reveal className="venue-copy" delay={.1}><SectionHeading eyebrow="venueEyebrow" title="venueTitle" accent="venueAccent" align="left" /><h3>{l(wedding.venue.name)}</h3><div className="venue-detail"><MapPin size={18} /><div><p>{l(wedding.venue.address)}</p><span>{t('landmark')}: {l(wedding.venue.landmark)}</span></div></div><div className="venue-detail"><Clock3 size={18} /><div><p>{l(wedding.date)}</p><span>{l(wedding.muhurtham)} · IST</span></div></div>
      <div className="venue-buttons">{hasMap ? <a className="button button-wine" href={wedding.venue.mapsUrl} target="_blank" rel="noopener noreferrer"><Navigation size={15} />{t('directions')}<ArrowUpRight size={15} /></a> : <button className="button button-wine" onClick={() => notify(t('locationSoon'))}><Navigation size={15} />{t('directions')}</button>}<button className="button button-outline" onClick={() => void copyAddress()}><Copy size={14} />{t('copyAddress')}</button></div>
      <div className="venue-qr">{qr ? <img src={qr} width="86" height="86" alt={t('scanMap')} /> : <Kolam />}<div><span className="eyebrow">{qr ? t('scanMap') : t('qrSoon')}</span><p>{wedding.hashtag}</p></div></div>
      {validUrl(wedding.liveStreamUrl) && <a className="text-button live-link" href={wedding.liveStreamUrl} target="_blank" rel="noopener noreferrer"><Radio size={16} />{t('viewLive')}<ArrowUpRight size={14} /></a>}
    </Reveal>
  </div></section>
}
