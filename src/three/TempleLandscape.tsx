import { useEffect, useMemo } from 'react'
import { AdditiveBlending, BufferGeometry, CanvasTexture, CatmullRomCurve3, Float32BufferAttribute, PlaneGeometry, SRGBColorSpace, TubeGeometry, Vector2, Vector3 } from 'three'
import { Instances, type Placement, type V3 } from './TempleGeometry'
import { useTempleMaterials } from './TempleMaterials'

const random = (i: number, seed = 1) => {
  const v = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453
  return v - Math.floor(v)
}

function palmFrond() {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = []
  const quad = (points: number[][]) => {
    const offset = positions.length / 3
    points.forEach((p, i) => { positions.push(...p); uvs.push(i % 2, Math.floor(i / 2)) })
    indices.push(offset, offset + 1, offset + 2, offset + 2, offset + 1, offset + 3)
  }
  for (let i = 0; i < 19; i++) {
    const t = (i + 1) / 20, x = t * 3.5, y = Math.sin(t * Math.PI) * .65 - t * t * .7
    const width = Math.pow(Math.sin(t * Math.PI), .65) * .87
    quad([[x - .14, y, -.025], [x + .12, y + .05, -.025], [x - .14, y, .025], [x + .12, y + .05, .025]])
    for (const side of [-1, 1]) quad([[x - .13, y, side * .015], [x + .06, y + .015, side * .015], [x - .48, y - .2, side * width], [x - .33, y - .28, side * (width + .11)]])
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3)); g.setAttribute('uv', new Float32BufferAttribute(uvs, 2)); g.setIndex(indices); g.computeVertexNormals()
  return g
}

function bananaLeaf() {
  const positions: number[] = [], uv: number[] = [], index: number[] = []
  for (let i = 0; i <= 18; i++) {
    const t = i / 18, y = Math.sin(t * Math.PI) * .72 - .75 * t * t, width = Math.pow(Math.sin(t * Math.PI), .75) * .46
    for (const side of [-1, 0, 1]) { positions.push(t * 2.9, y - (side ? .13 * Math.sin(t * Math.PI) : 0), side * width * (i % 5 === 0 ? .85 : 1)); uv.push(t, (side + 1) / 2) }
    if (i < 18) for (let j = 0; j < 2; j++) { const a = i * 3 + j; index.push(a, a + 3, a + 1, a + 1, a + 3, a + 4) }
  }
  const geometry = new BufferGeometry(); geometry.setAttribute('position', new Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2)); geometry.setIndex(index); geometry.computeVertexNormals()
  return geometry
}

