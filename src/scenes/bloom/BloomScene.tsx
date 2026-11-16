import { Component, useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore, type ReactNode, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Color, Group, OrthographicCamera, ShaderMaterial, Mesh, MeshStandardMaterial, Shape, Vector2, Vector3 } from 'three'
import type { AudioSignal } from '../../audio/signal'
import { createBloomResponse, updateBloomResponse, updateFragmentResponse, type BloomDebug } from './reactivity'
import { PerformanceProbe } from '../../components/PerformanceProbe'
import type { PerformanceMeasurement } from '../../engine/performance'
import { QUALITY_DPR, type GraphicsQuality } from '../../engine/quality'
import './bloom.css'

const vertex = `varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

const skyFragment = `varying vec2 vUv;
uniform vec3 midnight;
uniform vec3 lavender;
uniform vec3 rose;
uniform float atmosphere;
void main() {
  float y = vUv.y * 20.0 - 10.0;
  vec3 color = mix(lavender, midnight, smoothstep(0.0, 5.5, y));
  float horizon = exp(-abs(y) * 1.1);
  color = mix(color, rose, horizon * (0.42 + atmosphere * 0.12));
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`

// Authored reflection approximation; gentle phase motion and the same halo offsets.
// No render target, ray tracing or captured image is involved.
const waterFragment = `varying vec2 vUv;
uniform vec3 midnight;
uniform vec3 indigo;
uniform vec3 moonlight;
uniform vec3 rose;
uniform float time;
uniform vec2 haloOffset;
uniform float haloScale;
uniform float bass;
uniform float treble;
uniform float atmosphere;
void main() {
  vec2 p = vec2(vUv.x * 40.0 - 20.0, vUv.y * 10.0 - 10.0);
  float depth = -p.y;
  vec3 color = mix(indigo, midnight, smoothstep(0.0, 7.0, depth));
  color += rose * atmosphere * 0.035 * exp(-depth * 0.4);
  float distortion = sin(depth * 94.0 - time * 1.7) * 0.035 + sin(depth * 43.0 + time * 0.95) * 0.045;
  distortion *= 1.0 + bass * 2.5;
  vec2 ring = vec2(p.x - 0.6 - haloOffset.x + distortion, (p.y + 1.65 + haloOffset.y * 0.82) / 0.82) / haloScale;
  float distanceToRing = abs(length(ring) - 1.54);
  float broken = smoothstep(-0.65, -0.1, sin(atan(ring.y, ring.x) * 7.0 + 0.4));
  float bands = 0.45 + 0.55 * pow(0.5 + 0.5 * sin(depth * 110.0 - time * 1.35), 3.0);
  float reflection = exp(-distanceToRing * 52.0) * bands * (1.0 - broken * 0.75);
  float glow = exp(-distanceToRing * 5.0) * 0.10;
  float fade = exp(-depth * 0.23);
  color += moonlight * reflection * fade * (0.52 + treble * 0.32) + rose * glow * fade;
  float wash = exp(-pow((p.x - 0.6 - haloOffset.x) / (0.7 + depth * 0.25), 2.0)) * exp(-depth * 0.7);
  color += rose * wash * 0.07;
  float ripple = pow(0.5 + 0.5 * sin(depth * 80.0 + sin(p.x * 2.5) - time * 1.4), 18.0);
  color += (indigo * ripple * (0.16 + bass * 0.38) + moonlight * ripple * treble * 0.045) * exp(-depth * 0.2);
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`

function Framing() {
  const { get, size, invalidate } = useThree()
  useLayoutEffect(() => {
    const camera = get().camera
    if (camera instanceof OrthographicCamera) {
      // Hold the vertical composition; reveal more landscape on wider screens.
      camera.zoom = Math.min(size.height / 10, size.width / 5.6)
      camera.updateProjectionMatrix()
      invalidate()
    }
  }, [get, size.height, size.width, invalidate])
  return null
}

const ridges: [number, number][][] = [
  [[-20, 0.7], [-9, 1.5], [-7.2, 2.3], [-6.7, 1.9], [-5.8, 2.5], [-4.1, 1.2], [-2.5, 0.8], [-0.8, 0.35], [1.5, 0.5], [3.1, 1.3], [4, 1.0], [5.6, 2.2], [6.7, 1.7], [8, 2.4], [11, 1.1], [20, 0.9]],
  [[-20, 0.4], [-8.4, 0.7], [-6.3, 1.5], [-5.6, 1.1], [-4.7, 1.6], [-3, 0.7], [-1.8, 0.3], [0, 0.15], [2.3, 0.25], [3.8, 0.9], [4.7, 0.7], [6.2, 1.6], [7.1, 1.2], [9.5, 0.6], [20, 0.4]],
  [[-20, -0.2], [-9, 0.2], [-6, 0.7], [-4.9, 0.5], [-3.2, 0.8], [-2, 0.25], [-0.6, 0.04], [1.6, 0.03], [3.4, 0.3], [4.8, 0.65], [5.5, 0.4], [7.2, 0.85], [9, 0.2], [20, -0.1]],
]

function Mountains({ points, color, z, base = -0.12 }: { points: [number, number][], color: string, z: number, base?: number }) {
  const shape = useMemo(() => {
    const outline = new Shape()
    outline.moveTo(-20, base)
    points.forEach(([x, y]) => outline.lineTo(x, y))
    outline.lineTo(20, base)
    outline.closePath()
    return outline
  }, [points, base])
  return <mesh position={[0, 0, z]}><shapeGeometry args={[shape]} /><meshBasicMaterial color={color} /></mesh>
}

const arcs = [
  [0.06, 0.73], [0.87, 0.47], [1.40, 0.66], [2.15, 0.54],
  [2.82, 0.84], [3.79, 0.68], [4.57, 0.62], [5.33, 0.75],
]
const arcPivots = arcs.map(([, length]) => new Vector3(Math.cos(length / 2) * 1.58, Math.sin(length / 2) * 1.58, 0))

function Halo({ groupRef }: { groupRef: RefObject<Group | null> }) {
  return (
    <group ref={groupRef} position={[0.6, 1.95, 0]} rotation={[0.06, -0.23, 0.12]}>
      {arcs.map(([start, length], i) => (
        <group name="halo-fragment" key={start} rotation={[0, 0, start]} position={[0, 0, i % 3 === 0 ? 0.05 : 0]}>
          <group name="fragment-pivot" pivot={arcPivots[i]}>
          <mesh name="halo-body">
            <torusGeometry args={[1.58, 0.075, 6, 48, length]} />
            <meshStandardMaterial color="#81769E" emissive="#C69AB7" emissiveIntensity={0.28} roughness={0.4} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.065]}>
            <torusGeometry args={[1.56, 0.018, 8, 48, length]} />
            <meshBasicMaterial color="#F6D5EC" />
          </mesh>
          <mesh>
            <torusGeometry args={[1.57, 0.14, 12, 48, length]} />
            <meshBasicMaterial color="#C69AB7" transparent opacity={0.07} depthWrite={false} />
          </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

function Composition({ reducedMotion, signal, reactivity, onRenderTime, debug }: { reducedMotion: boolean, signal: AudioSignal, reactivity: number, onRenderTime: (now: number) => void, debug: BloomDebug }) {
  const halo = useRef<Group>(null)
  const lake = useRef<ShaderMaterial>(null)
  const skyMaterial = useRef<ShaderMaterial>(null)
  const response = useRef(createBloomResponse())
  const elapsed = useRef(0)
  const fragmentResponse = useRef({ x: 0, y: 0, rotation: 0, highlight: 0 })
  useFrame((_, delta) => {
    if (!halo.current || !lake.current || !skyMaterial.current) return
    const dt = Math.min(delta, 0.05)
    const now = performance.now()
    onRenderTime(now)
    updateBloomResponse(response.current, signal, reactivity, debug, now)
    const audio = response.current
    // Reduced motion freezes drift/ripple phases and suppresses reactive geometry.
    if (!reducedMotion && debug.ambient) elapsed.current += dt
    const time = debug.ambient ? elapsed.current : 0
    const x = Math.sin(time * 0.40) * 0.13
    const y = Math.sin(time * 0.50) * 0.14
    const scale = reducedMotion ? 1 : 1 + audio.bass * 0.20
    halo.current.position.set(0.6 + x, 1.95 + y, 0)
    halo.current.scale.setScalar(scale)
    halo.current.children.forEach((fragment, i) => {
      updateFragmentResponse(fragmentResponse.current, arcs[i][0] + arcs[i][1] / 2, i,
        reducedMotion ? 0 : audio.midrange, reducedMotion ? 0 : audio.treble)
      const motion = fragmentResponse.current
      fragment.position.x = motion.x
      fragment.position.y = motion.y
      const pivot = fragment.getObjectByName('fragment-pivot')
      if (pivot) pivot.rotation.z = motion.rotation
      const body = fragment.getObjectByName('halo-body') as Mesh | undefined
      if (body?.material instanceof MeshStandardMaterial) {
        body.material.emissiveIntensity = 0.28 + audio.glow * 0.55 + motion.highlight
      }
    })
    const uniforms = lake.current.uniforms
    uniforms.time.value = time
    uniforms.haloOffset.value.set(x, y)
    uniforms.haloScale.value = scale
    uniforms.bass.value = reducedMotion ? 0 : audio.bass
    uniforms.treble.value = reducedMotion ? 0 : audio.treble
    uniforms.atmosphere.value = audio.glow
    skyMaterial.current.uniforms.atmosphere.value = audio.glow

  })
  const sky = useMemo(() => ({ atmosphere: { value: 0 }, midnight: { value: new Color('#101322') }, lavender: { value: new Color('#81769E') }, rose: { value: new Color('#C69AB7') } }), [])
  const water = useMemo(() => ({ bass: { value: 0 }, treble: { value: 0 }, atmosphere: { value: 0 }, haloScale: { value: 1 }, time: { value: 0 }, haloOffset: { value: new Vector2() }, midnight: { value: new Color('#101322') }, indigo: { value: new Color('#353451') }, moonlight: { value: new Color('#F6D5EC') }, rose: { value: new Color('#C69AB7') } }), [])
  return (
    <>
      <Framing />
      <mesh position={[0, 0, -10]}><planeGeometry args={[40, 20]} /><shaderMaterial ref={skyMaterial} vertexShader={vertex} fragmentShader={skyFragment} uniforms={sky} toneMapped={false} /></mesh>
      <Mountains points={ridges[0]} color="#65617E" z={-7} />
      <Mountains points={ridges[1]} color="#45445F" z={-6} />
      <Mountains points={ridges[2]} color="#292D44" z={-5} />
      <mesh position={[0, -5.02, -2]}><planeGeometry args={[40, 10]} /><shaderMaterial ref={lake} vertexShader={vertex} fragmentShader={waterFragment} uniforms={water} toneMapped={false} /></mesh>
      <ambientLight intensity={1.2} />
      <directionalLight position={[-3, 5, 6]} intensity={3} color="#F6D5EC" />
      <Halo groupRef={halo} />
      <Mountains points={[[-20, -4.8], [-8, -4.5], [-6.4, -4.15], [-5.7, -4.3], [-5.2, -4.55], [-3.9, -4.8], [1, -5.3], [5.2, -4.9], [6.5, -4.6], [7, -4.2], [8.5, -4.1], [10, -4.5], [20, -4.8]]} color="#101322" z={2} base={-6} />
    </>
  )
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <p className="bloom-fallback">Bloom could not render. Audio diagnostics are available below.</p> : this.props.children }
}

const motionQuery = '(prefers-reduced-motion: reduce)'
function subscribeReducedMotion(onChange: () => void) {
  const preference = window.matchMedia(motionQuery)
  preference.addEventListener('change', onChange)
  return () => preference.removeEventListener('change', onChange)
}
function getReducedMotion() { return window.matchMedia(motionQuery).matches }

export default function BloomScene({ signal, onRenderTime, measurement, reactivity, debug, quality }: { signal: AudioSignal, onRenderTime: (now: number) => void, measurement: PerformanceMeasurement, reactivity: number, debug: BloomDebug, quality: GraphicsQuality }) {
  const debugActive = debug.band !== 'all' || debug.synthetic || !debug.ambient || debug.accent !== 'combined'
  useEffect(() => { measurement.invalidate('Visual debug settings changed. Repeat the run with debug defaults.') }, [measurement, debug])
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true)
  return (
    <>
    <section className="bloom-stage" aria-label="Bloom: a luminous fragmented halo over a tranquil lake at twilight">
      <SceneBoundary>
        <Canvas orthographic camera={{ position: [0, 0, 20], zoom: 80, near: 0.1, far: 60 }} frameloop="always" dpr={QUALITY_DPR[quality]} gl={{ antialias: true }} fallback={<p className="bloom-fallback">WebGL is unavailable. Audio diagnostics are available below.</p>}>
          <PerformanceProbe measurement={measurement} reactivity={reactivity} reducedMotion={reducedMotion} debugActive={debugActive} quality={quality} />
          <Composition reducedMotion={reducedMotion} signal={signal} reactivity={reactivity} onRenderTime={onRenderTime} debug={debug} />
        </Canvas>
      </SceneBoundary>
      <div className="bloom-brand" aria-hidden="true">ECHO<span>Your music. Another world.</span></div>

      <div className="bloom-caption"><span>01 / BLOOM</span><p>A quiet place between sound and stillness.</p></div>
      <a className="bloom-audio-link" href="#audio-controls">Choose audio ↓</a>
      {debugActive &&
        <p className="bloom-debug-status">Visual debug: {debug.band} · {debug.synthetic ? 'synthetic pulse' : debug.accent} · ambient {debug.ambient ? 'on' : 'off'}</p>}
    </section>

    </>
  )
}
