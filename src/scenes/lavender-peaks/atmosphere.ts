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

export const atmosphereRidge = `
uniform float atmosphereDensity;
uniform float atmosphereWarmth;
vec3 atmosphereRidgeColor(vec3 color, vec2 position, float blend) {
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
