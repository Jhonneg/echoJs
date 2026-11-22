import { Component, useEffect, useMemo, useRef, useState, useCallback, useSyncExternalStore, type ReactNode, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { MusicFeatureReader } from '../../audio/musicFeatures'
import { createMusicPilot, updateMusicPilot, type CrimsonProfile, type MusicPilot } from './musicPilot'
import type { AudioSignal } from '../../audio/signal'
import type { GraphicsQuality } from '../../engine/quality'
import { LandscapeCanvas } from '../../engine/LandscapeCanvas'
import { BackSide, Mesh, ShaderMaterial, Vector3, type Scene, type Camera, type WebGLRenderer } from 'three'
import { contourOrigin } from './contours'
import { createJourney, updateJourney, type Journey } from './journey'
import { createTerrainStream, chunkIndexAt, localCameraZ, chunkRenderZ, type TerrainEntry, type TerrainSnapshot } from './terrainStream'
import { terrainVertex, terrainFragment, nightshade } from './material'
import { createViewMotion, updateViewMotion } from './cameraMotion'
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
  vec3 dimSun = mix(nightColor(normalize(vWorld - cameraPosition)), fullSun, 0.055);
  gl_FragColor = vec4(mix(dimSun, fullSun, activity) * (1.0 + pulse * 0.2), 1.0);
  #include <colorspace_fragment>
}`
const glowFragment = `uniform float activity;
uniform float pulse;
varying vec3 vLocal;
void main() {
  float glow = exp(-dot(vLocal.xy, vLocal.xy) / 240.0) * (0.003 + activity * 0.17 + pulse * 0.06);
  gl_FragColor = vec4(0.65, 0.012, 0.09, glow);
  #include <colorspace_fragment>
}`
const skyFragment = `varying vec3 vLocal;
${nightshade}
void main() {
  gl_FragColor = vec4(nightColor(normalize(vLocal)), 1.0);
  #include <colorspace_fragment>
}`

type SceneStatus = 'loading' | 'ready' | 'waiting' | 'error'
export type CrimsonPilotInput = { reader: MusicFeatureReader; profile: CrimsonProfile
  inspect?: (journey: Journey, music: MusicPilot, scene: Scene, camera: Camera, renderer: WebGLRenderer) => void }
type CompositionProps = { target: RefObject<{ x: number, y: number }>, reducedMotion: boolean,
  pilot?: CrimsonPilotInput, signal: AudioSignal, reactivity: number, attempt: number, onStatus: (status: SceneStatus) => void }

function TerrainChunk({ entry, meshes, materials }: { entry: TerrainEntry, meshes: RefObject<Map<number, Mesh>>,
  materials: RefObject<Map<number, ShaderMaterial>> }) {
  const uniforms = useMemo(() => ({ activity: { value: 0 }, contourLight: { value: 0 }, contourStreak: { value: 0 },
    contourProgress: { value: 0 }, contourOrigin: { value: contourOrigin(entry.index) },
    musicHaze: { value: 0 }, musicWeight: { value: 0 }, sunPosition: { value: new Vector3(0, 6, -64) } }), [entry.index])
  return <mesh name={`crimson-chunk-${entry.index}`} ref={mesh => {
    if (mesh) meshes.current.set(entry.index, mesh)
    else meshes.current.delete(entry.index)
  }}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[entry.data.positions, 3]} />
      <bufferAttribute attach="attributes-normal" args={[entry.data.normals, 3]} />
      <bufferAttribute attach="attributes-terrainFeatures" args={[entry.data.features, 4]} />
      <bufferAttribute attach="attributes-terrainFold" args={[entry.data.folds, 1]} />
    </bufferGeometry>
    <shaderMaterial ref={material => {
      if (material) materials.current.set(entry.index, material)
      else materials.current.delete(entry.index)
    }} uniforms={uniforms} vertexShader={terrainVertex} fragmentShader={terrainFragment} toneMapped={false} />
  </mesh>
}

function Composition({ target, reducedMotion, signal, reactivity, attempt, onStatus, pilot }: CompositionProps) {
  const [snapshot, setSnapshot] = useState<TerrainSnapshot>({ chunks: [], error: false, ready: false })
  const stream = useRef<ReturnType<typeof createTerrainStream> | null>(null)
  const journey = useRef(createJourney())
  const music = useRef(createMusicPilot())
  const view = useRef(createViewMotion())
  const meshes = useRef(new Map<number, Mesh>())
  const materials = useRef(new Map<number, ShaderMaterial>())
  const sun = useRef<Mesh>(null), glow = useRef<Mesh>(null), sky = useRef<Mesh>(null)
  const sunMaterial = useRef<ShaderMaterial>(null), glowMaterial = useRef<ShaderMaterial>(null)
  const sunUniforms = useMemo(() => ({ activity: { value: 0 }, pulse: { value: 0 } }), [])
  const glowUniforms = useMemo(() => ({ activity: { value: 0 }, pulse: { value: 0 } }), [])
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
  useFrame(({ camera, scene, gl }, delta) => {
    const state = journey.current
    const limit = stream.current?.distanceLimit(state.distance) ?? state.distance
    const now = performance.now()
    if (pilot) updateMusicPilot(music.current, pilot.reader, pilot.profile, delta, now / 1000, reactivity, reducedMotion)
    const response = pilot ? music.current : undefined
    updateJourney(state, signal, reactivity, reducedMotion, delta, now, limit, response)
    stream.current?.requestWindow(chunkIndexAt(state.distance))
    const z = localCameraZ(state.distance)
    updateViewMotion(view.current, target.current, delta, reducedMotion)
    camera.position.set(view.current.x, 3.5 + view.current.y, z)
    camera.lookAt(0, 4.2, z - 59)
    for (const [index, mesh] of meshes.current) mesh.position.z = chunkRenderZ(index, state.distance)
    for (const material of materials.current.values()) {
      material.uniforms.activity.value = state.sun
      material.uniforms.musicWeight.value = response?.weight ?? 0
      material.uniforms.contourLight.value = response?.contours.light ?? 0
      material.uniforms.contourStreak.value = response?.contours.streak ?? 0
      material.uniforms.contourProgress.value = response?.contours.progress ?? 0
      material.uniforms.musicHaze.value = response?.haze ?? 0
      material.uniforms.sunPosition.value.set(0, 6, z - 88)
    }
    if (sun.current) {
      sun.current.position.set(0, 6, z - 88)
      sun.current.scale.setScalar(1 + state.sunPulse * (0.1 + .1 * (response?.weight ?? 0)))
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
    if (glowMaterial.current) {
      glowMaterial.current.uniforms.activity.value = state.sun
      glowMaterial.current.uniforms.pulse.value = state.sunPulse
    }
    if (stream.current?.failed) report('error')
    else if (started.current) report(state.blocked ? 'waiting' : 'ready')
    pilot?.inspect?.(state, music.current, scene, camera, gl)
  }, -1)
  return <>
    <color attach="background" args={['#221A32']} />
    <mesh ref={sky} name="crimson-sky">
      <sphereGeometry args={[160, 24, 16]} />
      <shaderMaterial vertexShader={sunVertex} fragmentShader={skyFragment} side={BackSide} toneMapped={false} depthWrite={false} />
    </mesh>
    {snapshot.chunks.map(entry => <TerrainChunk key={entry.index} entry={entry} meshes={meshes} materials={materials} />)}
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
  render() { return this.state.failed ? <p className="crimson-fallback">Crimson Horizon could not render. Choose another landscape from the scene menu, or reload to try again.</p> : this.props.children }
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
        fallback={<p className="crimson-fallback">Crimson Horizon needs WebGL to display. You can still choose audio or another landscape from the scene menu.</p>}>
        <Composition pilot={pilot} target={target} reducedMotion={reducedMotion} signal={signal} reactivity={reactivity} attempt={attempt} onStatus={setStatus} />
      </LandscapeCanvas>
    </SceneBoundary>
    <div className="crimson-brand" aria-hidden="true">ECHO</div>
    {status !== 'ready' && <div className="crimson-status" role="status">
      {status === 'error' ? <>The landscape could not load. <button onClick={() => setAttempt(value => value + 1)}>Retry landscape</button></>
        : status === 'loading' ? 'Preparing landscape…' : 'Loading terrain…'}
    </div>}
  </section>
}
