import { useCallback, useEffect, useState } from 'react'
import AdminLogin from './AdminLogin'
import AdminHome from './AdminHome'
import AdminShell from './AdminShell'
import AlbumListPage from './AlbumListPage'
import AlbumFormPage from './AlbumFormPage'
import AlbumPhotoPage from './AlbumPhotoPage'
import AlbumPreviewPage from './AlbumPreviewPage'
import { clearPreviewUnlock, previewMode, previewUnlocked, setPreviewUnlock, supabaseClient } from '../services/contentRepository'
import { parseAdminAlbumRoute } from '../lib/albums'
import './admin.css'

export default function AdminApp() {
  const [status, setStatus] = useState<'checking' | 'locked' | 'open'>('checking')
  const [route, setRoute] = useState(() => parseAdminAlbumRoute(window.location.hash))
  const preview = previewMode()

  useEffect(() => {
    if (preview) { setStatus(previewUnlocked() ? 'open' : 'locked'); return }
    supabaseClient().then(client => client.auth.getSession().then(({ data }) => setStatus(data.session ? 'open' : 'locked')).catch(() => setStatus('locked')))
  }, [preview])

  useEffect(() => {
    const sync = () => setRoute(parseAdminAlbumRoute(window.location.hash))
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const unlock = useCallback(() => {
    setPreviewUnlock()
    setStatus('open')
  }, [])

  const lock = useCallback(async () => {
    if (!preview) { try { await (await supabaseClient()).auth.signOut() } catch { /* already signed out */ } }
    clearPreviewUnlock()
    setStatus('locked')
  }, [preview])

  if (status === 'checking') return <div className="admin-app"><p className="admin-loading">Loading admin…</p></div>
  if (status === 'locked') return <AdminLogin onUnlock={unlock} preview={preview} />

  return <AdminShell preview={preview} onLock={() => void lock()} route={route}>
    {route.name === 'invitation' && <AdminHome />}
    {route.name === 'albums-list' && <AlbumListPage />}
    {route.name === 'albums-new' && <AlbumFormPage />}
    {route.name === 'albums-edit' && <AlbumFormPage albumId={route.albumId} />}
    {route.name === 'albums-photos' && <AlbumPhotoPage key={route.albumId} albumId={route.albumId} />}
    {route.name === 'albums-preview' && <AlbumPreviewPage albumId={route.albumId} />}
  </AdminShell>
}