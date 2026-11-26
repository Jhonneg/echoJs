import './bloom.css'
import { Component, useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BackSide, BufferAttribute, BufferGeometry, Color, Mesh, OctahedronGeometry, PerspectiveCamera, PlaneGeometry, ShaderMaterial, Vector2, Vector3, Vector4 } from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { MusicFeatureReader } from '../../audio/musicFeatures'
import type { GraphicsQuality } from '../../engine/quality'
import { LandscapeCanvas } from '../../engine/LandscapeCanvas'
import { CAMERA_HEIGHT, CAMERA_Z, CRYSTALS, FOV_DEGREES, MONOLITH, RANGES, cameraFor } from './composition'
import { buildRange, rangeCells, rangeFragmentShader, rangeVertexShader } from './ranges'
import { CURTAINS, SKY_DEFINES, auroraGain, curtainPhases, skyFragmentShader, skyVertexShader } from './sky'
import { MONOLITH_DEFINES, crystalFragmentShader, crystalPose, crystalVertexShader, monolithFragmentShader, monolithHover, monolithVertexShader } from './monolith'
import { RING_CENTER, WATER_PLANE, WATER_SHADER, reflectionSize, waterPhases } from './water'
import { RIVERS, riverBox, riverPath, riverPhases } from './rivers'
import { bloomMusicOutputs, createBloomMusic, updateBloomMusic } from './music'
import { parallaxStep, pointerTarget } from './parallax'

// Bloom rebuild from the Resonant Monolith reference. BR1 placed everything from measured
// screen fractions; BR2 made the ranges real 3D terrain; BR3 added the sky dome and aurora,
// whose light also falls on the ranges; BR4 added the stone monolith and crystals; BR5 added
// the reflective lake; BR6 added glowing rivers; BR7 adaptive framing; BR8 adds the music
// response (music.ts) and mouse parallax (parallax.ts).

const SKY_RADIUS = 450
const SKY_TOP = '#3d3a68'

// Aurora state shared by the sky and the ranges. Uniform objects are shared by reference, so
// one per-frame update reaches every material.
// Only one Bloom scene exists at a time, so this lives at module level and is rewritten each
// frame (phases are recomputed from the clock, so nothing carries over between mounts).
type AuroraUniforms = { uPhase: { value: Vector4 }, uAuroraGain: { value: number } }
const AURORA: AuroraUniforms = { uPhase: { value: new Vector4() }, uAuroraGain: { value: 1 } }
// Water wave/ring phases and river flow phases, shared the same way.
const WATER_PHASE = { value: new Vector4() }
const RIVER_PHASE = { value: new Vector3() }
// Music response values (BR8), shared the same way. Ages start far in the past (no ring/pulse).
const MUSIC = {
  uRiverGain: { value: 1 }, uRiverPulse: { value: new Vector2(99, 0) }, uLightLift: { value: 0 },
  uSeamGain: { value: 1 }, uSparkle: { value: 0 }, uRingPulse: { value: new Vector2(99, 0) },
  liftFraction: 0,
}

// Camera position is fixed; field of view and tilt adapt to the screen shape (BR7). With a real
// mouse and motion allowed, it turns very slightly toward the pointer (BR8 parallax) and eases
// back to centre when the pointer leaves or the window loses focus.
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches
function FixedCamera({ reducedMotion }: { reducedMotion: boolean }) {
  const camera = useThree(state => state.camera)
  const width = useThree(state => state.size.width), height = useThree(state => state.size.height)
  const basePitch = useRef(0), target = useRef({ x: 0, y: 0 }), offset = useRef({ yaw: 0, pitch: 0 })
  useLayoutEffect(() => {
    const view = cameraFor(width / height)
    if (camera instanceof PerspectiveCamera) {
      Object.assign(camera, { fov: view.fovDegrees })
      camera.updateProjectionMatrix()
    }
    basePitch.current = view.pitch
    camera.position.set(0, CAMERA_HEIGHT, CAMERA_Z)
    camera.rotation.set(view.pitch + offset.current.pitch, offset.current.yaw, 0, 'YXZ')
    camera.updateMatrixWorld()
  }, [camera, width, height])
  useEffect(() => {
    const centre = () => { target.current = { x: 0, y: 0 } }
    const move = (event: PointerEvent) => {
      target.current = event.pointerType === 'mouse' && finePointer() && !reducedMotion
        ? pointerTarget(event.clientX, event.clientY, window.innerWidth, window.innerHeight) : { x: 0, y: 0 }
    }
    centre()
    window.addEventListener('pointermove', move)
    document.documentElement.addEventListener('pointerleave', centre)
    window.addEventListener('blur', centre)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', centre)
      window.removeEventListener('blur', centre)
    }
  }, [reducedMotion])
  useFrame((_, delta) => {
    const next = reducedMotion ? { yaw: 0, pitch: 0 } : parallaxStep(offset.current, target.current, delta)
    offset.current = next
    camera.rotation.set(basePitch.current + next.pitch, next.yaw, 0, 'YXZ')
  })
  return null
}

