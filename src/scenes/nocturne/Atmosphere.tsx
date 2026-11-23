import { useMemo } from 'react'
import { AdditiveBlending, Color } from 'three'

const haloVertex = `varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const haloFragment = `uniform vec3 glow;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float halo = exp(-dot(p * vec2(1.2, 1.0), p * vec2(1.2, 1.0)) * 3.5);
    halo *= 1.0 - smoothstep(0.65, 1.0, max(abs(p.x), abs(p.y)));
    gl_FragColor = vec4(glow * 0.28, halo);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`
export function Atmosphere() {
  const fog = useMemo(() => new Color('#05070b'), [])
  const uniforms = useMemo(() => ({ glow: { value: new Color(0, 0, 0) } }), [])
  return <>
    <fog attach="fog" args={[fog, 17, 74]} />
    <group name="nocturne-atmosphere">
    {/* Slow, local depth illumination; no shadows or fixture-onset coupling. */}
    <pointLight name="nocturne-depth-spill" position={[0, 2.8, -42]} color="#6e879c" intensity={0} distance={22} decay={2} />
    <mesh name="nocturne-gate-light" position={[0, 1.9, -51.4]}>
      <boxGeometry args={[2.3, 3.8, 0.18]} />
      <meshStandardMaterial color="#060a0e" emissive="#000000" emissiveIntensity={1.4} roughness={0.9} metalness={0} toneMapped={false} />
    </mesh>
    <mesh name="nocturne-gate-haze" position={[0, 2.8, -50.9]}>
      <planeGeometry args={[15, 11]} />
      <shaderMaterial uniforms={uniforms} vertexShader={haloVertex} fragmentShader={haloFragment}
        blending={AdditiveBlending} transparent depthWrite={false} />
    </mesh>
    </group>
  </>
}
