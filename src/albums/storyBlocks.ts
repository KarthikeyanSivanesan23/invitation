import type { AlbumLayout, AlbumPhoto } from '../lib/albums'

export type StoryBlockKind = 'lead' | 'split' | 'full' | 'quote' | 'duo' | 'film' | 'caption' | 'closing'

export interface StoryBlock {
  kind: StoryBlockKind
  /** Indexes into the (already sort-ordered) photos array. Text blocks carry []. */
  indexes: number[]
}

interface Palette {
  order: StoryBlockKind[]
  spans: Partial<Record<StoryBlockKind, number>>
}

const paletteFor = (layout: AlbumLayout): Palette => {
  switch (layout) {
    case 'horizontal-filmstrip': return { order: ['film'], spans: { film: 5 } }
    case '3d-photo-book': return { order: ['duo', 'caption', 'quote', 'duo'], spans: { duo: 2, caption: 1, quote: 0 } }
    case 'masonry-gallery': return { order: ['caption', 'duo', 'caption', 'caption', 'quote'], spans: { caption: 1, duo: 2, quote: 0 } }
    case 'editorial-grid': return { order: ['split', 'caption', 'full', 'duo', 'caption'], spans: { split: 1, caption: 1, full: 1, duo: 2 } }
    case 'double-exposure-story': return { order: ['full', 'quote'], spans: { full: 1, quote: 0 } }
    default: return { order: ['split', 'full', 'quote', 'duo', 'caption', 'film'], spans: { split: 1, full: 1, quote: 0, duo: 2, caption: 1, film: 4 } }
  }
}

/** Deterministically turns a sorted photo list into a story outline. Every photo
 *  appears at least once; text (quote/closing) blocks breathe between visuals. */
export function buildStoryBlocks(photos: AlbumPhoto[], layout: AlbumLayout): StoryBlock[] {
  const blocks: StoryBlock[] = []
  if (photos.length) blocks.push({ kind: 'lead', indexes: [0] })
  if (photos.length <= 1) {
    blocks.push({ kind: 'closing', indexes: [] })
    return blocks
  }

  const palette = paletteFor(layout)
  const spans = { split: 1, full: 1, quote: 0, duo: 2, caption: 1, film: 4, lead: 1, closing: 0, ...palette.spans }
  const push = (kind: StoryBlockKind, count: number): boolean => {
    const take = Math.min(count, photos.length - i)
    if (take <= 0) return false
    const indexes: number[] = []
    for (let k = 0; k < take; k += 1) indexes.push(i + k)
    blocks.push({ kind, indexes })
    i += take
    return take > 0
  }

  let i = 1
  let slot = 0
  let zeroSpans = 0
  while (i < photos.length) {
    const kind = palette.order[slot % palette.order.length]
    const take = spans[kind] ?? 1
    if (take === 0) {
      blocks.push({ kind, indexes: [] })
      zeroSpans += 1
      if (zeroSpans > palette.order.length) break
      slot += 1
      continue
    }
    zeroSpans = 0
    const remaining = photos.length - i
    if (take > 1 && remaining === 1) { push('caption', 1); slot += 1; continue }
    push(kind, Math.min(take, remaining))
    slot += 1
  }

  blocks.push({ kind: 'closing', indexes: [] })
  return blocks
}