import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Heart, ArrowUpRight, Quote } from 'lucide-react'
import { wedding } from '../data/wedding'
import { useInvitation } from '../context/InvitationContext'
import { invitationRepository, type InvitationRepository } from '../services/invitationRepository'
import type { Blessing } from '../lib/rsvp'
import { Reveal, SectionHeading } from './UI'
import { Lotus } from './Ornaments'

export default function BlessingWall({ repository = invitationRepository }: { repository?: InvitationRepository }) {
  const { t, l, language, notify } = useInvitation()
  const [blessings, setBlessings] = useState<Blessing[]>([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<'name' | 'message' | null>(null)
  const [busy, setBusy] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    let active = true
    const load = () => { void repository.listBlessings().then(data => { if (active) setBlessings(data) }).catch(() => {}) }
    load(); window.addEventListener('storage', load)
    return () => { active = false; window.removeEventListener('storage', load) }
  }, [repository])
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    if (name.trim().length < 2 || name.trim().length > 80) { setError('name'); nameRef.current?.focus(); return }
    if (message.trim().length < 3 || message.trim().length > wedding.blessings.maxLength) { setError('message'); messageRef.current?.focus(); return }
    setError(null); setBusy(true)
    try { const blessing = await repository.addBlessing({ name, message }); setBlessings(current => [blessing, ...current].slice(0, 100)); setName(''); setMessage(''); notify(t('blessingSaved')) }
    catch { notify(t('blessingStorageError')) }
    finally { setBusy(false) }
  }
  return <section className="section blessings-section" id="blessings"><div className="container"><SectionHeading eyebrow="blessingEyebrow" title="blessingTitle" accent="blessingAccent" /><p className="blessing-introduction">{l(wedding.blessings.introduction)}</p>
    <div className="blessings-layout"><Reveal className="blessing-form-wrap"><form onSubmit={event => void submit(event)} noValidate><Heart size={24} strokeWidth={1} /><div className="form-field"><label htmlFor="blessing-name">{t('blessingName')}</label><input ref={nameRef} id="blessing-name" required autoComplete="name" maxLength={80} value={name} onChange={event => { setName(event.target.value); if (error === 'name') setError(null) }} aria-invalid={error === 'name'} aria-describedby={error === 'name' ? 'blessing-name-error' : undefined} />{error === 'name' && <span className="field-error" id="blessing-name-error">{t('nameError')}</span>}</div><div className="form-field"><label htmlFor="blessing-message">{t('blessingMessage')}</label><textarea ref={messageRef} id="blessing-message" required rows={4} maxLength={wedding.blessings.maxLength} value={message} onChange={event => { setMessage(event.target.value); if (error === 'message') setError(null) }} aria-invalid={error === 'message'} aria-describedby={error === 'message' ? 'blessing-message-error' : undefined} /><span className="character-count">{message.length}/{wedding.blessings.maxLength}</span>{error === 'message' && <span className="field-error" id="blessing-message-error">{t('blessingError')}</span>}</div><button className="button button-outline" disabled={busy}>{t(busy ? 'saving' : 'leaveBlessing')}<ArrowUpRight size={15} /></button></form></Reveal>
      <div className="blessing-cards" aria-live="polite">{blessings.length ? blessings.map(blessing => <Reveal key={blessing.id} className="blessing-card"><Quote size={22} strokeWidth={1} /><p>{blessing.message}</p><div><span>{blessing.name}</span><time dateTime={blessing.createdAt}>{new Intl.DateTimeFormat(language === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: wedding.timeZone }).format(new Date(blessing.createdAt))}</time></div></Reveal>) : <div className="blessing-empty"><Lotus /><p>{t('blessingEmpty')}</p><span>{wedding.groom.initial} & {wedding.bride.initial}</span></div>}</div>
    </div><p className="local-storage-note">{t('blessingLocal')}</p>
  </div></section>
}
