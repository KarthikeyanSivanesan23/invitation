import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Color, InstancedMesh, Material, Object3D } from 'three'

export type V3 = [number, number, number]
export interface Placement { position: V3; rotation?: V3; scale?: V3; tint?: string }

export function Instances({ placements, children, material, castShadow = true }: { placements: Placement[]; children: ReactNode; material: Material; castShadow?: boolean }) {
  const mesh = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!mesh.current) return
    const object = new Object3D(), color = new Color()
    placements.forEach((part, i) => {
      object.position.set(...part.position)
      object.rotation.set(...(part.rotation ?? [0, 0, 0]))
      object.scale.set(...(part.scale ?? [1, 1, 1]))
      object.updateMatrix(); mesh.current!.setMatrixAt(i, object.matrix)
      if (part.tint) mesh.current!.setColorAt(i, color.set(part.tint))
    })
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [placements])
  return <instancedMesh ref={mesh} args={[undefined, material, placements.length]} castShadow={castShadow} receiveShadow>{children}</instancedMesh>
}

export function offsetPlacement(part: Placement, offset: V3, scale: V3 = [1, 1, 1]): Placement {
  const angle = part.rotation?.[1] ?? 0
  return { position: [part.position[0] + Math.cos(angle) * offset[0] + Math.sin(angle) * offset[2], part.position[1] + offset[1], part.position[2] - Math.sin(angle) * offset[0] + Math.cos(angle) * offset[2]], rotation: part.rotation, scale }
}
