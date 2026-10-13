import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { MandapamModel } from './ProceduralTemple'
import ParticleSystem from './ParticleSystem'
import type { DevicePerformance } from '../hooks/useDevicePerformance'
import { TempleMaterialsProvider } from './TempleMaterials'
import TempleLighting from './TempleLighting'

function Stage() {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = Math.sin(clock.elapsedTime * .08) * .07 })
  return <group ref={ref}><MandapamModel /></group>
}

export default function MandapamScene({ device, active, onFailure }: { device: DevicePerformance; active: boolean; onFailure: () => void }) {
  return <Canvas aria-hidden="true" dpr={device.dpr} shadows={!device.mobile} frameloop={active ? 'always' : 'never'} camera={{ position: [9, 7, 15], fov: 40 }} gl={{ alpha: true, antialias: !device.mobile, powerPreference: 'low-power' }} onCreated={({ camera, gl }) => { camera.lookAt(0, 2, 0); gl.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); onFailure() }, { once: true }) }}>
    <fogExp2 attach="fog" args={['#2a2423', .021]} /><TempleLighting mobile={device.mobile} night /><directionalLight position={[-5, 12, 6]} intensity={3} color="#ffe1c0" castShadow shadow-mapSize={[1024, 1024]} shadow-normalBias={.03} />
    <TempleMaterialsProvider night><Stage /></TempleMaterialsProvider><ParticleSystem count={device.particles} spread={10} /><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.06, 0]} receiveShadow><planeGeometry args={[70, 70]} /><meshStandardMaterial color="#443c31" roughness={.8} /></mesh>
  </Canvas>
}
