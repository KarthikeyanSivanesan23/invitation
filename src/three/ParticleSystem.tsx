import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, InstancedMesh, Object3D } from 'three'

export default function ParticleSystem({ count = 60, spread = 14, petals = true, speed = 1, size = 1, progress }: { count?: number; spread?: number; petals?: boolean; speed?: number; size?: number; progress?: { current: number } }) {
  const ref = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({ x: Math.sin(i * 127.1) * spread, y: (i * 1.73) % spread, z: Math.cos(i * 311.7) * spread, phase: i * 1.37, size: petals ? .035 + (i % 5) * .012 : .018 + (i % 3) * .015 })), [count, spread, petals])
  useEffect(() => {
    if (!ref.current) return
    const colors = petals ? ['#ba5360', '#d28e8c', '#e7b2a0', '#f3d4a0'] : ['#f8daa1', '#d4ab62']
    particles.forEach((_, i) => ref.current?.setColorAt(i, new Color(colors[i % colors.length])))
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [particles, petals])
  useFrame(({ clock, pointer }, delta) => {
    if (!ref.current || delta > 1) return
    const t = clock.elapsedTime * speed
    const travel = progress?.current ?? 0
    particles.forEach((particle, i) => {
      dummy.position.set(particle.x + Math.sin(t * .2 + particle.phase) * .8 + pointer.x * .12, ((particle.y - t * .15 + spread * 100) % spread) - spread * (spread < 6 ? .5 : .18), particle.z + travel * 4)
      dummy.rotation.set(t * .2 + particle.phase, t * .1, Math.sin(t * .35 + particle.phase))
      dummy.scale.set(particle.size * size * (petals ? 1.3 : 1), particle.size * size, particle.size * size * (petals ? .1 : 1))
      dummy.updateMatrix()
      ref.current?.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
    <sphereGeometry args={[1, petals ? 8 : 4, 4]} /><meshStandardMaterial roughness={.8} emissive={petals ? '#000000' : '#d7a852'} emissiveIntensity={petals ? 0 : 1.2} />
  </instancedMesh>
}
