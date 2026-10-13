import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Trash2, Images, Pencil, ExternalLink, Lock } from 'lucide-react'
import { albumRepository, albumsUnavailable } from '../services/albumRepository'
import { useInvitation } from '../context/InvitationContext'
import type { AlbumListItem, EventType } from '../lib/albums'
import { EVENT_TYPES } from '../lib/albums'

const PAGE_SIZE = 9

const eventLabel = (type: EventType) => type.replace('-', ' ')

function coverFallback(initial: string) {
  return <div className="admin-album-cover admin-album-cover-fallback"><span>{initial}</span></div>
}

export default function AlbumListPage() {
  const { notify } = useInvitation()
  const [albums, setAlbums] = useState<AlbumListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [published, setPublished] = useState<'all' | 'published' | 'draft'>('all')
  const [eventType, setEventType] = useState<'all' | EventType>('all')
  const [sort, setSort] = useState<'updated' | 'created' | 'photos'>('updated')
  const [page, setPage] = useState(0)
  const unavailable = albumsUnavailable()

  const reload = () => {
    setError(null)
    setAlbums(null)
    const repo = albumRepository()
    repo.listAlbums().then(async list => {
      const counts = await repo.countPhotos(list.map(album => album.id))
      setAlbums(list.map(album => ({ ...album, photoCount: counts[album.id] ?? 0 })))
    }).catch(cause => setError(cause instanceof Error ? cause.message : 'Could not load the albums.'))
  }
  useEffect(reload, [])

  const filtered = useMemo(() => {
    if (!albums) return []
    const needle = search.trim().toLowerCase()
    let list = albums.filter(album => {
      if (published === 'published' && !album.isPublished) return false
      if (published === 'draft' && album.isPublished) return false
      if (eventType !== 'all' && album.eventType !== eventType) return false
      if (needle && !(album.title.en.toLowerCase().includes(needle) || album.title.ta.toLowerCase().includes(needle) || album.slug.includes(needle))) return false
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === 'photos') return b.photoCount - a.photoCount
      if (sort === 'created') return b.createdAt.localeCompare(a.createdAt)
      return b.updatedAt.localeCompare(a.updatedAt)
    })
    return list
  }, [albums, search, published, eventType, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages - 1)
  const onPage = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)

  const remove = async (album: AlbumListItem) => {
    if (!window.confirm(`Delete "${album.title.en}" and all of its photos? This cannot be undone.`)) return
    try {
      await albumRepository().deleteAlbum(album.id)
      notify('Album deleted.')
      reload()
    } catch (cause) { notify(cause instanceof Error ? cause.message : 'Could not delete the album.') }
  }

  if (unavailable) return <main className="admin-main">
    <header className="admin-pagehead"><h2>Wedding Albums</h2><p className="admin-note">Albums live in your connected Supabase project. This browser is in preview mode, so they are not available here — lock, sign in to the cloud account, then open this section again.</p></header>
    <div className="admin-album-unavailable"><Lock size={22} /><p>Albums need the Supabase connection. Use <strong>Lock</strong> in the sidebar and sign in with the admin account.</p></div>
  </main>

  return <main className="admin-main">
    <header className="admin-pagehead">
      <h2>Wedding Albums</h2>
      <p className="admin-note">A cinematic album for each celebration. Upload photos, arrange them, apply effects and publish when it's perfect.</p>
      <button type="button" className="admin-button primary" onClick={() => { window.location.hash = '#admin/albums/new' }}><Plus size={15} />New album</button>
    </header>

    {error && <div className="admin-album-error" role="alert"><p>{error}</p><p className="admin-note">If the album tables are missing, open Supabase → SQL Editor and run supabase/migrations/0001_albums.sql.</p></div>}

    {!error && albums === null && <p className="admin-loading">Loading albums…</p>}

    {!error && albums && <>
      <div className="admin-album-toolbar">
        <label className="admin-album-search"><Search size={15} /><input value={search} onChange={event => { setSearch(event.target.value); setPage(0) }} placeholder="Search albums…" aria-label="Search albums" /></label>
        <select value={published} onChange={event => { setPublished(event.target.value as 'all' | 'published' | 'draft'); setPage(0) }} aria-label="Filter by status">
          <option value="all">All albums</option><option value="published">Published</option><option value="draft">Drafts</option>
        </select>
        <select value={eventType} onChange={event => { setEventType(event.target.value as 'all' | EventType); setPage(0) }} aria-label="Filter by event">
          <option value="all">Every occasion</option>{EVENT_TYPES.map(type => <option key={type} value={type}>{eventLabel(type)}</option>)}
        </select>
        <select value={sort} onChange={event => { setSort(event.target.value as 'updated' | 'created' | 'photos'); setPage(0) }} aria-label="Sort albums">
          <option value="updated">Recently updated</option><option value="created">Newest first</option><option value="photos">Most photos</option>
        </select>
      </div>

      {filtered.length === 0
        ? <div className="admin-album-empty"><Images size={26} /><p>{albums.length === 0 ? 'No albums yet. Create your first one, then add the photographs.' : 'Nothing matches this search.'}</p>{albums.length === 0 && <button type="button" className="admin-button primary" onClick={() => { window.location.hash = '#admin/albums/new' }}><Plus size={15} />Create an album</button>}</div>
        : <>
          <div className="admin-album-grid">{onPage.map(album => {
            const initial = (album.title.en.trim()[0] ?? '&').toUpperCase()
            return <article className="admin-album-card" key={album.id}>
              <div className="admin-album-cover-wrap">{album.coverImage ? <img className="admin-album-cover" src={album.coverImage} alt="" loading="lazy" /> : coverFallback(initial)}
                <span className={`admin-album-status ${album.isPublished ? 'on' : ''}`}>{album.isPublished ? 'Published' : 'Draft'}</span>
              </div>
              <div className="admin-album-card-body">
                <h3>{album.title.en}<span className="admin-album-slug">/albums/{album.slug}</span></h3>
                <div className="admin-album-meta"><span>{eventLabel(album.eventType)}</span><span>{album.photoCount} photos</span><span>{album.updatedAt.slice(0, 10)}</span></div>
              </div>
              <div className="admin-album-actions">
                <button type="button" className="admin-button ghost" onClick={() => { window.location.hash = `#admin/albums/${album.id}/photos` }}>Photos</button>
                <button type="button" className="admin-button ghost" onClick={() => { window.location.hash = `#admin/albums/${album.id}` }}><Pencil size={13} />Settings</button>
                <button type="button" className="admin-button ghost" onClick={() => { window.open(`/albums/${album.slug}`, '_blank') }}><ExternalLink size={13} />Preview</button>
                <button type="button" className="admin-icon danger" aria-label={`Delete ${album.title.en}`} onClick={() => void remove(album)}><Trash2 size={15} /></button>
              </div>
            </article>
          })}</div>

          {pages > 1 && <nav className="admin-album-paging" aria-label="Albums pages">
            <button type="button" className="admin-button ghost" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button>
            <span>Page {currentPage + 1} of {pages}</span>
            <button type="button" className="admin-button ghost" disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)}>Next</button>
          </nav>}
        </>}
    </>}
  </main>
}