// Sky dome around the camera, drawn first and behind everything.
function Sky({ quality, aurora }: { quality: GraphicsQuality, aurora: AuroraUniforms }) {
  const material = useMemo(() => new ShaderMaterial({
    vertexShader: skyVertexShader, fragmentShader: skyFragmentShader, side: BackSide, depthWrite: false, depthTest: false,
    // Low keeps all four curtains (BR7: with two they thinned to faint lines); only the streak
    // detail is simpler. The sky shader is cheap at Low's lower drawing resolution.
    defines: { ...SKY_DEFINES, RAY_OCTAVES: quality === 'low' ? 3 : 4 },
    uniforms: {
      uTop: { value: new Color(SKY_TOP) }, uMid: { value: new Color('#6c5e98') },
      uHorizon: { value: new Color('#cdaed6') }, uHorizonPink: { value: new Color('#e6b2cf') },
      uColor: { value: CURTAINS.map(c => new Color(c.color)) },
      uEdge: { value: CURTAINS.map(c => new Vector4(c.x0, c.y0, c.x1, c.y1)) },
      uShape: { value: CURTAINS.map(c => [c.height, c.strength]).flat() },
      uPhase: aurora.uPhase, uGain: aurora.uAuroraGain,
    },
  }), [quality, aurora])
  useEffect(() => () => material.dispose(), [material])
  return <mesh material={material} position={[0, CAMERA_HEIGHT, CAMERA_Z]} renderOrder={-1} frustumCulled={false}>
    <sphereGeometry args={[SKY_RADIUS, 64, 32]} />
  </mesh>
}

// River paths and colours for the mountain shader (Low drops rivers listed last).
const riverUniforms = () => ({
  uRiverPts: { value: RIVERS.flatMap(r => riverPath(r).map(([x, y]) => new Vector2(x, y))) },
  uRiverColor: { value: RIVERS.map(r => new Color(r.color)) },
  uRiverStrength: { value: new Vector3(...RIVERS.map(r => r.strength)) },
  uRiverPhase: RIVER_PHASE,
  uRiverBox: { value: RIVERS.map(r => new Vector4(...riverBox(r))) },
  uRiverGain: MUSIC.uRiverGain, uRiverPulse: MUSIC.uRiverPulse,
})

// Per-range material with that range's snow line and mist depth. Identical shader source, so
// three.js compiles one program for all five.
function useRangeMaterial(quality: GraphicsQuality, snowLine: number, mistHeight: number, aurora: AuroraUniforms) {
  const material = useMemo(() => new ShaderMaterial({
    vertexShader: rangeVertexShader, fragmentShader: rangeFragmentShader,
    defines: { ...SKY_DEFINES, OCTAVES: quality === 'low' ? 3 : 5, RIVER_COUNT: quality === 'low' ? RIVERS.filter(r => r.lowQuality).length : RIVERS.length },
    uniforms: {
      uRockDark: { value: new Color('#33283c') }, uRockLit: { value: new Color('#685571') },
      uSnow: { value: new Color('#f4f0fa') }, uHaze: { value: new Color('#a897c0') },
      uSkyFill: { value: new Color('#857c9f') }, uGroundFill: { value: new Color('#3d3450') },
      uKeyColor: { value: new Color('#ece2f2') }, uKeyDir: { value: new Vector3(0.6, 0.5, 0.62) },
      uSnowLine: { value: snowLine }, uHazeNear: { value: 20 }, uHazeFar: { value: 220 }, uHazeMax: { value: 0.5 }, uMistHeight: { value: mistHeight },
      uAuroraLeft: { value: new Color(CURTAINS[0].color) }, uAuroraRight: { value: new Color(CURTAINS[3].color) },
      uAuroraGain: aurora.uAuroraGain, uLightLift: MUSIC.uLightLift,
      ...riverUniforms(),
    },
  }), [quality, snowLine, mistHeight, aurora])
  useEffect(() => () => material.dispose(), [material])
  return material
}

function Range({ index, quality, aurora }: { index: number, quality: GraphicsQuality, aurora: AuroraUniforms }) {
  const layer = RANGES[index]
  const material = useRangeMaterial(quality, layer.snow, 0.56, aurora)
  const geometry = useMemo(() => {
    const mesh = buildRange(layer, rangeCells(index, quality))
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(mesh.positions, 3))
    g.setAttribute('rise', new BufferAttribute(mesh.rise, 1))
    g.setIndex(new BufferAttribute(mesh.indices, 1))
    g.computeVertexNormals()
    return g
  }, [layer, index, quality])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} material={material} />
}

