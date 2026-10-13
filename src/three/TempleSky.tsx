import { useMemo } from 'react'
import { BackSide, Color, Vector3 } from 'three'

export default function TempleSky() {
  const uniforms = useMemo(() => ({
    zenith: { value: new Color('#668fae') },
    horizon: { value: new Color('#d0d8d5') },
    sunDirection: { value: new Vector3(-25, 20, 20).normalize() },
  }), [])
  return <mesh scale={240} renderOrder={-10}>
    <sphereGeometry args={[1, 24, 16]} />
    <shaderMaterial side={BackSide} depthWrite={false} uniforms={uniforms} vertexShader={`
      varying vec3 worldDirection;
      void main() {
        worldDirection = (modelMatrix * vec4(position, 1.0)).xyz;
        vec4 clip = projectionMatrix * viewMatrix * vec4(worldDirection, 1.0);
        gl_Position = clip.xyww;
      }
    `} fragmentShader={`
      varying vec3 worldDirection;
      uniform vec3 zenith;
      uniform vec3 horizon;
      uniform vec3 sunDirection;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 cell = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(cell), hash(cell + vec2(1,0)), f.x), mix(hash(cell + vec2(0,1)), hash(cell + vec2(1,1)), f.x), f.y);
      }
      void main() {
        vec3 direction = normalize(worldDirection - cameraPosition);
        float elevation = max(direction.y, 0.0);
        vec3 sky = mix(horizon, zenith, pow(elevation, 0.34));
        vec2 p = direction.xz / max(direction.y + 0.22, 0.1) * 2.6;
        float cloud = noise(p) * 0.58 + noise(p * 2.1) * 0.27 + noise(p * 4.3) * 0.15;
        cloud = smoothstep(0.57, 0.82, cloud) * smoothstep(0.015, 0.2, elevation) * 0.3;
        sky = mix(sky, vec3(0.78, 0.8, 0.75), cloud);
        float sun = pow(max(dot(direction, sunDirection), 0.0), 1800.0);
        sky += vec3(1.0, 0.8, 0.55) * sun;
        gl_FragColor = vec4(sky, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `} />
  </mesh>
}
