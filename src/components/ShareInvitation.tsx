import { useState } from 'react'
import { Share2, MessageCircle, Link2, Download, CalendarPlus, LoaderCircle } from 'lucide-react'
import { wedding } from '../data/wedding'
import { useInvitation } from '../context/InvitationContext'
import { copyText } from '../lib/assets'
import { googleCalendarUrl } from '../lib/calendar'
import { SectionHeading } from './UI'

export default function ShareInvitation() {
  const { t, l, language, notify } = useInvitation()
  const [downloading, setDownloading] = useState(false)
  const url = window.location.origin + window.location.pathname
  const title = `${l(wedding.groom.name)} & ${l(wedding.bride.name)}`
  const text = `${title}\n${t('invitation')}\n${l(wedding.date)}\n${wedding.hashtag}`
  const copy = async () => notify(t(await copyText(url) ? 'copied' : 'copyFailed'))
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return } catch (error) { if (error instanceof Error && error.name === 'AbortError') return }
    }
    await copy()
  }
  const download = async () => {
    setDownloading(true)
    try { const { downloadInvitationImage } = await import('../lib/invitationImage'); await downloadInvitationImage(language) } catch { notify(t('downloadError')) }
    finally { setDownloading(false) }
  }
  const calendar = () => {
    const event = wedding.events.find(event => event.id === 'muhurtham' && event.enabled)
    const link = event ? googleCalendarUrl(event, language) : null
    if (link) window.open(link, '_blank', 'noopener,noreferrer')
    else notify(t('dateSoon'))
  }
  return <section className="section share-section"><div className="container"><SectionHeading eyebrow="shareEyebrow" title="shareTitle" accent="shareAccent" description="shareText" /><div className="share-actions"><button onClick={() => void share()}><span><Share2 size={20} strokeWidth={1.4} /></span>{t('share')}</button><a href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`} target="_blank" rel="noopener noreferrer"><span><MessageCircle size={20} strokeWidth={1.4} /></span>{t('whatsapp')}</a><button onClick={() => void copy()}><span><Link2 size={20} strokeWidth={1.4} /></span>{t('copyLink')}</button><button onClick={() => void download()} disabled={downloading}><span>{downloading ? <LoaderCircle className="spin" size={20} /> : <Download size={20} strokeWidth={1.4} />}</span>{t('download')}</button><button onClick={calendar}><span><CalendarPlus size={20} strokeWidth={1.4} /></span>{t('googleCalendar')}</button></div></div></section>
}