const auroraLight = () => ({
  uAuroraLeft: { value: new Color(CURTAINS[0].color) }, uAuroraRight: { value: new Color(CURTAINS[3].color) },
  uAuroraGain: AURORA.uAuroraGain,
})

function Monolith({ quality, reducedMotion }: { quality: GraphicsQuality, reducedMotion: boolean }) {
  const mesh = useRef<Mesh>(null)
  const geometry = useMemo(() => new RoundedBoxGeometry(MONOLITH.width, MONOLITH.height, MONOLITH.depth, 3, 0.035), [])
  const material = useMemo(() => new ShaderMaterial({
    vertexShader: monolithVertexShader, fragmentShader: monolithFragmentShader,
    defines: { ...MONOLITH_DEFINES, OCTAVES: quality === 'low' ? 3 : 5 },
    uniforms: {
      uSize: { value: new Vector3(MONOLITH.width, MONOLITH.height, MONOLITH.depth) },
      uStoneDark: { value: new Color('#3a3043') }, uStoneLight: { value: new Color('#5d5067') },
      uKeyColor: { value: new Color('#f0d2e4') }, uKeyDir: { value: new Vector3(0.9, 0.3, 0.3) },
      uAmbient: { value: new Color('#8a80a3') }, uSeam: { value: new Color('#ffe0ef') },
      uSeamGain: MUSIC.uSeamGain, uLightLift: MUSIC.uLightLift,
      ...auroraLight(),
    },
  }), [quality])
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  useFrame(state => {
    const hover = monolithHover(state.clock.elapsedTime, reducedMotion), m = mesh.current
    if (!m) return
    m.position.y = MONOLITH.center[1] + hover.y + MUSIC.liftFraction * MONOLITH.height
    m.rotation.y = MONOLITH.yaw + hover.yaw
  })
  return <mesh ref={mesh} geometry={geometry} material={material} position={MONOLITH.center} rotation={[0, MONOLITH.yaw, 0]} />
}

function Crystal({ index, reducedMotion }: { index: number, reducedMotion: boolean }) {
  const crystal = CRYSTALS[index], mesh = useRef<Mesh>(null)
  const geometry = useMemo(() => new OctahedronGeometry(crystal.size), [crystal])
  const material = useMemo(() => new ShaderMaterial({
    vertexShader: crystalVertexShader, fragmentShader: crystalFragmentShader,
    uniforms: {
      uBase: { value: new Color('#9db3b8') }, uKeyColor: { value: new Color('#e6d8ec') },
      uKeyDir: { value: new Vector3(0.8, 0.45, 0.5) }, uAmbient: { value: new Color('#4c4660') },
      uSparkle: MUSIC.uSparkle,
      ...auroraLight(),
    },
  }), [])
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  useFrame(state => {
    const pose = crystalPose(index, state.clock.elapsedTime, reducedMotion), m = mesh.current
    if (!m) return
    m.position.y = crystal.position[1] + pose.y
    m.rotation.set(0.25, pose.spin, 0.1)
  })
  return <mesh ref={mesh} geometry={geometry} material={material} position={crystal.position} />
}

// Reflective lake: three's Reflector renders the mirrored scene; WATER_SHADER samples it.
// The reflection texture follows the drawing-buffer size and the quality setting.
function Water({ quality }: { quality: GraphicsQuality }) {
  const width = useThree(state => state.size.width), height = useThree(state => state.size.height)
  const dpr = useThree(state => state.viewport.dpr)
  const reflector = useMemo(() => {
    const texture = reflectionSize(width * dpr, height * dpr, quality)
    const water = new Reflector(new PlaneGeometry(WATER_PLANE.width, WATER_PLANE.depth, WATER_PLANE.segmentsX, WATER_PLANE.segmentsZ), {
      textureWidth: texture.width, textureHeight: texture.height, shader: WATER_SHADER,
      multisample: quality === 'low' ? 0 : 4, clipBias: 0.003,
    })
    const material = water.material as ShaderMaterial
    material.defines = { DETAIL: quality === 'low' ? 0 : 1 }
    material.uniforms.uPhase = WATER_PHASE
    material.uniforms.uRingCenter = { value: new Vector2(RING_CENTER[0], RING_CENTER[1]) }
    material.uniforms.uRingPulse = MUSIC.uRingPulse
    material.uniforms.uDeep = { value: new Color('#2a2238') }
    material.uniforms.uMist = { value: new Color('#bba7cf') }
    material.uniforms.uSeamGlow = { value: new Color('#ffd6ea') }
    water.rotation.x = -Math.PI / 2
    water.position.set(0, 0, CAMERA_Z + 10 - WATER_PLANE.depth / 2) // from just behind the camera out past the far ranges
    return water
  }, [width, height, dpr, quality])
  useEffect(() => () => { reflector.dispose(); reflector.geometry.dispose() }, [reflector])
  return <primitive object={reflector} />
}

