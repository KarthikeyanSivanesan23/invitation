import type { Localized } from '../data/wedding'

export const EVENT_TYPES = ['pre-wedding', 'engagement', 'mehendi', 'haldi', 'reception', 'wedding', 'post-wedding', 'custom'] as const
export type EventType = (typeof EVENT_TYPES)[number]

export const ALBUM_THEMES = ['royal-maroon-gold', 'ivory-champagne', 'emerald-temple', 'rose-blush', 'midnight-luxury'] as const
export type AlbumTheme = (typeof ALBUM_THEMES)[number]

export const ALBUM_LAYOUTS = ['cinematic-story', '3d-photo-book', 'editorial-grid', 'masonry-gallery', 'horizontal-filmstrip', 'double-exposure-story'] as const
export type AlbumLayout = (typeof ALBUM_LAYOUTS)[number]

export const PHOTO_EFFECTS = ['none', 'cinematic', 'black-and-white', 'sepia-memory', 'gold-glow', 'soft-bloom', 'film-grain', 'parallax-depth', 'double-exposure', 'polaroid', 'vintage-film'] as const
export type PhotoEffect = (typeof PHOTO_EFFECTS)[number]

export const BLEND_MODES = ['screen', 'overlay', 'soft-light', 'multiply', 'lighten'] as const
export type BlendMode = (typeof BLEND_MODES)[number]

export type PhotoOrientation = 'landscape' | 'portrait' | 'square'

export interface EffectConfig {
  /** Opacity of the gradient / overlay layer (0..1). */
  opacity: number
  /** Horizontal offset of the double-exposure overlay, as a percent (-50..50). */
  x: number
  /** Vertical offset of the double-exposure overlay, as a percent (-50..50). */
  y: number
  blend: BlendMode
  gradientDeg: number
  grain: boolean
}

export const effectConfigDefaults = (): EffectConfig => ({ opacity: 0.72, x: 0, y: 0, blend: 'screen', gradientDeg: 135, grain: false })

export interface AlbumInput {
  title: Localized
  slug: string
  subtitle: Localized
  description: Localized
  eventType: EventType
  eventDate: string | null
  location: string
  coverImage: string
  layoutType: AlbumLayout
  theme: AlbumTheme
  isPublished: boolean
  allowDownload: boolean
  sortOrder: number
}

export interface Album extends AlbumInput {
  id: string
  createdAt: string
  updatedAt: string
}

export interface AlbumListItem extends Album {
  photoCount: number
}

export interface AlbumPhotoInput {
  /** Pre-computed id so storage paths can be built before the row exists. */
  id?: string
  albumId: string
  /** Responsive WebP at ~1600px — the "gallery" size used everywhere by default. */
  imageUrl: string
  thumbnailUrl: string
  /** The pixel-perfect original (capped at ~2600px) used in the lightbox. */
  fullUrl: string
  /** Storage prefix, e.g. albums/<albumId>/<photoId> — used for bulk delete. */
  publicId: string
  altText: string
  title: Localized
  caption: Localized
  storyText: Localized
  location: string
  takenAt: string | null
  sortOrder: number
  orientation: PhotoOrientation
  featured: boolean
  isPublished: boolean
  effectType: PhotoEffect
  overlayImageUrl: string
  effectConfig: EffectConfig
  focalPointX: number
  focalPointY: number
}

export interface AlbumPhoto extends AlbumPhotoInput {
  id: string
  createdAt: string
  updatedAt: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

export const emptyLocalized = (): Localized => ({ en: '', ta: '' })

/** Coerces any database/localized value into a usable { en, ta } pair (Tamil
 *  silently falls back to the English string so a single-language album still reads). */
export function parseLocalized(value: unknown): Localized {
  const record = isRecord(value) ? value : {}
  const en = typeof record.en === 'string' ? record.en.trim() : ''
  const ta = typeof record.ta === 'string' ? record.ta.trim() : ''
  return { en, ta: ta || en }
}

const str = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback)
const bool = (value: unknown, fallback = false): boolean => (typeof value === 'boolean' ? value : fallback)
const num = (value: unknown, fallback: number): number => (typeof value === 'number' && Number.isFinite(value) ? value : fallback)
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const oneOf = <T extends readonly string[]>(value: unknown, list: T, fallback: T[number]): T[number] =>
  typeof value === 'string' && (list as readonly string[]).includes(value) ? (value as T[number]) : fallback

function parseEffectConfig(value: unknown): EffectConfig {
  const record = isRecord(value) ? value : {}
  const defaults = effectConfigDefaults()
  return {
    opacity: clamp(num(record.opacity, defaults.opacity), 0, 1),
    x: clamp(num(record.x, defaults.x), -50, 50),
    y: clamp(num(record.y, defaults.y), -50, 50),
    blend: oneOf(record.blend, BLEND_MODES, defaults.blend),
    gradientDeg: clamp(num(record.gradientDeg, defaults.gradientDeg), 0, 360),
    grain: bool(record.grain, defaults.grain),
  }
}

