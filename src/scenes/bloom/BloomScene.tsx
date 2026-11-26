import './bloom.css'
import { Component, useEffect, useLayoutEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, Color, Float32BufferAttribute, ShaderMaterial, Vector3 } from 'three'
import type { MusicFeatureReader } from '../../audio/musicFeatures'
import type { GraphicsQuality } from '../../engine/quality'
import { LandscapeCanvas } from '../../engine/LandscapeCanvas'
import { CAMERA_HEIGHT, CAMERA_PITCH, CAMERA_Z, CRYSTALS, FOV_DEGREES, MONOLITH, RANGES, heightForScreen, xForScreen } from './composition'
import { buildRange, rangeCells, rangeFragmentShader, rangeVertexShader } from './ranges'

// Bloom rebuild from the Resonant Monolith reference. BR1 placed everything from measured
// screen fractions; BR2 replaces the range silhouettes with real 3D terrain. Sky, monolith,
// crystals and water are still BR1 placeholders.

const SKY_DISTANCE = 300
const SKY_TOP = '#4b3d70', SKY_HORIZON = '#d4b2d6'

function FixedCamera() {
  const camera = useThree(state => state.camera)
  useLayoutEffect(() => {
    camera.position.set(0, CAMERA_HEIGHT, CAMERA_Z)
    camera.rotation.set(CAMERA_PITCH, 0, 0)
    camera.updateMatrixWorld()
  }, [camera])
  return null
}

// Vertical gradient card far behind everything, spanning ultra-wide and portrait frames.
function Sky() {
  const geometry = useMemo(() => {
    const halfWidth = xForScreen(1, SKY_DISTANCE) * 1.8, top = heightForScreen(-0.1, SKY_DISTANCE)
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute([-halfWidth, -5, 0, halfWidth, -5, 0, halfWidth, top, 0, -halfWidth, top, 0], 3))
    const [low, high] = [new Color(SKY_HORIZON), new Color(SKY_TOP)]
    g.setAttribute('color', new Float32BufferAttribute([...low.toArray(), ...low.toArray(), ...high.toArray(), ...high.toArray()], 3))
    g.setIndex([0, 1, 2, 0, 2, 3])
    return g
  }, [])
  return <mesh geometry={geometry} position={[0, 0, CAMERA_Z - SKY_DISTANCE]}>
    <meshBasicMaterial vertexColors depthWrite={false} />
  </mesh>
}

// Per-range material with that range's snow line and mist depth. Identical shader source, so
// three.js compiles one program for all five.
function useRangeMaterial(quality: GraphicsQuality, snowLine: number, mistHeight: number) {
  const material = useMemo(() => new ShaderMaterial({
    vertexShader: rangeVertexShader, fragmentShader: rangeFragmentShader,
    defines: { OCTAVES: quality === 'low' ? 3 : 5 },
    uniforms: {
      uRockDark: { value: new Color('#33283c') }, uRockLit: { value: new Color('#685571') },
      uSnow: { value: new Color('#f4f0fa') }, uHaze: { value: new Color('#a897c0') },
      uSkyFill: { value: new Color('#857c9f') }, uGroundFill: { value: new Color('#3d3450') },
      uKeyColor: { value: new Color('#ece2f2') }, uKeyDir: { value: new Vector3(0.6, 0.5, 0.62) },
      uSnowLine: { value: snowLine }, uHazeNear: { value: 20 }, uHazeFar: { value: 220 }, uHazeMax: { value: 0.5 }, uMistHeight: { value: mistHeight },
    },
  }), [quality, snowLine, mistHeight])
  useEffect(() => () => material.dispose(), [material])
  return material
}

function Range({ index, quality }: { index: number, quality: GraphicsQuality }) {
  const layer = RANGES[index]
  const material = useRangeMaterial(quality, layer.snow, 0.56)
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

function Composition({ onRenderTime, quality }: { onRenderTime: (now: number) => void, quality: GraphicsQuality }) {
  useFrame(() => onRenderTime(performance.now()))
  return <>
    <color attach="background" args={[SKY_TOP]} />
    <FixedCamera />
    <Sky />
    {RANGES.map((_, i) => <Range key={i} index={i} quality={quality} />)}
    {/* Water: flat placeholder plane at y = 0 out to the far ranges. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, CAMERA_Z - 150]}>
      <planeGeometry args={[2400, 320]} />
      <meshBasicMaterial color="#5a4c79" />
    </mesh>
    <mesh position={MONOLITH.center}>
      <boxGeometry args={[MONOLITH.width, MONOLITH.height, MONOLITH.depth]} />
      <meshBasicMaterial color="#3b3247" />
    </mesh>
    {/* Seam placeholder: thin bright strip on the front face, left of centre as in the reference. */}
    <mesh position={[-MONOLITH.width * 0.12, MONOLITH.center[1], 0.005]}>
      <planeGeometry args={[0.035, MONOLITH.height * 0.92]} />
      <meshBasicMaterial color="#f6d3e6" />
    </mesh>
    {CRYSTALS.map((crystal, i) => <mesh key={i} position={crystal.position} rotation={[0.2, 0.5, 0]}>
      <octahedronGeometry args={[crystal.size]} />
      <meshBasicMaterial color="#8fc9c1" />
    </mesh>)}
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
          <Composition onRenderTime={onRenderTime} quality={quality} />
        </LandscapeCanvas>
      </SceneBoundary>
      <div className="bloom-brand" aria-hidden="true">Bloom</div>
    </section>
  )
}
