import type { SupabaseClient } from '@supabase/supabase-js'
import { mapAlbumPhotoRow, mapAlbumRow, type Album, type AlbumInput, type AlbumPhoto, type AlbumPhotoInput, type AlbumPhotoRow, type AlbumRow } from '../lib/albums'
import { previewMode, supabaseClient } from './contentRepository'

/** All album storage lives in Supabase. There is deliberately no local mock:
 *  albums are real, shareable things and need the cloud project; in browser-only
 *  preview mode the admin shows a clear "connect Supabase" notice instead. */
export interface AlbumRepository {
  readonly online: boolean
  listAlbums(): Promise<Album[]>
  getAlbum(id: string): Promise<Album | null>
  listAlbumPhotos(albumId: string): Promise<AlbumPhoto[]>
  createAlbum(input: AlbumInput): Promise<Album>
  updateAlbum(id: string, input: AlbumInput): Promise<Album>
  deleteAlbum(id: string): Promise<void>
  createPhotos(inputs: AlbumPhotoInput[]): Promise<void>
  updatePhoto(id: string, patch: Partial<AlbumPhotoInput>): Promise<void>
  reorderPhotos(albumId: string, orderedIds: string[]): Promise<void>
  deletePhotos(ids: string[]): Promise<void>
  listPublishedAlbums(): Promise<Album[]>
  countPublishedPhotos(albumIds: string[]): Promise<Record<string, number>>
  countPhotos(albumIds: string[]): Promise<Record<string, number>>
  getPublishedAlbumBySlug(slug: string): Promise<{ album: Album; photos: AlbumPhoto[] } | null>
}

class SupabaseAlbumRepository implements AlbumRepository {
  online = true