export interface AlbumRow {
  id: string
  title: unknown
  slug: string
  subtitle: unknown
  description: unknown
  event_type: unknown
  event_date: string | null
  location: string
  cover_image: string
  layout_type: unknown
  theme: unknown
  is_published: boolean
  allow_download: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export function mapAlbumRow(row: AlbumRow): Album {
  return {
    id: str(row.id),
    title: parseLocalized(row.title),
    slug: str(row.slug),
    subtitle: parseLocalized(row.subtitle),
    description: parseLocalized(row.description),
    eventType: oneOf(row.event_type, EVENT_TYPES, 'custom'),
    eventDate: str(row.event_date) || null,
    location: str(row.location),
    coverImage: str(row.cover_image),
    layoutType: oneOf(row.layout_type, ALBUM_LAYOUTS, 'cinematic-story'),
    theme: oneOf(row.theme, ALBUM_THEMES, 'royal-maroon-gold'),
    isPublished: bool(row.is_published),
    allowDownload: bool(row.allow_download, true),
    sortOrder: Math.max(0, num(row.sort_order, 0)),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
  }
}

export interface AlbumPhotoRow {
  id: string
  album_id: string
  image_url: string
  thumbnail_url: string
  full_url: string
  public_id: string
  alt_text: string
  title: unknown
  caption: unknown
  story_text: unknown
  location: string
  taken_at: string | null
  sort_order: number
  orientation: unknown
  featured: boolean
  is_published: boolean
  effect_type: unknown
  overlay_image_url: string
  effect_config: unknown
  focal_point_x: number
  focal_point_y: number
  created_at: string
  updated_at: string
}

export function mapAlbumPhotoRow(row: AlbumPhotoRow): AlbumPhoto {
  return {
    id: str(row.id),
    albumId: str(row.album_id),
    imageUrl: str(row.image_url),
    thumbnailUrl: str(row.thumbnail_url),
    fullUrl: str(row.full_url),
    publicId: str(row.public_id),
    altText: str(row.alt_text),
    title: parseLocalized(row.title),
    caption: parseLocalized(row.caption),
    storyText: parseLocalized(row.story_text),
    location: str(row.location),
    takenAt: str(row.taken_at) || null,
    sortOrder: num(row.sort_order, 0),
    orientation: oneOf(row.orientation, ['landscape', 'portrait', 'square'] as const, 'landscape'),
    featured: bool(row.featured),
    isPublished: bool(row.is_published, true),
    effectType: oneOf(row.effect_type, PHOTO_EFFECTS, 'none'),
    overlayImageUrl: str(row.overlay_image_url),
    effectConfig: parseEffectConfig(row.effect_config),
    focalPointX: clamp(num(row.focal_point_x, 50), 0, 100),
    focalPointY: clamp(num(row.focal_point_y, 50), 0, 100),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
  }
}

const localizedValidation = (label: string, value: Localized): string[] => {
  const errors: string[] = []
  if (!value.en.trim()) errors.push(`${label} (English) is required.`)
  return errors
}

/** Pure form validation. Returns a list of human-readable problems (empty = valid). */
export function validateAlbum(value: AlbumInput): string[] {
  const errors = localizedValidation('Album title', value.title)
  if (!value.slug.trim()) errors.push('A web address (slug) is required — it becomes /albums/<slug>.')
  else if (!/^[\p{L}\p{N}\p{M}]+(?:-[\p{L}\p{N}\p{M}]+)*$/u.test(value.slug.trim())) errors.push('The web address can only contain letters, numbers and dashes.')
  else if (value.slug.trim().length > 80) errors.push('The web address must be under 80 characters.')
  if (!EVENT_TYPES.includes(value.eventType)) errors.push('Choose a valid event type.')
  if (value.eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(value.eventDate)) errors.push('The event date must look like YYYY-MM-DD.')
  if (!ALBUM_THEMES.includes(value.theme)) errors.push('Choose a valid theme.')
  if (!ALBUM_LAYOUTS.includes(value.layoutType)) errors.push('Choose a valid layout.')
  if (value.sortOrder < 0) errors.push('Sort order cannot be negative.')
  return errors
}

export function validatePhoto(value: AlbumPhotoInput, effect: PhotoEffect): string[] {
  const errors: string[] = []
  if (!value.imageUrl.trim()) errors.push('The photo is missing its uploaded copy.')
  if (effect === 'double-exposure' && !value.overlayImageUrl.trim()) errors.push('Double exposure needs a second overlay image.')
  if (value.effectConfig.opacity < 0 || value.effectConfig.opacity > 1) errors.push('Overlay opacity must be between 0 and 1.')
  return errors
}

/** Converts any text into a stable, URL-friendly slug that keeps letters in any
 *  language (so Tamil album names still become readable slugs). Combining marks
 *  (the virama etc. of the Tamil script) belong to the word, so they are kept
 *  rather than split out into dashes. */
export function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return slug
}

/** Admin album sub-routes, parsed from the hash (e.g. `#admin/albums/<id>/photos`). */
export type AdminAlbumRoute =
  | { name: 'invitation' }
  | { name: 'albums-list' }
  | { name: 'albums-new' }
  | { name: 'albums-edit'; albumId: string }
  | { name: 'albums-photos'; albumId: string }
  | { name: 'albums-preview'; albumId: string }

export function parseAdminAlbumRoute(hash: string): AdminAlbumRoute {
  const rest = hash.replace(/^#\/?/, '').replace(/^\//, '').replace(/^admin\/?/, '')
  if (!rest) return { name: 'invitation' }
  const match = /^albums\/([^/]+)\/(new|photos|preview)$/.exec(rest)
  if (match) {
    const albumId = match[1]
    const action = match[2]
    if (action === 'new') return { name: 'albums-new' }
    if (action === 'photos') return { name: 'albums-photos', albumId: decodeURIComponent(albumId) }
    if (action === 'preview') return { name: 'albums-preview', albumId: decodeURIComponent(albumId) }
  }
  if (rest === 'albums/new') return { name: 'albums-new' }
  if (rest === 'albums') return { name: 'albums-list' }
  const edit = /^albums\/([^/]+)$/.exec(rest)
  if (edit) return { name: 'albums-edit', albumId: decodeURIComponent(edit[1]) }
  return { name: 'albums-list' }
}