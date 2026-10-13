import { useEffect, useMemo } from 'react'
import { CylinderGeometry, Shape, Vector2 } from 'three'
import { Instances, offsetPlacement, type Placement, type V3 } from './TempleGeometry'
import { useTempleMaterials } from './TempleMaterials'

const tiers = Array.from({ length: 8 }, (_, i) => ({ width: 10.15 - i * .96, depth: 5.25 - i * .39, y: 6.35 + i * 1.4, index: i }))

function SculptedTiers() {
  const m = useTempleMaterials()
  const frustum = useMemo(() => new CylinderGeometry(.63, Math.SQRT1_2, 1, 4, 1).rotateY(Math.PI / 4), [])
  useEffect(() => () => frustum.dispose(), [frustum])
  const details = useMemo(() => {
    const niches: Placement[] = [], teeth: Placement[] = [], balustrades: Placement[] = [], cornerUrns: Placement[] = []
    for (const tier of tiers) {
      for (const face of [0, Math.PI, Math.PI / 2, -Math.PI / 2]) {
        const frontal = Math.abs(Math.sin(face)) < .5
        const span = frontal ? tier.width : tier.depth
        const depth = frontal ? tier.depth : tier.width
        const count = Math.max(2, Math.floor(span / .96))
        for (let i = 0; i < count; i++) {
          const x = -span / 2 + .53 + i * (span - 1.06) / (count - 1)
          niches.push({ position: [Math.cos(face) * x + Math.sin(face) * (depth * .465 + .05), tier.y + .64, -Math.sin(face) * x + Math.cos(face) * (depth * .465 + .05)], rotation: [0, face, 0] })
        }
        for (let i = 0; i < Math.ceil(span * 3); i++) {
          const x = -span / 2 + i / (Math.ceil(span * 3) - 1) * span
          teeth.push({ position: [Math.cos(face) * x + Math.sin(face) * (depth / 2 + .23), tier.y + .04, -Math.sin(face) * x + Math.cos(face) * (depth / 2 + .23)], rotation: [0, face, 0], scale: [.13, .15, .14] })
        }
      }
      for (const x of [-1, 1]) for (const z of [-1, 1]) {
        cornerUrns.push({ position: [x * (tier.width / 2 - .12), tier.y + 1.19, z * (tier.depth / 2 - .12)], scale: [.15, .19, .15] })
        balustrades.push({ position: [x * (tier.width / 2 - .12), tier.y + .63, z * (tier.depth / 2 - .12)], scale: [.26, .86, .25] })
      }
    }
    return { niches, teeth, cornerUrns, balustrades }
  }, [])
  const nicheShape = useMemo(() => new Shape().moveTo(-.3, -.36).lineTo(.3, -.36).lineTo(.3, .07).quadraticCurveTo(.3, .38, 0, .43).quadraticCurveTo(-.3, .38, -.3, .07).closePath(), [])
  const crown = useMemo(() => [new Vector2(0, 0), new Vector2(.74, 0), new Vector2(.9, .2), new Vector2(.55, .35), new Vector2(.8, .6), new Vector2(.68, .9), new Vector2(.24, 1.12), new Vector2(0, 1.5)], [])
  return <group>
    {tiers.map(tier => <group key={tier.index} position={[0, tier.y, 0]}>
      <mesh position={[0, .56, 0]} scale={[tier.width, 1.1, tier.depth]} geometry={frustum} material={m.sandstone} castShadow receiveShadow />
      <mesh position={[0, -.11, 0]} material={m.agedStone} castShadow><boxGeometry args={[tier.width + .6, .18, tier.depth + .65]} /></mesh>
      <mesh position={[0, -.22, 0]} material={m.limestone} receiveShadow><boxGeometry args={[tier.width + .48, .07, tier.depth + .52]} /></mesh>
      <mesh position={[0, .08, 0]} material={m.limestone} castShadow><boxGeometry args={[tier.width + .77, .11, tier.depth + .78]} /></mesh>
      <mesh position={[0, 1.12, 0]} material={m.agedStone} scale={[tier.width + .32, .18, tier.depth + .38]} geometry={frustum} castShadow />
      <mesh position={[0, 1.24, 0]} material={m.carving}><boxGeometry args={[tier.width - .15, .085, tier.depth - .04]} /></mesh>
    </group>)}
    <Instances placements={details.teeth} material={m.carving}><boxGeometry args={[1, 1, 1]} /></Instances>
    <Instances placements={details.balustrades} material={m.carving}><boxGeometry args={[1, 1, 1]} /></Instances>
    <Instances placements={details.cornerUrns} material={m.carving}><latheGeometry args={[crown, 8]} /></Instances>
    <Instances placements={details.niches} material={m.niche} castShadow={false}><shapeGeometry args={[nicheShape, 12]} /></Instances>
    <Instances placements={details.niches.map(p => offsetPlacement(p, [0, .06, .025]))} material={m.limestone}><torusGeometry args={[.31, .046, 6, 16, Math.PI]} /></Instances>
    <Instances placements={details.niches.flatMap(p => [-1, 1].map(side => offsetPlacement(p, [side * .31, -.14, .04], [.068, .42, .11])))} material={m.limestone}><boxGeometry args={[1, 1, 1]} /></Instances>
    <Instances placements={details.niches.map(p => offsetPlacement(p, [0, -.39, .08], [.74, .075, .24]))} material={m.carving}><boxGeometry args={[1, 1, 1]} /></Instances>
    <Instances placements={details.niches.map(p => offsetPlacement(p, [0, -.035, .13], [1, 1, .72]))} material={m.carving}><capsuleGeometry args={[.08, .2, 3, 8]} /></Instances>
    <Instances placements={details.niches.map(p => offsetPlacement(p, [0, .19, .15]))} material={m.carving}><sphereGeometry args={[.089, 8, 6]} /></Instances>
    <Instances placements={details.niches.map(p => offsetPlacement(p, [0, .31, .12], [1, 1.3, 1]))} material={m.carving}><coneGeometry args={[.085, .15, 8]} /></Instances>
    <Instances placements={details.niches.flatMap(p => [-1, 1].map(side => offsetPlacement(p, [side * .105, -.235, .15], [1.3, .8, 1.4])))} material={m.carving}><sphereGeometry args={[.1, 8, 5]} /></Instances>
    <Instances placements={details.niches.flatMap(p => [-1, 1].map(side => offsetPlacement(p, [side * .13, -.035, .11], [.045, .21, .065])))} material={m.carving}><sphereGeometry args={[1, 6, 5]} /></Instances>
    <Instances placements={details.niches.map(p => offsetPlacement(p, [0, .47, .015], [.15, .14, .09]))} material={m.agedStone}><sphereGeometry args={[1, 8, 6]} /></Instances>
  </group>
}