  async #client(): Promise<SupabaseClient> {
    return supabaseClient()
  }

  async listAlbums(): Promise<Album[]> {
    const client = await this.#client()
    const { data, error } = await client.from('albums').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true })
    if (error) throw new Error(this.#message(error, 'Could not load the albums.'))
    return ((data as unknown as AlbumRow[]) ?? []).map(mapAlbumRow)
  }

  async getAlbum(id: string): Promise<Album | null> {
    const client = await this.#client()
    const { data, error } = await client.from('albums').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(this.#message(error, 'Could not load the album.'))
    return data ? mapAlbumRow(data as unknown as AlbumRow) : null
  }

  async listAlbumPhotos(albumId: string): Promise<AlbumPhoto[]> {
    const client = await this.#client()
    const { data, error } = await client.from('album_photos').select('*').eq('album_id', albumId).order('sort_order', { ascending: true }).order('created_at', { ascending: true })
    if (error) throw new Error(this.#message(error, 'Could not load the album photos.'))
    return ((data as unknown as AlbumPhotoRow[]) ?? []).map(mapAlbumPhotoRow)
  }

  async createAlbum(input: AlbumInput): Promise<Album> {
    const client = await this.#client()
    const now = new Date().toISOString()
    const row = this.#toAlbumRow(input, now, now)
    const { data, error } = await client.from('albums').insert(row).select().maybeSingle()
    if (error) throw new Error(this.#message(error, 'The album could not be created.'))
    return mapAlbumRow(data as unknown as AlbumRow)
  }

  async updateAlbum(id: string, input: AlbumInput): Promise<Album> {
    const client = await this.#client()
    const now = new Date().toISOString()
    const row = this.#toAlbumRow(input, undefined, now)
    const { data, error } = await client.from('albums').update(row).eq('id', id).select().maybeSingle()
    if (error) throw new Error(this.#message(error, 'The album could not be saved.'))
    return mapAlbumRow(data as unknown as AlbumRow)
  }

  async deleteAlbum(id: string): Promise<void> {
    const client = await this.#client()
    await this.removeStorage([id]).catch(() => { /* Storage leftovers are not fatal. */ })
    const { error } = await client.from('albums').delete().eq('id', id)
    if (error) throw new Error(this.#message(error, 'The album could not be deleted.'))
  }

  async createPhotos(inputs: AlbumPhotoInput[]): Promise<void> {
    if (!inputs.length) return
    const client = await this.#client()
    const now = new Date().toISOString()
    const rows = inputs.map(input => this.#toPhotoRow(input, now))
    const { error } = await client.from('album_photos').insert(rows)
    if (error) throw new Error(this.#message(error, 'The photos could not be added.'))
  }

  async updatePhoto(id: string, patch: Partial<AlbumPhotoInput>): Promise<void> {
    const client = await this.#client()
    const now = new Date().toISOString()
    const row = this.#toPhotoPatch(patch, now)
    const { error } = await client.from('album_photos').update(row).eq('id', id)
    if (error) throw new Error(this.#message(error, 'The photo could not be saved.'))
  }

  async reorderPhotos(_albumId: string, orderedIds: string[]): Promise<void> {
    const client = await this.#client()
    const now = new Date().toISOString()
    const updates = orderedIds.map((id, index) => ({ id, sort_order: index, updated_at: now }))
    const { error } = await client.from('album_photos').upsert(updates, { onConflict: 'id' })
    if (error) throw new Error(this.#message(error, 'The photo order could not be saved.'))
  }

  async deletePhotos(ids: string[]): Promise<void> {
    if (!ids.length) return
    const client = await this.#client()
    const { data, error: fetchError } = await client.from('album_photos').select('id, public_id').in('id', ids)
    if (fetchError) throw new Error(this.#message(fetchError, 'The photos could not be deleted.'))
    const prefixes = ((data as unknown as { public_id: string }[]) ?? []).filter(photo => photo.public_id).map(photo => photo.public_id)
    await this.removeStorage(prefixes).catch(() => { /* Storage leftovers are not fatal. */ })
    const { error } = await client.from('album_photos').delete().in('id', ids)
    if (error) throw new Error(this.#message(error, 'The photos could not be deleted.'))
  }

  async listPublishedAlbums(): Promise<Album[]> {
    const client = await this.#client()
    const { data, error } = await client.from('albums').select('*').eq('is_published', true).order('sort_order', { ascending: true }).order('created_at', { ascending: true })
    if (error) throw new Error(this.#message(error, 'Could not load the albums.'))
    return ((data as unknown as AlbumRow[]) ?? []).map(mapAlbumRow)
  }

  async countPublishedPhotos(albumIds: string[]): Promise<Record<string, number>> {
    return this.#countPhotos(albumIds, true)
  }

  async countPhotos(albumIds: string[]): Promise<Record<string, number>> {
    return this.#countPhotos(albumIds, false)
  }

  async #countPhotos(albumIds: string[], publishedOnly: boolean): Promise<Record<string, number>> {
    if (!albumIds.length) return {}
    const client = await this.#client()
    let query = client.from('album_photos').select('album_id')
    if (publishedOnly) query = query.eq('is_published', true)
    const { data, error } = await query.in('album_id', albumIds)
    if (error) throw new Error(this.#message(error, 'Could not count the photos.'))
    const counts: Record<string, number> = {}
    for (const row of (data as unknown as { album_id: string }[]) ?? []) counts[row.album_id] = (counts[row.album_id] ?? 0) + 1
    return counts
  }

  async getPublishedAlbumBySlug(slug: string): Promise<{ album: Album; photos: AlbumPhoto[] } | null> {
    const client = await this.#client()
    const { data: album, error } = await client.from('albums').select('*').eq('slug', slug).eq('is_published', true).maybeSingle()
    if (error) throw new Error(this.#message(error, 'Could not load the album.'))
    if (!album) return null
    const { data: photos, error: photoError } = await client.from('album_photos').select('*').eq('album_id', (album as AlbumRow).id).eq('is_published', true).order('sort_order', { ascending: true }).order('created_at', { ascending: true })
    if (photoError) throw new Error(this.#message(photoError, 'Could not load the album photos.'))
    return { album: mapAlbumRow(album as unknown as AlbumRow), photos: ((photos as unknown as AlbumPhotoRow[]) ?? []).map(mapAlbumPhotoRow) }
  }

  /** Removes every storage object belonging to the given prefixes of the `albums`
 *  bucket. A photo prefix is `<albumId>/<photoId>` (whose derived files live
 *  beside it as `<prefix>-{thumb,gallery,full}.webp`); an album prefix is the
 *  bare `<albumId>` folder and everything inside it. */
  async removeStorage(prefixes: string[]): Promise<void> {
    if (!prefixes.length) return
    const client = await this.#client()
    const names = new Set<string>()
    for (const prefix of prefixes) {
      for (const name of await this.#listFolder(client, prefix)) names.add(name)
      for (const size of ['thumb', 'gallery', 'full']) names.add(`${prefix}-${size}.webp`)
    }
    if (!names.size) return
    const { error } = await client.storage.from('albums').remove([...names])
    if (error && !String(error.message ?? '').toLowerCase().includes('not found')) throw new Error(this.#message(error, 'Some storage files could not be removed.'))
  }

  async #listFolder(client: SupabaseClient, folder: string): Promise<string[]> {
    const { data, error } = await client.storage.from('albums').list(folder, { limit: 1000 })
    if (error) return []
    const names: string[] = []
    for (const entry of data ?? []) {
      const full = folder ? `${folder}/${entry.name}` : entry.name
      if (entry.metadata === null || entry.id === null) names.push(...await this.#listFolder(client, full))
      else names.push(full)
    }
    return names
  }

  #contentToJson({ en, ta }: { en: string; ta: string }) {
    return { en, ta: ta || en }
  }

  #toAlbumRow(input: AlbumInput, created?: string, updated?: string) {
    const row: Record<string, unknown> = {
      title: this.#contentToJson(input.title),
      slug: input.slug.trim(),
      subtitle: this.#contentToJson(input.subtitle),
      description: this.#contentToJson(input.description),
      event_type: input.eventType,
      event_date: input.eventDate || null,
      location: input.location.trim(),
      cover_image: input.coverImage.trim(),
      layout_type: input.layoutType,
      theme: input.theme,
      is_published: input.isPublished,
      allow_download: input.allowDownload,
      sort_order: input.sortOrder,
    }
    if (created) row.created_at = created
    if (updated) row.updated_at = updated
    return row
  }

  #toPhotoRow(input: AlbumPhotoInput, now: string) {
    return {
      id: input.id ?? undefined,
      album_id: input.albumId,
      image_url: input.imageUrl.trim(),
      thumbnail_url: input.thumbnailUrl.trim(),
      full_url: input.fullUrl.trim(),
      public_id: input.publicId.trim(),
      alt_text: input.altText.trim(),
      title: this.#contentToJson(input.title),
      caption: this.#contentToJson(input.caption),
      story_text: this.#contentToJson(input.storyText),
      location: input.location.trim(),
      taken_at: input.takenAt || null,
      sort_order: input.sortOrder,
      orientation: input.orientation,
      featured: input.featured,
      is_published: input.isPublished,
      effect_type: input.effectType,
      overlay_image_url: input.overlayImageUrl.trim(),
      effect_config: input.effectConfig,
      focal_point_x: input.focalPointX,
      focal_point_y: input.focalPointY,
      created_at: now,
      updated_at: now,
    }
  }

  #toPhotoPatch(patch: Partial<AlbumPhotoInput>, now: string) {
    const row: Record<string, unknown> = { updated_at: now }
    if (patch.imageUrl !== undefined) row.image_url = patch.imageUrl.trim()
    if (patch.thumbnailUrl !== undefined) row.thumbnail_url = patch.thumbnailUrl.trim()
    if (patch.fullUrl !== undefined) row.full_url = patch.fullUrl.trim()
    if (patch.publicId !== undefined) row.public_id = patch.publicId.trim()
    if (patch.altText !== undefined) row.alt_text = patch.altText.trim()
    if (patch.title !== undefined) row.title = this.#contentToJson(patch.title)
    if (patch.caption !== undefined) row.caption = this.#contentToJson(patch.caption)
    if (patch.storyText !== undefined) row.story_text = this.#contentToJson(patch.storyText)
    if (patch.location !== undefined) row.location = patch.location.trim()
    if (patch.takenAt !== undefined) row.taken_at = patch.takenAt || null
    if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder
    if (patch.orientation !== undefined) row.orientation = patch.orientation
    if (patch.featured !== undefined) row.featured = patch.featured
    if (patch.isPublished !== undefined) row.is_published = patch.isPublished
    if (patch.effectType !== undefined) row.effect_type = patch.effectType
    if (patch.overlayImageUrl !== undefined) row.overlay_image_url = patch.overlayImageUrl.trim()
    if (patch.effectConfig !== undefined) row.effect_config = patch.effectConfig
    if (patch.focalPointX !== undefined) row.focal_point_x = patch.focalPointX
    if (patch.focalPointY !== undefined) row.focal_point_y = patch.focalPointY
    return row
  }

  #message(error: { message?: string; hint?: string }, fallback: string): string {
    const raw = error?.message ?? ''
    const friendly = raw.includes('does not exist') || raw.includes('column') || raw.includes('relation')
      ? 'The album tables are not set up yet. Run supabase/migrations/0001_albums.sql in the Supabase Dashboard SQL Editor, then try again.'
      : raw
    return friendly || fallback
  }
}

let repository: SupabaseAlbumRepository | null = null
export function albumRepository(): AlbumRepository {
  if (!repository) repository = new SupabaseAlbumRepository()
  return repository
}

/** Albums need the real Supabase account — no this-browser preview is possible,
 *  because the storage session (uploads) and the reader role both live there. */
export function albumsUnavailable(): boolean {
  return previewMode()
}