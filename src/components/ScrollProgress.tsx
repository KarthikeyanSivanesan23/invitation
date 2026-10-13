import { useEffect, useRef } from 'react'

export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let frame = 0
    const update = () => { frame = 0; const total = document.documentElement.scrollHeight - window.innerHeight; if (ref.current) ref.current.style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})` }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll); update()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) }
  }, [])
  return <div className="scroll-thread" aria-hidden="true"><div ref={ref} /></div>
}
