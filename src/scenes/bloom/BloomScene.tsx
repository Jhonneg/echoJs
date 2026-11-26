import { Component, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore, type ReactNode, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, PlaneGeometry, Color, DirectionalLight, Fog, Group, Object3D, OrthographicCamera, ShaderMaterial, Vector2, Vector4 } from 'three'
import type { MusicFeatureReader } from '../../audio/musicFeatures'
import { createBloomMusic, updateBloomMusic } from './music'
import type { GraphicsQuality } from '../../engine/quality'
import { LandscapeCanvas } from '../../engine/LandscapeCanvas'
import { createMountainGeometry } from './mountains'
import { createMountainMaterial } from './surface'
import { MONOLITH, STONE_FRAGMENTS, createMonolithGeometry, createStoneFragmentGeometry, createStoneMaterial } from './monolith'
import { auroraFragment } from './aurora'
import { createTrailGeometry, trailVertex, trailFragment } from './trails'
import { createFloat, updateFloat, createParallax, updateParallax } from './lifecycle'
import { WaterSurface } from './WaterSurface'
import { WATER_VIEW } from './water'
import './bloom.css'

const vertex = `varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

// Camera-neutral backdrop cards keep the authored horizon level during orbit.
const backdropVertex = `varying vec2 vUv;
void main(){vUv=uv;vec4 p=modelMatrix*vec4(position,1.0);gl_Position=projectionMatrix*vec4(p.xy,p.z-512.0,1.0);}`

const skyFragment = `varying vec2 vUv;
uniform vec3 midnight;
uniform vec3 lavender;
uniform vec3 rose;
uniform float atmosphere;
${auroraFragment}
void main() {
  float y = vUv.y * 20.0 - 10.0;
  vec3 color = mix(lavender, midnight, smoothstep(0.0, 5.5, y));
  float horizon = exp(-abs(y) * 1.1);
  color = mix(color, rose, horizon * (0.42 + atmosphere * 0.12));
  vec2 skyPosition=vec2(vUv.x*40.0-20.0,y);
  color+=auroraField(skyPosition)*0.65;
  color=mix(color,auroraColor,auroraStrength*0.045*exp(-abs(y)*1.1));
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`

function Framing() {
  const { get, size, invalidate } = useThree()
  useLayoutEffect(() => {
    const camera = get().camera
    if (camera instanceof OrthographicCamera) {
      // Hold the vertical composition; reveal more landscape on wider screens.
      camera.zoom = Math.min(size.height / 10, size.width / 6.8)
      camera.updateProjectionMatrix()
      invalidate()
    }
  }, [get, size.height, size.width, invalidate])
  return null
}

function Mountains({ quality, material, surfaces }: { quality: GraphicsQuality, material: RefObject<ShaderMaterial | null>, surfaces: ReturnType<typeof createMountainMaterial>[] }) {
  const banks = useMemo(() => [createMountainGeometry(-1, quality), createMountainGeometry(1, quality)], [quality])
  const geometry = useMemo(() => createTrailGeometry(banks, quality), [banks, quality])
  const uniforms = useMemo(() => ({ trailPhases: { value: new Vector2(0,.43) }, trailLevels: { value: new Vector2(1,1) },
    trailShimmer: { value: new Vector2() }, trailPulseProgress: { value: new Vector4(2,2,2,2) }, trailPulseStrength: { value: new Vector4() }, trailPulseDetail: { value: new Vector4() } }), [])
  useLayoutEffect(() => () => { banks.forEach(g => g.dispose()); geometry.dispose() }, [banks, geometry])
  return <>
    {banks.map((bank, i) => <mesh key={i} name={i === 0 ? 'bloom-left-bank' : 'bloom-right-bank'}>
      <primitive object={bank} attach="geometry" />
      <primitive object={surfaces[i]} attach="material" />
    </mesh>)}
    <mesh name="bloom-trails" geometry={geometry} renderOrder={1}>
      <shaderMaterial ref={material} vertexShader={trailVertex} fragmentShader={trailFragment} uniforms={uniforms}
        transparent blending={AdditiveBlending} depthWrite={false} depthTest
        polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} toneMapped={false} />
    </mesh>
  </>
}

// Local emissive falloff, rather than full-frame bloom or a hard painted strip.
const beamFragment = `varying vec2 vUv;
uniform float strength;
uniform float falloff;
uniform float seamLevel;
void main() {
  float x = (vUv.x - 0.5) * 2.0;
  float profile = exp(-x*x*falloff*2.0)+exp(-x*x*2.0)*0.10;
  float ends = smoothstep(0.0,0.045,vUv.y)*(1.0-smoothstep(0.955,1.0,vUv.y));
  vec3 light = mix(vec3(1.0,0.48,0.73),vec3(1.0,0.94,0.97),pow(profile,3.0));
  gl_FragColor = vec4(light,profile*strength*seamLevel*ends);
  #include <colorspace_fragment>
}`

function Monolith({ auroraColor, auroraStrength, hero, seam, stone, fragmentsRef }: { auroraColor: Color, auroraStrength: { value: number }, hero: RefObject<Group | null>, seam: RefObject<ShaderMaterial | null>, stone: RefObject<ReturnType<typeof createStoneMaterial> | null>, fragmentsRef: RefObject<(Object3D | null)[]> }) {
  const m = MONOLITH
  const geometry = useMemo(() => createMonolithGeometry(), [])
  const beamGeometry=useMemo(()=>new PlaneGeometry(.038,m.seamHeight),[m.seamHeight])
  const fragments = useMemo(() => STONE_FRAGMENTS.map((_, i) => createStoneFragmentGeometry(i)), [])
  const core = useMemo(() => ({strength:{value:.96},falloff:{value:2.8},seamLevel:{value:1}}), [])
  const material = useMemo(() => createStoneMaterial(auroraColor, auroraStrength), [auroraColor, auroraStrength])
  useLayoutEffect(() => () => { geometry.dispose(); beamGeometry.dispose(); fragments.forEach(g => g.dispose()); material.dispose() }, [geometry, beamGeometry, fragments, material])
  return <>
    <group ref={hero} name="bloom-monolith" position={[m.x,m.y,0]} rotation={[0,m.yaw,0]}>
      <mesh name="monolith-body" geometry={geometry}><primitive object={material} attach="material" ref={stone} /></mesh>
      <mesh name="monolith-seam" position={[m.seamX,0,m.seamZ]} geometry={beamGeometry}>
        <shaderMaterial ref={seam} vertexShader={vertex} fragmentShader={beamFragment} uniforms={core}
          transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
    </group>
    {STONE_FRAGMENTS.map((f, i) => <mesh ref={node=>{fragmentsRef.current[i]=node}} key={i} name={`monolith-fragment-${i}`} position={[f.x,f.y,0]}
      geometry={fragments[i]} material={material} />)}
  </>
}

function Composition({ playing, reducedMotion, musicFeatures, reactivity, onRenderTime, quality }: { playing: boolean, reducedMotion: boolean, musicFeatures: MusicFeatureReader, reactivity: number, onRenderTime: (now: number) => void, quality: GraphicsQuality }) {
  const keyLight = useRef<DirectionalLight>(null)
  const fog = useRef<Fog>(null)
  const colors = useMemo(() => ({mint:new Color('#9CD7C8'),rose:new Color('#C69AB7'),light:new Color(),baseKey:new Color('#F6D5EC'),baseFog:new Color('#81769E')}), [])
  const lake = useRef<ShaderMaterial>(null)
  const setLake=useCallback((material: ShaderMaterial | null)=>{lake.current=material},[])
  const skyMaterial = useRef<ShaderMaterial>(null)
  const response = useRef(createBloomMusic())
  const floating = useRef(createFloat()), pointer = useRef(createParallax())
  const fragmentsRef = useRef<(Object3D | null)[]>([])
  const { camera, gl } = useThree()
  useEffect(()=>{
    const canvas=gl.domElement, fine=window.matchMedia('(hover: hover) and (pointer: fine)')
    const move=(event: PointerEvent)=>{if(reducedMotion||!fine.matches||event.pointerType!=='mouse'){pointer.current.targetX=pointer.current.targetY=0;return;}const r=canvas.getBoundingClientRect();pointer.current.targetX=Math.max(-1,Math.min(1,2*(event.clientX-r.left)/r.width-1));pointer.current.targetY=Math.max(-1,Math.min(1,1-2*(event.clientY-r.top)/r.height))}
    const reset=()=>{pointer.current.targetX=pointer.current.targetY=0}
    canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerleave',reset);window.addEventListener('blur',reset);fine.addEventListener('change',reset)
    return()=>{canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerleave',reset);window.removeEventListener('blur',reset);fine.removeEventListener('change',reset)}
  },[gl,reducedMotion])
  const mountainMaterials = useMemo(() => [createMountainMaterial(),createMountainMaterial()], [])
  const surfaces = useRef(mountainMaterials)
  useLayoutEffect(() => () => mountainMaterials.forEach(m=>m.dispose()),[mountainMaterials])
  const stone = useRef<ReturnType<typeof createStoneMaterial>>(null)
  const hero = useRef<Group>(null), seam = useRef<ShaderMaterial>(null), trails = useRef<ShaderMaterial>(null)
  useFrame((_, delta) => {
    if (!lake.current || !skyMaterial.current) return
    const now = performance.now()
    onRenderTime(now)
    const state = updateBloomMusic(response.current, musicFeatures, delta, now / 1000, reactivity, reducedMotion)
    const float=updateFloat(floating.current,playing,reducedMotion,delta,state.bands[2].accent,state.bands[3].accent)
    const view=updateParallax(pointer.current,delta,!reducedMotion)
    const yaw=view.x*Math.PI/72,pitch=WATER_VIEW.pitch+view.y*Math.PI/150
    camera.position.set(WATER_VIEW.distance*Math.sin(yaw)*Math.cos(pitch),WATER_VIEW.distance*Math.sin(pitch),WATER_VIEW.distance*Math.cos(yaw)*Math.cos(pitch));camera.lookAt(0,0,0);camera.updateMatrixWorld()
    const out = state.output
    out.heroY=float.y;out.heroYaw=float.yaw
    for(let i=0;i<2;i++){
      const mesh=fragmentsRef.current[i],f=STONE_FRAGMENTS[i],motion=float.fragments[i]
      if(mesh){mesh.position.set(f.x+motion.x,f.y+motion.y,motion.z);mesh.rotation.set(motion.rotation,motion.rotation*.7,motion.rotation*.4)}

    }
    colors.light.copy(colors.mint).lerp(colors.rose,out.auroraHue)
    for(let i=0;i<2;i++) {
      const material=i===0?lake.current:skyMaterial.current
      material.uniforms.auroraTime.value=state.ambient.time
      material.uniforms.auroraStrength.value=out.auroraStrength
      material.uniforms.auroraColor.value.copy(colors.light)
      material.uniforms.auroraExpansion.value=out.auroraExpansion
      material.uniforms.auroraDetail.value=out.auroraDetail
    }
    const auroraExcess=Math.max(0,out.auroraStrength-state.ambient.strength)
    for(const material of surfaces.current){material.auroraStrength.value=auroraExcess;material.auroraColor.value.copy(colors.light)}
    if(keyLight.current){keyLight.current.color.copy(colors.baseKey).lerp(colors.light,out.auroraStrength*.65);keyLight.current.intensity=3+state.ambient.strength*.8+Math.max(0,out.auroraStrength-state.ambient.strength)*2.6}
    if(fog.current)fog.current.color.copy(colors.baseFog).lerp(colors.light,(state.ambient.strength*.12+Math.max(0,out.auroraStrength-state.ambient.strength)*.35))
    if(hero.current){hero.current.position.y=out.heroY;hero.current.rotation.y=out.heroYaw}
    if(seam.current)seam.current.uniforms.seamLevel.value=out.seamLevel
    if(stone.current){stone.current.seamLevel.value=out.seamLevel;stone.current.auroraStrength.value=out.auroraStrength;stone.current.auroraExcess.value=auroraExcess}
    if(trails.current){
      const u=trails.current.uniforms,a=state.trails[0],b=state.trails[1]
      u.trailPhases.value.set(a.phase,b.phase);u.trailLevels.value.set(a.level,b.level);u.trailShimmer.value.set(a.shimmer,b.shimmer)
      u.trailPulseProgress.value.set(a.pulses[0].progress,a.pulses[1].progress,b.pulses[0].progress,b.pulses[1].progress)
      u.trailPulseDetail.value.set(a.pulses[0].detail,a.pulses[1].detail,b.pulses[0].detail,b.pulses[1].detail)
      u.trailPulseStrength.value.set(a.pulses[0].strength,a.pulses[1].strength,b.pulses[0].strength,b.pulses[1].strength)
    }
    const uniforms = lake.current.uniforms
    uniforms.viewDirection.value.copy(camera.position).normalize()
    uniforms.anchorX.value=MONOLITH.x
    if(keyLight.current){uniforms.keyColor.value.copy(keyLight.current.color);uniforms.keyStrength.value=keyLight.current.intensity}
    uniforms.time.value=state.time;uniforms.seamLevel.value=out.seamLevel
    uniforms.ringAge.value=state.ringAge;uniforms.ringStrength.value=state.ringStrength
    uniforms.trailLights.value.set(state.trails[0].level-1+state.trails[0].shimmer+state.trails[0].pulses[0].strength+state.trails[0].pulses[1].strength,
      state.trails[1].level-1+state.trails[1].shimmer+state.trails[1].pulses[0].strength+state.trails[1].pulses[1].strength)
    uniforms.atmosphere.value=out.atmosphere
    skyMaterial.current.uniforms.atmosphere.value=out.atmosphere

  })
  const sky = useMemo(() => ({ auroraExpansion:{value:0},auroraDetail:{value:0},auroraTime:{value:0},auroraStrength:{value:.24},auroraColor:{value:new Color()},auroraLayers:{value:quality==='low'?1:2},atmosphere: { value: 0 }, midnight: { value: new Color('#101322') }, lavender: { value: new Color('#81769E') }, rose: { value: new Color('#C69AB7') } }), [quality])
  return (
    <>
      <Framing />
      <mesh name="bloom-sky" position={[0, 0, -10]}><planeGeometry args={[40, 20]} /><shaderMaterial ref={skyMaterial} vertexShader={backdropVertex} fragmentShader={skyFragment} uniforms={sky} toneMapped={false} /></mesh>
      <fog ref={fog} attach="fog" args={['#81769E', WATER_VIEW.distance+2, WATER_VIEW.distance+11]} />
      <Mountains quality={quality} material={trails} surfaces={mountainMaterials} />
      <WaterSurface quality={quality} onMaterial={setLake} />
      <ambientLight intensity={1.2} />
      <directionalLight ref={keyLight} position={[-3, 5, 6]} intensity={3} color="#F6D5EC" />
      <Monolith auroraColor={colors.light} auroraStrength={sky.auroraStrength} hero={hero} seam={seam} stone={stone} fragmentsRef={fragmentsRef} />
    </>
  )
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <p className="bloom-fallback">Bloom could not render. You can still choose audio from the Bloom menu, or reload to try again.</p> : this.props.children }
}

const motionQuery = '(prefers-reduced-motion: reduce)'
function subscribeReducedMotion(onChange: () => void) {
  const preference = window.matchMedia(motionQuery)
  preference.addEventListener('change', onChange)
  return () => preference.removeEventListener('change', onChange)
}
function getReducedMotion() { return window.matchMedia(motionQuery).matches }

export default function BloomScene({ playing, musicFeatures, onRenderTime, reactivity, quality }: { playing: boolean, musicFeatures: MusicFeatureReader, onRenderTime: (now: number) => void, reactivity: number, quality: GraphicsQuality }) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true)
  return (
    <section className="bloom-stage" aria-label="Bloom: a levitating stone monolith over a tranquil lake at twilight">
      <SceneBoundary>
        <LandscapeCanvas camera={{position:[0,0,WATER_VIEW.distance],zoom:80,near:.1,far:WATER_VIEW.far}} cameraTilt={false} reactivity={reactivity} quality={quality} reducedMotion={reducedMotion} fallback={<p className="bloom-fallback">Bloom needs WebGL to display. You can still choose audio from the controls below.</p>}>
          <Composition playing={playing} reducedMotion={reducedMotion} musicFeatures={musicFeatures} reactivity={reactivity} onRenderTime={onRenderTime} quality={quality} />
        </LandscapeCanvas>
      </SceneBoundary>
      <div className="bloom-brand" aria-hidden="true">Bloom</div>
    </section>
  )
}