function TempleCrown() {
  const m = useTempleMaterials()
  const finials = useMemo<Placement[]>(() => Array.from({ length: 7 }, (_, i) => ({ position: [-1.65 + i * .55, 18.45, 0], scale: [.17, .85, .17] })), [])
  const profile = useMemo(() => [[0, 0], [.68, 0], [.68, .07], [.4, .1], [.42, .25], [.83, .38], [.8, .56], [.38, .68], [.31, .89], [0, 1.1]].map(p => new Vector2(...p)), [])
  return <group>
    <mesh position={[0, 17.6, 0]} material={m.agedStone}><boxGeometry args={[4.04, .3, 2.97]} /></mesh>
    <mesh position={[0, 17.86, 0]} rotation={[0, 0, Math.PI / 2]} scale={[.78, 3.8, 1.18]} material={m.carving} castShadow receiveShadow><cylinderGeometry args={[1, 1, 1, 24, 1, false, 0, Math.PI]} /></mesh>
    <mesh position={[0, 18.55, 0]} material={m.copper} castShadow><boxGeometry args={[4.1, .12, .3]} /></mesh>
    <Instances placements={finials} material={m.brass}><latheGeometry args={[profile, 12]} /></Instances>
    {[-1, 1].map(side => <group key={side} position={[side * 1.94, 17.9, 0]} rotation={[0, side * Math.PI / 2, 0]}>
      <mesh material={m.agedStone}><circleGeometry args={[.74, 24, 0, Math.PI]} /></mesh>
      <mesh position={[0, .12, .014]} material={m.limestone}><torusGeometry args={[.48, .045, 6, 20, Math.PI]} /></mesh>
    </group>)}
  </group>
}

