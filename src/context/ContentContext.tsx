import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { contentRepository, previewMode } from '../services/contentRepository'
import { mergeContent, type ContentOverrides, type LiveContent } from '../lib/content'

interface ContentContextValue {
  overrides: ContentOverrides | null
  loaded: boolean
  online: boolean
  error: string | null
  refresh: () => void
}

const ContentContext = createContext<ContentContextValue | null>(null)

/** Fetches admin overrides once on load and again when the window regains focus
 *  or the admin panel publishes (`wedding-content-updated`). */
export function ContentProvider({ children }: { children: ReactNode }) {
  const repo = useMemo(() => contentRepository(), [previewMode()])
  const [overrides, setOverrides] = useState<ContentOverrides | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [online, setOnline] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const next = await repo.listOverrides()
      setOverrides(next)
      setOnline(repo.online)
      setError(null)
    } catch {
      setError('Could not reach the photo library. Showing the built-in content.')
    } finally {
      setLoaded(true)
    }
  }, [repo])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => {
    const listen = () => refresh()
    window.addEventListener('focus', listen)
    window.addEventListener('wedding-content-updated', listen)
    return () => {
      window.removeEventListener('focus', listen)
      window.removeEventListener('wedding-content-updated', listen)
    }
  }, [refresh])

  return <ContentContext.Provider value={{ overrides, loaded, online, error, refresh }}>{children}</ContentContext.Provider>
}

export function useContentContext() {
  const value = useContext(ContentContext)
  if (!value) throw new Error('useContentContext must be used within ContentProvider')
  return value
}

/** Fully-merged content (overrides layered over wedding.ts defaults). */
export function useContent(): LiveContent {
  const { overrides } = useContentContext()
  return useMemo(() => mergeContent(overrides), [overrides])
}