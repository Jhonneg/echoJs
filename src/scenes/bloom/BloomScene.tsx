import './bloom.css'
import { Component, useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BackSide, BufferAttribute, BufferGeometry, Color, Mesh, OctahedronGeometry, ShaderMaterial, Vector3, Vector4 } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { MusicFeatureReader } from '../../audio/musicFeatures'
import type { GraphicsQuality } from '../../engine/quality'
import { LandscapeCanvas } from '../../engine/LandscapeCanvas'
import { CAMERA_HEIGHT, CAMERA_PITCH, CAMERA_Z, CRYSTALS, FOV_DEGREES, MONOLITH, RANGES } from './composition'
import { buildRange, rangeCells, rangeFragmentShader, rangeVertexShader } from './ranges'
import { CURTAINS, SKY_DEFINES, auroraGain, curtainPhases, skyFragmentShader, skyVertexShader } from './sky'
import { MONOLITH_DEFINES, crystalFragmentShader, crystalPose, crystalVertexShader, monolithFragmentShader, monolithHover, monolithVertexShader } from './monolith'

// Bloom rebuild from the Resonant Monolith reference. BR1 placed everything from measured
// screen fractions; BR2 made the ranges real 3D terrain; BR3 added the sky dome and aurora,
// whose light also falls on the ranges; BR4 adds the stone monolith and crystals. The water
// is still a BR1 placeholder.

const SKY_RADIUS = 450
const SKY_TOP = '#3d3a68'

// Aurora state shared by the sky and the ranges. Uniform objects are shared by reference, so
// one per-frame update reaches every material.
// Only one Bloom scene exists at a time, so this lives at module level and is rewritten each
// frame (phases are recomputed from the clock, so nothing carries over between mounts).
type AuroraUniforms = { uPhase: { value: Vector4 }, uAuroraGain: { value: number } }
const AURORA: AuroraUniforms = { uPhase: { value: new Vector4() }, uAuroraGain: { value: 1 } }

function FixedCamera() {
  const camera = useThree(state => state.camera)
  useLayoutEffect(() => {
    camera.position.set(0, CAMERA_HEIGHT, CAMERA_Z)
    camera.rotation.set(CAMERA_PITCH, 0, 0)
    camera.updateMatrixWorld()
  }, [camera])
  return null
}

// Sky dome around the camera, drawn first and behind everything.
function Sky({ quality, aurora }: { quality: GraphicsQuality, aurora: AuroraUniforms }) {
  const material = useMemo(() => new ShaderMaterial({
    vertexShader: skyVertexShader, fragmentShader: skyFragmentShader, side: BackSide, depthWrite: false, depthTest: false,
    defines: { ...SKY_DEFINES, RAY_OCTAVES: quality === 'low' ? 2 : 4, LOW_QUALITY: quality === 'low' ? 1 : 0 },
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

// Per-range material with that range's snow line and mist depth. Identical shader source, so
// three.js compiles one program for all five.
function useRangeMaterial(quality: GraphicsQuality, snowLine: number, mistHeight: number, aurora: AuroraUniforms) {
  const material = useMemo(() => new ShaderMaterial({
    vertexShader: rangeVertexShader, fragmentShader: rangeFragmentShader,
    defines: { ...SKY_DEFINES, OCTAVES: quality === 'low' ? 3 : 5 },
    uniforms: {
      uRockDark: { value: new Color('#33283c') }, uRockLit: { value: new Color('#685571') },
      uSnow: { value: new Color('#f4f0fa') }, uHaze: { value: new Color('#a897c0') },
      uSkyFill: { value: new Color('#857c9f') }, uGroundFill: { value: new Color('#3d3450') },
      uKeyColor: { value: new Color('#ece2f2') }, uKeyDir: { value: new Vector3(0.6, 0.5, 0.62) },
      uSnowLine: { value: snowLine }, uHazeNear: { value: 20 }, uHazeFar: { value: 220 }, uHazeMax: { value: 0.5 }, uMistHeight: { value: mistHeight },
      uAuroraLeft: { value: new Color(CURTAINS[0].color) }, uAuroraRight: { value: new Color(CURTAINS[3].color) },
      uAuroraGain: aurora.uAuroraGain,
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
      ...auroraLight(),
    },
  }), [quality])
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  useFrame(state => {
    const hover = monolithHover(state.clock.elapsedTime, reducedMotion), m = mesh.current
    if (!m) return
    m.position.y = MONOLITH.center[1] + hover.y
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

function Composition({ onRenderTime, quality, reducedMotion }: { onRenderTime: (now: number) => void, quality: GraphicsQuality, reducedMotion: boolean }) {
  const aurora = AURORA
  useFrame(state => {
    // Slow curtain drift; reduced motion holds a fixed pose. Not music-driven until BR8.
    const phases = curtainPhases(state.clock.elapsedTime, reducedMotion)
    AURORA.uPhase.value.set(phases[0], phases[1], phases[2], phases[3])
    AURORA.uAuroraGain.value = auroraGain(phases)
    onRenderTime(performance.now())
  })
  return <>
    <color attach="background" args={[SKY_TOP]} />
    <FixedCamera />
    <Sky quality={quality} aurora={aurora} />
    {RANGES.map((_, i) => <Range key={i} index={i} quality={quality} aurora={aurora} />)}
    {/* Water: flat placeholder plane at y = 0 out to the far ranges. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, CAMERA_Z - 150]}>
      <planeGeometry args={[2400, 320]} />
      <meshBasicMaterial color="#5a4c79" />
    </mesh>
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
  // Accepted for the existing App contract; music response returns in phase BR8.
  playing: boolean, musicFeatures: MusicFeatureReader, reactivity: number,
  onRenderTime: (now: number) => void, quality: GraphicsQuality,
}

export default function BloomScene({ onRenderTime, quality, reactivity }: BloomSceneProps) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true)
  return (
    <section className="bloom-stage" aria-label="Bloom: a tall stone monolith hovering over a still lake, between misty mountain ranges under an aurora">
      <SceneBoundary>
        <LandscapeCanvas projection="perspective" camera={{ fov: FOV_DEGREES, near: 0.1, far: 600, position: [0, CAMERA_HEIGHT, CAMERA_Z] }}
          cameraTilt={false} reactivity={reactivity} quality={quality} reducedMotion={reducedMotion}
          fallback={<p className="bloom-fallback">Bloom can’t be shown because this browser can’t use WebGL. Audio still works: use the controls below to choose audio or another landscape.</p>}>
          <Composition onRenderTime={onRenderTime} quality={quality} reducedMotion={reducedMotion} />
        </LandscapeCanvas>
      </SceneBoundary>
      <div className="bloom-brand" aria-hidden="true">Bloom</div>
    </section>
  )
}
