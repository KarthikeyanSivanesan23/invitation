import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { CanvasTexture, DoubleSide, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from 'three'

const noise = (x: number, y: number) => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return value - Math.floor(value)
}

function texture(kind: 'stone' | 'granite' | 'grass' | 'bark' | 'water' | 'silk', height = false) {
  const size = kind === 'stone' || kind === 'granite' ? 512 : 256
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const c = canvas.getContext('2d')!
  const pixels = c.createImageData(size, size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const n = noise(x, y)
    const cloud = Math.sin(x * .047 + Math.sin(y * .035) * 2) * Math.cos(y * .038 + x * .012)
    let r = 215, g = 207, b = 190
    let grain = (n - .5) * 24 + cloud * 8
    if (kind === 'granite') { r = 175; g = 179; b = 167; grain = (n - .5) * 65 + cloud * 12 }
    if (kind === 'grass') { r = 117; g = 132; b = 89; grain = (n - .5) * 22 + cloud * 5 }
    if (kind === 'bark') { r = 139; g = 129; b = 102; grain = (n - .5) * 31 + Math.sin(y * .56) * 11 + Math.sin(x * .11) * 9 }
    if (kind === 'silk') { r = 210; g = 183; b = 128; grain = ((x % 3 === 0 ? 1 : -1) + (y % 3 === 0 ? 1 : -1)) * 8 + (n - .5) * 10 }
    const i = (y * size + x) * 4
    if (kind === 'water') {
      pixels.data[i] = 128 + Math.sin(x * .13 + Math.sin(y * .09)) * 24
      pixels.data[i + 1] = 128 + Math.cos(y * .18 + x * .03) * 24
      pixels.data[i + 2] = 245
    } else {
      pixels.data[i] = height ? 150 + grain * 2 : r + grain
      pixels.data[i + 1] = height ? 150 + grain * 2 : g + grain
      pixels.data[i + 2] = height ? 150 + grain * 2 : b + grain
    }
    pixels.data[i + 3] = 255
  }
  c.putImageData(pixels, 0, 0)
  if (kind === 'stone') {
    // Fine age streaks are baked into one shared texture, rather than separate decals.
    for (let i = 0; i < 65; i++) {
      const x = noise(i, 43) * size, y = noise(i, 87) * size
      const shade = c.createLinearGradient(x, y, x + 3, y + 60)
      shade.addColorStop(0, height ? 'rgba(35,35,35,.15)' : 'rgba(79,76,52,.12)')
      shade.addColorStop(1, 'rgba(79,76,52,0)')
      c.fillStyle = shade; c.fillRect(x, y, 1 + noise(i, 66) * 5, 30 + noise(i, 91) * 70)
    }
  }
  const map = new CanvasTexture(canvas)
  map.wrapS = map.wrapT = RepeatWrapping
  map.anisotropy = 4
  if (!height && kind !== 'water') map.colorSpace = SRGBColorSpace
  if (kind === 'grass') map.repeat.set(220, 220)
  if (kind === 'bark') map.repeat.set(1, 4)
  if (kind === 'water') map.repeat.set(4, 10)
  return map
}

function foliageTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512
  const c = canvas.getContext('2d')!
  const clusters = Array.from({ length: 31 }, (_, i) => {
    const angle = noise(i, 3) * Math.PI * 2, radius = Math.sqrt(noise(i, 4)) * 162
    return [256 + Math.cos(angle) * radius, 256 + Math.sin(angle) * radius * .83]
  })
  for (let i = 0; i < 9000; i++) {
    const cluster = clusters[i % clusters.length]
    const a = noise(i, 17) * Math.PI * 2, radius = Math.sqrt(noise(i, 21)) * 51
    const x = cluster[0] + Math.cos(a) * radius, y = cluster[1] + Math.sin(a) * radius
    const light = 1 - y / 512, variation = noise(i, 81) * 42
    c.fillStyle = `rgb(${Math.floor(39 + light * 44 + variation)},${Math.floor(66 + light * 48 + variation)},${Math.floor(31 + light * 19 + variation * .45)})`
    c.beginPath(); c.ellipse(x, y, 2.4 + noise(i, 62) * 3.3, 1.1 + noise(i, 83) * 1.6, a, 0, Math.PI * 2); c.fill()
  }
  const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace; map.anisotropy = 4
  return map
}

