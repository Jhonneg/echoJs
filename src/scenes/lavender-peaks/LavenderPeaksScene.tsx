import { Component, useLayoutEffect, useMemo, useRef, useSyncExternalStore, type ReactNode, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Group, OrthographicCamera, ShaderMaterial, Shape } from 'three'
import type { GraphicsQuality } from '../../engine/quality'
import { LandscapeCanvas } from '../../engine/LandscapeCanvas'
import type { MusicFeatureReader } from '../../audio/musicFeatures'
import { createLayerMotion, updateLayerMotion, ridgeHeight, TERRAIN_PERIOD } from './motion'
import { createLavenderResponse, updateLavenderResponse, type LavenderResponse } from './response'
import { RIDGE_SHADING } from './shading'
import { CORONA_SETTINGS, coronaFragment, createCorona, updateCorona } from './corona'
import { ridges, type Ridge } from './terrain'
import './lavender-peaks.css'

const vertex = `varying vec2 vPosition;
void main() { vPosition = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

const skyFragment = `varying vec2 vPosition;
${coronaFragment}
void main() {
  float height = smoothstep(-5.8, 5.8, vPosition.y);
  vec3 cream = vec3(1.0, 0.87, 0.84);
  vec3 lavender = vec3(0.62, 0.42, 0.85);
  vec3 color = mix(cream, lavender, height);
  float halo = exp(-pow(vPosition.x / 5.8, 2.0) - pow((vPosition.y + 0.9) / 3.7, 2.0));
  color = mix(color, vec3(1.0, 0.94, 0.86), halo * 0.55);
  // Fixed behind the first large peak; opaque ridges reveal it as they travel.
  vec2 sunOffset = vPosition - vec2(1.6, 1.9);
  float sunDistance = length(sunOffset);
  float sunDisc = 1.0 - smoothstep(0.68, 0.75, sunDistance);
  float sunHaze = exp(-pow(sunDistance / 1.1, 2.0)) * 0.055;
  color = mix(color, vec3(1.0, 0.94, 0.83), sunDisc * 0.38 + sunHaze);
  // Derivatives are evaluated before the localized branch, keeping Low quality soft.
  color = applyCorona(color, sunOffset, sunDistance, max(fwidth(sunDistance), 0.006));
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`

const ridgeFragment = `varying vec2 vPosition;
uniform vec3 upperColor;
uniform vec3 lowerColor;
uniform float bottom;
uniform float top;
uniform float sustained;
uniform float accent;
uniform vec3 tint;
uniform float upperStrength;
uniform float lowerWeight;
uniform float accentStrength;
uniform float phase;
void main() {
  float blend = smoothstep(bottom, top, vPosition.y);
  vec3 color = mix(lowerColor, upperColor, blend);
  // Integer harmonics share the authored 24-unit period: no tile seams.
  float cycle = vPosition.x * 6.28318530718 / 24.0;
  float broad = 0.75 + 0.25 * sin(cycle + phase);
  float slope = blend * blend;
  color = mix(color, tint, sustained * upperStrength * slope * broad);
  color *= 1.0 - sustained * lowerWeight * (1.0 - blend);
  // A stationary soft patch, not a travelling contour (LP06).
  float localPatch = pow(0.5 + 0.5 * sin(cycle * 2.0 + phase), 4.0);
  float accentMask = smoothstep(0.4, 1.0, blend) * localPatch;
  color = mix(color, vec3(0.97, 0.86, 0.89), accent * accentStrength * accentMask);
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`

function RidgeLayer({ ridge, index, halfWidth, response }: { ridge: Ridge, index: number, halfWidth: number, response: RefObject<LavenderResponse> }) {
  const material = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(() => {
    const settings = RIDGE_SHADING[index]
    return {
      upperColor: { value: new Color(ridge.upper) }, lowerColor: { value: new Color(ridge.lower) },
      bottom: { value: ridge.base - 2.2 }, top: { value: ridge.base + 2.5 },
      sustained: { value: 0 }, accent: { value: 0 }, tint: { value: new Color(settings.tint) },
      upperStrength: { value: settings.upper }, lowerWeight: { value: settings.lower },
      accentStrength: { value: settings.accent }, phase: { value: settings.phase },
    }
  }, [ridge, index])
  useFrame(() => {
    if (!material.current) return
    material.current.uniforms.sustained.value = response.current.ridges[index].sustained
    material.current.uniforms.accent.value = response.current.ridges[index].accent
  }, -.5)
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
      <shaderMaterial ref={material} vertexShader={vertex} fragmentShader={ridgeFragment} uniforms={uniforms} toneMapped={false} />
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

type MotionProps = { musicFeatures: MusicFeatureReader, reactivity: number, reducedMotion: boolean }

function Composition({ musicFeatures, reactivity, reducedMotion }: MotionProps) {
  const sky = useRef<ShaderMaterial>(null)
  const skyUniforms = useMemo(() => ({
    coronaTime: { value: 0 }, coronaEnvelope: { value: 0 }, coronaDetail: { value: 0 },
    coronaLowAccent: { value: 0 }, coronaMidAccent: { value: 0 }, coronaHighAccent: { value: 0 },
    coronaMotion: { value: 1 }, coronaSunRadius: { value: CORONA_SETTINGS.sunRadius },
    coronaRadiusRatio: { value: CORONA_SETTINGS.maximumRadiusRatio },
    coronaBaseAmplitude: { value: CORONA_SETTINGS.baseAmplitude }, coronaMaxAmplitude: { value: CORONA_SETTINGS.maximumAmplitude },
    coronaBaseOpacity: { value: CORONA_SETTINGS.restingOpacity }, coronaMaxOpacity: { value: CORONA_SETTINGS.maximumOpacity },
  }), [])
  const corona = useRef(createCorona())
  const groups = useRef<(Group | null)[]>([])
  const motion = useRef(ridges.map(() => createLayerMotion()))
  const response = useRef(createLavenderResponse())
  const size = useThree(state => state.size)
  const zoom = Math.min(size.height / 12, size.width / 7)
  // One extra period covers the entire rightward offset, including ultra-wide views.
  const halfWidth = (Math.ceil(size.width / zoom / 2 / TERRAIN_PERIOD) + 1) * TERRAIN_PERIOD
  const skyWidth = Math.max(40, size.width / zoom + 2)
  const skyHeight = Math.max(40, size.height / zoom + 2)
  useFrame((_, delta) => {
    updateLavenderResponse(response.current, musicFeatures, delta, performance.now() / 1000, reactivity, reducedMotion)
    updateCorona(corona.current, response.current, delta, reactivity, reducedMotion)
    if (sky.current) {
      const uniforms = sky.current.uniforms, state = corona.current
      uniforms.coronaTime.value = state.time
      uniforms.coronaEnvelope.value = state.envelope; uniforms.coronaDetail.value = state.detail
      uniforms.coronaLowAccent.value = state.lowAccent; uniforms.coronaMidAccent.value = state.midAccent
      uniforms.coronaHighAccent.value = state.highAccent; uniforms.coronaMotion.value = state.motion
      uniforms.coronaBaseOpacity.value = reducedMotion ? CORONA_SETTINGS.reducedOpacity : CORONA_SETTINGS.restingOpacity
    }
    for (let depth = 0; depth < ridges.length; depth++) {
      updateLayerMotion(motion.current[depth], depth, reducedMotion, delta)
      const group = groups.current[depth]
      if (group) group.position.x = motion.current[depth].offset
    }
  }, -1)
  return <>
    <Framing />
    <mesh position={[0, 0, -10]}><planeGeometry args={[skyWidth, skyHeight]} /><shaderMaterial ref={sky} uniforms={skyUniforms} vertexShader={vertex} fragmentShader={skyFragment} toneMapped={false} /></mesh>
    {ridges.map((ridge, index) => <group key={index} ref={group => { groups.current[index] = group }}>
      <RidgeLayer ridge={ridge} index={index} halfWidth={halfWidth} response={response} />
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

export default function LavenderPeaksScene({ quality, musicFeatures, reactivity }: { quality: GraphicsQuality, musicFeatures: MusicFeatureReader, reactivity: number }) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true)
  return (
    <section className="lavender-stage" aria-label="Lavender Peaks: layered mountains revealing a faint sun in a pale lavender sky">
      <SceneBoundary>
        <LandscapeCanvas cameraTilt={false} reactivity={reactivity} quality={quality} reducedMotion={reducedMotion} fallback={<p className="lavender-fallback">Lavender Peaks needs WebGL to display. You can still use the scene menu to choose audio.</p>}>
          <Composition musicFeatures={musicFeatures} reactivity={reactivity} reducedMotion={reducedMotion} />
        </LandscapeCanvas>
      </SceneBoundary>
      <div className="lavender-brand" aria-hidden="true">Lavender Peaks</div>
    </section>
  )
}
