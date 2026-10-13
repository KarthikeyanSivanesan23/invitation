import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide, InstancedMesh, Object3D, PlaneGeometry, PointLight, Group } from 'three'
import type { ReactNode } from 'react'
import { wedding } from '../data/wedding'
import { hasAsset } from '../lib/assets'
import { SceneBoundary } from '../components/SceneBoundary'
import DetailedTemple from './DetailedTemple'
import TempleLandscape, { RealisticLamps } from './TempleLandscape'
import { useTempleMaterials } from './TempleMaterials'

type Position = [number, number, number]

function Repeated({ positions, geometry, color, scale = [1, 1, 1], emissive = false }: { positions: Position[]; geometry: ReactNode; color: string; scale?: Position; emissive?: boolean }) {
  const ref = useRef<InstancedMesh>(null)
  useEffect(() => {
    const dummy = new Object3D()
    positions.forEach((position, i) => {
      dummy.position.set(...position); dummy.scale.set(...scale); dummy.updateMatrix()
      ref.current?.setMatrixAt(i, dummy.matrix)
    })
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true
  }, [positions, scale])
  return <instancedMesh ref={ref} args={[undefined, undefined, positions.length]} castShadow receiveShadow>{geometry}<meshStandardMaterial color={color} roughness={.73} metalness={color === '#bd9552' ? .65 : .1} emissive={emissive ? color : '#000000'} emissiveIntensity={emissive ? 2 : 0} /></instancedMesh>
}

export function LampRows({ small = false }: { small?: boolean }) {
  return <RealisticLamps small={small} />
}

function PleatedDrape() {
  const m = useTempleMaterials()
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(5.9, 3.8, 64, 6)
    const positions = plane.attributes.position
    for (let i = 0; i < positions.count; i++) positions.setZ(i, Math.sin(positions.getX(i) * 11) * .075)
    plane.computeVertexNormals()
    return plane
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh position={[0, 2.4, -2.6]} geometry={geometry} material={m.silk} castShadow receiveShadow />
}

export function SacredFire() {
  const group = useRef<Group>(null)
  const light = useRef<PointLight>(null)
  const uniforms = useMemo(() => ({ time: { value: 0 } }), [])
  useFrame(({ clock }) => {
    uniforms.time.value = clock.elapsedTime
    const pulse = 1 + Math.sin(clock.elapsedTime * 5.2) * .09 + Math.sin(clock.elapsedTime * 8.7) * .05
    if (group.current) group.current.scale.y = pulse
    if (light.current) light.current.intensity = 5 * pulse
  })
  return <group>
    <mesh position={[0, .16, 0]}><boxGeometry args={[1.05, .32, 1.05]} /><meshStandardMaterial color="#9e673f" roughness={.9} /></mesh>
    <mesh position={[0, .33, 0]}><boxGeometry args={[.78, .05, .78]} /><meshStandardMaterial color="#592e22" /></mesh>
    <group ref={group} position={[0, .35, 0]}>
      {[0, 1, 2].map(i => <mesh key={i} position={[Math.sin(i * 2) * .1, .37, Math.cos(i * 2) * .08]} rotation={[0, i * Math.PI / 3, 0]}>
        <planeGeometry args={[.6, .96]} /><shaderMaterial uniforms={uniforms} transparent depthWrite={false} side={DoubleSide} blending={AdditiveBlending} toneMapped={false} vertexShader={`
          varying vec2 vUv;
          void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
        `} fragmentShader={`
          varying vec2 vUv; uniform float time;
          void main(){
            float y=vUv.y;
            float sway=sin(y*9.0-time*4.0)*0.06*y+sin(y*17.0+time*3.0)*0.025;
            float width=max(0.004,pow(1.0-y,0.8)*0.39);
            float edge=abs(vUv.x-0.5+sway);
            float shape=1.0-smoothstep(width*0.25,width,edge);
            shape*=smoothstep(0.0,0.09,y)*(1.0-smoothstep(0.88,1.0,y));
            vec3 color=mix(vec3(1.0,0.21,0.025),vec3(1.0,0.9,0.43),pow(shape,2.0)*(1.0-y*0.4));
            gl_FragColor=vec4(color,shape*0.78);
          }
        `} />
      </mesh>)}
    </group>
    <pointLight ref={light} position={[0, 1, 0]} color="#ffae54" intensity={5} distance={9} decay={2} />
  </group>
}

