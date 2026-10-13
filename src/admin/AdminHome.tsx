import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronUp, ChevronDown, Trash2, ImagePlus } from 'lucide-react'
import { wedding } from '../data/wedding'
import { hasAsset } from '../lib/assets'
import { useContentContext } from '../context/ContentContext'
import { useInvitation } from '../context/InvitationContext'
import { contentRepository, saveDraft, loadDraft, newGalleryItem } from '../services/contentRepository'
import { deepEqual, effectiveToOverrides, mergeContent, type GalleryItem, type LiveContent } from '../lib/content'
import { PhotoButton } from './ImageEditor'
import { resolvePhoto } from './storage'

const photoVisible = (src: string) => Boolean(src.trim() && (/^https?:|^data:/.test(src.trim()) || hasAsset(src.trim())))

function PortraitCard({ title, src, setSrc }: { title: string; src: string; setSrc: (src: string) => void }) {
  const has = photoVisible(src)
  return <div className="admin-portrait-card">
    <h3>{title}</h3>
    <div className="admin-portrait-stage">
      {has
        ? <div className="portrait-preview"><img src={src} alt="" /><button type="button" className="admin-icon portrait-remove" aria-label={`Remove ${title} photo`} onClick={() => setSrc('')}><Trash2 size={16} /></button>
            <PhotoButton aspect={0.8} className="portrait-replace" onSave={async blob => setSrc(await resolvePhoto('couple', blob))}>Replace photo</PhotoButton></div>
        : <PhotoButton aspect={0.8} className="portrait-add" onSave={async blob => setSrc(await resolvePhoto('couple', blob))}><ImagePlus size={22} />Add photo</PhotoButton>}
      {has && <p className="admin-note">Drag to position, then apply. Saved photos appear in the Couple section.</p>}
    </div>
  </div>
}

function CoupleEditor({ value, setValue }: { value: LiveContent; setValue: (next: LiveContent) => void }) {
  return <div className="admin-couple-grid">
    <PortraitCard title={wedding.bride.name.en} src={value.bridePortrait} setSrc={bridePortrait => setValue({ ...value, bridePortrait })} />
    <PortraitCard title={wedding.groom.name.en} src={value.groomPortrait} setSrc={groomPortrait => setValue({ ...value, groomPortrait })} />
  </div>
}

function GalleryEditor({ value, setValue }: { value: LiveContent; setValue: (next: LiveContent) => void }) {
  const gallery = value.gallery
  const setGallery = (next: GalleryItem[]) => setValue({ ...value, gallery: next })
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= gallery.length) return
    const next = [...gallery]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    setGallery(next)
  }
  const setCaption = (index: number, key: 'en' | 'ta', text: string) => {
    const next = [...gallery]
    next[index] = { ...next[index], caption: { ...next[index].caption, [key]: text } }
    setGallery(next)
  }
  return <div>
    {gallery.map((item, index) => <div className="admin-gallery-row" key={item.id}>
      <div className="gallery-thumb">{photoVisible(item.src) ? <img src={item.src} alt="" /> : <span aria-hidden="true">Photo</span>}</div>
      <div className="gallery-fields">
        <label className="admin-field"><span>Caption · English</span><input value={item.caption.en} onChange={event => setCaption(index, 'en', event.target.value)} placeholder="A little memory…" /></label>
        <label className="admin-field"><span>Caption · தமிழ் <em>(optional)</em></span><input value={item.caption.ta === item.caption.en ? '' : item.caption.ta} onChange={event => setCaption(index, 'ta', event.target.value)} placeholder="ஒரு சின்ன நினைவு…" /></label>
      </div>
      <div className="gallery-moves">
        <button type="button" className="admin-icon" aria-label="Move photo up" disabled={index === 0} onClick={() => move(index, -1)}><ChevronUp size={16} /></button>
        <button type="button" className="admin-icon" aria-label="Move photo down" disabled={index === gallery.length - 1} onClick={() => move(index, 1)}><ChevronDown size={16} /></button>
        <button type="button" className="admin-icon danger" aria-label="Delete photo" onClick={() => setGallery(gallery.filter((_, i) => i !== index))}><Trash2 size={16} /></button>
      </div>
    </div>)}
    <PhotoButton aspect={1} className="gallery-add" onSave={async blob => setGallery([...gallery, newGalleryItem(await resolvePhoto('gallery', blob), { en: '', ta: '' }, gallery.length)])}>
      <ImagePlus size={22} />Add photo
    </PhotoButton>
  </div>
}

export default function AdminHome() {
  const { loaded, online, error } = useContentContext()
  const { notify } = useInvitation()
  const content = useContentContext()
  const initial = useMemo(() => mergeContent(content.overrides), [content.overrides])

  const [effective, setEffective] = useState<LiveContent | null>(null)
  const [tab, setTab] = useState<'couple' | 'gallery'>('gallery')
  const [saving, setSaving] = useState(false)
  const published = useRef<LiveContent | null>(null)
  const repo = useRef(contentRepository())

  useEffect(() => {
    if (loaded && !effective) {
      const seed = loadDraft() ?? initial
      setEffective(seed)
      published.current = seed
    }
  }, [loaded, effective, initial])

  useEffect(() => { if (effective) saveDraft(effective) }, [effective])

  const dirty = Boolean(effective && published.current && !deepEqual(effective, published.current))

  const publish = async () => {
    if (!effective || !dirty) return
    setSaving(true)
    try {
      await repo.current.saveOverrides(effectiveToOverrides(effective))
      published.current = structuredClone(effective)
      window.dispatchEvent(new Event('wedding-content-updated'))
      notify(repo.current.online ? 'Published — visitors now see your invitation.' : 'Saved on this browser. Connect Supabase to publish for every visitor.')
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : 'Could not publish. Try again in a moment.')
    } finally { setSaving(false) }
  }

  return <main className="admin-main">
    <header className="admin-pagehead"><h2>Invitation</h2><p className="admin-note">Couple portraits and the gallery shown on your public invitation.</p></header>

    {error && <p className="admin-banner" role="alert">{error}</p>}

    {!loaded || !effective ? <p className="admin-loading">Loading the photo library…</p> : <>
      <nav className="admin-tabs" role="tablist" aria-label="Editor sections">
        <button type="button" role="tab" aria-selected={tab === 'couple'} onClick={() => setTab('couple')}>Couple photos</button>
        <button type="button" role="tab" aria-selected={tab === 'gallery'} onClick={() => setTab('gallery')}>Gallery <span className="admin-count">{effective.gallery.length}</span></button>
      </nav>

      {tab === 'couple'
        ? <CoupleEditor value={effective} setValue={setEffective} />
        : <GalleryEditor value={effective} setValue={setEffective} />}

      <footer className="admin-publishbar">
        <div className="admin-publish-note">{dirty ? 'Unsaved edits — visitors still see the last published version.' : online ? 'Your published invitation is live.' : 'Saved for this browser.'}</div>
        <button type="button" className="admin-button primary" onClick={publish} disabled={!dirty || saving}>{saving ? 'Publishing…' : dirty ? 'Save & publish' : online ? 'Published' : 'Saved'}</button>
      </footer>
    </>}
  </main>
}