// BR5: reflective lake. three.js's bundled Reflector add-on renders the scene from a camera
// mirrored below the water into a texture; this shader samples it with slow, mostly
// horizontal ripples (stretching reflections into vertical streaks), concentric rings under
// the monolith, a darker foreground and luminous mist along the horizon.
import type { GraphicsQuality } from '../../engine/quality'
import { MONOLITH } from './composition.ts'

const TAU = Math.PI * 2
const wrap = (t: number, period: number) => ((t % period) + period) % period / period * TAU

// Wave and ring loops (seconds). Reduced motion holds a fixed pose.
export const WATER_PERIODS = [13, 21, 34, 8] as const // three wave layers, then the rings
export const WATER_STILL_TIME = 5
export function waterPhases(seconds: number, reducedMotion: boolean) {
  const t = reducedMotion || !Number.isFinite(seconds) ? WATER_STILL_TIME : seconds
  return WATER_PERIODS.map(p => wrap(t, p))
}

// Rings spread from directly under the monolith.
export const RING_CENTER = [MONOLITH.center[0], MONOLITH.center[2]] as const

// Reflection texture size as a fraction of the drawing buffer.
export const REFLECTION_SCALE: Record<GraphicsQuality, number> = { standard: 0.5, low: 0.33 }
export function reflectionSize(width: number, height: number, quality: GraphicsQuality) {
  const s = REFLECTION_SCALE[quality]
  return { width: Math.max(64, Math.round(width * s)), height: Math.max(64, Math.round(height * s)) }
}

export const waterVertexShader = /* glsl */`
uniform mat4 textureMatrix;
varying vec4 vUv;
varying vec3 vWorld;
void main() {
  vUv = textureMatrix * vec4(position, 1.0);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`

export const waterFragmentShader = /* glsl */`
uniform vec3 color; // required by Reflector; unused
uniform sampler2D tDiffuse;
uniform vec4 uPhase; // waves x3, rings
uniform vec2 uRingCenter;
uniform vec3 uDeep, uMist, uSeamGlow;
varying vec4 vUv;
varying vec3 vWorld;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + 1.0), u.x), u.y);
}
void main() {
  vec2 p = vWorld.xz;
  float dist = length(vWorld - cameraPosition);
  // Ripples vary mostly with depth (z), so each horizontal band samples a shifted row of the
  // reflection: that smears it into vertical streaks and zigzags the seam's reflection.
  // Fine ripples fade with distance (they would only alias there); far water stays glassy.
  // Bands use 1/distance, which is how height below the horizon falls off on screen, so the
  // ripples come out evenly spaced and dense, like the reference, instead of a few wobbles.
  float calm = smoothstep(90.0, 6.0, dist);
  float band = 1.0 / max(dist, 0.5);
  float w = sin(band * 170.0 + uPhase.x) * 0.45 + sin(band * 410.0 + p.x * 0.4 - uPhase.y) * 0.3;
  float side = sin(band * 290.0 + uPhase.y) * 0.55 + sin(band * 640.0 - uPhase.x * 2.0) * 0.3;
  #if DETAIL
  w += (noise(p * vec2(0.5, 3.2) + vec2(cos(uPhase.z), sin(uPhase.z)) * 0.6) - 0.5) * 0.9 * calm;
  #endif
  // Concentric rings under the monolith, spreading outward and fading with distance.
  float r = length(p - uRingCenter);
  float ring = sin(r * 5.5 - uPhase.w) * exp(-r / 6.0) * smoothstep(0.25, 1.2, r);
  vec2 offset = vec2(side * 0.5, w + ring * 1.6) * 0.012 * calm;
  vec3 sampled = texture2DProj(tDiffuse, vUv + vec4(offset * vUv.w, 0.0, 0.0)).rgb;
  // Darken the reflection overall but keep its highlights (seam, aurora) bright.
  vec3 reflection = sampled * 0.6 + max(sampled - 0.45, 0.0) * 0.9;
  // Foreground darker; at grazing angles toward the horizon, more reflection.
  float grazing = 1.0 - clamp(abs(normalize(cameraPosition - vWorld).y) * 6.0, 0.0, 1.0);
  vec3 water = mix(uDeep, reflection, 0.42 + 0.38 * grazing);
  water = mix(water, uDeep * 0.8, smoothstep(26.0, 3.0, dist) * 0.3);
  // Bright thin rings and a soft glow on the water where the seam's light meets it.
  float rings = pow(max(ring, 0.0), 3.0) * exp(-r / 5.0);
  float contact = exp(-abs(p.x - uRingCenter.x) / 0.9) * exp(-r / 7.0);
  water += uSeamGlow * (rings * 2.2 + contact * 0.3);
  // Luminous mist lying along the horizon.
  water = mix(water, uMist, smoothstep(16.0, 150.0, dist) * 0.62);
  gl_FragColor = vec4(water, 1.0);
  #include <colorspace_fragment>
}`

export const WATER_SHADER = {
  name: 'BloomWater',
  uniforms: {
    color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
    uPhase: { value: null }, uRingCenter: { value: null },
    uDeep: { value: null }, uMist: { value: null }, uSeamGlow: { value: null },
  },
  vertexShader: waterVertexShader,
  fragmentShader: waterFragmentShader,
}
