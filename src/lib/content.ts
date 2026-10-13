import { wedding, type Localized } from '../data/wedding'

/** A single gallery photograph. `motif` and `color` only drive the fallback
 *  artwork shown while an image is missing, so uploaded photos carry safe defaults. */
export interface GalleryItem {
  id: string
  src: string
  caption: Localized
  motif: string
  color: string
}

/** The small set of content the admin panel can edit. `wedding.ts` remains the
 *  build-time source of truth; these overrides are layered on top of it. */
export interface ContentOverrides {
  groomPortrait?: string
  bridePortrait?: string
  gallery?: GalleryItem[]
}

/** Fully-resolved content after merging overrides with the build-time defaults. */
export interface LiveContent {
  groomPortrait: string
  bridePortrait: string
  gallery: GalleryItem[]
}

export const galleryPalette = ['rose', 'sand', 'sage', 'wine', 'clay'] as const

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isString = (value: unknown): value is string => typeof value === 'string'
const isLocalized = (value: unknown): value is Localized => isRecord(value) && isString(value.en) && isString(value.ta)

export function isGalleryItem(value: unknown): value is GalleryItem {
  return isRecord(value) && isString(value.id) && isString(value.src) && isLocalized(value.caption) && isString(value.motif ?? '') && isString(value.color ?? '')
}

export function isOverrides(value: unknown): value is ContentOverrides {
  if (!isRecord(value)) return false
  if (value.groomPortrait !== undefined && !isString(value.groomPortrait)) return false
  if (value.bridePortrait !== undefined && !isString(value.bridePortrait)) return false
  if (value.gallery !== undefined && (!Array.isArray(value.gallery) || !value.gallery.every(isGalleryItem))) return false
  return true
}

const fillGallery = (gallery: GalleryItem[]) => gallery.map((item, index) => ({
  ...item,
  src: item.src.trim(),
  motif: item.motif || 'arch',
  color: item.color || galleryPalette[index % galleryPalette.length],
  caption: { en: item.caption.en, ta: item.caption.ta || item.caption.en },
}))

/** Merge admin overrides over the static invitation. An empty `gallery` array is
 *  honoured (photos can be cleared); `undefined` means "use the default gallery". */
export function mergeContent(overrides: ContentOverrides | null): LiveContent {
  return {
    groomPortrait: overrides && typeof overrides.groomPortrait === 'string' ? overrides.groomPortrait.trim() : wedding.groom.portrait,
    bridePortrait: overrides && typeof overrides.bridePortrait === 'string' ? overrides.bridePortrait.trim() : wedding.bride.portrait,
    gallery: overrides && Array.isArray(overrides.gallery) ? fillGallery(overrides.gallery) : fillGallery(wedding.gallery),
  }
}

/** Turn an edited, fully-resolved value back into a minimal overrides document
 *  containing only the parts that differ from the shipped defaults. */
export function effectiveToOverrides(value: LiveContent): ContentOverrides {
  const defaults = mergeContent(null)
  const overrides: ContentOverrides = {}
  const groom = value.groomPortrait.trim()
  const bride = value.bridePortrait.trim()
  if (groom !== defaults.groomPortrait) overrides.groomPortrait = groom
  if (bride !== defaults.bridePortrait) overrides.bridePortrait = bride
  if (JSON.stringify(value.gallery) !== JSON.stringify(defaults.gallery)) overrides.gallery = value.gallery.map(item => ({ ...item, src: item.src.trim() }))
  return overrides
}

export const deepEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)