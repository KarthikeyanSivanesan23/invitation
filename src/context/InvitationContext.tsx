import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { translations, type TranslationKey } from '../data/translations'
import type { Language, Localized } from '../data/wedding'

interface InvitationContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
  l: (value: Localized) => string
  notify: (message: string) => void
}

const InvitationContext = createContext<InvitationContextValue | null>(null)

export function InvitationProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>(() => {
    try { return localStorage.getItem('wedding-language') === 'ta' ? 'ta' : 'en' } catch { return 'en' }
  })
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null)
  const setLanguage = useCallback((next: Language) => {
    updateLanguage(next)
    try { localStorage.setItem('wedding-language', next) } catch { /* Language selection still works without storage. */ }
  }, [])
  const notify = useCallback((message: string) => setToast({ message, id: Date.now() }), [])

  useEffect(() => { document.documentElement.lang = language }, [language])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5500)
    return () => window.clearTimeout(timer)
  }, [toast])

  return <InvitationContext.Provider value={{ language, setLanguage, t: key => translations[language][key], l: value => value[language], notify }}>
    {children}
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait">{toast && <motion.div className="toast" key={toast.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
        <Check size={18} aria-hidden="true" /><span>{toast.message}</span><button onClick={() => setToast(null)} aria-label={translations[language].close}><X size={16} /></button>
      </motion.div>}</AnimatePresence>
    </div>
  </InvitationContext.Provider>
}

export function useInvitation() {
  const value = useContext(InvitationContext)
  if (!value) throw new Error('useInvitation must be used within InvitationProvider')
  return value
}
