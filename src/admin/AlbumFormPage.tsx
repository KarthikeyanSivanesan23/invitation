import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Wand2 } from 'lucide-react'
import { albumRepository } from '../services/albumRepository'
import { useInvitation } from '../context/InvitationContext'
import { ALBUM_LAYOUTS, ALBUM_THEMES, EVENT_TYPES, slugify, validateAlbum, type Album, type AlbumInput, type AlbumLayout, type AlbumTheme, type EventType } from '../lib/albums'

const emptyInput = (): AlbumInput => ({
  title: { en: '', ta: '' }, slug: '', subtitle: { en: '', ta: '' }, description: { en: '', ta: '' },
  eventType: 'custom', eventDate: null, location: '', coverImage: '', layoutType: 'cinematic-story', theme: 'royal-maroon-gold',
  isPublished: false, allowDownload: true, sortOrder: 0,
})

const themeLabel: Record<AlbumTheme, string> = { 'royal-maroon-gold': 'Royal maroon & gold', 'ivory-champagne': 'Ivory & champagne', 'emerald-temple': 'Emerald temple', 'rose-blush': 'Rose blush', 'midnight-luxury': 'Midnight luxury' }
const layoutLabel: Record<AlbumLayout, string> = { 'cinematic-story': 'Cinematic story', '3d-photo-book': '3D photo book', 'editorial-grid': 'Editorial grid', 'masonry-gallery': 'Masonry gallery', 'horizontal-filmstrip': 'Horizontal film strip', 'double-exposure-story': 'Double exposure story' }

