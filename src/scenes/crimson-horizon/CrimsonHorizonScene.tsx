import { createValley, updateValley, writeValleyUniforms, valleyOrigin } from './valley'
import { Component, useEffect, useMemo, useRef, useState, useCallback, useSyncExternalStore, type ReactNode, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { MusicFeatureReader } from '../../audio/musicFeatures'
import { createMusicPilot, updateMusicPilot, type CrimsonProfile, type MusicPilot } from './musicPilot'
import type { AudioSignal } from '../../audio/signal'
import type { GraphicsQuality } from '../../engine/quality'
import { LandscapeCanvas } from '../../engine/LandscapeCanvas'
import { BackSide, BufferAttribute, BufferGeometry, Mesh, ShaderMaterial, Vector3, type Scene, type Camera, type WebGLRenderer } from 'three'
import { contourOrigin } from './contours'
import { createJourney, updateJourney, type Journey } from './journey'
import { createTerrainStream, chunkIndexAt, localCameraZ, chunkRenderZ, type TerrainEntry, type TerrainSnapshot } from './terrainStream'
import { terrainVertex, terrainFragment, nightshade } from './material'
import { createViewMotion, updateViewMotion } from './cameraMotion'
import { RIDGE, ridgeStrip } from './ridgeline'
import './crimson-horizon.css'

const sunVertex = `varying vec3 vLocal;
varying vec3 vWorld;
void main() { vLocal = position; vec4 world = modelMatrix * vec4(position, 1.0); vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world; }`
const sunFragment = `uniform float activity;
uniform float pulse;
varying vec3 vLocal;
varying vec3 vWorld;
${nightshade}
void main() {
  float gradient = clamp(vLocal.y / 18.4 + 0.5, 0.0, 1.0);
  vec3 fullSun = mix(vec3(0.82, 0.055, 0.27), vec3(1.0, 0.34, 0.61), gradient);
  // Sun glow pass (owner option b): at rest the sun is a clear soft disc (was 5.5% of full).
  vec3 dimSun = mix(nightColor(normalize(vWorld - cameraPosition)), fullSun, 0.2);
  gl_FragColor = vec4(mix(dimSun, fullSun, activity) * (1.0 + pulse * 0.2), 1.0);
  #include <colorspace_fragment>
}`
const glowFragment = `uniform float airAccent;
uniform float corona;
uniform float coronaRadius;
uniform float glowActivity;
uniform float pulse;
varying vec3 vLocal;
void main() {
  float glow = exp(-dot(vLocal.xy, vLocal.xy) / 240.0) * (0.003 + glowActivity * 0.17 + pulse * 0.06);
  float radius = length(vLocal.xy);
  float ringDistance = (radius - coronaRadius - (1.0 - corona) * 1.4) / .4;
  float ring = exp(-ringDistance * ringDistance) * corona * .42;
  // Sun glow pass: a soft dark-red halo just outside the disc (radius about 10 here), present at
  // rest and growing with the existing sun activity.
  float halo = exp(-pow(max(radius - 9.5, 0.0) / 7.0, 2.0)) * (0.08 + glowActivity * 0.12);
  glow += halo;
  gl_FragColor = vec4(mix(vec3(0.65, 0.012, 0.09), vec3(1.0, .2, .4), ring / max(.001, glow + ring)), glow + ring + exp(-ringDistance * ringDistance) * airAccent * .12 * (0.5 + 0.5 * sin(atan(vLocal.y, vLocal.x) * 43.0)));
  #include <colorspace_fragment>
}`
// The sky dithers its output (three.js's built-in dithering), so the dark gradient doesn't band.
const skyFragment = `uniform float atmosphereDensity;
uniform float atmosphereWarmth;
uniform float airAccent;
uniform float detailDensity;
varying vec3 vLocal;
#include <common>
${nightshade}
#include <dithering_pars_fragment>
void main() {
  vec3 ray = normalize(vLocal);
  vec2 coordinate = ray.xy * 95.0;
  vec2 cell = floor(coordinate);
  float pick = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
  float speck = exp(-dot(fract(coordinate) - .5, fract(coordinate) - .5) * 55.0);
  float band = smoothstep(-.02, .04, ray.y) * (1.0 - smoothstep(.22, .4, ray.y));
  gl_FragColor = vec4(atmosphericNight(ray, atmosphereDensity, atmosphereWarmth) + vec3(.7, .22, .45) * speck * step(1.0-detailDensity, pick) * band * (.018 + airAccent * 2.5), 1.0);
  #include <colorspace_fragment>
  #include <dithering_fragment>
}`

// Sun-cut pass: the distant ridge in front of the sun (ridgeline.ts). Dark like the far mountains,
// a thin crimson backlit rim on its outline and the magenta glow at the sun's base, both following
// the sun's existing activity.
const ridgeVertex = `attribute float edge;
varying float vEdge;
varying float vX;
void main() { vEdge = edge; vX = position.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const ridgeFragment = `uniform float activity;
varying float vEdge;
varying float vX;
void main() {
  vec3 color = vec3(0.014, 0.0035, 0.0095);
  color += vec3(0.85, 0.02, 0.1) * exp(-max(vEdge, 0.0) / 0.1) * (0.6 + activity * 0.3);
  color += vec3(0.9, 0.06, 0.3) * exp(-vX * vX / 72.0) * exp(-max(vEdge, 0.0) / 0.8) * (0.12 + activity * 0.5);
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`
function Ridge({ mesh }: { mesh: RefObject<Mesh | null> }) {
  const uniforms = useMemo(() => ({ activity: { value: 0 } }), [])
  const geometry = useMemo(() => {
    const strip = ridgeStrip(), value = new BufferGeometry()
    value.setAttribute('position', new BufferAttribute(strip.positions, 3))
    value.setAttribute('edge', new BufferAttribute(strip.edges, 1))
    value.setIndex(strip.index)
    return value
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh ref={mesh} name="crimson-ridge" geometry={geometry} frustumCulled={false}>
    <shaderMaterial uniforms={uniforms} vertexShader={ridgeVertex} fragmentShader={ridgeFragment} toneMapped={false} />
  </mesh>
}

type SceneStatus = 'loading' | 'ready' | 'waiting' | 'error'
export type CrimsonPilotInput = { reader: MusicFeatureReader; profile: CrimsonProfile
  inspect?: (journey: Journey, music: MusicPilot, scene: Scene, camera: Camera, renderer: WebGLRenderer) => void }
type CompositionProps = { quality: GraphicsQuality, target: RefObject<{ x: number, y: number }>, reducedMotion: boolean,
  pilot?: CrimsonPilotInput, signal: AudioSignal, reactivity: number, attempt: number, onStatus: (status: SceneStatus) => void }

function TerrainChunk({ entry, meshes, materials }: { entry: TerrainEntry, meshes: RefObject<Map<number, Mesh>>,
  materials: RefObject<Map<number, ShaderMaterial>> }) {
  // Keep attributes attached until disposal so Three can release their GPU buffers.
  // JSX attribute children detach before R3F's deferred geometry disposal.
  const geometry = useMemo(() => {
    const value = new BufferGeometry()
    value.setAttribute('position', new BufferAttribute(entry.data.positions, 3))
    value.setAttribute('normal', new BufferAttribute(entry.data.normals, 3))
    value.setAttribute('terrainFeatures', new BufferAttribute(entry.data.features, 4))
    value.setAttribute('terrainFold', new BufferAttribute(entry.data.folds, 1))
    return value
  }, [entry.data])
  useEffect(() => () => geometry.dispose(), [geometry])
  const uniforms = useMemo(() => ({ atmosphereDensity: { value: 0 }, atmosphereWarmth: { value: 0 }, presenceAccent: { value: 0 }, activity: { value: 0 }, contourLight: { value: 0 }, contourStreak: { value: 0 },
    valleyWaves: { value: new Float32Array(16) }, valleyGlow: { value: 0 }, valleyOrigin: { value: valleyOrigin(entry.index) },
    contourProgress: { value: 0 }, contourOrigin: { value: contourOrigin(entry.index) },
    musicHaze: { value: 0 }, musicWeight: { value: 0 }, sunPosition: { value: new Vector3(0, 6, -64) } }), [entry.index])
  return <mesh name={`crimson-chunk-${entry.index}`} ref={mesh => {
    if (mesh) meshes.current.set(entry.index, mesh)
    else meshes.current.delete(entry.index)
  }}>
    <primitive attach="geometry" object={geometry} />
    <shaderMaterial ref={material => {
      if (material) materials.current.set(entry.index, material)
      else materials.current.delete(entry.index)
    }} uniforms={uniforms} vertexShader={terrainVertex} fragmentShader={terrainFragment} toneMapped={false} />
  </mesh>
}

function Composition({ quality, target, reducedMotion, signal, reactivity, attempt, onStatus, pilot }: CompositionProps) {
  const [snapshot, setSnapshot] = useState<TerrainSnapshot>({ chunks: [], error: false, ready: false })
  const stream = useRef<ReturnType<typeof createTerrainStream> | null>(null)
  const journey = useRef(createJourney())
  const music = useRef(createMusicPilot())
  const view = useRef(createViewMotion())
  const meshes = useRef(new Map<number, Mesh>())
  const materials = useRef(new Map<number, ShaderMaterial>())
  const sun = useRef<Mesh>(null), glow = useRef<Mesh>(null), sky = useRef<Mesh>(null), ridge = useRef<Mesh>(null)
  const sunMaterial = useRef<ShaderMaterial>(null), glowMaterial = useRef<ShaderMaterial>(null)
  const sunUniforms = useMemo(() => ({ activity: { value: 0 }, pulse: { value: 0 } }), [])
  const glowUniforms = useMemo(() => ({ airAccent: { value: 0 }, corona: { value: 0 }, coronaRadius: { value: 10.35 }, glowActivity: { value: 0 }, pulse: { value: 0 } }), [])
  const skyUniforms = useMemo(() => ({ atmosphereDensity: { value: 0 }, atmosphereWarmth: { value: 0 }, airAccent: { value: 0 }, detailDensity: { value: .01 } }), [])
  const skyMaterial = useRef<ShaderMaterial>(null)
  const started = useRef(false)
  const reported = useRef<SceneStatus>('loading')
  const report = useCallback((status: SceneStatus) => {
    if (reported.current !== status) { reported.current = status; onStatus(status) }
  }, [onStatus])
  useEffect(() => {
    journey.current = createJourney()
    music.current = createMusicPilot()
    started.current = false
    report('loading')
    try {
      const worker = new Worker(new URL('./terrain.worker.ts', import.meta.url), { type: 'module' })
      const active = createTerrainStream(worker, next => {
        setSnapshot(next)
        if (next.ready) started.current = true
        report(next.error ? 'error' : started.current ? 'ready' : 'loading')
      })
      stream.current = active
      return () => { active.dispose(); stream.current = null }
    } catch {
      report('error')
    }
  }, [attempt, report])
  const valley = useRef(createValley())
  useFrame(({ camera, scene, gl }, delta) => {
    const state = journey.current
    const limit = stream.current?.distanceLimit(state.distance) ?? state.distance
    const now = performance.now()
    if (pilot) updateMusicPilot(music.current, pilot.reader, pilot.profile, delta, now / 1000, reactivity, reducedMotion)
    if (pilot) updateValley(valley.current, pilot.reader, pilot.profile === 'candidate', state.distance, now / 1000, delta, reactivity, reducedMotion)
    const response = pilot ? music.current : undefined
    updateJourney(state, signal, reactivity, reducedMotion, delta, now, limit, response)
    stream.current?.requestWindow(chunkIndexAt(state.distance))
    const z = localCameraZ(state.distance)
    updateViewMotion(view.current, target.current, delta, reducedMotion)
    camera.position.set(view.current.x, 3.5 + view.current.y, z)
    camera.lookAt(0, 4.2, z - 59)
    for (const [index, mesh] of meshes.current) mesh.position.z = chunkRenderZ(index, state.distance)
    for (const [index, material] of materials.current) {
      writeValleyUniforms(valley.current, index, now / 1000, reactivity, material.uniforms.valleyWaves.value)
      material.uniforms.valleyGlow.value = valley.current.glow
      material.uniforms.atmosphereDensity.value = (response?.atmosphere.density ?? 0) * (response?.weight ?? 0)
      material.uniforms.atmosphereWarmth.value = (response?.atmosphere.warmth ?? 0) * (response?.weight ?? 0)
      material.uniforms.presenceAccent.value = (response?.presence ?? 0)
      material.uniforms.activity.value = state.sun
      material.uniforms.musicWeight.value = response?.weight ?? 0
      material.uniforms.contourLight.value = response?.contours.light ?? 0
      material.uniforms.contourStreak.value = response?.contours.streak ?? 0
      material.uniforms.contourProgress.value = response?.contours.progress ?? 0
      material.uniforms.musicHaze.value = response?.haze ?? 0
      material.uniforms.sunPosition.value.set(0, 6, z - 88)
    }
    const candidateScale = 1 + (response?.body ?? 0) * .15 + (response?.low ?? 0) * .05
    if (ridge.current) {
      ridge.current.position.set(0, 0, z - RIDGE.distance)
      ;(ridge.current.material as ShaderMaterial).uniforms.activity.value = state.sun
    }
    if (sun.current) {
      sun.current.position.set(0, 6, z - 88)
      sun.current.scale.setScalar((1 + state.sunPulse * .05) * (1 - (response?.weight ?? 0)) + candidateScale * (response?.weight ?? 0))
    }
    if (glow.current) {
      glow.current.position.set(0, 6, z - 99)
      glow.current.scale.setScalar(1 + state.sunPulse * 0.12)
    }
    if (sky.current) sky.current.position.copy(camera.position)
    if (sunMaterial.current) {
      sunMaterial.current.uniforms.activity.value = state.sun
      sunMaterial.current.uniforms.pulse.value = state.sunPulse
    }
    const airAccent = (response?.air ?? 0) * (response?.weight ?? 0)
    if (skyMaterial.current) {
      skyMaterial.current.uniforms.atmosphereDensity.value = (response?.atmosphere.density ?? 0) * (response?.weight ?? 0)
      skyMaterial.current.uniforms.atmosphereWarmth.value = (response?.atmosphere.warmth ?? 0) * (response?.weight ?? 0)
      skyMaterial.current.uniforms.airAccent.value = airAccent
      skyMaterial.current.uniforms.detailDensity.value = quality === 'low' ? .0045 : .01
    }
    if (glowMaterial.current) {
      glowMaterial.current.uniforms.airAccent.value = airAccent
      glowMaterial.current.uniforms.glowActivity.value = state.sun * (1 - (response?.weight ?? 0)) + (response?.glowActivity ?? 0) * (response?.weight ?? 0)
      glowMaterial.current.uniforms.pulse.value = state.sunPulse * (1 - (response?.weight ?? 0))
      glowMaterial.current.uniforms.corona.value = (response?.low ?? 0) * (response?.weight ?? 0) * (1 - (candidateScale - 1))
      // Halo plane is farther away than the sphere; align its ring in perspective.
      glowMaterial.current.uniforms.coronaRadius.value = 10.35 * candidateScale / (1 + state.sunPulse * .12)
    }
    if (stream.current?.failed) report('error')
    else if (started.current) report(state.blocked ? 'waiting' : 'ready')
    pilot?.inspect?.(state, music.current, scene, camera, gl)
  }, -1)
  return <>
    <color attach="background" args={['#221A32']} />
    <mesh ref={sky} name="crimson-sky">
      <sphereGeometry args={[160, 24, 16]} />
      <shaderMaterial ref={skyMaterial} uniforms={skyUniforms} vertexShader={sunVertex} fragmentShader={skyFragment} side={BackSide} toneMapped={false} depthWrite={false} dithering />
    </mesh>
    {snapshot.chunks.map(entry => <TerrainChunk key={entry.index} entry={entry} meshes={meshes} materials={materials} />)}
    <Ridge mesh={ridge} />
    <mesh ref={sun} name="crimson-sun">
      <sphereGeometry args={[9.2, 48, 32]} />
      <shaderMaterial ref={sunMaterial} uniforms={sunUniforms} vertexShader={sunVertex} fragmentShader={sunFragment} toneMapped={false} />
    </mesh>
    <mesh ref={glow} name="crimson-glow">
      <planeGeometry args={[100, 100]} />
      <shaderMaterial ref={glowMaterial} uniforms={glowUniforms} vertexShader={sunVertex} fragmentShader={glowFragment} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  </>
}

const motionQuery = '(prefers-reduced-motion: reduce)'
function subscribeReducedMotion(onChange: () => void) {
  const preference = window.matchMedia(motionQuery)
  preference.addEventListener('change', onChange)
  return () => preference.removeEventListener('change', onChange)
}
function getReducedMotion() { return window.matchMedia(motionQuery).matches }

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <p className="crimson-fallback">Crimson Horizon stopped displaying. Choose another landscape below, or reload the page to try again.</p> : this.props.children }
}

export default function CrimsonHorizonScene({ signal, reactivity, quality, pilot }: { signal: AudioSignal, reactivity: number, quality: GraphicsQuality, pilot?: CrimsonPilotInput }) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true)
  const target = useRef({ x: 0, y: 0 })
  const [status, setStatus] = useState<SceneStatus>('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const reset = () => { target.current.x = 0; target.current.y = 0 }
    window.addEventListener('blur', reset)
    return () => window.removeEventListener('blur', reset)
  }, [])
  return <section className="crimson-stage" aria-label="Crimson Horizon: a three-dimensional dark mountain valley beneath a pink sun"
    onPointerMove={event => {
      if (event.pointerType !== 'mouse' || reducedMotion) return
      const bounds = event.currentTarget.getBoundingClientRect()
      target.current.x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1))
      target.current.y = Math.max(-1, Math.min(1, 1 - (event.clientY - bounds.top) / bounds.height * 2))
    }}
    onPointerLeave={() => { target.current.x = 0; target.current.y = 0 }}>
    <SceneBoundary>
      <LandscapeCanvas cameraTilt={false} signal={signal} reactivity={reactivity} quality={quality} reducedMotion={reducedMotion}
        projection="perspective" camera={{ position: [0, 3.5, 24], fov: 42, near: 0.5, far: 200 }}
        frameloop="always"
        fallback={<p className="crimson-fallback">Crimson Horizon can’t be shown because this browser can’t use WebGL. Audio still works: use the controls below to choose audio or another landscape.</p>}>
        <Composition quality={quality} pilot={pilot} target={target} reducedMotion={reducedMotion} signal={signal} reactivity={reactivity} attempt={attempt} onStatus={setStatus} />
      </LandscapeCanvas>
    </SceneBoundary>
    <div className="crimson-brand" aria-hidden="true">Crimson Horizon</div>
    {status !== 'ready' && <div className="crimson-status" role="status">
      {status === 'error' ? <>The landscape could not load. <button onClick={() => setAttempt(value => value + 1)}>Retry landscape</button></>
        : status === 'loading' ? 'Preparing landscape…' : 'Loading terrain…'}
    </div>}
  </section>
}
