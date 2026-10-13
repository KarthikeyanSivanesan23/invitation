import { previewMode, supabaseClient, supabaseConfigured } from '../services/contentRepository'

export type PhotoBucket = 'couple' | 'gallery'

/** Turns a cropped photo into a permanent, publicly-viewable URL. Uploads to
 *  Supabase Storage when connected and NOT in this-browser preview mode;
 *  otherwise embeds the image as a data URL so the editor still previews
 *  correctly (storage writes require a signed-in admin, which preview skips). */
export async function resolvePhoto(bucket: PhotoBucket, blob: Blob): Promise<string> {
  if (supabaseConfigured && !previewMode()) {
    const client = await supabaseClient()
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
    const { error } = await client.storage.from(bucket).upload(name, blob, { contentType: blob.type || 'image/jpeg', upsert: false })
    if (error) throw new Error('The photo could not be uploaded. Make sure you are unlocked and connected to Supabase.')
    return client.storage.from(bucket).getPublicUrl(name).data.publicUrl
  }
  return blobToDataUrl(blob)
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Could not read the image file.'))
    reader.readAsDataURL(blob)
  })
}