import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, Check, Eye, EyeOff, ImagePlus, Pencil, RotateCcw, Star, Trash2, UploadCloud, X } from 'lucide-react'
import { albumRepository, albumsUnavailable } from '../services/albumRepository'
import { createDerivatives, newPhotoId, uploadAlbumSizes } from './albumUpload'
import { PhotoFrame } from '../albums/PhotoEffects'
import { useInvitation } from '../context/InvitationContext'
import { BLEND_MODES, PHOTO_EFFECTS, effectConfigDefaults, validatePhoto, type Album, type AlbumInput, type AlbumPhoto, type AlbumPhotoInput, type BlendMode, type EffectConfig, type PhotoEffect } from '../lib/albums'

const stop = (event: { stopPropagation: () => void }) => event.stopPropagation()
const toInput = (album: Album): AlbumInput => ({ title: album.title, slug: album.slug, subtitle: album.subtitle, description: album.description, eventType: album.eventType, eventDate: album.eventDate, location: album.location, coverImage: album.coverImage, layoutType: album.layoutType, theme: album.theme, isPublished: album.isPublished, allowDownload: album.allowDownload, sortOrder: album.sortOrder })
const effectLabel = (effect: PhotoEffect) => effect.replaceAll('-', ' ')

function SortablePhoto({ photo, isCover, selected, onSelect, onEdit, onCover, onPublish, onDelete }: {
  photo: AlbumPhoto
  isCover: boolean
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onCover: () => void
  onPublish: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id })
  return <div className={`admin-photo-tile ${isDragging ? 'dragging' : ''} ${photo.effectType !== 'none' ? 'has-effect' : ''}`} ref={setNodeRef} {...attributes} {...listeners}
    style={{ transform: CSS.Transform.toString(transform), transition }}>
    <img src={photo.thumbnailUrl} alt="" loading="lazy" draggable={false} />
    {isCover && <span className="admin-photo-cover">Cover</span>}
    <span className={`admin-photo-status ${photo.isPublished ? 'on' : ''}`} title={photo.isPublished ? 'Published' : 'Hidden'} />
    <span className="admin-photo-effect">{effectLabel(photo.effectType)}</span>
    <label className="admin-photo-select" onPointerDown={stop} onClick={stop}><input type="checkbox" checked={selected} onChange={onSelect} aria-label="Select photo" /></label>
    <div className="admin-photo-actions" onPointerDown={stop} onClick={stop}>
      <button type="button" aria-label={photo.isPublished ? 'Hide photo' : 'Publish photo'} onClick={onPublish}>{photo.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}</button>
      <button type="button" aria-label="Use as cover" className={isCover ? 'active' : ''} onClick={onCover}><Star size={14} /></button>
      <button type="button" aria-label="Edit photo" onClick={onEdit}><Pencil size={14} /></button>
      <button type="button" className="danger" aria-label="Delete photo" onClick={onDelete}><Trash2 size={14} /></button>
    </div>
  </div>
}

interface Uploading { done: number; total: number; fileName: string; fraction: number }