function TropicalGarden({ mobile }: { mobile: boolean }) {
  const m = useTempleMaterials()
  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(.15, 2, .03), new Vector3(.48, 4, .06), new Vector3(.82, 6, .03), new Vector3(.95, 8, 0)])
    return { frond: palmFrond(), banana: bananaLeaf(), trunk: new TubeGeometry(curve, 20, .15, 8, false) }
  }, [])
  useEffect(() => () => Object.values(geometry).forEach(value => value.dispose()), [geometry])
  const parts = useMemo(() => {
    const trunks: Placement[] = [], palms: Placement[] = [], bananas: Placement[] = [], bananaTrunks: Placement[] = [], shrubs: Placement[] = []
    const treePositions: V3[] = [-1, 1].flatMap(side => [6, 17, 29, 41, -14].map((z, i): V3 => [side * (17.4 + (i % 2) * 3.5), 0, z]))
    treePositions.forEach(([x, , z], i) => {
      const s = .8 + random(i, 4) * .42, turn = random(i, 15) * Math.PI * 2
      trunks.push({ position: [x, 0, z], rotation: [0, turn, 0], scale: [s, s, s] })
      for (let j = 0; j < (mobile ? 7 : 9); j++) palms.push({ position: [x + Math.cos(turn) * .95 * s, 8 * s, z - Math.sin(turn) * .95 * s], rotation: [0, j * Math.PI * 2 / (mobile ? 7 : 9) + turn, -.18 + random(i * 10 + j, 12) * .4], scale: [s, s, s], tint: j % 3 === 0 ? '#d3df9d' : j % 3 === 1 ? '#aebf85' : '#ffffff' })
    })
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
      const x = side * (6 + i * 4.3), z = 3.5 + i * 3.2
      bananaTrunks.push({ position: [x, 1.43, z], rotation: [0, 0, side * .055], scale: [.15, 2.85, .15] })
      for (let j = 0; j < 7; j++) bananas.push({ position: [x, 2.78, z], rotation: [0, j * Math.PI / 3.5 + i * .8, -.2 + j * .075], scale: [.78, .78, .78], tint: j % 2 ? '#d9dd8c' : '#ffffff' })
    }
    const shrubCount = mobile ? 150 : 300
    for (let i = 0; i < shrubCount; i++) {
      const side = i % 2 ? 1 : -1, s = .3 + random(i, 45) * .55
      const x = side * (15.7 + random(i, 44) * 1.2), z = random(i, 78) * 39 - 2
      for (let angle = 0; angle < 3; angle++) shrubs.push({ position: [x, s * .52, z], scale: [s * 2.5, s * 1.9, 1], rotation: [0, angle * Math.PI / 3, 0], tint: i % 3 === 0 ? '#d0ddb4' : '#ffffff' })
    }
    for (let i = 0; i < (mobile ? 40 : 65); i++) {
      const s = 5 + random(i, 177) * 5
      const x = (random(i, 32) - .5) * 138, z = -26 - random(i, 19) * 44
      for (let angle = 0; angle < 3; angle++) shrubs.push({ position: [x, s * .45, z], scale: [s * 1.4, s, 1], rotation: [0, angle * Math.PI / 3, 0], tint: i % 3 === 0 ? '#a1b3a0' : '#ffffff' })
    }
    return { trunks, palms, bananas, bananaTrunks, shrubs }
  }, [mobile])
  return <group>
    <Instances placements={parts.trunks} material={m.bark}><primitive object={geometry.trunk} attach="geometry" /></Instances>
    <Instances placements={parts.palms} material={m.palmLeaf}><primitive object={geometry.frond} attach="geometry" /></Instances>
    <Instances placements={parts.bananas} material={m.bananaLeaf}><primitive object={geometry.banana} attach="geometry" /></Instances>
    <Instances placements={parts.bananaTrunks} material={m.bananaLeaf}><cylinderGeometry args={[.65, 1, 1, 8]} /></Instances>
    <Instances placements={parts.shrubs} material={m.shrub}><planeGeometry args={[1, 1]} /></Instances>
  </group>
}

function KolamFloor() {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512
    const c = canvas.getContext('2d')!
    c.translate(256, 256); c.strokeStyle = '#eadbc0'; c.lineWidth = 2.5
    for (let i = 0; i < 8; i++) {
      c.save(); c.rotate(i * Math.PI / 4)
      c.beginPath(); c.moveTo(0, -185); c.bezierCurveTo(105, -108, 91, -49, 0, 0); c.bezierCurveTo(-91, -49, -105, -108, 0, -185); c.stroke()
      c.beginPath(); c.ellipse(0, -199, 4, 4, 0, 0, Math.PI * 2); c.stroke(); c.restore()
    }
    for (const r of [40, 47, 215, 222]) { c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke() }
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace
    return texture
  }, [])
  useEffect(() => () => map.dispose(), [map])
  return <group>{[8, 25].map(z => <mesh key={z} position={[0, .1, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[5, 5]} /><meshStandardMaterial map={map} transparent opacity={.78} depthWrite={false} roughness={1} /></mesh>)}</group>
}

