import { describe, expect, it } from 'vitest'
import { wedding } from '../data/wedding'
import { deepEqual, effectiveToOverrides, isGalleryItem, isOverrides, mergeContent, type ContentOverrides, type GalleryItem } from './content'
import { contentRepository, newGalleryItem, clearPreviewMode, setPreviewMode } from '../services/contentRepository'

const item = (src: string, overrides: Partial<GalleryItem> = {}): GalleryItem => ({
  id: `${Date.now()}-${Math.random()}`, src, caption: { en: 'A moment', ta: 'ஒரு தருணம்' }, motif: '', color: '', ...overrides,
})

describe('content merging over build-time defaults', () => {
  it('returns the bundled defaults when nothing is overridden', () => {
    const content = mergeContent(null)
    expect(content.groomPortrait).toBe(wedding.groom.portrait)
    expect(content.bridePortrait).toBe(wedding.bride.portrait)
    expect(content.gallery).toHaveLength(wedding.gallery.length)
    expect(content.gallery.every(image => image.color.length > 0 && image.motif.length > 0)).toBe(true)
  })

  it('layers admin photos on top of the defaults', () => {
    const content = mergeContent({ bridePortrait: 'https://cdn.example/bride.jpg', groomPortrait: 'https://cdn.example/groom.jpg' })
    expect(content.bridePortrait).toBe('https://cdn.example/bride.jpg')
    expect(content.groomPortrait).toBe('https://cdn.example/groom.jpg')
  })

  it('honours an empty gallery override as "photos cleared"', () => {
    expect(mergeContent({ gallery: [] }).gallery).toEqual([])
    expect(mergeContent({}).gallery).toHaveLength(wedding.gallery.length)
  })

  it('fills safe motif, colour and Tamil fallbacks for uploaded photos', () => {
    const content = mergeContent({ gallery: [item('https://cdn.example/g.jpg')] })
    expect(content.gallery[0].motif).toBe('arch')
    expect(content.gallery[0].color).toMatch(/^(rose|sand|sage|wine|clay)$/)
    expect(content.gallery[0].caption.ta).toBe('ஒரு தருணம்')
    const englishOnly = mergeContent({ gallery: [item('https://cdn.example/g.jpg', { caption: { en: 'Only English', ta: '' } })] })
    expect(englishOnly.gallery[0].caption.ta).toBe('Only English')
  })
})

describe('minimal overrides produced from edited content', () => {
  it('emits an empty object when content still matches the defaults', () => {
    expect(effectiveToOverrides(mergeContent(null))).toEqual({})
  })

  it('records only what actually changed', () => {
    const edited = mergeContent(null)
    edited.bridePortrait = 'https://cdn.example/new-bride.jpg'
    edited.gallery = [item('https://cdn.example/first.jpg'), edited.gallery[1], edited.gallery[0]]
    const overrides = effectiveToOverrides(edited)
    expect(overrides.bridePortrait).toBe('https://cdn.example/new-bride.jpg')
    expect(overrides.groomPortrait).toBeUndefined()
    expect(overrides.gallery).toBeDefined()
    expect(overrides.gallery?.[0].src).toBe('https://cdn.example/first.jpg')
    expect(deepEqual(overrides, effectiveToOverrides(edited))).toBe(true)
  })

  it('records a cleared portrait as an empty override so placeholders return', () => {
    const overrides = effectiveToOverrides({ ...mergeContent(null), bridePortrait: '' })
    expect(overrides.bridePortrait).toBe('')
    expect(mergeContent(overrides).bridePortrait).toBe('')
  })
})

describe('overrides validation', () => {
  const valid: ContentOverrides = { groomPortrait: 'https://cdn.example/g.jpg', gallery: [item('https://cdn.example/one.jpg')] }
  it('accepts well-formed documents and rejects malformed ones', () => {
    expect(isOverrides(valid)).toBe(true)
    expect(isOverrides({ ...valid, groomPortrait: 42 })).toBe(false)
    expect(isOverrides({ ...valid, gallery: [{ ...valid.gallery![0], src: 7 }] })).toBe(false)
    expect(isOverrides({ gallery: 'nope' })).toBe(false)
    expect(isGalleryItem(valid.gallery![0])).toBe(true)
    expect(isGalleryItem({ caption: 'nope' })).toBe(false)
  })
})

describe('content repository storage', () => {
  it('round-trips overrides through the browser-backed store', async () => {
    setPreviewMode()
    try {
      const repo = contentRepository()
      expect(repo.online).toBe(false)
      const source: ContentOverrides = { bridePortrait: 'https://cdn.example/b.jpg', gallery: [item('https://cdn.example/one.jpg')] }
      await repo.saveOverrides(source)
      const restored = await repo.listOverrides()
      expect(restored).toEqual(source)
      expect(newGalleryItem('https://cdn.example/new.jpg', { en: '', ta: '' }, 2).src).toBe('https://cdn.example/new.jpg')
    } finally { clearPreviewMode() }
  })
})