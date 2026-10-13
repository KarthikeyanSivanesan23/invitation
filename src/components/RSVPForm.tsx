import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUpRight, Check, Heart, MessageCircle, Phone, Send } from 'lucide-react'
import { wedding } from '../data/wedding'
import { useInvitation } from '../context/InvitationContext'
import { invitationRepository, type InvitationRepository } from '../services/invitationRepository'
import { validateRSVP, whatsappRSVPUrl, type RSVPInput, type RSVPErrors } from '../lib/rsvp'
import { configured } from '../lib/assets'
import { Botanical, Lotus } from './Ornaments'
import { Reveal, SectionHeading } from './UI'

const empty: RSVPInput = { name: '', phone: '', guests: 1, attendance: '', meal: 'vegetarian', message: '' }

export default function RSVPForm({ repository = invitationRepository }: { repository?: InvitationRepository }) {
  const { t, l, language, notify } = useInvitation()
  const [values, setValues] = useState<RSVPInput>(empty)
  const [errors, setErrors] = useState<RSVPErrors>({})
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [saved, setSaved] = useState(false)
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    let active = true
    void repository.getRSVP().then(response => { if (response && active) { setValues(response); setSaved(true) } }).catch(() => {})
    return () => { active = false }
  }, [repository])
  const change = <K extends keyof RSVPInput>(key: K, value: RSVPInput[K]) => {
    setValues(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: undefined }))
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    const result = validateRSVP(values)
    setErrors(result)
    if (Object.keys(result).length) {
      window.setTimeout(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0)
      return
    }
    setSaving(true)
    const url = whatsappRSVPUrl(values, language)
    // Open during the user gesture; navigating after persistence avoids popup blocking.
    const popup = url ? window.open('about:blank', '_blank') : null
    if (popup) popup.opener = null
    try { await repository.saveRSVP(values); setSaved(true) } catch { setSaved(false); notify(t('storageError')) }
    if (popup && url) popup.location.replace(url)
    setSubmitted(true); setSaving(false)
  }
  const whatsappUrl = whatsappRSVPUrl(values, language)
  const error = (key: keyof RSVPInput) => errors[key] ? <span id={`rsvp-${key}-error`} className="field-error">{t(errors[key])}</span> : null
  const inputProps = (key: keyof RSVPInput) => ({ 'aria-invalid': errors[key] ? true as const : undefined, 'aria-describedby': errors[key] ? `rsvp-${key}-error` : undefined })
  return <section id="rsvp" className="section rsvp-section"><div className="container rsvp-grid"><Reveal className="rsvp-intro"><Lotus /><SectionHeading eyebrow="rsvpEyebrow" title="rsvpTitle" accent="rsvpAccent" description="rsvpText" align="left" /><p className="rsvp-deadline">{l(wedding.rsvp.deadline)}</p><div className="rsvp-host"><span className="eyebrow">{t('hosted')}</span><p>{l(wedding.hostedBy)}</p></div><div className="family-contacts">{wedding.contacts.map((contact, i) => <div key={i}><Phone size={14} /><span>{l(contact.name)}</span>{configured(contact.phone) ? <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}>{contact.phone}</a> : <span>{contact.phone}</span>}</div>)}</div><Botanical className="rsvp-botanical" /></Reveal>
    <Reveal className="rsvp-form-shell" delay={.1}>{submitted ? <div className="rsvp-success" role="status"><span className="success-icon"><Check size={27} /></span><h3>{t('rsvpSuccess')}</h3><p>{saved ? (whatsappUrl ? t('rsvpLocal') : t('rsvpNoContact')) : t('storageError')}</p>{whatsappUrl && <a className="button button-wine" href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} />{t('rsvpWhatsApp')}<ArrowUpRight size={16} /></a>}<button className="text-button" onClick={() => setSubmitted(false)}>{t('editResponse')}</button><Heart size={24} strokeWidth={1} /></div> : <form ref={form} className="rsvp-form" noValidate onSubmit={event => void submit(event)}>
      <div className="form-row"><div className="form-field"><label htmlFor="rsvp-name">{t('name')} <span>*</span></label><input id="rsvp-name" name="name" autoComplete="name" maxLength={80} required value={values.name} onChange={event => change('name', event.target.value)} {...inputProps('name')} />{error('name')}</div><div className="form-field"><label htmlFor="rsvp-phone">{t('phone')} <span>*</span></label><input id="rsvp-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={24} required value={values.phone} onChange={event => change('phone', event.target.value)} {...inputProps('phone')} />{error('phone')}</div></div>
      <fieldset className="attendance-field"><legend>{t('attendance')} <span>*</span></legend><div className="attendance-options">{(['yes', 'no'] as const).map(value => <label className={values.attendance === value ? 'selected' : ''} key={value}><input type="radio" name="attendance" value={value} checked={values.attendance === value} onChange={() => change('attendance', value)} required {...inputProps('attendance')} /><span className="custom-radio" />{t(value === 'yes' ? 'attending' : 'declining')}</label>)}</div>{error('attendance')}</fieldset>
      {values.attendance !== 'no' && <div className="form-row"><div className="form-field"><label htmlFor="rsvp-guests">{t('guests')}</label><select id="rsvp-guests" value={values.guests} onChange={event => change('guests', Number(event.target.value))} {...inputProps('guests')}>{Array.from({ length: wedding.rsvp.maxGuests }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select>{error('guests')}</div><div className="form-field"><label htmlFor="rsvp-meal">{t('meal')}</label><select id="rsvp-meal" value={values.meal} onChange={event => change('meal', event.target.value as RSVPInput['meal'])} {...inputProps('meal')}>{(['vegetarian', 'vegan', 'noPreference'] as const).map(value => <option key={value} value={value}>{t(value)}</option>)}</select>{error('meal')}</div></div>}
      <div className="form-field"><label htmlFor="rsvp-message">{t('message')} <small>({t('optional')})</small></label><textarea id="rsvp-message" rows={3} maxLength={500} value={values.message} onChange={event => change('message', event.target.value)} {...inputProps('message')} />{error('message')}</div><button className="button button-wine submit-button" type="submit" disabled={saving}>{t(saving ? 'saving' : 'sendRsvp')}<Send size={15} /></button><p className="form-note">{t('localNotice')}</p>
    </form>}</Reveal>
  </div></section>
}
