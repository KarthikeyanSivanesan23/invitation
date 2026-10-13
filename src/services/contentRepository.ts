import type { SupabaseClient } from '@supabase/supabase-js'
import { isGalleryItem, isOverrides, type ContentOverrides, type GalleryItem, type LiveContent } from '../lib/content'

/** Small storage wrapper: prefers localStorage, falls back to an in-memory map
 *  (keeps unit tests and strict private modes working). */
const memory = new Map<string, string>()
const canLocal = typeof window !== 'undefined'
const store = {
  get(key: string): string | null {
    if (canLocal) { try { return window.localStorage.getItem(key) } catch { /* fall through to memory */ } }
    return memory.get(key) ?? null
  },
  set(key: string, value: string) {
    if (canLocal) { try { window.localStorage.setItem(key, value); return } catch { /* keep a same-tab copy */ } }
    memory.set(key, value)
  },
}

const readJson = (key: string): unknown => {
  const raw = store.get(key)
  if (!raw) return null
  try { return JSON.parse(raw) as unknown } catch { return null }
}

export interface ContentRepository {
  /** Whether saves go to the cloud (published for everyone) or just this browser. */
  readonly online: boolean
  listOverrides(): Promise<ContentOverrides | null>
  saveOverrides(value: ContentOverrides): Promise<void>
}

const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {}
const SUPABASE_URL = (viteEnv.VITE_SUPABASE_URL ?? '').trim()
const SUPABASE_ANON = (viteEnv.VITE_SUPABASE_ANON_KEY ?? '').trim()
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON)
/** Public endpoint used by raw uploads (XHR progress) and storage references. */
export const supabaseEndpointUrl = SUPABASE_URL
/** Public publishable key used for raw storage requests. */
export const supabaseAnonKey = SUPABASE_ANON

const OVERRIDE_KEY = 'wedding-content-v1'
const DRAFT_KEY = 'wedding-admin-draft-v1'

const localStorageContentRepository: ContentRepository = {
  online: false,
  async listOverrides() { const value = readJson(OVERRIDE_KEY); return isOverrides(value) ? value : null },
  async saveOverrides(value) { store.set(OVERRIDE_KEY, JSON.stringify(value)) },
}

class SupabaseContentRepository implements ContentRepository {
  online = true
  #key() { return 'invitation-v1' }

  async listOverrides() {
    const client = await supabaseClient()
    const { data, error } = await client.from('content_overrides').select('value').eq('key', this.#key()).maybeSingle()
    if (error) throw error
    const value = data?.value
    return isOverrides(value) ? value : null
  }

  async saveOverrides(value: ContentOverrides) {
    const client = await supabaseClient()
    const { error } = await client
      .from('content_overrides')
      .upsert({ key: this.#key(), value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) throw error
  }
}

// supabase-js is loaded lazily so it never appears in the visitor bundle.
let clientPromise: Promise<SupabaseClient> | null = null
export function supabaseClient(): Promise<SupabaseClient> {
  if (!supabaseConfigured) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and run `npm run admin:setup`.')
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON))
  }
  return clientPromise
}

// Browser-only preview: when the admin opts into "this-browser preview mode"
// even a cloud build stores drafts and renders them locally, and visitors on
// the same device see the preview instead of the published cloud content.
const OFFLINE_FLAG = 'wedding-admin-offline'
export function previewMode(): boolean {
  if (!supabaseConfigured) return true
  return store.get(OFFLINE_FLAG) === '1'
}
export function setPreviewMode() { store.set(OFFLINE_FLAG, '1') }
export function clearPreviewMode() { store.set(OFFLINE_FLAG, '') }

// Local (browser-only) unlock flag for the editor gate.
const UNLOCK_FLAG = 'wedding-admin-unlock'
export function previewUnlocked() { return store.get(UNLOCK_FLAG) === '1' }
export function setPreviewUnlock() { store.set(UNLOCK_FLAG, '1') }
export function clearPreviewUnlock() { store.set(UNLOCK_FLAG, '') }

/** Picks the cloud adapter when configured, otherwise a browser-only one. */
export function contentRepository(): ContentRepository {
  return previewMode() ? localStorageContentRepository : new SupabaseContentRepository()
}

/** Draft helpers: the editor autosaves to this browser so nothing is lost on refresh. */
const isLiveContent = (value: unknown): value is LiveContent => {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.groomPortrait === 'string' && typeof record.bridePortrait === 'string' && Array.isArray(record.gallery) && record.gallery.every(isGalleryItem)
}

export function loadDraft(): LiveContent | null { const value = readJson(DRAFT_KEY); return isLiveContent(value) ? value : null }
export function saveDraft(value: LiveContent) { store.set(DRAFT_KEY, JSON.stringify(value)) }
export function clearDraft() { store.set(DRAFT_KEY, '') }

export function newGalleryItem(src: string, caption: { en: string; ta: string }, _index: number): GalleryItem {
  return { id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`, src, caption, motif: 'arch', color: '' }
}