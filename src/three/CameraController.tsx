import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, Color, DirectionalLight, FogExp2, MathUtils, Vector3 } from 'three'

export default function CameraController({ progress, night = false, mobile = false }: { progress: { current: number }; night?: boolean; mobile?: boolean }) {
  const smoothed = useRef(0)
  const light = useRef<DirectionalLight>(null)
  const curves = useMemo(() => ({
    path: new CatmullRomCurve3((night ? [[7, 7, 27], [15, 16, 36], [23, 26, 45], [31, 37, 55]] : [mobile ? [9, 25, 61] : [17, 23, 52], [9, 17, 38], [2.5, 10, 24], [0, 5.1, 13], [0, 3.6, 4], [0, 3.2, -6]]).map(p => new Vector3(...p))),
    target: new CatmullRomCurve3((night ? [[0, 8, 0], [0, 7, 0], [0, 6, 0], [0, 4, -2]] : [mobile ? [0, 14, 0] : [-2, 6, 0], [-1, mobile ? 11 : 8, 0], [0, 7.3, 0], [0, 4.7, -3], [0, 3.5, -12], [0, 2.8, -15]]).map(p => new Vector3(...p))),
    position: new Vector3(), look: new Vector3(), fogDay: new Color('#d6dbcc'), fogWarm: new Color('#d9c8ad'), fogNight: new Color('#172c36'),
  }), [night, mobile])
  useFrame(({ camera, scene }, delta) => {
    smoothed.current = MathUtils.damp(smoothed.current, progress.current, 4.5, Math.min(delta, .05))
    const p = MathUtils.clamp(smoothed.current, 0, 1)
    curves.path.getPoint(p, curves.position); curves.target.getPoint(p, curves.look)
    camera.position.copy(curves.position); camera.lookAt(curves.look)
    if (scene.fog instanceof FogExp2) {
      scene.fog.density = night ? .01 + p * .003 : .0055 - p * .003
      scene.fog.color.copy(night ? curves.fogNight : curves.fogDay).lerp(night ? curves.fogNight : curves.fogWarm, p)
    }
    if (light.current) light.current.intensity = night ? .65 : 3.1 + p * .25
  })
  return <directionalLight ref={light} position={[-24, 32, 25]} color={night ? '#b6c9e6' : '#fff0da'} intensity={night ? .65 : 3.1} castShadow={!mobile} shadow-mapSize={[2048, 2048]} shadow-camera-left={-29} shadow-camera-right={29} shadow-camera-top={29} shadow-camera-bottom={-29} shadow-camera-near={1} shadow-camera-far={110} shadow-normalBias={.035} shadow-bias={-.00008} shadow-radius={2} />
}
