import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, Color, HalfFloatType, Mesh, MeshBasicMaterial, MeshStandardMaterial, ShaderMaterial, Vector2, WebGLRenderTarget, type Material, type Object3D } from 'three'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import type { GraphicsQuality } from '../../engine/quality'
import { GLOW, GLOW_BLUR_WEIGHTS, GLOW_IDLE, GLOW_LAYER, GLOW_SOURCE_GAIN, GLOW_THRESHOLD, glowActivity, isGlowSource } from './effects'

// NT16 glow (see effects.ts). Takes over Nocturne's render loop: the frame is drawn exactly as
// before, then the light sources are drawn small (everything else black, so walls still hide
// them), blurred with three.js's bloom, and the blur is added over the frame.
const addVertex = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`
const addFragment = `uniform sampler2D tGlow; varying vec2 vUv;
  void main() { gl_FragColor = vec4(texture2D(tGlow, vUv).rgb, 1.0);
  #include <colorspace_fragment>
  }`

export function Glow({ quality }: { quality: GraphicsQuality }) {
  const scene = useThree(state => state.scene)
  const width = useThree(state => state.size.width), height = useThree(state => state.size.height), dpr = useThree(state => state.viewport.dpr)
  const settings = GLOW[quality]
  const parts = useMemo(() => {
    const sources = new WebGLRenderTarget(1, 1, { type: HalfFloatType })
    // A small threshold: distant unlit fixtures pick up a trace of fog colour, which must not glow.
    const bloom = new UnrealBloomPass(new Vector2(1, 1), settings.strength, settings.radius, GLOW_THRESHOLD)
    bloom.compositeMaterial.uniforms.bloomFactors.value = [...GLOW_BLUR_WEIGHTS]
    const black = new MeshBasicMaterial({ color: 0x000000, fog: false })
    // The bloom's own result target (its texture object survives resizes).
    const add = new FullScreenQuad(new ShaderMaterial({ uniforms: { tGlow: { value: bloom.renderTargetsHorizontal[0].texture } }, vertexShader: addVertex, fragmentShader: addFragment,
      blending: AdditiveBlending, depthTest: false, depthWrite: false, transparent: true, toneMapped: false }))
    return { sources, bloom, black, add, clear: new Color() }
  }, [settings])
  useEffect(() => () => {
    parts.sources.dispose(); parts.bloom.dispose(); parts.black.dispose()
    ;(parts.add.material as Material).dispose(); parts.add.dispose()
  }, [parts])
  useLayoutEffect(() => {
    const w = Math.max(16, Math.round(width * dpr * settings.scale)), h = Math.max(16, Math.round(height * dpr * settings.scale))
    parts.sources.setSize(w, h)
    parts.bloom.setSize(w, h)
  }, [parts, settings, width, height, dpr])
  // Light sources also render on the glow layer (their materials and per-fixture levels
  // unchanged). The wet floor, additive haze and NT19 rain stay out of the glow pass.
  useLayoutEffect(() => {
    const marked: Object3D[] = []
    scene.traverse(object => {
      const material = (object as Mesh).material as (Material & { emissive?: { r: number, g: number, b: number } }) | undefined
      if ((object as Mesh).isMesh && material && !Array.isArray(material) && isGlowSource(object.name, material.emissive)) {
        object.layers.enable(GLOW_LAYER); marked.push(object)
      }
    })
    return () => marked.forEach(object => object.layers.disable(GLOW_LAYER))
  }, [scene])
  useFrame(({ gl, scene, camera }) => {
    // 1. The approved frame, unchanged.
    gl.setRenderTarget(null)
    gl.render(scene, camera)
    if (glowActivity.level < GLOW_IDLE) return // every light is off: nothing can glow
    // 2. Light sources only, small: first everything black (occluders), then the sources on top.
    const hidden: Object3D[] = []
    scene.traverse(object => {
      if (object.visible && (object.name === 'nocturne-wet-ground' || object.name.startsWith('nocturne-haze') || object.name === 'nocturne-gate-haze' || object.name === 'nocturne-rain')) {
        object.visible = false; hidden.push(object)
      }
    })
    const autoClear = gl.autoClear, background = scene.background, layers = camera.layers.mask
    gl.getClearColor(parts.clear); const clearAlpha = gl.getClearAlpha()
    gl.autoClear = false
    scene.background = null
    gl.setRenderTarget(parts.sources)
    gl.setClearColor(0x000000, 1); gl.clear()
    scene.overrideMaterial = parts.black
    gl.render(scene, camera)
    scene.overrideMaterial = null
    camera.layers.set(GLOW_LAYER)
    // Sources with a reduced glow are drawn dimmer in this pass only (restored right after).
    const dimmed: [MeshStandardMaterial, number][] = []
    for (const [name, gain] of Object.entries(GLOW_SOURCE_GAIN)) {
      const material = (scene.getObjectByName(name) as Mesh | undefined)?.material
      if (material instanceof MeshStandardMaterial) { dimmed.push([material, material.emissiveIntensity]); material.emissiveIntensity *= gain }
    }
    gl.render(scene, camera)
    for (const [material, intensity] of dimmed) material.emissiveIntensity = intensity
    camera.layers.mask = layers
    scene.background = background
    hidden.forEach(object => { object.visible = true })
    // 3. Blur, then add the glow over the frame.
    parts.bloom.render(gl, parts.sources, parts.sources, 0, false)
    gl.setRenderTarget(null)
    parts.add.render(gl)
    gl.autoClear = autoClear
    gl.setClearColor(parts.clear, clearAlpha)
  }, 1)
  return null
}
