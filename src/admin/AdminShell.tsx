import type { ReactNode } from 'react'
import { ExternalLink, Film, Images, Lock } from 'lucide-react'
import { clearPreviewMode, supabaseConfigured } from '../services/contentRepository'
import { useContentContext } from '../context/ContentContext'
import type { AdminAlbumRoute } from '../lib/albums'
import { goHome } from '../lib/navigate'

/** Global admin frame: brand sidebar with the two sections (Invitation /
 *  Wedding Albums) and the top actions that used to live in AdminHome's header,
 *  now shared by every page of the panel. */
export default function AdminShell({ preview, onLock, route, children }: { preview: boolean; onLock: () => void; route: AdminAlbumRoute; children: ReactNode }) {
  const { online } = useContentContext()
  const openInvitation = () => { window.location.hash = '#admin' }
  const openAlbums = () => { window.location.hash = '#admin/albums' }
  const viewSite = () => { goHome(); window.location.hash = '' }
  return <div className="admin-app">
    <aside className="admin-sidebar">
      <h1 className="admin-brand"><span className="admin-mark">&</span><strong>Wedding editor</strong></h1>
      <nav className="admin-nav" aria-label="Administration">
        <button type="button" className={route.name === 'invitation' ? 'active' : ''} onClick={openInvitation}><Images size={16} />Invitation</button>
        <button type="button" className={route.name !== 'invitation' ? 'active' : ''} onClick={openAlbums}><Film size={16} />Wedding Albums</button>
      </nav>
      <div className="admin-sidebar-foot">
        <span className={`admin-pill ${online ? 'on' : ''}`}>{online ? 'Cloud · live' : supabaseConfigured ? 'Browser preview' : 'Local build'}</span>
        {preview && <button type="button" className="admin-button soft" onClick={() => { clearPreviewMode(); window.location.hash = '' }}>Exit preview</button>}
        <button type="button" className="admin-button soft" onClick={viewSite}><ExternalLink size={14} />View site</button>
        <button type="button" className="admin-icon" aria-label="Lock the editor" onClick={onLock}><Lock size={16} /></button>
      </div>
    </aside>
    <div className="admin-shell-body">{children}</div>
  </div>
}