export default function AlbumPhotoPage({ albumId }: { albumId: string }) {
  const { notify } = useInvitation()
  const [album, setAlbum] = useState<Album | null>(null)
  const [photos, setPhotos] = useState<AlbumPhoto[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [uploading, setUploading] = useState<Uploading | null>(null)
  const [editing, setEditing] = useState<AlbumPhoto | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const aborter = useRef<AbortController | null>(null)
  const unavailable = albumsUnavailable()

  const reload = () => {
    aborter.current?.abort()
    setPhotos([])
    albumRepository().getAlbum(albumId).then(found => {
      if (!found) { setStatus('missing'); return }
      setAlbum(found)
      return albumRepository().listAlbumPhotos(albumId).then(list => { setPhotos([...list].sort((a, b) => a.sortOrder - b.sortOrder)); setStatus('ready') })
    }).catch(() => setStatus('error'))
  }
  useEffect(reload, [albumId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const photoIds = useMemo(() => photos.map(photo => photo.id), [photos])

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    setPhotos(current => {
      const from = current.findIndex(photo => photo.id === active.id)
      const to = current.findIndex(photo => photo.id === over.id)
      if (from < 0 || to < 0) return current
      const next = arrayMove(current, from, to)
      albumRepository().reorderPhotos(albumId, next.map(photo => photo.id)).catch(() => { notify('Could not save the new order.'); reload() })
      return next
    })
  }

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    event.target.value = ''
    if (!files?.length || !album) return
    aborter.current?.abort()
    const controller = new AbortController()
    aborter.current = controller
    const list = Array.from(files)
    const signal = controller.signal
    setUploading({ done: 0, total: list.length, fileName: list[0]?.name ?? '', fraction: 0 })
    const inputs: AlbumPhotoInput[] = []
    let firstError: Error | null = null
    let base = photos.length ? Math.max(...photos.map(photo => photo.sortOrder)) + 1 : 0
    for (let index = 0; index < list.length; index += 1) {
      if (signal.aborted) break
      const file = list[index]
      try {
        setUploading(current => current && { ...current, fileName: file.name })
        const sizes = await createDerivatives(file)
        const photoId = newPhotoId()
        const uploaded = await uploadAlbumSizes({ albumId, photoId, sizes, signal, onProgress: fraction => setUploading(current => current && { ...current, fraction }) })
        inputs.push({
          albumId, id: photoId, imageUrl: uploaded.imageUrl, thumbnailUrl: uploaded.thumbnailUrl, fullUrl: uploaded.fullUrl, publicId: uploaded.publicId,
          altText: '', title: { en: '', ta: '' }, caption: { en: '', ta: '' }, storyText: { en: '', ta: '' }, location: '', takenAt: null,
          sortOrder: base + index, orientation: sizes.orientation, featured: false, isPublished: true, effectType: 'none', overlayImageUrl: '',
          effectConfig: effectConfigDefaults(), focalPointX: 50, focalPointY: 50,
        })
        setUploading(current => current && { ...current, done: current.done + 1, fraction: 0 })
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === 'AbortError') break
        firstError ??= cause instanceof Error ? cause : new Error('The upload failed.')
      }
    }
    aborter.current = null
    setUploading(null)
    if (signal.aborted) notify('Upload cancelled — finished photos were kept.')
    else if (inputs.length) {
      try { await albumRepository().createPhotos(inputs); notify(`Added ${inputs.length} photo${inputs.length === 1 ? '' : 's'}.`); reload() }
      catch (cause) { notify(cause instanceof Error ? cause.message : 'Could not record the photos.') }
    } else if (firstError) notify(firstError.message)
  }

  const cancelUpload = () => aborter.current?.abort()

  const patchPhoto = (id: string, patch: Partial<AlbumPhotoInput>) => {
    setPhotos(current => current.map(photo => (photo.id === id ? { ...photo, ...patch } : photo)))
  }

  const setCover = async (photo: AlbumPhoto) => {
    if (!album) return
    const next = { ...album, coverImage: photo.imageUrl }
    setAlbum(next)
    try { await albumRepository().updateAlbum(albumId, toInput(next)); notify('Cover photo set.') }
    catch (cause) { setAlbum(album); notify(cause instanceof Error ? cause.message : 'Could not set the cover.') }
  }

  const togglePublished = async (photo: AlbumPhoto) => {
    patchPhoto(photo.id, { isPublished: !photo.isPublished })
    try { await albumRepository().updatePhoto(photo.id, { isPublished: !photo.isPublished }) }
    catch (cause) { patchPhoto(photo.id, { isPublished: photo.isPublished }); notify(cause instanceof Error ? cause.message : 'Could not update the photo.') }
  }

  const deletePhotos = async (targets: AlbumPhoto[]) => {
    if (!album) return
    const query = window.confirm(targets.length === 1 ? 'Delete this photo? This also removes its stored copies.' : `Delete these ${targets.length} photos? This also removes their stored copies.`)
    if (!query) return
    setBusy(true)
    try {
      await albumRepository().deletePhotos(targets.map(photo => photo.id))
      const coverPhoto = targets.find(photo => photo.imageUrl === album.coverImage)
      if (coverPhoto) {
        const next = { ...album, coverImage: '' }
        setAlbum(next)
        try { await albumRepository().updateAlbum(albumId, toInput(next)) } catch { /* cover stays stale but harmless */ }
      }
      setSelected(new Set())
      if (editing && targets.some(photo => photo.id === editing.id)) setEditing(null)
      notify(targets.length === 1 ? 'Photo deleted.' : `${targets.length} photos deleted.`)
      reload()
    } catch (cause) { notify(cause instanceof Error ? cause.message : 'Could not delete the photos.') }
    finally { setBusy(false) }
  }

  const toggleSelect = (id: string) => setSelected(current => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const applyBulk = async (action: 'publish' | 'hide' | 'delete') => {
    const targets = photos.filter(photo => selected.has(photo.id))
    if (!targets.length) return
    if (action === 'delete') { void deletePhotos(targets); return }
    const value = action === 'publish'
    setBusy(true)
    try {
      for (const photo of targets) { patchPhoto(photo.id, { isPublished: value }); await albumRepository().updatePhoto(photo.id, { isPublished: value }) }
      notify(targets.length === 1 ? 'Photo updated.' : `${targets.length} photos updated.`)
      setSelected(new Set())
    } catch (cause) { notify(cause instanceof Error ? cause.message : 'Could not update the photos.'); reload() }
    finally { setBusy(false) }
  }

  if (unavailable) return <main className="admin-main"><header className="admin-pagehead"><h2>Album photos</h2><p className="admin-note">Albums need the Supabase connection. Lock the editor and sign in with the admin account to manage photographs.</p></header></main>
  if (status === 'loading') return <main className="admin-main"><p className="admin-loading">Loading album…</p></main>
  if (status === 'missing' || status === 'error') return <main className="admin-main"><header className="admin-pagehead"><h2>Album unavailable</h2></header><p className="admin-note">{status === 'missing' ? 'This album may have been deleted.' : 'Could not reach the album data.'}</p><button type="button" className="admin-button soft" onClick={() => { window.location.hash = '#admin/albums' }}><ArrowLeft size={14} />Back to albums</button></main>
  if (!album) return null

  const selectedList = photos.filter(photo => selected.has(photo.id))
  const barFraction = uploading ? Math.min(1, (uploading.done + uploading.fraction) / Math.max(1, uploading.total)) : 0

  return <main className="admin-main">
    <header className="admin-pagehead">
      <a className="admin-back-link" href="#admin/albums" onClick={event => { event.preventDefault(); window.location.hash = '#admin/albums' }}><ArrowLeft size={14} />Albums</a>
      <h2>{album.title.en}</h2>
      <p className="admin-note">Drag the tiles to order the story. Every change saves straight to your album.</p>
    </header>

    <label className="admin-uploadzone" onPointerDown={event => { if (uploading || busy) event.preventDefault() }}>
      <UploadCloud size={22} />
      <span>{uploading ? 'Uploading…' : `Drop photographs here, or click to choose — ${photos.length} photo${photos.length === 1 ? '' : 's'} so far.`}</span>
      <em>Large files are resized to three WebP sizes automatically.</em>
      {!uploading && <input type="file" accept="image/*" multiple onChange={handleFiles} disabled={busy} />}
      {uploading && <div className="admin-uploadbar"><div className="admin-uploadbar-fill" style={{ width: `${barFraction * 100}%` }} /><span>{uploading.fileName} · {uploading.done}/{uploading.total}</span><button type="button" className="admin-icon" onClick={cancelUpload} aria-label="Cancel upload"><X size={15} /></button></div>}
    </label>

    {selectedList.length > 0 && <div className="admin-bulkbar">
      <span>{selectedList.length} selected</span>
      <button type="button" className="admin-button ghost" onClick={() => void applyBulk('publish')}><Check size={13} />Publish</button>
      <button type="button" className="admin-button ghost" onClick={() => void applyBulk('hide')}><EyeOff size={13} />Hide</button>
      <button type="button" className="admin-button ghost" onClick={() => void applyBulk('delete')}><Trash2 size={13} />Delete…</button>
      <button type="button" className="admin-button ghost" onClick={() => setSelected(new Set())}>Clear</button>
    </div>}

    {photos.length === 0
      ? <div className="admin-album-empty"><ImagePlus size={26} /><p>This album has no photographs yet. Drop a few in above — the story builds itself.</p><a className="admin-button soft" href={`#admin/albums/${albumId}/preview`}>Preview the album</a></div>
      : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={photoIds} strategy={rectSortingStrategy}>
          <div className="admin-photo-grid">
            {photos.map(photo => <SortablePhoto key={photo.id} photo={photo} isCover={photo.imageUrl === album.coverImage} selected={selected.has(photo.id)} onSelect={() => toggleSelect(photo.id)} onEdit={() => setEditing(photo)} onCover={() => void setCover(photo)} onPublish={() => void togglePublished(photo)} onDelete={() => void deletePhotos([photo])} />)}
          </div>
        </SortableContext>
      </DndContext>}

    {editing && <PhotoInspector photo={editing} key={editing.id} photos={photos} isCover={editing.imageUrl === album.coverImage} onClose={() => setEditing(null)} onDelete={() => { setEditing(null); void deletePhotos([editing]) }} onCover={() => { setEditing(null); void setCover(editing) }} onSaved={saved => { patchPhoto(editing.id, saved); setEditing({ ...editing, ...saved }) }} notify={notify} />}
  </main>
}

function PhotoInspector({ photo, photos, isCover, onClose, onDelete, onCover, onSaved, notify }: {
  photo: AlbumPhoto
  photos: AlbumPhoto[]
  isCover: boolean
  onClose: () => void
  onDelete: () => void
  onCover: () => void
  onSaved: (patch: Partial<AlbumPhotoInput>) => void
  notify: (message: string) => void
}) {
  const [effect, setEffect] = useState<PhotoEffect>(photo.effectType)
  const [config, setConfig] = useState<EffectConfig>(photo.effectConfig)
  const [overlay, setOverlay] = useState(photo.overlayImageUrl)
  const [caption, setCaption] = useState({ en: photo.caption.en, ta: photo.caption.ta || photo.caption.en })
  const [alt, setAlt] = useState(photo.altText)
  const [published, setPublished] = useState(photo.isPublished)
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const overlayOptions = photos.filter(item => item.id !== photo.id)
  const previewPhoto: AlbumPhoto = { ...photo, effectType: effect, effectConfig: config, overlayImageUrl: overlay, caption }

  const setConfigField = <K extends keyof EffectConfig>(key: K, value: EffectConfig[K]) => setConfig(current => ({ ...current, [key]: value }))

  const save = async (event: FormEvent) => {
    event.preventDefault()
    const validation = validatePhoto({ ...photo, effectType: effect, effectConfig: config, overlayImageUrl: overlay, caption, altText: alt }, effect)
    setErrors(validation)
    if (validation.length) return
    setSaving(true)
    const patch: Partial<AlbumPhotoInput> = { effectType: effect, effectConfig: config, overlayImageUrl: overlay, caption, altText: alt, isPublished: published }
    try { await albumRepository().updatePhoto(photo.id, patch); notify('Photo updated.'); onSaved(patch) }
    catch (cause) { notify(cause instanceof Error ? cause.message : 'Could not save the photo.') }
    finally { setSaving(false) }
  }

  return <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Edit photo">
    <form className="admin-modal-card admin-inspector" onSubmit={save} onPointerDown={stop}>
      <header className="admin-modal-head"><h3>Edit photo</h3><button type="button" className="admin-icon" onClick={onClose} aria-label="Close editor"><X size={18} /></button></header>
      <div className="admin-inspector-layout">
        <div className="admin-effect-preview" aria-hidden="true"><PhotoFrame photo={previewPhoto} label="Photo preview" /></div>
        <div className="admin-inspector-fields">
          <label className="admin-field"><span>Effect</span><select value={effect} onChange={event => { setEffect(event.target.value as PhotoEffect); setConfig(effectConfigDefaults()) }}>{PHOTO_EFFECTS.map(item => <option key={item} value={item}>{effectLabel(item)}</option>)}</select></label>

          {effect === 'double-exposure' && <>
            <label className="admin-field"><span>Overlay photo</span><select value={overlay} onChange={event => setOverlay(event.target.value)}>
              <option value="">Choose an overlay photo…</option>{overlayOptions.map(item => <option key={item.id} value={item.imageUrl}>{item.caption.en || item.altText || 'Photo in this album'}</option>)}
            </select>{effect === 'double-exposure' && !overlay && <span className="admin-note">Pick another photo from this album to combine with this one.</span>}</label>
            <label className="admin-field"><span>Blend</span><select value={config.blend} onChange={event => setConfigField('blend', event.target.value as BlendMode)}>{BLEND_MODES.map(blend => <option key={blend} value={blend}>{blend}</option>)}</select></label>
            <label className="admin-field"><span>Offset X · {config.x}%</span><input type="range" min={-50} max={50} step={1} value={config.x} onChange={event => setConfigField('x', Number(event.target.value))} /></label>
            <label className="admin-field"><span>Offset Y · {config.y}%</span><input type="range" min={-50} max={50} step={1} value={config.y} onChange={event => setConfigField('y', Number(event.target.value))} /></label>
            <label className="admin-field"><span>Overlay opacity · {Math.round(config.opacity * 100)}%</span><input type="range" min={0} max={100} step={1} value={Math.round(config.opacity * 100)} onChange={event => setConfigField('opacity', Number(event.target.value) / 100)} /></label>
            <label className="admin-field"><span>Gradient · {config.gradientDeg}°</span><input type="range" min={0} max={360} step={1} value={config.gradientDeg} onChange={event => setConfigField('gradientDeg', Number(event.target.value))} /></label>
            <label className="admin-album-check"><input type="checkbox" checked={config.grain} onChange={event => setConfigField('grain', event.target.checked)} /><span>Add film grain</span></label>
          </>}

          {effect === 'parallax-depth' && <p className="admin-note">The photo drifts gently as the visitor scrolls — nothing to configure.</p>}
          {(effect === 'cinematic' || effect === 'black-and-white' || effect === 'sepia-memory' || effect === 'gold-glow' || effect === 'soft-bloom' || effect === 'film-grain' || effect === 'polaroid' || effect === 'vintage-film' || effect === 'none') && <p className="admin-note">{effect === 'none' ? 'A clean, untouched frame.' : `${effectLabel(effect)} is applied by the album's CSS — the live preview updates above.`}</p>}

          <label className="admin-field"><span>Caption · English</span><input value={caption.en} onChange={event => setCaption(current => ({ ...current, en: event.target.value }))} placeholder="The school friend who never stopped laughing" /></label>
          <label className="admin-field"><span>Caption · தமிழ் <em>(optional)</em></span><input value={caption.ta === caption.en ? '' : caption.ta} onChange={event => setCaption(current => ({ ...current, ta: event.target.value }))} placeholder="பள்ளி நண்பன், சிரிப்பு நிற்கவே இல்லை" /></label>
          <label className="admin-field"><span>Alt text</span><input value={alt} onChange={event => setAlt(event.target.value)} placeholder="For screen readers (the caption is used when empty)" /></label>

          <label className="admin-album-check"><input type="checkbox" checked={published} onChange={event => setPublished(event.target.checked)} /><span>{published ? 'Visible to visitors' : 'Hidden from visitors'}</span></label>

          {errors.length > 0 && <p className="admin-error">{errors[0]}</p>}
        </div>
      </div>
      <footer className="admin-modal-foot">
        <div className="admin-modal-actions">
          <button type="button" className="admin-button ghost" onClick={onDelete}><Trash2 size={14} />Delete…</button>
          <button type="button" className={`admin-button ghost ${isCover ? '' : 'hollow'}`} onClick={onCover}>{isCover ? <Check size={14} /> : <Star size={14} />}{isCover ? 'Cover photo' : 'Use as cover'}</button>
        </div>
        <div className="admin-modal-actions">
          <button type="button" className="admin-button ghost" onClick={onClose}>Close</button>
          <button type="button" className="admin-button ghost" onClick={() => { setEffect(photo.effectType); setConfig(photo.effectConfig); setOverlay(photo.overlayImageUrl); setPublished(photo.isPublished) }}><RotateCcw size={13} />Reset</button>
          <button type="submit" className="admin-button primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </footer>
    </form>
  </div>
}