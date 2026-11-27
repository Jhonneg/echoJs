import { useMemo } from 'react'
import { AdditiveBlending, Color } from 'three'
import { HAZE } from './effects'
import { NOCTURNE_LIGHT_COLORS } from './lighting'

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
// NT16 haze: the same soft falloff, with its own strength (layers in front of the gate and
// glows at the fixtures).
const hazeFragment = `uniform vec3 glow;
  uniform float strength;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float haze = exp(-dot(p, p) * 3.0) * (1.0 - smoothstep(0.7, 1.0, max(abs(p.x), abs(p.y))));
    gl_FragColor = vec4(glow * strength, haze);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`
// A beam of gate light lying along the floor: brightest at the gate, fading toward the camera.
const beamFragment = `uniform vec3 glow;
  uniform float strength;
  varying vec2 vUv;
  void main() {
    float across = (vUv.x - 0.5) * 2.0;
    float beam = exp(-across * across * 4.0) * vUv.y * vUv.y * (1.0 - smoothstep(0.96, 1.0, vUv.y));
    gl_FragColor = vec4(glow * strength, beam);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`
const hazeProps = { blending: AdditiveBlending, transparent: true, depthWrite: false } as const

export function Atmosphere() {
  const fog = useMemo(() => new Color('#05070b'), [])
  const uniforms = useMemo(() => ({ glow: { value: new Color(0, 0, 0) } }), [])
  // Extra gate layers and the floor beam share the gate's colour (set by LightingDriver).
  const layers = useMemo(() => HAZE.gateLayers.slice(1).map(layer => ({ glow: uniforms.glow, strength: { value: layer.strength } })), [uniforms])
  const beam = useMemo(() => ({ glow: uniforms.glow, strength: { value: HAZE.beam.strength } }), [uniforms])
  // Fixture glows: colour times level, set each frame by LightingDriver.
  const fixtures = useMemo(() => ({
    magenta: { glow: { value: new Color(0, 0, 0) }, strength: { value: HAZE.fixtures.magenta.strength }, color: new Color(NOCTURNE_LIGHT_COLORS.magenta) },
    cyan: { glow: { value: new Color(0, 0, 0) }, strength: { value: HAZE.fixtures.cyan.strength }, color: new Color(NOCTURNE_LIGHT_COLORS.cyan) },
    bridge: { glow: { value: new Color(0, 0, 0) }, strength: { value: HAZE.fixtures.bridge.strength }, color: new Color(NOCTURNE_LIGHT_COLORS.magenta) },
  }), [])
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
    {HAZE.gateLayers.slice(1).map((layer, i) => <mesh key={layer.z} name={`nocturne-haze-gate-${i + 1}`} position={[0, 2.6, layer.z]}>
      <planeGeometry args={[layer.width, layer.height]} />
      <shaderMaterial uniforms={layers[i]} vertexShader={haloVertex} fragmentShader={hazeFragment} {...hazeProps} />
    </mesh>)}
    <mesh name="nocturne-haze-beam" position={[0, 0.03, -51 + HAZE.beam.length / 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[HAZE.beam.width, HAZE.beam.length]} />
      <shaderMaterial uniforms={beam} vertexShader={haloVertex} fragmentShader={beamFragment} {...hazeProps} />
    </mesh>
    {(Object.keys(fixtures) as (keyof typeof fixtures)[]).map(name => {
      const f = HAZE.fixtures[name]
      return <mesh key={name} name={`nocturne-haze-${name}`} position={[...f.position]} userData={{ hazeColor: fixtures[name].color }}>
        <planeGeometry args={[...f.size]} />
        <shaderMaterial uniforms={{ glow: fixtures[name].glow, strength: fixtures[name].strength }} vertexShader={haloVertex} fragmentShader={hazeFragment} {...hazeProps} />
      </mesh>
    })}
    </group>
  </>
}
