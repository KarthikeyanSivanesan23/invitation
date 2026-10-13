import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { CanvasTexture, Group, MathUtils, Mesh, MeshStandardMaterial, SRGBColorSpace } from 'three'
import { gsap } from 'gsap'
import { wedding } from '../data/wedding'
import type { DevicePerformance } from '../hooks/useDevicePerformance'
import { useInvitation } from '../context/InvitationContext'
import ParticleSystem from './ParticleSystem'

export type CardPhase = 'closed' | 'opening' | 'open' | 'entering' | 'entered'

function createCardTexture(inside: boolean, name: string, bride: string, labels: string[]) {
  const canvas = document.createElement('canvas')
  canvas.width = 768; canvas.height = 1024
  const c = canvas.getContext('2d')!
  c.fillStyle = inside ? '#f5ecd8' : '#591d2c'; c.fillRect(0, 0, 768, 1024)
  for (let i = 0; i < 15500; i++) {
    c.fillStyle = i % 2 ? 'rgba(255,233,191,.045)' : 'rgba(18,0,8,.08)'
    c.fillRect((Math.sin(i * 127.1) * .5 + .5) * 768, (Math.cos(i * 311.7) * .5 + .5) * 1024, 1, 2)
  }
  const gold = c.createLinearGradient(0, 0, 768, 1024)
  gold.addColorStop(0, '#9b783d'); gold.addColorStop(.35, '#e9d59e'); gold.addColorStop(.62, '#b69756'); gold.addColorStop(1, '#e4c580')
  c.strokeStyle = gold; c.lineWidth = 2
  c.strokeRect(35, 35, 698, 954); c.lineWidth = 1; c.strokeRect(46, 46, 676, 932)
  c.strokeRect(57, 57, 654, 910)
  for (const [x, y, rotate] of [[72, 73, 0], [696, 73, Math.PI / 2], [696, 951, Math.PI], [72, 951, Math.PI * 1.5]]) {
    c.save(); c.translate(x, y); c.rotate(rotate)
    c.lineWidth = 1.5
    for (let j = 0; j < 5; j++) { c.beginPath(); c.ellipse(13 + j * 9, 13 + j * 9, 11, 33, -.8, 0, Math.PI * 2); c.stroke() }
    c.restore()
  }
  c.textAlign = 'center'; c.fillStyle = inside ? '#632738' : gold
  const font = document.documentElement.lang === 'ta' ? 'Noto Serif Tamil' : 'Cormorant Garamond'
  if (!inside) {
    c.font = '19px Manrope, sans-serif'; c.fillText(labels[0], 384, 209)
    c.save(); c.translate(384, 457)
    c.beginPath(); c.ellipse(0, 0, 160, 199, 0, 0, Math.PI * 2); c.stroke()
    c.beginPath(); c.ellipse(0, 0, 149, 188, 0, 0, Math.PI * 2); c.stroke()
    for (let i = 0; i < 26; i++) { const a = i * Math.PI / 13; c.save(); c.translate(Math.cos(a) * 166, Math.sin(a) * 205); c.rotate(a); c.beginPath(); c.ellipse(0, 0, 5, 12, .5, 0, Math.PI * 2); c.stroke(); c.restore() }
    c.font = '142px Cormorant Garamond, serif'; c.fillText(wedding.groom.initial, -43, 24); c.fillText(wedding.bride.initial, 48, 69)
    c.font = 'italic 55px Cormorant Garamond, serif'; c.fillText('&', 8, 35)
    c.restore()
    c.font = '21px Manrope, sans-serif'; c.fillText(labels[1], 384, 757)
    c.font = `italic 30px ${font}, serif`; c.fillText(labels[5], 384, 803, 570)
    c.beginPath(); c.moveTo(290, 846); c.lineTo(478, 846); c.stroke()
  } else {
    c.font = `24px ${font}, serif`; c.fillText(labels[2], 384, 260, 590)
    c.font = `64px ${font}, serif`; c.fillText(name, 384, 420, 620)
    c.font = `italic 32px ${font}, serif`; c.fillText(labels[3], 384, 486)
    c.font = `64px ${font}, serif`; c.fillText(bride, 384, 570, 620)
    c.font = `20px ${font}, serif`; c.fillText(labels[1], 384, 713)
    c.font = `37px ${font}, serif`; c.fillText(labels[4], 384, 775, 570)
    c.beginPath(); c.moveTo(300, 640); c.lineTo(468, 640); c.stroke()
  }
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.anisotropy = 4
  return texture
}

