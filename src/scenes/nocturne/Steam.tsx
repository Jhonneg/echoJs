import { useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, Float32BufferAttribute, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, ShaderMaterial } from 'three'
import type { GraphicsQuality } from '../../engine/quality'
import { STEAM, plumeBase, steamScroll, steamTime } from './steam'
import { createSceneLightUniforms, findSceneLights, sceneLightGlsl, updateSceneLightUniforms, type SceneLightUniforms, type SceneLights } from './sceneLights'

// NT21 steam (see steam.ts). One camera-facing sheet per plume, turned about the vertical axis;
// soft noise scrolls up through the plume's outline, lit by the nearby lights.
const vertex = `
  attribute vec4 plume; // base x, y, z, wall side (-1 left, 1 right)
  attribute float seed;
  varying vec3 vWorld;
  varying vec2 vUv;
  varying float vWall;
  varying float vSeed;
  void main() {
    vec3 toCamera = cameraPosition - plume.xyz;
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCamera));
    vec3 world = plume.xyz + right * position.x * ${STEAM.size.width.toFixed(2)} + vec3(0.0, position.y * ${STEAM.size.height.toFixed(2)}, 0.0);
    vWorld = world;
    vUv = vec2(position.x, position.y + 0.5);
    vWall = sign(dot(right, vec3(plume.w, 0.0, 0.0)));
    vSeed = seed;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }`
const fragment = (octaves: number) => `
  uniform float scroll;
  ${sceneLightGlsl(STEAM.maxLights, STEAM.lightGain)}
  varying vec3 vWorld;
  varying vec2 vUv;
  varying float vWall;
  varying float vSeed;
  // Value noise whose lattice repeats every ${STEAM.period} cells, so the wrapped scroll has no seam.
  float hash(vec2 i) { i = mod(i, ${STEAM.period.toFixed(1)}); return fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float sum = 0.0, amp = 0.5;
    for (int k = 0; k < ${octaves}; k++) { sum += noise(p) * amp; p *= 2.0; amp *= 0.5; }
    return sum / (1.0 - pow(0.5, ${octaves.toFixed(1)}));
  }
  void main() {
    float u = vUv.x, v = vUv.y;
    // Billows: the outline wanders a little with the noise as it rises.
    float drift = (noise(vec2(vSeed * 13.0, v * 2.0 - scroll)) - 0.5) * 0.12 * v;
    float center = vWall * 0.28 * (1.0 - v) * (1.0 - v) + drift;
    float width = 0.07 + 0.22 * v;
    float shape = exp(-2.0 * pow((u - center) / width, 2.0)) * smoothstep(0.0, 0.08, v) * (1.0 - smoothstep(0.5, 1.0, v))
      * (1.0 - smoothstep(0.4, 0.5, abs(u)));
    float puff = smoothstep(0.35, 0.75, fbm(vec2(u * 2.4 + vSeed * 17.0, v * 2.0 - scroll)));
    float fade = 1.0 - smoothstep(${STEAM.fade.start.toFixed(1)}, ${STEAM.fade.end.toFixed(1)}, distance(cameraPosition, vWorld));
    vec3 lit = vec3(${STEAM.base.toFixed(4)}, ${(STEAM.base * 1.1).toFixed(4)}, ${(STEAM.base * 1.25).toFixed(4)}) + sceneLight(vWorld);
    gl_FragColor = vec4(lit * shape * puff * fade, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`

export function Steam({ quality, reducedMotion }: { quality: GraphicsQuality, reducedMotion: boolean }) {
  const scene = useThree(state => state.scene), camera = useThree(state => state.camera)
  const steam = useRef<Mesh | null>(null)
  const lights = useRef<SceneLights>({ points: [], gate: null })
  // Allocate in the effect so StrictMode setup/cleanup owns every GPU resource. The noise detail
  // is compiled per quality, so a quality change rebuilds the steam.
  useLayoutEffect(() => {
    const geometry = new InstancedBufferGeometry()
    // A unit quad: x across (-0.5 to 0.5), y up (-0.5 to 0.5) around the plume's centre.
    geometry.setAttribute('position', new Float32BufferAttribute([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0], 3))
    geometry.setIndex([0, 1, 2, 0, 2, 3])
    geometry.setAttribute('plume', new InstancedBufferAttribute(Float32Array.from(STEAM.plumes.flatMap(p => {
      const base = plumeBase(p)
      return [base.x, base.y, base.z, p.side]
    })), 4))
    geometry.setAttribute('seed', new InstancedBufferAttribute(Float32Array.from(STEAM.plumes.map(p => p.seed)), 1))
    geometry.instanceCount = STEAM.plumes.length
    const material = new ShaderMaterial({
      uniforms: { scroll: { value: 0 }, ...createSceneLightUniforms(STEAM.maxLights) },
      vertexShader: vertex, fragmentShader: fragment(STEAM.octaves[quality]),
      blending: AdditiveBlending, transparent: true, depthWrite: false,
    })
    const mesh = new Mesh(geometry, material)
    mesh.name = 'nocturne-steam'
    mesh.frustumCulled = false // positions are computed in the shader
    mesh.layers.set(STEAM.layer)
    scene.add(mesh)
    camera.layers.enable(STEAM.layer)
    steam.current = mesh
    lights.current = findSceneLights(scene, STEAM.maxLights)
    return () => {
      steam.current = null
      scene.remove(mesh)
      camera.layers.disable(STEAM.layer)
      geometry.dispose(); material.dispose()
    }
  }, [scene, camera, quality])
  useFrame(({ clock }) => {
    const mesh = steam.current
    if (!mesh) return
    const uniforms = (mesh.material as ShaderMaterial).uniforms
    // Reduced motion: a still frame (the plumes stay, frozen).
    uniforms.scroll.value = steamScroll(steamTime(clock.elapsedTime, reducedMotion))
    updateSceneLightUniforms(uniforms as unknown as SceneLightUniforms, lights.current, STEAM.gate)
  })
  return null
}