export default function AlbumFormPage({ albumId }: { albumId?: string }) {
  const editing = Boolean(albumId)
  const { notify } = useInvitation()
  const [album, setAlbum] = useState<Album | null>(null)
  const [form, setForm] = useState<AlbumInput>(emptyInput())
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>(editing ? 'loading' : 'ready')
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const draft = useRef<AlbumInput | null>(null)

  useEffect(() => {
    if (!albumId) { draft.current = emptyInput(); return }
    let cancelled = false
    albumRepository().getAlbum(albumId).then(result => {
      if (cancelled) return
      if (!result) { setStatus('missing'); return }
      setAlbum(result)
      setForm({
        title: result.title, slug: result.slug, subtitle: result.subtitle, description: result.description,
        eventType: result.eventType, eventDate: result.eventDate, location: result.location, coverImage: result.coverImage,
        layoutType: result.layoutType, theme: result.theme, isPublished: result.isPublished, allowDownload: result.allowDownload, sortOrder: result.sortOrder,
      })
      draft.current = result
      setStatus('ready')
    }).catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true }
  }, [albumId])

  const dirty = useMemo(() => {
    if (editing) return Boolean(album && JSON.stringify(album) !== JSON.stringify(form))
    return JSON.stringify(emptyInput()) !== JSON.stringify(form)
  }, [album, form, editing])

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault() }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [dirty])

  const set = <K extends keyof AlbumInput>(key: K, value: AlbumInput[K]) => setForm(current => ({ ...current, [key]: value }))

  const regenerateSlug = () => set('slug', slugify(form.title.en) || form.slug)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const validation = validateAlbum(form)
    setErrors(validation)
    if (validation.length) return
    setBusy(true)
    try {
      const repo = albumRepository()
      let saved: Album
      if (editing && albumId) saved = await repo.updateAlbum(albumId, form)
      else saved = await repo.createAlbum(form)
      notify(editing ? 'Album settings saved.' : 'Album created — now add its photos.')
      if (!editing) window.location.hash = `#admin/albums/${saved.id}/photos`
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Could not save the album.')
    } finally { setBusy(false) }
  }

  if (status === 'loading') return <main className="admin-main"><p className="admin-loading">Loading album…</p></main>
  if (status === 'missing') return <main className="admin-main"><header className="admin-pagehead"><h2>Album not found</h2></header><p className="admin-note">This album may have been deleted.</p><button type="button" className="admin-button soft" onClick={() => { window.location.hash = '#admin/albums' }}><ArrowLeft size={14} />Back to albums</button></main>
  if (status === 'error') return <main className="admin-main"><header className="admin-pagehead"><h2>Could not load the album</h2></header><p className="admin-note">Check your connection and the Supabase migration (supabase/migrations/0001_albums.sql).</p><button type="button" className="admin-button soft" onClick={() => { window.location.hash = '#admin/albums' }}><ArrowLeft size={14} />Back to albums</button></main>

  const renderError = (matches: (message: string) => boolean) => errors.some(matches)
    ? <p className="admin-error">{errors.filter(matches)[0]}</p> : null

  return <main className="admin-main">
    <header className="admin-pagehead">
      <a className="admin-back-link" href="#admin/albums" onClick={event => { event.preventDefault(); window.location.hash = '#admin/albums' }}><ArrowLeft size={14} />Albums</a>
      <h2>{editing ? 'Album settings' : 'New album'}</h2>
      <p className="admin-note">Give this celebration a home. The slug becomes its public address — /albums/{form.slug || 'your-album'}.</p>
    </header>

    <form className="admin-album-form" onSubmit={submit} noValidate>
      <section className="admin-album-section">
        <h3>Name & address</h3>
        <div className="admin-album-row2">
          <label className="admin-field"><span>Title · English</span><input value={form.title.en} onChange={event => set('title', { en: event.target.value, ta: form.title.ta })} placeholder="Our engagement" /><span className="admin-error-inline">{renderError(message => message.startsWith('Album title'))}</span></label>
          <label className="admin-field"><span>Title · தமிழ் <em>(optional)</em></span><input value={form.title.ta === form.title.en ? '' : form.title.ta} onChange={event => set('title', { en: form.title.en, ta: event.target.value })} placeholder="எங்கள் நிச்சயதார்த்தம்" /></label>
        </div>
        <label className="admin-field"><span>Web address (slug)</span><div className="admin-album-slugrow"><span className="admin-album-slugprefix">/albums/</span><input value={form.slug} onChange={event => set('slug', event.target.value)} placeholder="our-engagement" /><button type="button" className="admin-button ghost" onClick={regenerateSlug} aria-label="Slug from title"><Wand2 size={14} /></button></div>{renderError(message => message.startsWith('A web address')) || renderError(message => message.startsWith('The web address'))}</label>
        <div className="admin-album-row2">
          <label className="admin-field"><span>Subtitle · English</span><input value={form.subtitle.en} onChange={event => set('subtitle', { en: event.target.value, ta: form.subtitle.ta })} placeholder="THE FIRST PROMISE" /></label>
          <label className="admin-field"><span>Subtitle · தமிழ் <em>(optional)</em></span><input value={form.subtitle.ta === form.subtitle.en ? '' : form.subtitle.ta} onChange={event => set('subtitle', { en: form.subtitle.en, ta: event.target.value })} placeholder="முதல் உறுதிமொழி" /></label>
        </div>
        <label className="admin-field"><span>Description · English</span><textarea rows={3} value={form.description.en} onChange={event => set('description', { en: event.target.value, ta: form.description.ta })} placeholder="A few words the visitors read as they open the album." /></label>
        <label className="admin-field"><span>Description · தமிழ் <em>(optional)</em></span><textarea rows={2} value={form.description.ta === form.description.en ? '' : form.description.ta} onChange={event => set('description', { en: form.description.en, ta: event.target.value })} placeholder="ஆல்பத்தைத் திறக்கும் போது வாசிப்பவர்களுக்குச் சில வார்த்தைகள்." /></label>
      </section>

      <section className="admin-album-section">
        <h3>Details</h3>
        <div className="admin-album-row3">
          <label className="admin-field"><span>Occasion</span><select value={form.eventType} onChange={event => set('eventType', event.target.value as EventType)}>{EVENT_TYPES.map(type => <option key={type} value={type}>{type.replace('-', ' ')}</option>)}</select></label>
          <label className="admin-field"><span>Date</span><input type="date" value={form.eventDate ?? ''} onChange={event => set('eventDate', event.target.value || null)} />{renderError(message => message.startsWith('The event date'))}</label>
          <label className="admin-field"><span>Location</span><input value={form.location} onChange={event => set('location', event.target.value)} placeholder="Chennai" /></label>
        </div>
        <div className="admin-album-row2">
          <label className="admin-field"><span>Theme</span><select value={form.theme} onChange={event => set('theme', event.target.value as AlbumTheme)}>{ALBUM_THEMES.map(theme => <option key={theme} value={theme}>{themeLabel[theme]}</option>)}</select><span className="admin-note">Sets the colours of the whole album page.</span></label>
          <label className="admin-field"><span>Layout</span><select value={form.layoutType} onChange={event => set('layoutType', event.target.value as AlbumLayout)}>{ALBUM_LAYOUTS.map(layout => <option key={layout} value={layout}>{layoutLabel[layout]}</option>)}</select><span className="admin-note">How the photos are staged in the story.</span></label>
        </div>
      </section>

      <section className="admin-album-section">
        <h3>Publishing</h3>
        <label className="admin-album-check"><input type="checkbox" checked={form.allowDownload} onChange={event => set('allowDownload', event.target.checked)} /><span>Let visitors download the photographs</span></label>
        <label className="admin-album-check"><input type="checkbox" checked={form.isPublished} onChange={event => set('isPublished', event.target.checked)} /><span>Published — visible at /albums/{form.slug || '…'}</span><em className={form.isPublished ? '' : 'admin-draft-note'}>Visitors only see the album once this is on; drafts are just for you.</em></label>
        <label className="admin-field"><span>Sort order</span><input type="number" min={0} value={form.sortOrder} onChange={event => set('sortOrder', Math.max(0, Number(event.target.value)))} /><span className="admin-note">Smaller numbers appear first on the album wall.</span>{renderError(message => message.includes('sort'))}</label>
        <p className="admin-note admin-cover-note">The cover photo you choose from the Photos page will lead the album wall.</p>
      </section>

      <footer className="admin-album-formbar">
        <span className="admin-note">{dirty ? 'Unsaved changes.' : "Everything's saved."}</span>
        <button type="submit" className="admin-button primary" disabled={busy || (!dirty && editing)}>{busy ? 'Saving…' : editing ? 'Save settings' : 'Create album'}</button>
      </footer>
    </form>
  </main>
}