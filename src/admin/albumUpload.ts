import { supabaseAnonKey, supabaseClient, supabaseEndpointUrl } from '../services/contentRepository'
import type { PhotoOrientation } from '../lib/albums'

export interface DeriveResult {
  thumbnail: Blob
  gallery: Blob
  full: Blob
  width: number
  height: number
  /** Stored as-is; a valid uuid photo key is required to be available here. */
  orientation: PhotoOrientation
}

const DERIVE_FULL = 2400
const DERIVE_GALLERY = 1400
const DERIVE_THUMB = 480

export function loadImageSource(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => { URL.revokeObjectURL(url); resolve(image) }
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as an image.')) }
    image.src = url
  })
}

function canvasFrom(source: HTMLImageElement | HTMLCanvasElement, max: number): HTMLCanvasElement {
  const width = 'naturalWidth' in source ? source.naturalWidth : source.width
  const height = 'naturalHeight' in source ? source.naturalHeight : source.height
  const scale = Math.min(1, max / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  canvas.getContext('2d')!.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

function encodeCanvas(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('The image could not be encoded.'))), 'image/webp', quality)
  })
}

/** Decodes a chosen file once and produces the three responsive sizes used by the
 *  album (thumb / gallery / full). EXIF orientation is applied by the browser. */
export async function createDerivatives(file: File): Promise<DeriveResult> {
  if (!file.type.startsWith('image/')) throw new Error('Only image files can be added to an album.')
  const source = await loadImageSource(file)
  const width = source.naturalWidth
  const height = source.naturalHeight
  if (!width || !height) throw new Error('That image has no readable dimensions.')
  const base = canvasFrom(source, DERIVE_FULL)
  const ratio = width / height
  const orientation: PhotoOrientation = ratio >= 1.2 ? 'landscape' : ratio <= 0.83 ? 'portrait' : 'square'
  return {
    full: await encodeCanvas(base, 0.9),
    gallery: await encodeCanvas(canvasFrom(base, DERIVE_GALLERY), 0.82),
    thumbnail: await encodeCanvas(canvasFrom(base, DERIVE_THUMB), 0.72),
    width,
    height,
    orientation,
  }
}

export interface UploadedSizes {
  thumbnailUrl: string
  imageUrl: string
  fullUrl: string
  publicId: string
}

/** Uploads the three derivatives with real byte progress via XHR, retrying
 *  transient failures and honouring cancellation through the AbortSignal. */
export async function uploadAlbumSizes(options: {
  albumId: string
  photoId: string
  sizes: DeriveResult
  signal: AbortSignal
  onProgress?: (fraction: number) => void
}): Promise<UploadedSizes> {
  const { albumId, photoId, sizes, signal, onProgress } = options
  const publicId = `${albumId}/${photoId}`
  const [thumbnailUrl, imageUrl, fullUrl] = await Promise.all([
    uploadWithRetry({ path: `${publicId}-thumb.webp`, blob: sizes.thumbnail, signal, onProgress: fraction => onProgress?.(fraction / 3) }),
    uploadWithRetry({ path: `${publicId}-gallery.webp`, blob: sizes.gallery, signal, onProgress: fraction => onProgress?.((1 + fraction) / 3) }),
    uploadWithRetry({ path: `${publicId}-full.webp`, blob: sizes.full, signal, onProgress: fraction => onProgress?.((2 + fraction) / 3) }),
  ])
  return { thumbnailUrl, imageUrl, fullUrl, publicId }
}

async function uploadWithRetry(options: { path: string; blob: Blob; signal: AbortSignal; onProgress?: (fraction: number) => void }, attempts = 4): Promise<string> {
  let last: unknown
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await xhrUpload(options)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      last = error
      if (attempt < attempts - 1) await new Promise(resolve => setTimeout(resolve, 700 * 2 ** attempt))
    }
  }
  throw last instanceof Error ? last : new Error('The photo could not be uploaded.')
}

function xhrUpload(options: { path: string; blob: Blob; signal: AbortSignal; onProgress?: (fraction: number) => void }): Promise<string> {
  return supabaseClient().then(async client => {
    const { data } = await client.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error('Your admin session expired. Lock the editor and sign in again.')
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const abort = () => xhr.abort()
      options.signal.addEventListener('abort', abort, { once: true })
      xhr.open('POST', `${supabaseEndpointUrl}/storage/v1/object/albums/${options.path}`)
      xhr.setRequestHeader('apikey', supabaseAnonKey)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.setRequestHeader('x-upsert', 'true')
      xhr.setRequestHeader('Content-Type', options.blob.type || 'image/webp')
      if (xhr.upload) xhr.upload.onprogress = event => { if (event.lengthComputable) options.onProgress?.(event.loaded / event.total) }
      xhr.onload = () => {
        options.signal.removeEventListener('abort', abort)
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(`${supabaseEndpointUrl}/storage/v1/object/public/albums/${options.path}`)
          return
        }
        let message = `Upload failed (HTTP ${xhr.status}).`
        try { const parsed = JSON.parse(xhr.responseText); if (typeof parsed?.message === 'string') message = parsed.message } catch { /* keep generic message */ }
        reject(new Error(message))
      }
      xhr.onerror = () => { options.signal.removeEventListener('abort', abort); reject(new Error('The upload stopped because of a network error.')) }
      xhr.onabort = () => { options.signal.removeEventListener('abort', abort); reject(new DOMException('Upload cancelled.', 'AbortError')) }
      xhr.send(options.blob)
    })
  })
}

export function newPhotoId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  // Valid v4 fallback for non-secure contexts where randomUUID may be absent.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const random = Math.random() * 16 | 0
    const value = character === 'x' ? random : (random & 0x3 | 0x8)
    return value.toString(16)
  })
}