type CompositionProps = {
  onRenderTime: (now: number) => void, quality: GraphicsQuality, reducedMotion: boolean,
  musicFeatures: MusicFeatureReader, reactivity: number, playing: boolean,
}
function Composition({ onRenderTime, quality, reducedMotion, musicFeatures, reactivity, playing }: CompositionProps) {
  const aurora = AURORA
  const music = useRef(createBloomMusic())
  useFrame((state, delta) => {
    // Music (BR8): read the shared analysis once, then drive the shared shader values.
    const now = performance.now()
    updateBloomMusic(music.current, musicFeatures.read(), now / 1000, delta, reactivity, reducedMotion, playing)
    const out = bloomMusicOutputs(music.current)
    // Slow curtain drift (faster shimmer with the highs); reduced motion holds a fixed pose.
    const phases = curtainPhases(music.current.auroraClock, reducedMotion)
    AURORA.uPhase.value.set(phases[0], phases[1], phases[2], phases[3])
    AURORA.uAuroraGain.value = auroraGain(phases) * out.auroraFactor
    const water = waterPhases(state.clock.elapsedTime, reducedMotion)
    WATER_PHASE.value.set(water[0], water[1], water[2], water[3])
    const rivers = riverPhases(music.current.riverClock, reducedMotion)
    RIVER_PHASE.value.set(rivers[0], rivers[1], rivers[2])
    MUSIC.uRiverGain.value = out.riverGain
    MUSIC.uRiverPulse.value.set(Math.min(out.pulse.along, 99), out.pulse.strength)
    MUSIC.uLightLift.value = out.lightLift
    MUSIC.uSeamGain.value = out.seamGain
    MUSIC.uSparkle.value = out.sparkle
    MUSIC.uRingPulse.value.set(Math.min(out.ring.age, 99), out.ring.strength)
    MUSIC.liftFraction = out.liftFraction
    onRenderTime(now)
  })
  return <>
    <color attach="background" args={[SKY_TOP]} />
    <FixedCamera reducedMotion={reducedMotion} />
    <Sky quality={quality} aurora={aurora} />
    {RANGES.map((_, i) => <Range key={i} index={i} quality={quality} aurora={aurora} />)}
    <Water quality={quality} />
    <Monolith quality={quality} reducedMotion={reducedMotion} />
    {CRYSTALS.map((_, i) => <Crystal key={i} index={i} reducedMotion={reducedMotion} />)}
  </>
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <p className="bloom-fallback">Bloom stopped displaying. Choose another landscape below, or reload the page to try again.</p> : this.props.children }
}

const motionQuery = '(prefers-reduced-motion: reduce)'
function subscribeReducedMotion(onChange: () => void) {
  const preference = window.matchMedia(motionQuery)
  preference.addEventListener('change', onChange)
  return () => preference.removeEventListener('change', onChange)
}
const getReducedMotion = () => window.matchMedia(motionQuery).matches

type BloomSceneProps = {
  playing: boolean, musicFeatures: MusicFeatureReader, reactivity: number,
  onRenderTime: (now: number) => void, quality: GraphicsQuality,
}

export default function BloomScene({ playing, musicFeatures, onRenderTime, quality, reactivity }: BloomSceneProps) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true)
  return (
    <section className="bloom-stage" aria-label="Bloom: a tall stone monolith hovering over a still lake, between misty mountain ranges under an aurora">
      <SceneBoundary>
        <LandscapeCanvas projection="perspective" camera={{ fov: FOV_DEGREES, near: 0.1, far: 600, position: [0, CAMERA_HEIGHT, CAMERA_Z] }}
          cameraTilt={false} reactivity={reactivity} quality={quality} reducedMotion={reducedMotion}
          fallback={<p className="bloom-fallback">Bloom can’t be shown because this browser can’t use WebGL. Audio still works: use the controls below to choose audio or another landscape.</p>}>
          <Composition onRenderTime={onRenderTime} quality={quality} reducedMotion={reducedMotion}
            musicFeatures={musicFeatures} reactivity={reactivity} playing={playing} />
        </LandscapeCanvas>
      </SceneBoundary>
      <div className="bloom-brand" aria-hidden="true">Bloom</div>
    </section>
  )
}