function LotusPonds({ mobile }: { mobile: boolean }) {
  const m = useTempleMaterials()
  const details = useMemo(() => {
    const leaves: Placement[] = [], petals: Placement[] = [], rims: Placement[] = []
    for (const side of [-1, 1]) {
      for (let i = 0; i < (mobile ? 9 : 16); i++) {
        const x = side * 10.5 + (random(i, side + 29) - .5) * 5.2, z = 9 + random(i, side + 18) * 18
        leaves.push({ position: [x, .05, z], rotation: [-Math.PI / 2, 0, i], scale: [.2 + random(i, 54) * .23, .2 + random(i, 54) * .23, 1] })
        if (i % 3 === 0) for (let j = 0; j < 7; j++) petals.push({ position: [x + Math.sin(j * Math.PI / 3.5) * .06, .12, z + Math.cos(j * Math.PI / 3.5) * .06], rotation: [j * .5, j * Math.PI / 3.5, .4], scale: [.065, .1, .035] })
      }
      for (const edge of [-1, 1]) {
        rims.push({ position: [side * 10.5 + edge * 3.45, .11, 18], scale: [.28, .24, 23] })
        rims.push({ position: [side * 10.5, .11, 18 + edge * 11.5], scale: [7.2, .24, .28] })
      }
    }
    return { leaves, petals, rims }
  }, [mobile])
  return <group>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * 10.5, -.08, 18]} material={m.granite}><boxGeometry args={[7.5, .19, 23.6]} /></mesh>
      <mesh position={[side * 10.5, .015, 18]} rotation={[-Math.PI / 2, 0, 0]} material={m.water}><planeGeometry args={[6.7, 22.8]} /></mesh>
      <mesh position={[side * 10.5, -.04, 18]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[6.7, 22.8]} /><meshStandardMaterial color="#315446" roughness={1} /></mesh>
    </group>)}
    <Instances placements={details.rims} material={m.agedStone}><boxGeometry args={[1, 1, 1]} /></Instances>
    <Instances placements={details.leaves} material={m.palmLeaf} castShadow={false}><circleGeometry args={[1, 16, .08, Math.PI * 1.91]} /></Instances>
    <Instances placements={details.petals} material={m.rose} castShadow={false}><sphereGeometry args={[1, 7, 5]} /></Instances>
  </group>
}

function FlowerBeds({ mobile }: { mobile: boolean }) {
  const m = useTempleMaterials()
  const placements = useMemo(() => {
    const foliage: Placement[] = [], flowers: Placement[] = [], scattered: Placement[] = []
    for (let i = 0; i < (mobile ? 140 : 280); i++) {
      const side = i % 2 ? 1 : -1, x = side * (5.9 + random(i, 1) * .48), z = 6 + random(i, 9) * 32
      for (const angle of [0, Math.PI / 2]) foliage.push({ position: [x, .16, z], scale: [.8, .6, 1], rotation: [0, angle, 0], tint: i % 2 ? '#c5d499' : '#ffffff' })
      flowers.push({ position: [x + (random(i, 54) - .5) * .2, .35, z], scale: [.09, .07, .09], rotation: [i, 0, 0] })
    }
    for (let i = 0; i < (mobile ? 55 : 110); i++) scattered.push({ position: [(random(i, 99) - .5) * 7.8, .107, 5 + random(i, 89) * 30], rotation: [-Math.PI / 2, 0, i], scale: [.035, .055, .009] })
    return { foliage, flowers, scattered }
  }, [mobile])
  return <group>
    <Instances placements={placements.foliage} material={m.shrub}><planeGeometry args={[1, 1]} /></Instances>
    <Instances placements={placements.flowers} material={m.marigold}><icosahedronGeometry args={[1, 1]} /></Instances>
    <Instances placements={placements.flowers.filter((_, i) => i % 3 === 0).map(p => ({ ...p, position: [p.position[0] + .12, p.position[1] + .015, p.position[2]] as V3 }))} material={m.rose}><icosahedronGeometry args={[1, 1]} /></Instances>
    <Instances placements={placements.scattered} material={m.rose} castShadow={false}><sphereGeometry args={[1, 6, 4]} /></Instances>
  </group>
}

