import { clampSignal, smooth } from '../../audio/signal.ts'
import { lavenderDrive, type LavenderResponse } from './response.ts'

export const createAtmosphere = () => ({ session: -1, density: 0, warmth: 0 })
export type Atmosphere = ReturnType<typeof createAtmosphere>

// Slow context alone: never turn onsets into full-sky flashes or guess phrases.
export function updateAtmosphere(state: Atmosphere, response: LavenderResponse, delta: number,
  reactivity: number, reducedMotion: boolean) {
  const gain = clampSignal(reactivity)
  if (state.session !== response.session || gain === 0) {
    state.session = response.session
    state.density = state.warmth = 0
  }
  if (gain === 0) return state
  const dt = Number.isFinite(delta) ? Math.max(0, Math.min(.05, delta)) : 0
  const context = response.context
  const intensity = response.fresh ? lavenderDrive(context.intensity) : 0
  const density = response.fresh ? (.65 * intensity + .35 * clampSignal(context.activity)) * gain : 0
  const warmth = response.fresh && context.brightnessValid ? intensity * clampSignal(context.brightness) * gain : 0
  state.density = smooth(state.density, density, dt, reducedMotion ? 4 : 2, reducedMotion ? 6 : 4)
  state.warmth = smooth(state.warmth, warmth, dt, reducedMotion ? 4 : 2, reducedMotion ? 6 : 4)
  if (density === 0 && state.density < .0001) state.density = 0
  if (warmth === 0 && state.warmth < .0001) state.warmth = 0
  return state
}

// Wide warm light (owner review item 5): the low sky's peach glow spans most of the view, as in the
// reference, and the layer mist picks up the same warmth across its width. Shared by sky and mist.
export const WARM_LIGHT = {
  sky: { width: 10.5, height: 5.2, strength: 0.62, color: [1.0, 0.89, 0.8] }, // was 5.8 x 3.7, [1, .94, .86]
  mist: { base: 0.2, peak: 0.4, width: 11.0 }, // was no base, 0.5 peak, 6.0 wide
} as const
// The warm share of the mist colour at world x (mirrors the shader).
export const mistWarmth = (worldX: number) =>
  WARM_LIGHT.mist.base + WARM_LIGHT.mist.peak * Math.exp(-(((worldX - 1.6) / WARM_LIGHT.mist.width) ** 2))
const glsl = (v: number) => v.toFixed(3)
export const warmSkyHalo = `exp(-pow(vPosition.x / ${glsl(WARM_LIGHT.sky.width)}, 2.0) - pow((vPosition.y + 0.9) / ${glsl(WARM_LIGHT.sky.height)}, 2.0))`
export const warmSkyColor = `vec3(${WARM_LIGHT.sky.color.map(glsl).join(', ')})`

export const atmosphereSky = `
uniform float atmosphereDensity;
uniform float atmosphereWarmth;
vec3 atmosphereSkyColor(vec3 color, vec2 position) {
  // Protect the approved emitter; broad changes live in its surrounding sky.
  float outside = smoothstep(coronaSunRadius * coronaRadiusRatio + 0.08,
    coronaSunRadius * coronaRadiusRatio + 0.45, length(position - vec2(1.6, 1.9)));
  float horizon = exp(-pow((position.y - 0.4) / 3.3, 2.0));
  color = mix(color, vec3(0.88, 0.78, 0.91), atmosphereDensity * outside * horizon * 0.09);
  return mix(color, vec3(1.0, 0.82, 0.80), atmosphereWarmth * outside * (0.045 + 0.065 * horizon));
}
`

// Layer-mist pass (owner option b): a steady pale mist lies in horizontal bands at the foot of each
// layer and fades upward, so each farther layer dissolves into haze where the nearer ones cross it,
// as in the reference. Measured from the ridge's own base line (following the nearer outline instead
// drew tall columns up every steep flank). Farther layers get more (aerial perspective); the
// frontmost ridge gets none. Strength per ridge, far to near:
export const LAYER_MIST = { strength: [0.62, 0.56, 0.48, 0.4, 0.32, 0], height: 1.1, lift: 0.3 } as const
// The mist at a ridge pixel `above` world units over the ridge's base line (mirrors the shader).
export function layerMist(index: number, above: number) {
  const strength = LAYER_MIST.strength[Math.round(index)] ?? 0
  if (!(strength > 0) || !Number.isFinite(above)) return 0
  return strength * Math.exp(-Math.max(above - LAYER_MIST.lift, 0) / LAYER_MIST.height)
}
const mistStrengthGlsl = LAYER_MIST.strength.map((s, i) => `ridgeIndex < ${i}.5 ? ${s.toFixed(3)} : `).join('') + '0.0'

export const atmosphereRidge = `
uniform float atmosphereDensity;
uniform float atmosphereWarmth;
vec3 layerMistColor(vec3 color, vec2 position) {
  float strength = ${mistStrengthGlsl};
  if (strength <= 0.0) return color;
  float worldX = position.x + terrainOffset;
  // The ridge's base line is bottom + 2.2 (see the ridge uniforms).
  float above = position.y - (bottom + 2.2);
  float mist = strength * exp(-max(above - ${LAYER_MIST.lift.toFixed(3)}, 0.0) / ${LAYER_MIST.height.toFixed(3)});
  // Pale lavender, warmed across its width and most toward the sun.
  vec3 mistColor = mix(vec3(0.91, 0.85, 0.95), vec3(0.99, 0.91, 0.90), ${glsl(WARM_LIGHT.mist.base)} + ${glsl(WARM_LIGHT.mist.peak)} * exp(-pow((worldX - 1.6) / ${glsl(WARM_LIGHT.mist.width)}, 2.0)));
  return mix(color, mistColor, mist);
}
vec3 atmosphereRidgeColor(vec3 color, vec2 position, float blend) {
  color = layerMistColor(color, position);
  float depth = ridgeIndex / 5.0;
  // Distant softness against restrained lower foreground contrast.
  color = mix(color, vec3(0.87, 0.77, 0.90), atmosphereDensity * (1.0 - depth) * 0.055);
  color *= 1.0 - atmosphereDensity * depth * depth * (1.0 - 0.6 * blend) * 0.065;
  if (ridgeIndex < 2.5 && atmosphereDensity + atmosphereWarmth > 0.0) {
    float worldX = position.x + terrainOffset;
    float nextHeight = profileHeight(worldX - nextOffset, ridgeIndex + 1.0);
    float valley = 1.0 - smoothstep(-0.5, 1.0, nextHeight);
    float band = exp(-pow((position.y - nextHeight - 0.16) / 0.42, 2.0));
    float mist = atmosphereDensity * valley * band * exp(-ridgeIndex * 0.45) * 0.12;
    vec3 mistColor = mix(vec3(0.90, 0.82, 0.94), vec3(1.0, 0.85, 0.84), atmosphereWarmth);
    color = mix(color, mistColor, mist);
  }
  return color;
}
`