function Card({ phase, onReady }: { phase: CardPhase; onReady: () => void }) {
  const group = useRef<Group>(null)
  const hinge = useRef<Group>(null)
  const leaf = useRef<Group>(null)
  const seal = useRef<Mesh>(null)
  const ready = useRef(false)
  const [fontsReady, setFontsReady] = useState(false)
  const opening = useRef({ progress: 0, portal: 0 })
  const { l, t, language } = useInvitation()
  const textures = useMemo(() => {
    const labels = [t('together').toUpperCase(), t('saveDate'), t('blessingsIntro'), t('weds'), l(wedding.date), l(wedding.title)]
    return [createCardTexture(false, l(wedding.groom.name), l(wedding.bride.name), labels), createCardTexture(true, l(wedding.groom.name), l(wedding.bride.name), labels)]
    // Rebuild for language/fonts, not when a toast changes context.
  }, [language, fontsReady])
  useEffect(() => {
    let active = true
    void document.fonts.ready.then(() => { if (active) setFontsReady(true) })
    return () => { active = false }
  }, [])
  useEffect(() => () => textures.forEach(texture => texture.dispose()), [textures])
  useEffect(() => {
    const target = opening.current
    const tween = gsap.to(target, { progress: phase === 'closed' ? 0 : 1, duration: 2.8, ease: 'power2.inOut' })
    const portal = gsap.to(target, { portal: phase === 'entering' || phase === 'entered' ? 1 : 0, duration: 1.4, ease: 'power3.in' })
    return () => { tween.kill(); portal.kill() }
  }, [phase])
  useFrame(({ clock, pointer, camera }, delta) => {
    if (!ready.current) { ready.current = true; onReady() }
    if (!group.current || !hinge.current) return
    const p = opening.current.progress
    group.current.rotation.x = MathUtils.damp(group.current.rotation.x, .04 - pointer.y * .045, 3, delta)
    group.current.rotation.y = MathUtils.damp(group.current.rotation.y, -.13 + pointer.x * .09 + p * .1, 3, delta)
    group.current.rotation.z = -.04 + Math.sin(clock.elapsedTime * .45) * .012
    group.current.position.y = Math.sin(clock.elapsedTime * .7) * .045
    group.current.position.x = p * .7
    hinge.current.rotation.y = -p * Math.PI * .89
    if (leaf.current) leaf.current.rotation.y = Math.sin(p * Math.PI) * .18
    if (seal.current) {
      seal.current.scale.setScalar(Math.max(0, 1 - p * 5))
      const material = seal.current.material as MeshStandardMaterial
      material.emissiveIntensity = Math.sin(Math.min(p * 5, 1) * Math.PI) * 3
    }
    camera.position.z = 6.7 - p * .15 - opening.current.portal * 5.3
    camera.position.x = opening.current.portal * .65
  })
  return <group ref={group}>
    <mesh position={[0, 0, -.035]} castShadow receiveShadow><boxGeometry args={[2.22, 3.06, .12]} /><meshStandardMaterial color="#642232" roughness={.82} /></mesh>
    <mesh position={[.018, 0, .035]}><boxGeometry args={[2.12, 2.95, .075]} /><meshStandardMaterial color="#d7c29d" roughness={.9} /></mesh>
    <group ref={leaf} position={[-1.04, 0, .08]}><mesh position={[1.055, 0, 0]}><boxGeometry args={[2.11, 2.92, .016]} /><meshStandardMaterial color="#f5ecd8" /></mesh><mesh position={[1.055, 0, .012]}><planeGeometry args={[2.11, 2.92]} /><meshBasicMaterial map={textures[1]} toneMapped={false} /></mesh></group>
    <group ref={hinge} position={[-1.1, 0, .13]}>
      <mesh position={[1.1, 0, 0]} castShadow><boxGeometry args={[2.22, 3.06, .075]} /><meshStandardMaterial color="#551c2a" roughness={.7} metalness={.08} /></mesh>
      <mesh position={[1.1, 0, .04]}><planeGeometry args={[2.22, 3.06]} /><meshStandardMaterial map={textures[0]} metalness={.3} roughness={.67} /></mesh>
      <mesh position={[1.1, 0, -.04]} rotation={[0, Math.PI, 0]}><planeGeometry args={[2.15, 2.99]} /><meshStandardMaterial color="#dbc99f" roughness={.86} /></mesh>
      <mesh ref={seal} position={[2.17, -.61, .105]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[.145, .15, .055, 32]} /><meshStandardMaterial color="#c8a55d" metalness={.8} roughness={.3} emissive="#ffd79d" emissiveIntensity={0} /></mesh>
    </group>
  </group>
}

export default function InvitationScene({ phase, device, active, onReady, onFailure }: { phase: CardPhase; device: DevicePerformance; active: boolean; onReady: () => void; onFailure: () => void }) {
  return <Canvas aria-hidden="true" dpr={device.dpr} frameloop={active ? 'always' : 'never'} camera={{ position: [0, 0, 6.7], fov: 36 }} gl={{ alpha: true, antialias: !device.mobile, powerPreference: 'low-power' }} onCreated={({ gl }) => { gl.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); onFailure() }, { once: true }) }}>
    <ambientLight intensity={1.9} color="#fff1df" /><directionalLight position={[-4, 5, 7]} intensity={3.2} color="#ffe0b4" /><directionalLight position={[4, -1, 3]} intensity={.9} color="#e5b2a4" />
    <Card phase={phase} onReady={onReady} /><ParticleSystem count={device.mobile ? 14 : 25} spread={3} size={.55} />
    <ParticleSystem count={device.mobile ? 8 : 16} spread={3} size={.3} petals={false} />
  </Canvas>
}
