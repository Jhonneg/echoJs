import { useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PlaneGeometry, ShaderMaterial, Vector2, Vector4 } from 'three'
import { Reflector } from 'three/addons/objects/Reflector.js'
import type { GraphicsQuality } from '../../engine/quality'
import { GLOW_IDLE, STREAK, glowActivity, streakGlsl } from './effects'
import { RIPPLE, rippleField } from './ripples'

// NT16: bright reflections (the lit fixtures) also smear into long vertical streaks, as on wet
// asphalt, and make the floor more reflective where they land. Dim reflections (all the idle
// scene) use the original treatment unchanged, so the approved resting floor is preserved.
const wetShader = (quality: GraphicsQuality) => ({
  name: 'NocturneWetGround',
  uniforms: {
    color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
    texel: { value: new Vector2(1 / 512, 1 / 512) },
    streakOn: { value: 0 }, // NT16: 0 while every light is off (nothing bright to streak)
    rippleOn: { value: 0 }, // NT20: 0 while no ring is active (the floor is then unchanged)
    ripples: { value: Array.from({ length: RIPPLE.slots }, () => new Vector4()) }, // x, z, radius, amplitude
  },
  vertexShader: `uniform mat4 textureMatrix;
    varying vec4 vReflection;
    varying vec3 vWorld;
    void main() {
      vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      vReflection = textureMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `uniform sampler2D tDiffuse;
    uniform vec2 texel;
    uniform float streakOn;
    uniform float rippleOn;
    uniform vec4 ripples[${RIPPLE.slots}];
    varying vec4 vReflection;
    varying vec3 vWorld;
    ${streakGlsl(STREAK[quality].taps)}
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
        mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
    }
    void main() {
      vec2 p = vWorld.xz;
      float pools = noise(p * vec2(1.1, 0.65)) * 0.7 + noise(p * 3.1) * 0.3;
      float puddle = smoothstep(0.44, 0.59, pools);
      float edges = 1.0 - smoothstep(2.35, 2.66, abs(p.x));
      float breakup = noise(p * vec2(9.0, 17.0));
      vec2 uv = vReflection.xy / vReflection.w;
      // Static surface irregularity: no water animation or temporal jitter.
      uv.x += (noise(p * vec2(3.0, 12.0)) - 0.5) * 0.0025;
      uv.y += (breakup - 0.5) * 0.001;
      // NT20: rings from bass hits bend the reflection where they pass, strongest in puddles.
      float crest = 0.0;
      if (rippleOn > 0.5) {
        vec2 bend = vec2(0.0);
        for (int i = 0; i < ${RIPPLE.slots}; i++) {
          vec4 ring = ripples[i];
          if (ring.w <= 0.0) continue;
          vec2 d = p - ring.xy;
          float r = length(d), w = r - ring.z;
          float wave = sin(w * 40.0) * exp(-w * w / 0.012) * ring.w;
          bend += d / max(r, 1e-3) * wave;
          crest += max(wave, 0.0);
        }
        float water = mix(0.3, 1.0, puddle) * edges;
        uv += bend * water * 0.014;
        crest *= water;
      }
      vec2 spread = texel * mix(1.8, 0.65, puddle);
      vec3 reflected = texture2D(tDiffuse, uv).rgb * 0.4;
      reflected += texture2D(tDiffuse, uv + vec2(spread.x, 0)).rgb * 0.15;
      reflected += texture2D(tDiffuse, uv - vec2(spread.x, 0)).rgb * 0.15;
      reflected += texture2D(tDiffuse, uv + vec2(0, spread.y)).rgb * 0.15;
      reflected += texture2D(tDiffuse, uv - vec2(0, spread.y)).rgb * 0.15;
      float facing = max(normalize(cameraPosition - vWorld).y, 0.0);
      float fresnel = 0.1 + 0.9 * pow(1.0 - facing, 4.0);
      float wetness = mix(0.09, 0.86, puddle) * edges;
      float strength = wetness * (0.32 + 0.65 * fresnel) * mix(0.65, 1.0, breakup);
      // Enhance only bright reflected sources; no independent motion or colored overlay.
      vec3 highlights = max(reflected - vec3(0.055), vec3(0.0));
      // Light sources: a vertical streak, longer in the puddles, added only above a brightness
      // floor, and raising the floor's reflectivity where it lands.
      vec3 bright = vec3(0.0);
      if (streakOn > 0.5) {
        vec3 streaked = streak(uv, texel.y * ${STREAK[quality].spacing.toFixed(1)} * mix(1.0, 1.7, puddle));
        bright = max(streaked - vec3(0.04), vec3(0.0));
      }
      float glint = clamp(dot(bright, vec3(0.2126, 0.7152, 0.0722)) * 6.0, 0.0, 1.0);
      // Bright reflections run closer to the walls than the base film (wall fixtures land there).
      float glintEdges = 1.0 - smoothstep(2.5, 2.68, abs(p.x));
      strength = min(1.0, strength + glint * 0.6 * glintEdges * mix(0.45, 1.0, puddle) + crest * 0.4);
      // NT20: a ring's crest catches the light it reflects (nothing on unlit water).
      vec3 crestLight = crest * (reflected * 1.5 + bright * 2.0);
      gl_FragColor = vec4(reflected * 0.9 + highlights * 0.2 + bright * 2.4 + crestLight, strength);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
})

export function WetGround({ quality }: { quality: GraphicsQuality }) {
  const { scene, size } = useThree()
  const reflector = useRef<Reflector | null>(null)
  // Allocate in the effect so StrictMode setup/cleanup owns every GPU resource. The streak
  // length is compiled per quality, so a quality change rebuilds the floor.
  useLayoutEffect(() => {
    const geometry = new PlaneGeometry(5.36, 60)
    const floor = new Reflector(geometry, { shader: wetShader(quality), textureWidth: 1, textureHeight: 1, clipBias: 0.003, multisample: 0 })
    floor.name = 'nocturne-wet-ground'
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, 0.016, -23)
    const material = floor.material as ShaderMaterial
    material.transparent = true
    material.depthWrite = false
    scene.add(floor)
    reflector.current = floor
    return () => {
      reflector.current = null
      scene.remove(floor)
      floor.dispose()
      geometry.dispose()
    }
  }, [scene, quality])
  useLayoutEffect(() => {
    const floor = reflector.current
    if (!floor) return
    const cap = quality === 'low' ? 512 : 1024
    const scale = Math.min(quality === 'low' ? 0.4 : 0.7, cap / Math.max(size.width, size.height, 1))
    const width = Math.max(128, Math.floor(size.width * scale))
    const height = Math.max(128, Math.floor(size.height * scale))
    floor.getRenderTarget().setSize(width, height)
    const material = floor.material as ShaderMaterial
    material.uniforms.texel.value.set(1 / width, 1 / height)
  }, [quality, size.width, size.height])
  useFrame(() => {
    const floor = reflector.current
    if (!floor) return
    const uniforms = (floor.material as ShaderMaterial).uniforms
    uniforms.streakOn.value = glowActivity.level >= GLOW_IDLE ? 1 : 0
    uniforms.rippleOn.value = rippleField.active ? 1 : 0
    const rings = uniforms.ripples.value as Vector4[]
    for (let i = 0; i < RIPPLE.slots; i++) rings[i].fromArray(rippleField.rings, i * 4)
  }, -1)
  return null
}
