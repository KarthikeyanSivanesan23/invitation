import { useState, type FormEvent } from 'react'
import { setPreviewMode, supabaseClient } from '../services/contentRepository'

export default function AdminLogin({ onUnlock, preview }: { onUnlock: () => void; preview: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const { data, error: signInError } = await (await supabaseClient()).auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (signInError || !data.session) { setError(signInError?.message ?? 'Could not unlock the editor.'); return }
    onUnlock()
  }

  const previewLocally = () => {
    setPreviewMode()
    onUnlock()
  }

  return <div className="admin-app"><main className="admin-login">
    <div className="admin-login-card">
      <span className="admin-login-mark" aria-hidden="true">&</span>
      <h1>Wedding editor</h1>
      <p className="admin-login-sub">Update couple photos and the gallery, then publish for every visitor.</p>
      {preview ? <>
        <div className="admin-local-note">Browser-only preview<br />Your edits stay on this device until Supabase is connected.</div>
        <button className="admin-button primary" onClick={onUnlock}>Enter editor</button>
        <p className="admin-hint">To publish for every visitor: create a free Supabase project, copy the keys to <code>.env</code> and run <code>npm run admin:setup</code>.</p>
      </> : <>
        <form className="admin-form" onSubmit={submit}>
          <label className="admin-field"><span>Admin email</span><input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required /></label>
          <label className="admin-field"><span>Password</span><input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button type="submit" className="admin-button primary" disabled={busy}>{busy ? 'Unlocking…' : 'Unlock editor'}</button>
        </form>
        <button type="button" className="admin-link-button" onClick={previewLocally}>Continue in this-browser preview instead</button>
      </>}
    </div>
  </main></div>
}