function createMaterials(night = false) {
  const stoneMap = texture('stone'), bump = texture('stone', true), granite = texture('granite'), graniteBump = texture('granite', true)
  const grass = texture('grass'), bark = texture('bark'), ripples = texture('water'), silk = texture('silk'), foliage = foliageTexture()
  const stone = (color: string, bumpScale = .055) => new MeshStandardMaterial({ map: stoneMap, bumpMap: bump, bumpScale, color, roughness: .91, metalness: 0 })
  const materials = {
    sandstone: stone('#d4c6af'),
    limestone: stone('#fff2da', .035),
    carving: stone('#d9cfb9', .025),
    agedStone: stone('#a6997c', .07),
    niche: stone('#4a4940', .015),
    granite: new MeshStandardMaterial({ map: granite, bumpMap: graniteBump, bumpScale: .06, color: '#8a918b', roughness: .82 }),
    pavement: new MeshStandardMaterial({ map: granite, bumpMap: graniteBump, bumpScale: .025, color: '#d3cdbb', roughness: .62 }),
    darkPavement: new MeshStandardMaterial({ map: granite, bumpMap: graniteBump, bumpScale: .025, color: '#8e9289', roughness: .66 }),
    plaster: stone('#f0e8d5', .02),
    vermilion: stone('#a15b4e', .025),
    copper: new MeshStandardMaterial({ map: stoneMap, color: '#897951', roughness: .64, metalness: .42 }),
    brass: new MeshStandardMaterial({ color: '#d1ab60', roughness: .28, metalness: .87 }),
    antiqueBrass: new MeshStandardMaterial({ map: granite, color: '#c6a766', roughness: .42, metalness: .78 }),
    grass: new MeshStandardMaterial({ map: grass, color: '#89947a', roughness: 1 }),
    bark: new MeshStandardMaterial({ map: bark, bumpMap: bark, bumpScale: .05, roughness: .96 }),
    palmLeaf: new MeshStandardMaterial({ color: '#486342', roughness: .77, side: DoubleSide }),
    bananaLeaf: new MeshStandardMaterial({ color: '#657b43', roughness: .7, side: DoubleSide }),
    // Baked leaflet shading avoids visible lighting seams between crossed canopy cards.
    shrub: new MeshBasicMaterial({ map: foliage, color: '#aabb95', alphaTest: .45, side: DoubleSide }),
    jasmine: new MeshStandardMaterial({ color: '#f5ead3', roughness: .88 }),
    rose: new MeshStandardMaterial({ color: '#96384d', roughness: .86 }),
    marigold: new MeshStandardMaterial({ color: '#d59538', roughness: .86 }),
    flame: new MeshBasicMaterial({ color: '#fff0c4', toneMapped: false }),
    silk: new MeshPhysicalMaterial({ map: silk, color: '#d3b56c', roughness: .65, metalness: .15, sheen: 1, sheenColor: '#f6d798', side: DoubleSide }),
    water: new MeshPhysicalMaterial({ color: '#38605b', normalMap: ripples, roughness: .16, metalness: .28, clearcoat: 1, clearcoatRoughness: .12, envMapIntensity: 1.15 }),
  }
  materials.water.normalScale.set(.16, .16)
  if (night) materials.shrub.color.multiplyScalar(.28)
  return { materials, textures: [stoneMap, bump, granite, graniteBump, grass, bark, ripples, silk, foliage] }
}

type Materials = ReturnType<typeof createMaterials>['materials']
const MaterialContext = createContext<Materials | null>(null)

export function TempleMaterialsProvider({ children, night = false }: { children: ReactNode; night?: boolean }) {
  const resources = useMemo(() => createMaterials(night), [night])
  useEffect(() => () => {
    Object.values(resources.materials).forEach(material => material.dispose())
    resources.textures.forEach(map => map.dispose())
  }, [resources])
  return <MaterialContext.Provider value={resources.materials}>{children}</MaterialContext.Provider>
}

export function useTempleMaterials() {
  const materials = useContext(MaterialContext)
  if (!materials) throw new Error('Temple materials require TempleMaterialsProvider')
  return materials
}
