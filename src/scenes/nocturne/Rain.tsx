import { useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, Float32BufferAttribute, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, ShaderMaterial } from 'three'
import type { GraphicsQuality } from '../../engine/quality'
import { RAIN, rainDrops, rainVisible } from './rain'
import { createSceneLightUniforms, findSceneLights, sceneLightGlsl, updateSceneLightUniforms, type SceneLightUniforms, type SceneLights } from './sceneLights'

// NT19 rain (see rain.ts). One instanced quad per streak; the fall is computed on the GPU from
// one time uniform. Each streak is lit by the lights near it (sceneLights.ts, the same falloff
// as rainLightFalloff).
const vertex = `
  attribute vec4 drop; // x, starting height, z, speed
  attribute float dropLength;
  uniform float time;
  varying vec3 vWorld;
  varying vec2 vQuad;
  void main() {
    float height = ${RAIN.volume.top.toFixed(2)} - ${RAIN.volume.bottom.toFixed(2)};
    float fallen = mod(drop.y - ${RAIN.volume.bottom.toFixed(2)} - time * drop.w, height);
    float y = ${RAIN.volume.bottom.toFixed(2)} + fallen;
    vec3 head = vec3(drop.x + ${RAIN.wind.toFixed(3)} * (${RAIN.volume.top.toFixed(2)} - y) / drop.w, y, drop.z);
    // The tail trails up and upwind, along the streak's velocity.
    vec3 along = normalize(vec3(-${RAIN.wind.toFixed(3)}, drop.w, 0.0));
    vec3 toCamera = cameraPosition - head;
    vec3 side = normalize(cross(along, toCamera));
    float width = max(${RAIN.width.toFixed(4)}, length(toCamera) * 0.0011);
    vec3 world = head + along * dropLength * position.y + side * width * position.x;
    vWorld = world;
    vQuad = position.xy;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }`
const fragment = `
  ${sceneLightGlsl(RAIN.maxLights, RAIN.lightGain)}
  varying vec3 vWorld;
  varying vec2 vQuad;
  void main() {
    vec3 lit = vec3(${RAIN.base.toFixed(4)}, ${(RAIN.base * 1.15).toFixed(4)}, ${(RAIN.base * 1.35).toFixed(4)}) + sceneLight(vWorld);
    // Brightest at the head, fading along the tail and toward the streak's edges.
    float alpha = (1.0 - vQuad.y) * (1.0 - smoothstep(0.2, 0.5, abs(vQuad.x)));
    float fade = 1.0 - smoothstep(${RAIN.fade.start.toFixed(1)}, ${RAIN.fade.end.toFixed(1)}, distance(cameraPosition, vWorld));
    gl_FragColor = vec4(lit * alpha * fade, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`

export function Rain({ quality, reducedMotion }: { quality: GraphicsQuality, reducedMotion: boolean }) {
  const scene = useThree(state => state.scene), camera = useThree(state => state.camera)
  const rain = useRef<Mesh | null>(null)
  const lights = useRef<SceneLights>({ points: [], gate: null })
  // Allocate in the effect so StrictMode setup/cleanup owns every GPU resource (as WetGround does).
  // The streak count depends on quality, so a quality change rebuilds the rain.
  useLayoutEffect(() => {
    const drops = rainDrops(RAIN.count[quality])
    const geometry = new InstancedBufferGeometry()
    // A unit quad: x across the streak (-0.5 to 0.5), y along it from the head (0) to the tail (1).
    geometry.setAttribute('position', new Float32BufferAttribute([-.5, 0, 0, .5, 0, 0, .5, 1, 0, -.5, 1, 0], 3))
    geometry.setIndex([0, 1, 2, 0, 2, 3])
    geometry.setAttribute('drop', new InstancedBufferAttribute(Float32Array.from(drops.flatMap(d => [d.x, d.y, d.z, d.speed])), 4))
    geometry.setAttribute('dropLength', new InstancedBufferAttribute(Float32Array.from(drops.map(d => d.length)), 1))
    geometry.instanceCount = drops.length
    const material = new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        ...createSceneLightUniforms(RAIN.maxLights),
      },
      vertexShader: vertex, fragmentShader: fragment,
      blending: AdditiveBlending, transparent: true, depthWrite: false,
    })
    const mesh = new Mesh(geometry, material)
    mesh.name = 'nocturne-rain'
    mesh.frustumCulled = false // positions are computed in the shader
    mesh.layers.set(RAIN.layer)
    mesh.renderOrder = 1
    scene.add(mesh)
    camera.layers.enable(RAIN.layer)
    rain.current = mesh
    lights.current = findSceneLights(scene, RAIN.maxLights)
    return () => {
      rain.current = null
      scene.remove(mesh)
      camera.layers.disable(RAIN.layer)
      geometry.dispose(); material.dispose()
    }
  }, [scene, camera, quality])
  useFrame(({ clock }) => {
    const mesh = rain.current
    if (!mesh) return
    // The rain is hidden with reduced motion.
    mesh.visible = rainVisible(reducedMotion)
    if (!mesh.visible) return
    const uniforms = (mesh.material as ShaderMaterial).uniforms
    uniforms.time.value = clock.elapsedTime
    updateSceneLightUniforms(uniforms as unknown as SceneLightUniforms, lights.current, RAIN.gate)
  })
  return null
}
