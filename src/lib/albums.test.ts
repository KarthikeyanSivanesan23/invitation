import { describe, expect, it } from 'vitest'
import {
  effectConfigDefaults, mapAlbumPhotoRow, mapAlbumRow, parseAdminAlbumRoute, parseLocalized, slugify, validateAlbum, validatePhoto,
  type AlbumInput, type AlbumPhotoInput, type AlbumRow,
} from './albums'

const albumRow = (overrides: Partial<AlbumRow> = {}): AlbumRow => ({
  id: 'a1', title: { en: 'Our Days', ta: 'எங்கள் நாட்கள்' }, slug: 'our-days', subtitle: { en: 'A little album', ta: '' },
  description: { en: 'Moments together.', ta: '' }, event_type: 'engagement', event_date: '2026-12-01', location: 'Chennai',
  cover_image: 'https://cdn.example/cover.jpg', layout_type: 'cinematic-story', theme: 'royal-maroon-gold',
  is_published: true, allow_download: true, sort_order: 2, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z', ...overrides,
})

const albumInput = (): AlbumInput => ({
  title: { en: 'Our Days', ta: 'எங்கள் நாட்கள்' }, slug: 'our-days', subtitle: { en: '', ta: '' }, description: { en: '', ta: '' },
  eventType: 'engagement', eventDate: null, location: '', coverImage: '', layoutType: 'cinematic-story', theme: 'royal-maroon-gold',
  isPublished: true, allowDownload: true, sortOrder: 0,
})

const photoInput = (): AlbumPhotoInput => ({
  albumId: 'a1', imageUrl: 'https://cdn.example/g.jpg', thumbnailUrl: 'https://cdn.example/t.jpg', fullUrl: 'https://cdn.example/f.jpg',
  publicId: 'albums/a1/p1', altText: '', title: { en: '', ta: '' }, caption: { en: '', ta: '' }, storyText: { en: '', ta: '' },
  location: '', takenAt: null, sortOrder: 0, orientation: 'landscape', featured: false, isPublished: true,
  effectType: 'none', overlayImageUrl: '', effectConfig: effectConfigDefaults(), focalPointX: 50, focalPointY: 50,
})