export function ProceduralMandapam() {
  const m = useTempleMaterials()
  const pillars = useMemo<Position[]>(() => [[-3.1, 2.4, -2.6], [3.1, 2.4, -2.6], [-3.1, 2.4, 2.6], [3.1, 2.4, 2.6]], [])
  const flowers = useMemo<Position[]>(() => Array.from({ length: 128 }, (_, i) => {
    const side = Math.floor(i / 32), p = (i % 32) / 31
    return side < 2 ? [-3.35 + p * 6.7, 4.8 + Math.sin(p * Math.PI) * -.4, side ? 2.9 : -2.9] : [side === 2 ? -3.35 : 3.35, 4.8 + Math.sin(p * Math.PI) * -.4, -2.9 + p * 5.8]
  }), [])
  const garlands = useMemo<Position[]>(() => Array.from({ length: 80 }, (_, i) => [(i % 4 < 2 ? -1 : 1) * 3.12, .7 + Math.floor(i / 4) * .2, i % 2 ? 2.62 : -2.62]), [])
  return <group>
    <mesh position={[0, .13, 0]} material={m.granite} receiveShadow><boxGeometry args={[8, .26, 7.6]} /></mesh>
    <mesh position={[0, .32, 0]} material={m.pavement} receiveShadow><boxGeometry args={[7.4, .2, 6.7]} /></mesh>
    <mesh position={[0, .45, 0]} receiveShadow><boxGeometry args={[6.8, .08, 6.1]} /><meshStandardMaterial color="#8b3942" roughness={.95} /></mesh>
    <Repeated positions={pillars} color="#bd9552" geometry={<cylinderGeometry args={[.16, .24, 4, 10]} />} />
    <Repeated positions={pillars.map(([x, , z]) => [x, .68, z])} color="#bd9552" geometry={<boxGeometry args={[.65, .43, .65]} />} />
    <Repeated positions={pillars.map(([x, , z]) => [x, 4.5, z])} color="#bd9552" geometry={<boxGeometry args={[.65, .3, .65]} />} />
    <mesh position={[0, 4.85, 0]} material={m.antiqueBrass} castShadow><boxGeometry args={[7.25, .23, 6.35]} /></mesh>
    <mesh position={[0, 5.15, 0]} material={m.silk}><coneGeometry args={[4.9, .65, 4]} /></mesh>
    <Repeated positions={flowers} color="#dba581" geometry={<sphereGeometry args={[.14, 6, 4]} />} />
    <Repeated positions={garlands} color="#e9dec2" geometry={<sphereGeometry args={[.1, 5, 4]} />} />
    <group position={[0, .51, 1]}><SacredFire /></group>
    <PleatedDrape />
    <mesh position={[0, 2.5, -2.5]}><torusGeometry args={[1.12, .055, 6, 48]} /><meshStandardMaterial color="#e4c88b" metalness={.65} roughness={.4} /></mesh>
    <LampRows small />
  </group>
}

export function ProceduralTemple() {
  return <DetailedTemple />
}

function LoadedModel({ url, scale }: { url: string; scale: number }) {
  const { scene } = useGLTF(url, false)
  const instance = useMemo(() => scene.clone(true), [scene])
  return <primitive object={instance} scale={scale} dispose={null} />
}

export function TempleModel() {
  const fallback = <ProceduralTemple />
  return hasAsset(wedding.templeModel) ? <SceneBoundary fallback={fallback}><Suspense fallback={fallback}><LoadedModel url={wedding.templeModel} scale={wedding.templeModelScale} /></Suspense></SceneBoundary> : fallback
}

export function MandapamModel() {
  const fallback = <ProceduralMandapam />
  return hasAsset(wedding.mandapamModel) ? <SceneBoundary fallback={fallback}><Suspense fallback={fallback}><LoadedModel url={wedding.mandapamModel} scale={wedding.mandapamModelScale} /></Suspense></SceneBoundary> : fallback
}

export function TempleEnvironment({ mobile = false }: { mobile?: boolean }) {
  return <group>
    <TempleLandscape mobile={mobile} />
    <TempleModel /><group position={[0, 0, -15]}><MandapamModel /></group><LampRows />
  </group>
}
