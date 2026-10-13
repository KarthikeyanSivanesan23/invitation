import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import AlbumStory from '../albums/AlbumStory'
import { albumRepository, albumsUnavailable } from '../services/albumRepository'
import type { Album, AlbumPhoto } from '../lib/albums'
import '../albums/albums.css'

export default function AlbumPreviewPage({ albumId }: { albumId: string }) {
  const [state, setState] = useState<{ album: Album; photos: AlbumPhoto[] } | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const unavailable = albumsUnavailable()

  useEffect(() => {
    let cancelled = false
    setStatus('loading'); setState(null)
    Promise.all([albumRepository().getAlbum(albumId), albumRepository().listAlbumPhotos(albumId)])
      .then(([album, photos]) => {
        if (cancelled) return
        if (!album) { setStatus('missing'); return }
        setState({ album, photos: photos.filter(photo => photo.isPublished && photo.imageUrl.trim()) })
        setStatus('ready')
      })
      .catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true }
  }, [albumId])

  const back = <a className="admin-back-link" href={`#admin/albums/${albumId}/photos`} onClick={event => { event.preventDefault(); window.location.hash = `#admin/albums/${albumId}/photos` }}><ArrowLeft size={14} />Photos</a>

  if (unavailable) return <main className="admin-main"><header className="admin-pagehead"><h2>Preview</h2><p className="admin-note">Albums need the Supabase connection. Lock the editor and sign in with the admin account to preview photographs.</p></header>{back}</main>
  if (status === 'loading') return <main className="admin-main"><p className="admin-loading">Preparing the preview…</p></main>
  if (status === 'missing' || status === 'error') return <main className="admin-main"><header className="admin-pagehead"><h2>Preview unavailable</h2></header><p className="admin-note">{status === 'missing' ? 'This album may have been deleted.' : 'Could not reach the album data.'}</p>{back}</main>
  if (!state) return null

  return <main className="admin-main admin-fullbleed">
    <div className="alb-admin-preview">
      <div className="alb-admin-preview-note"><span>Preview — {state.album.title.en}</span>{back}</div>
      <AlbumStory album={state.album} photos={state.photos} />
    </div>
  </main>
}