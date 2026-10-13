import assets from 'virtual:public-assets'

const files = new Set(assets)
export const hasAsset = (path: string) => files.has(path)
export const validUrl = (value: string) => {
  try { return ['https:', 'http:'].includes(new URL(value).protocol) } catch { return false }
}
export const configured = (value: string) => Boolean(value.trim()) && !value.includes('[')

export async function copyText(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(value); return true } catch { /* Try the selection-based fallback. */ }
  }
  const field = document.createElement('textarea')
  const previous = document.activeElement
  field.value = value
  field.style.cssText = 'position:fixed;left:-9999px;top:0;'
  document.body.appendChild(field)
  field.select()
  let copied = false
  try { copied = document.execCommand('copy') } catch { copied = false }
  field.remove()
  if (previous instanceof HTMLElement) previous.focus()
  return copied
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10000)
}
