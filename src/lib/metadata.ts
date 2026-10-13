import { wedding } from '../data/wedding.ts'
import type { Language } from '../data/wedding.ts'

export function structuredData(language: Language = 'en') {
  const base = { '@context': 'https://schema.org', name: `${wedding.groom.name[language]} & ${wedding.bride.name[language]} — ${wedding.title[language]}`, url: wedding.siteUrl, description: wedding.description[language], inLanguage: language === 'ta' ? 'ta-IN' : 'en-IN' }
  if (!wedding.dateISO || !Number.isFinite(Date.parse(wedding.dateISO)) || wedding.venue.name.en.includes('[')) return { ...base, '@type': 'WebSite' }
  return { ...base, '@type': 'Event', startDate: wedding.dateISO, ...(wedding.endISO ? { endDate: wedding.endISO } : {}), eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', location: { '@type': 'Place', name: wedding.venue.name[language], address: { '@type': 'PostalAddress', streetAddress: wedding.venue.address[language], addressCountry: 'IN' } }, organizer: { '@type': 'Organization', name: wedding.hostedBy[language], url: wedding.siteUrl } }
}
