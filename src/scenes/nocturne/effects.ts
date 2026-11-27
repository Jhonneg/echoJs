// NT16: glow around the lights, streaked wet-floor reflections and gate haze. Pure settings and
// helpers (testable without three.js). Everything here follows levels Nocturne already
// computes (visualState.ts); nothing adds a new music mapping. With all lights off (idle in
// silence) the glow and haze are exactly zero, so the approved resting view is unchanged.
import type { NocturneVisualState } from './visualState.ts'

// --- Glow -------------------------------------------------------------------------------
// The approved frame is rendered exactly as before. A second, smaller render draws only the
// light sources (everything else black, so walls still hide what is behind them); three.js's
// bloom blurs that, and the blur is added over the frame. Sources: emissive fixtures (their
// level is their brightness) and the gate.
export const GLOW_LAYER = 3
export const GLOW_THRESHOLD = 0.05 // linear brightness below which nothing glows
export const GLOW = {
  standard: { scale: 0.5, strength: 1.0, radius: 0 }, // glow image at half the drawing size
  low: { scale: 0.25, strength: 0.95, radius: 0 }, // and a quarter on Low
} as const
// Weights of the bloom's five blur sizes, tightest first. three.js's default (1, .8, .6, .4, .2)
// spreads a big panel's light across the whole frame; these keep the glow close to each light
// so the black architecture stays black, as on the reference board.
export const GLOW_BLUR_WEIGHTS = [1, 0.55, 0.25, 0.1, 0.04]
// Per-source glow strength (1 = full). The main right magenta panel is large and close, so
// its full glow read as glare (owner feedback); it glows at a reduced level.
export const GLOW_SOURCE_GAIN: Record<string, number> = { 'nocturne-magenta': 0.55 }
// How lit the scene is (highest fixture, bridge or gate level), written by LightingDriver each
// frame. With everything off the glow passes are skipped entirely (no cost at idle).
export const glowActivity = { level: 0 }
export const GLOW_IDLE = 1e-3
export function sceneLightLevel(state: Pick<NocturneVisualState, 'atmosphere' | 'channels' | 'bridge'>) {
  let level = Math.max(state.atmosphere.level, state.bridge.level)
  for (const channel of Object.values(state.channels)) level = Math.max(level, channel.level)
  return Number.isFinite(level) ? Math.max(0, level) : 0
}
type ColorLike = { r: number, g: number, b: number }
export function isGlowSource(name: string, emissive: ColorLike | undefined) {
  if (name === 'nocturne-gate-light') return true
  return !!emissive && emissive.r + emissive.g + emissive.b > 0
}

// --- Wet-floor streaks --------------------------------------------------------------------
// Each light reflects as a long vertical smear, as on wet asphalt: the reflection is sampled
// along the screen's vertical axis with Gaussian weights. `spacing` is in reflection texels.
export const STREAK = {
  standard: { taps: 13, spacing: 5 },
  low: { taps: 7, spacing: 9 },
} as const
export function streakWeights(taps: number) {
  const n = Math.max(1, Math.floor(taps) | 1) // odd, so one tap sits on the reflection point
  const half = (n - 1) / 2, sigma = Math.max(0.5, half / 1.6)
  const raw = Array.from({ length: n }, (_, i) => Math.exp(-((i - half) ** 2) / (2 * sigma * sigma)))
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map(w => w / sum)
}
// GLSL function summing the weighted vertical taps (unrolled; `step` is one tap in uv units).
export function streakGlsl(taps: number) {
  const w = streakWeights(taps), half = (w.length - 1) / 2
  const lines = w.map((x, i) => `  s += texture2D(tDiffuse, uv + vec2(0.0, ${(i - half).toFixed(1)} * step)).rgb * ${x.toFixed(6)};`)
  return `vec3 streak(vec2 uv, float step) {\n  vec3 s = vec3(0.0);\n${lines.join('\n')}\n  return s;\n}`
}

// --- Haze -------------------------------------------------------------------------------
// Layered haze around the gate, a beam along the floor from it, and soft haze at the three
// main fixtures. Strengths are the haze's brightness at full fixture level.
export const HAZE = {
  gateLayers: [
    { z: -50.6, width: 15, height: 11, strength: 0.28 }, // the existing halo
    { z: -47.5, width: 11, height: 8, strength: 0.16 },
    { z: -43, width: 8, height: 6, strength: 0.09 },
  ],
  beam: { length: 30, width: 2.6, strength: 0.14 },
  fixtures: {
    magenta: { position: [2.35, 2.75, -2.6] as const, size: [3.2, 4.4] as const, strength: 0.05 },
    cyan: { position: [-2.2, 2.65, -6.9] as const, size: [2.4, 3.2] as const, strength: 0.14 },
    bridge: { position: [0, 3.85, -6.6] as const, size: [6.4, 1.8] as const, strength: 0.08 },
  },
} as const
export function hazeLevels(state: Pick<NocturneVisualState, 'atmosphere' | 'channels' | 'bridge'>) {
  const clamp = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0)
  return {
    gate: clamp(state.atmosphere.level),
    magenta: clamp(state.channels.magentaMain.level),
    cyan: clamp(state.channels.cyanPanel.level),
    bridge: clamp(state.bridge.level),
  }
}
