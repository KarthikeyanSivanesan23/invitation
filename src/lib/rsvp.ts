import { wedding, type Language } from '../data/wedding'
import { translations, type TranslationKey } from '../data/translations'

export interface RSVPInput {
  name: string
  phone: string
  guests: number
  attendance: 'yes' | 'no' | ''
  meal: 'vegetarian' | 'vegan' | 'noPreference'
  message: string
}
export interface RSVPResponse extends RSVPInput { id: string; createdAt: string }
export interface Blessing { id: string; name: string; message: string; createdAt: string }
export type RSVPErrors = Partial<Record<keyof RSVPInput, TranslationKey>>

export function validateRSVP(value: RSVPInput, maxGuests = wedding.rsvp.maxGuests): RSVPErrors {
  const errors: RSVPErrors = {}
  if (value.name.trim().length < 2 || value.name.trim().length > 80) errors.name = 'nameError'
  const digits = value.phone.replace(/\D/g, '')
  if (!/^\+?[\d\s().-]+$/.test(value.phone.trim()) || digits.length < 7 || digits.length > 15) errors.phone = 'phoneError'
  if (!['yes', 'no'].includes(value.attendance)) errors.attendance = 'attendanceError'
  if (value.attendance === 'yes' && (!Number.isInteger(value.guests) || value.guests < 1 || value.guests > maxGuests)) errors.guests = 'guestsError'
  if (!['vegetarian', 'vegan', 'noPreference'].includes(value.meal)) errors.meal = 'mealError'
  if (value.message.trim().length > 500) errors.message = 'messageError'
  return errors
}

export function buildRSVPMessage(value: RSVPInput, language: Language) {
  const t = translations[language]
  return [
    `${t.rsvp} · ${wedding.groom.name[language]} & ${wedding.bride.name[language]}`,
    `${t.name}: ${value.name.trim()}`, `${t.phone}: ${value.phone.trim()}`, `${t.attendance}: ${value.attendance === 'yes' ? t.attending : t.declining}`,
    ...(value.attendance === 'yes' ? [`${t.guests}: ${value.guests}`, `${t.meal}: ${t[value.meal]}`] : []),
    ...(value.message.trim() ? [`${t.message}: ${value.message.trim()}`] : []), wedding.hashtag,
  ].join('\n')
}

export function whatsappRSVPUrl(value: RSVPInput, language: Language, contact = wedding.whatsappNumber) {
  const digits = contact.replace(/[\s+()-]/g, '')
  if (!/^[1-9]\d{6,14}$/.test(digits)) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(buildRSVPMessage(value, language))}`
}