export function RealisticLamps({ small = false }: { small?: boolean }) {
  const m = useTempleMaterials()
  const profile = useMemo(() => [[0, 0], [.3, 0], [.32, .045], [.28, .08], [.2, .13], [.17, .2], [.08, .25], [.055, .62], [.09, .67], [.24, .7], [.27, .74], [.075, .81], [.055, 1.12], [.11, 1.2], [.31, 1.27], [.32, 1.31], [.2, 1.34], [.08, 1.38], [0, 1.41]].map(v => new Vector2(...v)), [])
  const placements = useMemo<Placement[]>(() => Array.from({ length: small ? 8 : 20 }, (_, i) => ({ position: [(i % 2 ? 1 : -1) * (small ? 3.9 : 4.9), small ? .25 : .09, Math.floor(i / 2) * (small ? 2.35 : 3.5) - (small ? 3 : 0)] })), [small])
  const flames = useMemo<Placement[]>(() => placements.flatMap(p => Array.from({ length: 5 }, (_, i) => ({ position: [p.position[0] + Math.cos(i * Math.PI * .4) * .22, p.position[1] + 1.39, p.position[2] + Math.sin(i * Math.PI * .4) * .22] as V3, scale: [.022, .075, .022] as V3 }))), [placements])
  const glow = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64
    const c = canvas.getContext('2d')!, gradient = c.createRadialGradient(32, 32, 1, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255,234,184,.9)'); gradient.addColorStop(.15, 'rgba(255,197,113,.35)'); gradient.addColorStop(1, 'rgba(255,157,66,0)')
    c.fillStyle = gradient; c.fillRect(0, 0, 64, 64)
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace
    return map
  }, [])
  const points = useMemo(() => new Float32Array(placements.flatMap(p => [p.position[0], p.position[1] + 1.48, p.position[2]])), [placements])
  useEffect(() => () => glow.dispose(), [glow])
  return <group>
    <Instances placements={placements} material={m.brass}><latheGeometry args={[profile, 18]} /></Instances>
    <Instances placements={flames} material={m.flame} castShadow={false}><sphereGeometry args={[1, 7, 5]} /></Instances>
    <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[points, 3]} /></bufferGeometry><pointsMaterial map={glow} size={1.1} transparent opacity={.72} depthWrite={false} blending={AdditiveBlending} toneMapped={false} /></points>
  </group>
}

export default function TempleLandscape({ mobile }: { mobile: boolean }) {
  const m = useTempleMaterials()
  const hills = useMemo(() => {
    const geometry = new PlaneGeometry(430, 200, 60, 28)
    const p = geometry.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), blend = Math.min(1, Math.max(0, (y + 100) / 75))
      p.setZ(i, (11 + Math.sin(x * .018 + .7) * 6 + Math.sin(x * .043 + y * .022) * 4 + Math.cos(y * .035) * 3) * blend)
    }
    geometry.rotateX(-Math.PI / 2); geometry.computeVertexNormals()
    return geometry
  }, [])
  useEffect(() => () => hills.dispose(), [hills])
  const paving = useMemo(() => {
    const light: Placement[] = [], dark: Placement[] = [], joints: Placement[] = []
    for (let row = 0; row < 36; row++) for (let col = 0; col < 6; col++) {
      const target = col === 0 || col === 5 ? dark : light
      target.push({ position: [(col - 2.5) * 1.46, .035, row * 1.44 - 6], scale: [1.425, .1, 1.405], tint: row % 3 === 0 ? '#e0dccf' : '#ffffff' })
    }
    for (const side of [-1, 1]) joints.push({ position: [side * 4.47, .07, 19], scale: [.14, .11, 51] })
    return { light, dark, joints }
  }, [])
  return <group>
    <mesh position={[0, -.15, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.grass} receiveShadow><planeGeometry args={[2000, 2000]} /></mesh>
    <mesh geometry={hills} position={[0, -.12, -155]} receiveShadow><meshStandardMaterial color="#738571" roughness={1} /></mesh>
    <mesh position={[0, -.035, -13]} material={m.pavement} receiveShadow><boxGeometry args={[34, .11, 28]} /></mesh>
    <Instances placements={paving.light} material={m.pavement}><boxGeometry args={[1, 1, 1]} /></Instances>
    <Instances placements={paving.dark} material={m.darkPavement}><boxGeometry args={[1, 1, 1]} /></Instances>
    <Instances placements={paving.joints} material={m.agedStone}><boxGeometry args={[1, 1, 1]} /></Instances>
    <KolamFloor /><LotusPonds mobile={mobile} /><FlowerBeds mobile={mobile} /><TropicalGarden mobile={mobile} />
  </group>
}
