import type { CSSProperties } from 'react'
import type { AlbumPhoto } from '../lib/albums'
import './photoEffects.css'

const sizesFor = (orientation: string) => (orientation === 'portrait' ? '60vw' : '100vw')

/** The animated/static layers that give each photo its effect. The frame fills
 *  its positioned parent; the effect lives in CSS (photoEffects.css) so the
 *  admin's live editor preview and the public story always match. */
export function PhotoFrame({ photo, eager = false, className = '', onClick, label }: {
  photo: AlbumPhoto
  eager?: boolean
  className?: string
  onClick?: () => void
  label: string
}) {
  const parallaxClass = photo.effectType === 'parallax-depth' ? 'ph-parallax-ok' : ''
  const base = <span className="ph-base"><img className={parallaxClass} src={photo.imageUrl} srcSet={`${photo.thumbnailUrl} 480w, ${photo.imageUrl} 1400w, ${photo.fullUrl} 2400w`} sizes={sizesFor(photo.orientation)} alt={photo.altText || label} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => { /* graceful blank frame */ }} /></span>
  const common: CSSProperties = {
    '--dex-x': `${photo.effectConfig.x}%`,
    '--dex-y': `${photo.effectConfig.y}%`,
    '--dex-grade': `${photo.effectConfig.gradientDeg}deg`,
  } as CSSProperties
  return <button type="button" className={`story-photo effect-${photo.effectType} ${className}`.trim()} style={common} onClick={onClick} aria-label={label}>
    {base}
    {photo.effectType === 'double-exposure' && photo.overlayImageUrl && <>
      <span className="ph-dex-wrap" aria-hidden="true"><img className="ph-dex-img" src={photo.overlayImageUrl} alt="" style={{ mixBlendMode: photo.effectConfig.blend }} loading="lazy" decoding="async" /></span>
      <span className="ph-dex-grade" aria-hidden="true" />
    </>}
    {photo.effectType === 'gold-glow' && <span className="ph-glow" aria-hidden="true" />}
    {photo.effectType === 'soft-bloom' && <span className="ph-bloom" aria-hidden="true" />}
    {(photo.effectType === 'cinematic' || photo.effectType === 'vintage-film') && <span className="ph-vignette" aria-hidden="true" />}
    {(photo.effectType === 'film-grain' || photo.effectType === 'vintage-film' || (photo.effectType === 'double-exposure' && photo.effectConfig.grain)) && <span className="ph-grain" aria-hidden="true" />}
  </button>
}

/** Plain non-interactive frame used where clicking isn't needed (hero covers). */
export function PhotoBackdrop({ photo, className = '', eager = false, alt = '' }: { photo: AlbumPhoto; className?: string; eager?: boolean; alt?: string }) {
  const common: CSSProperties = {
    '--dex-x': `${photo.effectConfig.x}%`,
    '--dex-y': `${photo.effectConfig.y}%`,
    '--dex-grade': `${photo.effectConfig.gradientDeg}deg`,
  } as CSSProperties
  return <div className={`story-photo effect-${photo.effectType} ${className}`.trim()} style={common} aria-hidden="true">
    <img className="ph-backdrop-img" src={photo.imageUrl} srcSet={`${photo.thumbnailUrl} 480w, ${photo.imageUrl} 1400w, ${photo.fullUrl} 2400w`} sizes="100vw" alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
    {photo.effectType === 'double-exposure' && photo.overlayImageUrl && <><img className="ph-backdrop-dex" src={photo.overlayImageUrl} alt="" style={{ mixBlendMode: photo.effectConfig.blend }} loading="lazy" decoding="async" /></>}
  </div>
}

/** When a photo has no uploaded copy the story falls back to this quiet frame. */
export function MissingPhotoFrame({ label }: { label: string }) {
  return <div className="story-photo story-photo-missing"><span>✦</span><p>{label}</p></div>
}