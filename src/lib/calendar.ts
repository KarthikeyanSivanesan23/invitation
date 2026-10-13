import type { Language, WeddingEvent } from '../data/wedding'
import { wedding } from '../data/wedding'
import { downloadBlob } from './assets'

export function parseZonedDate(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(iso)) return null
  const milliseconds = Date.parse(iso)
  return Number.isFinite(milliseconds) ? milliseconds : null
}

export function countdownTo(iso: string, now = Date.now()) {
  const target = parseZonedDate(iso)
  if (target === null) return null
  const seconds = Math.max(0, Math.floor((target - now) / 1000))
  return { days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60, complete: target <= now }
}

const stamp = (date: number) => new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')
const escape = (text: string) => text.replaceAll('\\', '\\\\').replaceAll('\r\n', '\n').replaceAll('\r', '\n').replaceAll('\n', '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;')

// RFC 5545 folds at 75 octets, not 75 characters; Tamil occupies multiple UTF-8 bytes.
export function foldCalendarLine(line: string) {
  const encoder = new TextEncoder()
  let result = '', bytes = 0
  for (const character of line) {
    const size = encoder.encode(character).length
    if (bytes + size > 75) { result += '\r\n '; bytes = 1 }
    result += character; bytes += size
  }
  return result
}

export function eventDates(event: WeddingEvent) {
  const startISO = event.startISO || (event.id === 'muhurtham' ? wedding.dateISO : '')
  const start = parseZonedDate(startISO)
  if (start === null) return null
  const configuredEnd = parseZonedDate(event.endISO || (event.id === 'muhurtham' ? wedding.endISO : ''))
  const end = configuredEnd !== null && configuredEnd > start ? configuredEnd : start + 2 * 3600000
  return { start, end }
}

export function createCalendar(event: WeddingEvent, language: Language, now = Date.now()): string | null {
  const dates = eventDates(event)
  if (!dates) return null
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//A Lifetime of Us//Wedding Invitation//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${event.id}-${dates.start}@${new URL(wedding.siteUrl).hostname}`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(dates.start)}`, `DTEND:${stamp(dates.end)}`,
    `SUMMARY:${escape(`${wedding.groom.name[language]} & ${wedding.bride.name[language]} · ${event.title[language]}`)}`,
    `DESCRIPTION:${escape(`${event.description[language]}\n${wedding.hashtag}`)}`, `LOCATION:${escape(`${event.venue[language]}, ${wedding.venue.address[language]}`)}`,
    `URL:${wedding.siteUrl}`, 'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR',
  ].map(foldCalendarLine).join('\r\n') + '\r\n'
}

export function downloadCalendar(event: WeddingEvent, language: Language) {
  const calendar = createCalendar(event, language)
  if (!calendar) return false
  downloadBlob(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }), `wedding-${event.id}.ics`)
  return true
}

export function googleCalendarUrl(event: WeddingEvent, language: Language) {
  const dates = eventDates(event)
  if (!dates) return null
  return `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: 'TEMPLATE', text: `${wedding.groom.name[language]} & ${wedding.bride.name[language]} · ${event.title[language]}`, dates: `${stamp(dates.start)}/${stamp(dates.end)}`, details: `${event.description[language]}\n${wedding.siteUrl}`, location: `${event.venue[language]}, ${wedding.venue.address[language]}`, ctz: wedding.timeZone })}`
}