function GateAndColonnades() {
  const m = useTempleMaterials()
  const roof = useMemo(() => new CylinderGeometry(.56, Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4), [])
  useEffect(() => () => roof.dispose(), [roof])
  const columns = useMemo<Placement[]>(() => [-1, 1].flatMap(side => Array.from({ length: 8 }, (_, i) => ({ position: [side * (5.2 + i * 1.6), .42, .4] as V3 }))), [])
  const columnProfile = useMemo(() => [[.43, 0], [.43, .2], [.35, .25], [.35, .47], [.27, .55], [.21, .75], [.2, 2.8], [.25, 3.05], [.38, 3.15], [.4, 3.38], [.54, 3.45], [.54, 3.67]].map(p => new Vector2(...p)), [])
  const blocks = useMemo<Placement[]>(() => [-1, 1].flatMap(side => Array.from({ length: 7 }, (_, row) => Array.from({ length: 3 }, (_, column) => ({ position: [side * 3.37 + (column - 1) * .94, .5 + row * .72, 2.55] as V3, scale: [.89, .66, .17] as V3 })))).flat(), [])
  const stripes = useMemo<Placement[]>(() => [-1, 1].flatMap(side => Array.from({ length: 12 }, (_, i) => ({ position: [side * (5.05 + i * 1.01), 1.65, -1.61] as V3, scale: [.45, 2.75, .045] as V3 }))), [])
  const tiles = useMemo<Placement[]>(() => [-1, 1].flatMap(side => Array.from({ length: 59 }, (_, i) => [-1, 1].map(half => ({ position: [side * 11.15 - 6.38 + i * .22, 4.85, -.6 + half * 1.07] as V3, rotation: [-Math.PI / 2 + half * .2, 0, 0] as V3, scale: [1, 2.18, 1] as V3, tint: i % 4 === 0 ? '#ddc5a6' : '#ffffff' })))).flat(), [])
  return <group>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * 3.38, 2.75, 0]} material={m.granite} castShadow receiveShadow><boxGeometry args={[3, 5.5, 5]} /></mesh>
      <mesh position={[side * 11.15, 1.8, -2.1]} material={m.plaster} castShadow receiveShadow><boxGeometry args={[12.9, 3.3, .9]} /></mesh>
      <mesh position={[side * 11.15, .22, -.5]} material={m.granite} receiveShadow><boxGeometry args={[13.4, .4, 4.4]} /></mesh>
      <mesh position={[side * 11.15, 4.27, -.6]} material={m.agedStone} castShadow><boxGeometry args={[13.55, .32, 4.3]} /></mesh>
      <mesh position={[side * 11.15, 4.5, -.6]} material={m.carving} castShadow><boxGeometry args={[13.8, .12, 4.5]} /></mesh>
      <mesh position={[side * 11.15, 4.77, -.6]} scale={[13.6, .45, 4.2]} geometry={roof} material={m.vermilion} castShadow />
      <mesh position={[side * 2.0, 2.83, 2.7]} material={m.agedStone} castShadow><boxGeometry args={[.24, 5.1, .26]} /></mesh>
      <mesh position={[side * 1.79, 2.84, 2.53]} material={m.carving}><boxGeometry args={[.13, 4.97, .27]} /></mesh>
    </group>)}
    <Instances placements={blocks} material={m.agedStone}><boxGeometry args={[1, 1, 1]} /></Instances>
    <Instances placements={stripes} material={m.vermilion}><boxGeometry args={[1, 1, 1]} /></Instances>
    <Instances placements={tiles} material={m.vermilion}><cylinderGeometry args={[.115, .115, 1, 8, 1, true, -Math.PI / 2, Math.PI]} /></Instances>
    <Instances placements={columns} material={m.granite}><latheGeometry args={[columnProfile, 8]} /></Instances>
    <Instances placements={columns.map(p => offsetPlacement(p, [0, 3.7, 0], [1.04, .23, .8]))} material={m.agedStone}><boxGeometry args={[1, 1, 1]} /></Instances>
    <Instances placements={columns.map(p => offsetPlacement(p, [0, 1.1, .23], [.16, .65, .12]))} material={m.carving}><capsuleGeometry args={[1, 1, 3, 6]} /></Instances>
    <mesh position={[0, 5.67, 0]} material={m.granite} castShadow><boxGeometry args={[10.17, .8, 5.45]} /></mesh>
    <mesh position={[0, 6.06, 0]} material={m.limestone} castShadow><boxGeometry args={[10.65, .12, 5.85]} /></mesh>
    <mesh position={[0, 5.83, 2.8]} material={m.agedStone}><boxGeometry args={[9.8, .42, .25]} /></mesh>
    <mesh position={[0, 5.8, 2.98]} material={m.carving}><torusGeometry args={[.27, .067, 8, 32]} /></mesh>
    <mesh position={[0, 5.8, 2.96]} material={m.brass}><circleGeometry args={[.19, 24]} /></mesh>
    {[0, 1, 2, 3, 4].map(i => <mesh key={i} position={[0, .07 + i * .1, 4.7 - i * .4]} material={i % 2 ? m.pavement : m.granite} receiveShadow><boxGeometry args={[11.4 - i * .35, .14, 1.3]} /></mesh>)}
  </group>
}

