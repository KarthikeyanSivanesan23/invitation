import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { FlipHorizontal2, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

interface ImageEditorProps {
  file: File
  /** Output crop shape as width / height (1 = square, 0.8 = 4:5 portrait). */
  aspect: number
  onCancel: () => void
  onSave: (blob: Blob) => Promise<void> | void
}

/** Canvas-based photo editor: position, zoom, rotate and flip a photo, then
 *  export a resized JPEG from the visible crop. No image libraries required. */
export default function ImageEditor({ file, aspect, onCancel, onSave }: ImageEditorProps) {
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file])
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [rotate, setRotate] = useState(0)
  const [flip, setFlip] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [working, setWorking] = useState<{ w: number; h: number } | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const boxRef = useRef<HTMLDivElement>(null)
  const workCanvas = useRef<HTMLCanvasElement>(null)
  const preview = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  useEffect(() => () => URL.revokeObjectURL(objectUrl), [objectUrl])

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setZoom(1)
      setPan({ x: 0, y: 0 })
    }
    img.src = objectUrl
  }, [objectUrl])

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [file])

  // Bake rotation + flip into an offscreen canvas so crop math matches the preview.
  useEffect(() => {
    if (!image) return
    let width = image.naturalWidth
    let height = image.naturalHeight
    if (rotate % 180 !== 0) { const temp = width; width = height; height = temp }
    const canvas = workCanvas.current
    if (!canvas) return
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.translate(width / 2, height / 2)
    if (flip) ctx.scale(-1, 1)
    ctx.rotate((rotate * Math.PI) / 180)
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)
    ctx.restore()
    setWorking({ w: width, h: height })
  }, [image, rotate, flip])

  const base = working && box.w ? Math.max(box.w / working.w, box.h / working.h) : 1
  const displayW = working ? working.w * base * zoom : 0
  const displayH = working ? working.h * base * zoom : 0

  const clampPan = useCallback((value: { x: number; y: number }) => ({
    x: clamp(value.x, (box.w - displayW) / 2, (displayW - box.w) / 2),
    y: clamp(value.y, (box.h - displayH) / 2, (displayH - box.h) / 2),
  }), [box, displayW, displayH])

  useEffect(() => { setPan(current => clampPan(current)) }, [clampPan])

  const ready = Boolean(image && working && box.w)

  const apply = useCallback(async () => {
    const canvas = workCanvas.current
    if (!canvas || !working || !box.w) return
    const scale = base * zoom
    const cropX = -((box.w - displayW) / 2 + pan.x) / scale
    const cropY = -((box.h - displayH) / 2 + pan.y) / scale
    const cropW = box.w / scale
    const cropH = box.h / scale
    if (cropW <= 0 || cropH <= 0 || cropX < 0 || cropY < 0 || cropX + cropW > working.w || cropY + cropH > working.h) return

    const longest = 1600
    const outW = Math.round(aspect >= 1 ? longest : longest * aspect)
    const outH = Math.round(aspect >= 1 ? longest / aspect : longest)
    const out = document.createElement('canvas')
    out.width = outW
    out.height = outH
    const ctx = out.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, outW, outH)
    const blob = await new Promise<Blob | null>(resolve => out.toBlob(resolve, 'image/jpeg', 0.85))
    if (!blob) return
    setSaving(true)
    setMessage(null)
    try { await onSave(blob) } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save this photo.')
      setSaving(false)
    }
  }, [aspect, base, box, displayW, displayH, onSave, pan, working, zoom])

  const move = (dx: number, dy: number) => setPan(current => clampPan({ x: current.x + dx, y: current.y + dy }))

  const changeZoom = (next: number) => {
    const value = clamp(next, 1, 5)
    setZoom(value)
    if (value < zoom) setPan(current => clampPan(current))
  }

  return <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Edit photo">
    <div className="admin-modal-inner">
      <div className="admin-modal-head"><h2>Edit photo</h2><span>A little framing, then apply.</span></div>
      <div className="crop-area" ref={boxRef} aria-label="Photo crop area" tabIndex={0} style={{ aspectRatio: String(aspect) }}
        onKeyDown={event => {
          const step = 24
          if (event.key === 'ArrowLeft') move(-step, 0)
          else if (event.key === 'ArrowRight') move(step, 0)
          else if (event.key === 'ArrowUp') move(0, -step)
          else if (event.key === 'ArrowDown') move(0, step)
        }}
        onWheel={event => { event.preventDefault(); changeZoom(zoom - Math.sign(event.deltaY) * 0.1) }}
        onPointerDown={event => { if (!ready) return; event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, px: pan.x, py: pan.y } }}
        onPointerMove={event => { if (!drag.current) return; setPan(() => clampPan({ x: drag.current!.px + (event.clientX - drag.current!.x), y: drag.current!.py + (event.clientY - drag.current!.y) })) }}
        onPointerUp={() => { drag.current = null }}
        onPointerCancel={() => { drag.current = null }}>
        <canvas ref={preview} width={working?.w ?? 0} height={working?.h ?? 0} className="crop-preview"
          style={{ width: displayW || 1, height: displayH || 1, transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))` }} />
        {!ready && <span className="crop-loading" aria-live="polite">Preparing photo…</span>}
      </div>
      <canvas ref={workCanvas} className="admin-work-canvas" aria-hidden="true" style={{ display: 'none' }} />
      <div className="crop-toolbar">
        <div className="crop-tools">
          <button type="button" className="admin-icon" aria-label="Rotate left" onClick={() => setRotate(r => (r + 270) % 360)}><RotateCcw size={17} /></button>
          <button type="button" className="admin-icon" aria-label="Rotate right" onClick={() => setRotate(r => (r + 90) % 360)}><RotateCw size={17} /></button>
          <button type="button" className="admin-icon" aria-label="Flip horizontally" onClick={() => setFlip(f => !f)}><FlipHorizontal2 size={17} /></button>
        </div>
        <label className="crop-zoom"><ZoomOut size={15} /><input type="range" min={1} max={5} step={0.01} value={zoom} aria-label="Zoom" onChange={event => changeZoom(Number(event.target.value))} /><ZoomIn size={15} /></label>
      </div>
      <p className="crop-hint">Drag to position · scroll or use the slider to zoom · arrows nudge.</p>
      {message && <p className="admin-error" role="alert">{message}</p>}
      <div className="admin-modal-actions">
        <button type="button" className="admin-button ghost" onClick={onCancel}>Cancel</button>
        <button type="button" className="admin-button primary" onClick={apply} disabled={!ready || saving}>{saving ? 'Saving…' : 'Apply edits'}</button>
      </div>
    </div>
  </div>
}

/** A trigger button that opens the file picker and, once a file is chosen,
 *  the shared photo editor. Reused for portraits and gallery uploads. */
export function PhotoButton({ aspect, className = '', children, onSave }: {
  aspect: number
  className?: string
  children: ReactNode
  onSave: (blob: Blob) => Promise<void> | void
}) {
  const [file, setFile] = useState<File | null>(null)
  const input = useRef<HTMLInputElement>(null)
  return <>
    <button type="button" className={`photo-trigger ${className}`} onClick={() => input.current?.click()}>{children}</button>
    <input ref={input} type="file" accept="image/*" className="admin-file-input" tabIndex={-1} aria-hidden="true"
      onChange={event => { const picked = event.target.files?.[0] ?? null; event.target.value = ''; if (picked) setFile(picked) }} />
    {file && <ImageEditor aspect={aspect} file={file} onCancel={() => setFile(null)}
      onSave={async blob => { await onSave(blob); setFile(null) }} />}
  </>
}