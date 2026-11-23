import { LightingDriver } from './LightingDriver'
import { IndustrialBuildings } from './WallSurface'
import { Atmosphere } from './Atmosphere'
import { WetGround } from './WetGround'
import { NOCTURNE_LIGHT_COLORS, type NocturneLighting, type NocturneLightingMode } from './lighting'
import { Component, useEffect, useRef, useSyncExternalStore, type ReactNode, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { createViewMotion, updateViewMotion } from '../crimson-horizon/cameraMotion'
import type { MusicFeatureReader } from '../../audio/musicFeatures'
import { LandscapeCanvas } from '../../engine/LandscapeCanvas'
import type { GraphicsQuality } from '../../engine/quality'
import { ArchitectureDetails } from './ArchitectureDetails'
import './nocturne.css'

// Metres; negative Z runs down the alley. Keep composition tuning local to Nocturne.
const layout = { width: 6, depth: 52, bridgeZ: -8, clearance: 4.5 }
type BoxProps = { position: [number, number, number], size: [number, number, number], color?: string }
function Block({ position, size, color = '#303940' }: BoxProps) {
  return <mesh position={position}><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={1} /></mesh>
}
function Architecture() {
  return <>
    <IndustrialBuildings />
    <color attach="background" args={['#05070b']} />
    {/* Static cool visibility floor; independent of fixture energy and Reactivity. */}
    <ambientLight name="nocturne-readability-fill" color="#708a9e" intensity={0.35} />
    <hemisphereLight args={['#a2b1bd', '#737b81', 2.2]} />
    <directionalLight position={[-2, 12, 4]} intensity={0.9} color="#bac5cc" />
    <Block position={[0, -0.15, -23]} size={[18, 0.3, 64]} color="#12191e" />
    {[-1, 1].map(side => <group key={side}>
      {[0, 1, 2, 3, 4, 5].map(index => {
        const z = 2 - index * 10
        return <group key={index}>
          <Block position={[side * 2.93, 4, z + 4.6]} size={[0.28, 8, 0.45]} color="#1a242c" />
          <Block position={[side * 2.88, 7.6, z]} size={[0.3, 0.28, 9.8]} color="#1a242c" />
        </group>
      })}
      <Block position={[side * 2.85, 0.12, -23]} size={[0.3, 0.24, 60]} color="#263039" />
    </group>)}
    <group position={[0, layout.clearance, layout.bridgeZ]}>
      <Block position={[0, 0.22, 0]} size={[layout.width + 0.4, 0.44, 2.1]} color="#26313a" />
      {[-0.96, 0.96].map(z => <group key={z}>
        {[0.65, 1.05, 1.5].map(y => <Block key={y} position={[0, y, z]} size={[6.2, 0.065, 0.065]} color="#3a4750" />)}
        {[-3, -2, -1, 0, 1, 2, 3].map(x => <Block key={x} position={[x, 0.97, z]} size={[0.075, 1.12, 0.075]} color="#35414b" />)}
      </group>)}
      {[-0.7, 0, 0.7].map(z => <Block key={z} position={[0, -0.12, z]} size={[6.1, 0.3, 0.12]} color="#1b252d" />)}
    </group>
    <Block position={[0, 9, -layout.depth]} size={[15, 18, 1]} color="#141e27" />
    {[-1.3, 1.3].map(x => <Block key={x} position={[x, 2, -layout.depth + 0.8]} size={[0.18, 4, 0.3]} color="#283640" />)}
    <Block position={[0, 4, -layout.depth + 0.8]} size={[2.8, 0.2, 0.3]} color="#283640" />
  </>
}
const motionQuery = '(prefers-reduced-motion: reduce)'
function subscribeReducedMotion(onChange: () => void) {
  const preference = window.matchMedia(motionQuery)
  preference.addEventListener('change', onChange)
  return () => preference.removeEventListener('change', onChange)
}
function getReducedMotion() { return window.matchMedia(motionQuery).matches }
function MouseCamera({ target, reducedMotion }: { target: RefObject<{ x: number, y: number }>, reducedMotion: boolean }) {
  const view = useRef(createViewMotion())
  useFrame(({ camera }, delta) => {
    updateViewMotion(view.current, target.current, delta, reducedMotion)
    // Close walls amplify parallax: use a quarter of Crimson’s world-space range.
    camera.position.set(view.current.x * 0.25, 1.6 + view.current.y * 0.25, 5)
    // Preserve the blockout's neutral upward view while looking into the alley.
    camera.lookAt(0, 1.6 + Math.tan(0.055) * 57, -52)
  })
  return null
}
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <p className="nocturne-fallback">Nocturne could not render. Choose another landscape or reload.</p> : this.props.children }
}
export default function NocturneScene({ musicFeatures, quality, lighting, lightingMode, reactivity }: { musicFeatures: MusicFeatureReader, quality: GraphicsQuality, lighting: NocturneLighting, lightingMode: NocturneLightingMode, reactivity: number }) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true)
  const target = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const reset = () => { target.current.x = 0; target.current.y = 0 }
    window.addEventListener('blur', reset)
    return () => window.removeEventListener('blur', reset)
  }, [])
  return <section className="nocturne-stage" aria-label="Nocturne: a three-dimensional industrial alley preview"
    onPointerMove={event => {
      if (event.pointerType !== 'mouse' || reducedMotion) return
      const bounds = event.currentTarget.getBoundingClientRect()
      target.current.x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1))
      target.current.y = Math.max(-1, Math.min(1, 1 - (event.clientY - bounds.top) / bounds.height * 2))
    }}
    onPointerLeave={() => { target.current.x = 0; target.current.y = 0 }}>
    <SceneBoundary>
      <LandscapeCanvas reactivity={0} reducedMotion={reducedMotion} cameraTilt={false} quality={quality}
        projection="perspective" camera={{ position: [0, 1.6, 5], rotation: [0.055, 0, 0], fov: 50, near: 0.1, far: 100 }} frameloop="always"
        fallback={<p className="nocturne-fallback">Nocturne needs WebGL. You can choose another landscape from the scene menu.</p>}>
        <MouseCamera target={target} reducedMotion={reducedMotion} />
        <Architecture />
        <ArchitectureDetails />
        <Atmosphere />
        <WetGround quality={quality} />
        <group name="nocturne-light-spill">
          <pointLight name="magenta-fixture-spill" position={[2.1, 2.8, -3]} color={NOCTURNE_LIGHT_COLORS.magenta} intensity={50} distance={13} decay={2} />
          <pointLight name="magenta-bridge-spill" position={[0, 3.9, -7.1]} color={NOCTURNE_LIGHT_COLORS.magenta} intensity={40} distance={13} decay={2} />
          <pointLight name="cyan-window-spill" position={[-2.1, 5.8, 0.1]} color={NOCTURNE_LIGHT_COLORS.cyan} intensity={65} distance={14} decay={2} />
          <pointLight name="cyan-panel-spill" position={[2.1, 4.75, -15]} color={NOCTURNE_LIGHT_COLORS.cyan} intensity={40} distance={12} decay={2} />
          <pointLight name="cyanPanel-left-spill" position={[-2.35, 2.65, -7.3]} color={NOCTURNE_LIGHT_COLORS.cyan} intensity={30} distance={9} decay={2} />
          <pointLight name="violet-near-spill" position={[2.6, 4.8, -4.3]} color={NOCTURNE_LIGHT_COLORS.violet} intensity={12} distance={7} decay={2} />
          <pointLight name="violet-far-spill" position={[-2.6, 4.8, -14.3]} color={NOCTURNE_LIGHT_COLORS.violet} intensity={12} distance={7} decay={2} />
        </group>
        <LightingDriver musicFeatures={musicFeatures} mode={lightingMode} manual={lighting} reactivity={reactivity} reducedMotion={reducedMotion} />
      </LandscapeCanvas>
    </SceneBoundary>
    <div className="nocturne-brand" aria-hidden="true">Nocturne</div>
  </section>
}