function WeddingDecorations() {
  const m = useTempleMaterials()
  const garlands = useMemo(() => {
    const flowers: Placement[] = [], leaves: Placement[] = [], swags: Placement[] = []
    for (let i = 0; i < 110; i++) {
      const a = i / 109 * Math.PI
      flowers.push({ position: [Math.cos(a) * 1.81, 3.45 + Math.sin(a) * 1.62, 2.94], scale: [.09, .1, .095] })
    }
    for (let side = -1; side <= 1; side += 2) for (let i = 0; i < 66; i++) flowers.push({ position: [side * (1.84 + Math.sin(i * 1.7) * .045), .55 + i * .045, 2.95], scale: [.105, .08, .09] })
    for (let i = 0; i < 80; i++) {
      const x = -4.4 + i / 79 * 8.8
      swags.push({ position: [x, 5.28 - Math.abs(Math.sin(i / 79 * Math.PI * 4)) * .47, 2.97], scale: [.075, .085, .075] })
      if (i % 2 === 0) leaves.push({ position: [x, 5.19 - Math.abs(Math.sin(i / 79 * Math.PI * 4)) * .47, 3], rotation: [0, 0, Math.sin(i) * .2], scale: [.044, .21, .018] })
    }
    return { flowers, swags, leaves }
  }, [])
  const bell = useMemo(() => [[0, 0], [.23, 0], [.25, .035], [.17, .085], [.11, .3], [.07, .37], [0, .38]].map(p => new Vector2(...p)), [])
  return <group>
    <Instances placements={garlands.flowers} material={m.jasmine}><icosahedronGeometry args={[1, 1]} /></Instances>
    <Instances placements={garlands.flowers.filter((_, i) => i % 12 < 3).map(p => ({ ...p, scale: [.12, .105, .11] as V3 }))} material={m.rose}><icosahedronGeometry args={[1, 1]} /></Instances>
    <Instances placements={garlands.swags} material={m.marigold}><icosahedronGeometry args={[1, 1]} /></Instances>
    <Instances placements={garlands.leaves} material={m.bananaLeaf}><sphereGeometry args={[1, 6, 4]} /></Instances>
    <Instances placements={[-1.32, 0, 1.32].map(x => ({ position: [x, 4.52, 1.9] as V3 }))} material={m.brass}><latheGeometry args={[bell, 16]} /></Instances>
    <Instances placements={[-1.32, 0, 1.32].map(x => ({ position: [x, 5.09, 1.9] as V3 }))} material={m.antiqueBrass}><cylinderGeometry args={[.009, .009, .65, 5]} /></Instances>
    <Instances placements={[-1.32, 0, 1.32].map(x => ({ position: [x, 4.47, 1.9] as V3 }))} material={m.brass}><sphereGeometry args={[.055, 8, 6]} /></Instances>
  </group>
}

export default function DetailedTemple() {
  return <group><GateAndColonnades /><SculptedTiers /><TempleCrown /><WeddingDecorations /></group>
}
