import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, Sprite, SRGBColorSpace } from 'three'

export default function Atmosphere({ progress, mobile }: { progress: { current: number }; mobile: boolean }) {
  const sprites = useRef<(Sprite | null)[]>([])
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64; canvas.height = 64
    const c = canvas.getContext('2d')!
    const glow = c.createRadialGradient(32, 32, 0, 32, 32, 32)
    glow.addColorStop(0, 'rgba(255,247,226,.9)')
    glow.addColorStop(.45, 'rgba(255,247,226,.4)')
    glow.addColorStop(1, 'rgba(255,247,226,0)')
    c.fillStyle = glow; c.fillRect(0, 0, 64, 64)
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace
    return map
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  useFrame(({ clock }) => sprites.current.forEach((sprite, i) => {
    if (!sprite) return
    sprite.position.x = (i % 2 ? -1 : 1) * (7 + i * 6) + Math.sin(clock.elapsedTime * .04 + i) * 2
    sprite.material.opacity = .32 * (1 - progress.current * .9)
  }))
  return <group>{Array.from({ length: mobile ? 3 : 5 }, (_, i) => <sprite key={i} ref={element => { sprites.current[i] = element }} position={[(i % 2 ? -1 : 1) * (7 + i * 6), 8 + i * 1.8, 10 + i * 7]} scale={[24 + i * 3, 5 + i, 1]}><spriteMaterial map={texture} transparent opacity={.32} depthWrite={false} toneMapped={false} /></sprite>)}</group>
}