describe('slugify', () => {
  it('lowercases and dashes non-word characters', () => {
    expect(slugify('  Our Beautiful Days!  ')).toBe('our-beautiful-days')
  })
  it('keeps Tamil letters so native slugs work', () => {
    expect(slugify('எங்கள் நாள்')).toBe('எங்கள்-நாள்')
  })
  it('returns an empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })
})

describe('parseLocalized', () => {
  it('falls back to English when Tamil is empty or missing', () => {
    expect(parseLocalized({ en: 'Hello', ta: '' })).toEqual({ en: 'Hello', ta: 'Hello' })
    expect(parseLocalized({ en: 'Hello' })).toEqual({ en: 'Hello', ta: 'Hello' })
    expect(parseLocalized(null)).toEqual({ en: '', ta: '' })
  })
})

describe('mapAlbumRow', () => {
  it('maps every database column into the camel-case Album shape', () => {
    const album = mapAlbumRow(albumRow())
    expect(album).toMatchObject({ id: 'a1', slug: 'our-days', eventType: 'engagement', layoutType: 'cinematic-story', theme: 'royal-maroon-gold', isPublished: true, sortOrder: 2 })
    expect(album.title.ta).toBe('எங்கள் நாட்கள்')
  })
  it('coerces missing or invalid values to safe defaults', () => {
    const album = mapAlbumRow({ ...albumRow({ event_type: 'banquet', theme: 'unknown', title: null, sort_order: -3 }) })
    expect(album.eventType).toBe('custom')
    expect(album.theme).toBe('royal-maroon-gold')
    expect(album.title).toEqual({ en: '', ta: '' })
    expect(album.sortOrder).toBe(0)
  })
})

describe('mapAlbumPhotoRow', () => {
  it('maps photo rows and normalises the effect config', () => {
    const row = {
      id: 'p1', album_id: 'a1', image_url: 'https://cdn.example/g.jpg', thumbnail_url: 'https://cdn.example/t.jpg', full_url: 'https://cdn.example/f.jpg',
      public_id: 'albums/a1/p1', alt_text: '', title: { en: 'First dance', ta: '' }, caption: { en: '', ta: '' }, story_text: { en: '', ta: '' },
      location: '', taken_at: null, sort_order: 1, orientation: 'portrait', featured: true, is_published: true,
      effect_type: 'double-exposure', overlay_image_url: 'https://cdn.example/o.jpg',
      effect_config: { opacity: 0.5, x: 12, y: -8, blend: 'soft-light', gradientDeg: 90, grain: true },
      focal_point_x: 40, focal_point_y: 60, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    }
    const photo = mapAlbumPhotoRow(row)
    expect(photo.orientation).toBe('portrait')
    expect(photo.featured).toBe(true)
    expect(photo.effectType).toBe('double-exposure')
    expect(photo.effectConfig).toEqual({ opacity: 0.5, x: 12, y: -8, blend: 'soft-light', gradientDeg: 90, grain: true })
    expect(photo.title.ta).toBe('First dance')
  })
})

describe('form validation', () => {
  it('rejects empty titles and malformed slugs', () => {
    expect(validateAlbum({ ...albumInput(), title: { en: '', ta: '' } }).length).toBeGreaterThan(0)
    expect(validateAlbum({ ...albumInput(), slug: 'has spaces' }).length).toBeGreaterThan(0)
    expect(validateAlbum({ ...albumInput(), slug: 'fine-slug-2' })).toEqual([])
  })
  it('accepts Unicode slugs and validates dates and enums', () => {
    expect(validateAlbum({ ...albumInput(), slug: 'எங்கள்-நாள்' })).toEqual([])
    expect(validateAlbum({ ...albumInput(), eventDate: 'not-a-date' }).length).toBeGreaterThan(0)
    expect(validateAlbum({ ...albumInput(), theme: 'rose-blush', layoutType: 'masonry-gallery' })).toEqual([])
  })
  it('flags photos missing their copy or double-exposure overlay', () => {
    expect(validatePhoto(photoInput(), 'none')).toEqual([])
    expect(validatePhoto({ ...photoInput(), imageUrl: '' }, 'none').length).toBeGreaterThan(0)
    expect(validatePhoto(photoInput(), 'double-exposure').length).toBeGreaterThan(0)
    expect(validatePhoto({ ...photoInput(), overlayImageUrl: 'https://cdn.example/o.jpg' }, 'double-exposure')).toEqual([])
  })
})

describe('parseAdminAlbumRoute', () => {
  it('keeps the invitation route for the plain admin hash', () => {
    expect(parseAdminAlbumRoute('#admin')).toEqual({ name: 'invitation' })
    expect(parseAdminAlbumRoute('#/admin')).toEqual({ name: 'invitation' })
  })
  it('parses the album sub-routes', () => {
    expect(parseAdminAlbumRoute('#admin/albums')).toEqual({ name: 'albums-list' })
    expect(parseAdminAlbumRoute('#admin/albums/new')).toEqual({ name: 'albums-new' })
    expect(parseAdminAlbumRoute('#admin/albums/abc-123')).toEqual({ name: 'albums-edit', albumId: 'abc-123' })
    expect(parseAdminAlbumRoute('#admin/albums/abc-123/photos')).toEqual({ name: 'albums-photos', albumId: 'abc-123' })
    expect(parseAdminAlbumRoute('#admin/albums/abc-123/preview')).toEqual({ name: 'albums-preview', albumId: 'abc-123' })
  })
  it('falls back to the album list for unknown hashes', () => {
    expect(parseAdminAlbumRoute('#admin/nonsense')).toEqual({ name: 'albums-list' })
  })
})