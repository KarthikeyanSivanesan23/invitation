import { useEffect, useRef, useState } from 'react'

export function useVisibility<T extends HTMLElement>(margin = '180px') {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  const [seen, setSeen] = useState(false)
  const [pageVisible, setPageVisible] = useState(!document.hidden)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting)
      if (entry.isIntersecting) setSeen(true)
    }, { rootMargin: margin })
    observer.observe(element)
    const visibility = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [margin])
  return { ref, visible: visible && pageVisible, seen }
}
