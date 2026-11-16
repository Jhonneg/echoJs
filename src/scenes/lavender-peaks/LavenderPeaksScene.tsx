import { Component, useLayoutEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Group, OrthographicCamera, Shape } from 'three'
import type { GraphicsQuality } from '../../engine/quality'
import { LandscapeCanvas } from '../../engine/LandscapeCanvas'
import type { AudioSignal } from '../../audio/signal'
import { createLayerMotion, updateLayerMotion, ridgeHeight, TERRAIN_PERIOD } from './motion'
import { ridges, type Ridge } from './terrain'
import './lavender-peaks.css'

const vertex = `varying vec2 vPosition;
void main() { vPosition = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

const skyFragment = `varying vec2 vPosition;
void main() {
  float height = smoothstep(-5.8, 5.8, vPosition.y);
  vec3 cream = vec3(1.0, 0.87, 0.84);
  vec3 lavender = vec3(0.62, 0.42, 0.85);
  vec3 color = mix(cream, lavender, height);
  float halo = exp(-pow(vPosition.x / 5.8, 2.0) - pow((vPosition.y + 0.9) / 3.7, 2.0));
  color = mix(color, vec3(1.0, 0.94, 0.86), halo * 0.55);
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`

const ridgeFragment = `varying vec2 vPosition;
uniform vec3 upperColor;
uniform vec3 lowerColor;
uniform float bottom;
uniform float top;
void main() {
  float blend = smoothstep(bottom, top, vPosition.y);
  gl_FragColor = vec4(mix(lowerColor, upperColor, blend), 1.0);
  #include <colorspace_fragment>
}`

function RidgeLayer({ ridge, index, halfWidth }: { ridge: Ridge, index: number, halfWidth: number }) {
  const shape = useMemo(() => {
    const outline = new Shape()
    outline.moveTo(-halfWidth, -100)
    for (let step = 0; step <= halfWidth * 16; step++) {
      const x = -halfWidth + step / 8
      outline.lineTo(x, ridgeHeight(x, ridge.peaks, ridge.base, ridge.detail, index))
    }
    outline.lineTo(halfWidth, -100)
    outline.closePath()
    return outline
  }, [ridge, index, halfWidth])
  return (
    <mesh position={[0, 0, ridge.z]}>
      <shapeGeometry args={[shape]} />
      <shaderMaterial vertexShader={vertex} fragmentShader={ridgeFragment} uniforms={{
        upperColor: { value: new Color(ridge.upper) }, lowerColor: { value: new Color(ridge.lower) },
        bottom: { value: ridge.base - 2.2 }, top: { value: ridge.base + 2.5 },
      }} toneMapped={false} />
    </mesh>
  )
}

function Framing() {
  const { get, size, invalidate } = useThree()
  useLayoutEffect(() => {
    const camera = get().camera
    if (camera instanceof OrthographicCamera) {
      camera.zoom = Math.min(size.height / 12, size.width / 7)
      camera.updateProjectionMatrix()
      invalidate()
    }
  }, [get, size.height, size.width, invalidate])
  return null
}

type MotionProps = { signal: AudioSignal, reactivity: number, reducedMotion: boolean }

function Composition({ signal, reactivity, reducedMotion }: MotionProps) {
  const groups = useRef<(Group | null)[]>([])
  const motion = useRef(ridges.map(() => createLayerMotion()))
  const size = useThree(state => state.size)
  const zoom = Math.min(size.height / 12, size.width / 7)
  // One extra period covers the entire rightward offset, including ultra-wide views.
  const halfWidth = (Math.ceil(size.width / zoom / 2 / TERRAIN_PERIOD) + 1) * TERRAIN_PERIOD
  const skyWidth = Math.max(40, size.width / zoom + 2)
  const skyHeight = Math.max(40, size.height / zoom + 2)
  useFrame((_, delta) => {
    for (let depth = 0; depth < ridges.length; depth++) {
      updateLayerMotion(motion.current[depth], signal, depth, reactivity, reducedMotion, delta)
      const group = groups.current[depth]
      if (group) group.position.x = motion.current[depth].offset
    }
  })
  return <>
    <Framing />
    <mesh position={[0, 0, -10]}><planeGeometry args={[skyWidth, skyHeight]} /><shaderMaterial vertexShader={vertex} fragmentShader={skyFragment} toneMapped={false} /></mesh>
    {ridges.map((ridge, index) => <group key={index} ref={group => { groups.current[index] = group }}>
      <RidgeLayer ridge={ridge} index={index} halfWidth={halfWidth} />
    </group>)}
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
  render() { return this.state.failed ? <p className="lavender-fallback">Lavender Peaks could not render. You can still choose audio from the scene menu, or reload to try again.</p> : this.props.children }
}

export default function LavenderPeaksScene({ quality, signal, reactivity }: { quality: GraphicsQuality, signal: AudioSignal, reactivity: number }) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true)
  return (
    <section className="lavender-stage" aria-label="Lavender Peaks: layered mountains fading into a pale lavender sky">
      <SceneBoundary>
        <LandscapeCanvas cameraTilt={false} signal={signal} reactivity={reactivity} quality={quality} reducedMotion={reducedMotion} frameloop={reducedMotion || reactivity === 0 ? 'demand' : 'always'} fallback={<p className="lavender-fallback">Lavender Peaks needs WebGL to display. You can still use the scene menu to choose audio.</p>}>
          <Composition signal={signal} reactivity={reactivity} reducedMotion={reducedMotion} />
        </LandscapeCanvas>
      </SceneBoundary>
      <div className="lavender-brand" aria-hidden="true">ECHO</div>
    </section>
  )
}
