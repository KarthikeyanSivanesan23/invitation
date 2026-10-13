import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { ACESFilmicToneMapping } from 'three'
import CameraController from './CameraController'
import ParticleSystem from './ParticleSystem'
import Atmosphere from './Atmosphere'
import { TempleEnvironment } from './ProceduralTemple'
import type { DevicePerformance } from '../hooks/useDevicePerformance'
import { TempleMaterialsProvider } from './TempleMaterials'
import TempleLighting from './TempleLighting'
import TempleSky from './TempleSky'

export default function TempleJourney({ progress, active, device, night = false, onFailure }: { progress: { current: number }; active: boolean; device: DevicePerformance; night?: boolean; onFailure: () => void }) {
  return <Canvas aria-hidden="true" dpr={device.dpr} shadows={!device.mobile} frameloop={active ? 'always' : 'never'} camera={{ position: night ? [7, 7, 27] : [17, 23, 52], fov: device.mobile ? 58 : 44, near: .15, far: 260 }} gl={{ antialias: !device.mobile, alpha: true, powerPreference: 'low-power', toneMapping: ACESFilmicToneMapping, toneMappingExposure: night ? 1.1 : .9 }} onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); onFailure() }, { once: true })}>
    <fogExp2 attach="fog" args={[night ? '#172c36' : '#d6dbcc', .006]} />
    <TempleLighting mobile={device.mobile} night={night} />
    <CameraController progress={progress} night={night} mobile={device.mobile} /><TempleMaterialsProvider night={night}><TempleEnvironment mobile={device.mobile} /></TempleMaterialsProvider>
    {!night && <Atmosphere progress={progress} mobile={device.mobile} />}
    <ParticleSystem count={device.particles} spread={25} progress={progress} /><ParticleSystem count={device.mobile ? 20 : 45} spread={18} petals={false} />
    {night ? <Stars radius={110} depth={35} count={device.mobile ? 160 : 450} factor={2} saturation={0} fade speed={.12} /> : <group>
      <TempleSky />
      {[0, 1, 2].map(i => <mesh key={i} position={[-15 + i * 6, 14, 0]} rotation={[0, 0, -.45]}><cylinderGeometry args={[.2, 4, 40, 6, 1, true]} /><meshBasicMaterial color="#ffe4ad" transparent opacity={.035} depthWrite={false} /></mesh>)}
    </group>}
    {night && <><pointLight position={[-6, 10, 8]} intensity={110} distance={32} color="#ffc178" /><pointLight position={[6, 8, 5]} intensity={65} distance={28} color="#ffc47d" /><pointLight position={[0, 4, 1]} intensity={23} distance={15} color="#ffc47d" /></>}
  </Canvas>
}
