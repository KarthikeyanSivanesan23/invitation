import { Environment, Lightformer } from '@react-three/drei'

export default function TempleLighting({ mobile, night = false }: { mobile: boolean; night?: boolean }) {
  return <>
    <hemisphereLight args={[night ? '#a4b5cf' : '#dbe7ef', night ? '#282a25' : '#6f6557', night ? .48 : .78]} />
    <ambientLight intensity={night ? .08 : .13} color="#f4e5cf" />
    <directionalLight position={[18, 12, -15]} intensity={night ? .12 : .45} color="#bccfd9" />
    <Environment frames={1} resolution={mobile ? 64 : 128} environmentIntensity={night ? .55 : .65}>
      <color attach="background" args={[night ? '#253442' : '#a5b5ba']} />
      <Lightformer position={[0, 15, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[35, 35, 1]} intensity={night ? .5 : 1.4} color="#dce8f2" />
      <Lightformer position={[-12, 9, 8]} rotation={[0, Math.PI / 3, 0]} scale={[9, 16, 1]} intensity={night ? 1.5 : 3.5} color="#ffe1ab" />
      <Lightformer position={[0, -8, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[40, 40, 1]} intensity={.16} color="#645440" />
    </Environment>
  </>
}
