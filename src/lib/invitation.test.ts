import { describe, expect, it } from 'vitest'
import { wedding, type WeddingEvent } from '../data/wedding'
import { countdownTo, createCalendar, eventDates, foldCalendarLine, parseZonedDate } from './calendar'
import { buildRSVPMessage, validateRSVP, whatsappRSVPUrl, type RSVPInput } from './rsvp'
import { en, ta } from '../data/translations'

const event: WeddingEvent = { ...wedding.events[4], startISO: '2027-02-14T09:00:00+05:30', endISO: '2027-02-14T11:00:00+05:30' }
const response: RSVPInput = { name: 'Arun & Meena', phone: '+91 98765 43210', guests: 3, attendance: 'yes', meal: 'vegetarian', message: 'Wishing you joy, always!' }

describe('time-zone-safe wedding calendars', () => {
  it('requires an explicit time zone and resolves Indian Standard Time correctly', () => {
    expect(parseZonedDate('2027-02-14T09:00:00')).toBeNull()
    expect(parseZonedDate('[Wedding Date]')).toBeNull()
    expect(parseZonedDate('2027-02-14T09:00:00+05:30')).toBe(Date.UTC(2027, 1, 14, 3, 30))
  })
  it('shows unknown and completed states instead of fabricated countdowns', () => {
    expect(countdownTo('')).toBeNull()
    expect(countdownTo(event.startISO, Date.UTC(2027, 1, 13, 2, 28, 57))).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 3, complete: false })
    expect(countdownTo(event.startISO, Date.UTC(2027, 1, 15))).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, complete: true })
  })
  it('exports a real UTC calendar and rejects unconfigured events', () => {
    const calendar = createCalendar(event, 'en', Date.UTC(2026, 8, 21))
    expect(calendar).toContain('DTSTART:20270214T033000Z\r\n')
    expect(calendar).toContain('DTEND:20270214T053000Z\r\n')
    expect(calendar).toContain('DTSTAMP:20260921T000000Z')
    expect(calendar).toContain('END:VCALENDAR\r\n')
    expect(createCalendar({ ...event, startISO: '' }, 'en')).toBeNull()
    expect(eventDates({ ...event, endISO: '2027-02-13T09:00:00+05:30' })?.end).toBe(Date.UTC(2027, 1, 14, 5, 30))
  })
  it('folds Tamil lines at the RFC 5545 byte limit without breaking Unicode', () => {
    const input = 'DESCRIPTION:' + 'திருமண விழாவிற்கு அன்புடன் அழைக்கிறோம். '.repeat(8)
    const folded = foldCalendarLine(input)
    expect(folded.replaceAll('\r\n ', '')).toBe(input)
    for (const line of folded.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
  })
  it('escapes calendar text, including line breaks and delimiters', () => {
    const escaped = createCalendar({ ...event, title: { en: 'Party, food; joy', ta: '' }, description: { en: 'First\nSecond\\Third', ta: '' } }, 'en')
    expect(escaped?.replaceAll('\r\n ', '')).toContain('Party\\, food\\; joy')
    expect(escaped).toContain('First\\nSecond\\\\Third')
  })
})

describe('RSVP validation and WhatsApp handoff', () => {
  it('accepts valid responses and prevents malformed input', () => {
    expect(validateRSVP(response)).toEqual({})
    expect(validateRSVP({ ...response, name: ' ', phone: 'hello', guests: 0, attendance: '' })).toMatchObject({ name: 'nameError', phone: 'phoneError', attendance: 'attendanceError' })
    expect(validateRSVP({ ...response, guests: 2.5 })).toHaveProperty('guests')
    expect(validateRSVP({ ...response, guests: 11 })).toHaveProperty('guests')
    expect(validateRSVP({ ...response, message: 'x'.repeat(501) })).toHaveProperty('message')
  })
  it('omits guest and meal details when the invitation is declined', () => {
    const declined = { ...response, attendance: 'no' as const, guests: 0 }
    expect(validateRSVP(declined)).toEqual({})
    const message = buildRSVPMessage(declined, 'en')
    expect(message).toContain('Regretfully decline')
    expect(message).not.toContain('Number of guests:')
    expect(message).not.toContain('Meal preference:')
  })
  it('encodes all RSVP fields and targets only a valid configured contact', () => {
    expect(whatsappRSVPUrl(response, 'en', '')).toBeNull()
    expect(whatsappRSVPUrl(response, 'en', '[Contact Numbers]')).toBeNull()
    const link = whatsappRSVPUrl(response, 'en', '+91 98765 43210')!
    expect(new URL(link).pathname).toBe('/919876543210')
    expect(new URL(link).searchParams.get('text')).toContain('Arun & Meena')
    expect(new URL(link).searchParams.get('text')).toContain('Number of guests: 3')
    expect(new URL(whatsappRSVPUrl(response, 'ta', '919876543210')!).searchParams.get('text')).toContain(ta.attending)
  })
  it('keeps English and Tamil UI translations in sync', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ta).sort())
    expect(Object.values(ta).every(value => value.trim().length > 0)).toBe(true)
  })
})
