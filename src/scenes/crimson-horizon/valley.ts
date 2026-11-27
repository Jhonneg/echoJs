import { crimsonLowAccentDrive } from './response.ts'
import { clampSignal } from '../../audio/signal.ts'
import { musicFeaturesFresh, type MusicFeatureReader } from '../../audio/musicFeatures.ts'
import { CHUNK_LENGTH } from './terrain.ts'

export const VALLEY_POOL_SIZE = 4
export const VALLEY_LIFETIME = 4.2
export const VALLEY_SPEED = 30
export const VALLEY_ORIGIN_DISTANCE = 72
// Glow-band pass: far away the floor is seen almost edge-on, so a wave front there is only a thin
// sliver, and several at once stacked into bands under the sun. Waves fade in with distance: none
// beyond FAR metres, full strength by NEAR. The shader uses these numbers; launches are unchanged.
export const WAVE_FADE = { near: 35, far: 55 }
export function waveVisibility(depth: number) {
  if (!Number.isFinite(depth)) return 0
  const t = Math.min(1, Math.max(0, (depth - WAVE_FADE.near) / (WAVE_FADE.far - WAVE_FADE.near)))
  return 1 - t * t * (3 - 2 * t)
}
// Owner option b: each wave launch (the same bass hits) briefly swells the magenta glow at the
// sun's base instead, decaying over about half a second, so the hit still reads at the horizon.
export const SWELL_DECAY = 0.5
export function createValley() {
  return { session: -1, sequence: 0, candidate: false, glow: 0, launched: 0, swell: 0,
    waves: Array.from({ length: VALLEY_POOL_SIZE }, () => ({ start: -Infinity, origin: 0, strength: 0 })) }
}
export type Valley = ReturnType<typeof createValley>
// Forward distance is logical world space. Camera travel/rebasing never moves an existing wave.
export function updateValley(state: Valley, reader: MusicFeatureReader, candidate: boolean,
  distance: number, now: number, delta: number, reactivity: number, reduced: boolean) {
  const view = reader.read(), gain = clampSignal(reactivity)
  const reset = state.session !== view.session || candidate !== state.candidate
  const enabled = candidate && musicFeaturesFresh(view, now) && gain > 0 && !reduced
  if (reset || !enabled) { for (const wave of state.waves) wave.start = -Infinity; state.swell = 0 }
  if (reset) { state.sequence = view.sequence; state.session = view.session; state.candidate = candidate; state.glow = 0 }
  for (const event of view.events) {
    if (event.sequence <= state.sequence) continue
    state.sequence = event.sequence
    const age = now - event.emittedAtSeconds
    if (!reset && enabled && event.session === view.session && event.band === 'low' && age >= 0 && age <= .25) {
      let slot = state.waves[0]
      for (const wave of state.waves) if (wave.start < slot.start) slot = wave
      slot.start = event.emittedAtSeconds; slot.origin = distance + VALLEY_ORIGIN_DISTANCE; slot.strength = crimsonLowAccentDrive(event.strength)
      state.launched++
      state.swell = Math.max(state.swell, slot.strength)
    }
  }
  state.sequence = Math.max(state.sequence, view.sequence)
  for (const wave of state.waves) if (now - wave.start >= VALLEY_LIFETIME) wave.start = -Infinity
  const target = enabled ? clampSignal(view.energy.six.bass) * gain : 0
  state.swell *= Math.exp(-Math.min(.05, Math.max(0, delta)) / SWELL_DECAY)
  if (state.swell < .001) state.swell = 0
  state.glow = !enabled ? 0 : state.glow + (target - state.glow) * (1 - Math.exp(-Math.min(.05, Math.max(0, delta)) / .45))
}
// Four vec4s, reused by each chunk: local head Z, amplitude, head width, trail length.
export function writeValleyUniforms(state: Valley, index: number, now: number, gain: number, out: Float32Array) {
  for (let i = 0; i < VALLEY_POOL_SIZE; i++) {
    const wave = state.waves[i], age = now - wave.start, strength = wave.strength, offset = i * 4
    const active = age >= 0 && age < VALLEY_LIFETIME
    out[offset] = active ? index * CHUNK_LENGTH - wave.origin + age * VALLEY_SPEED : 0
    out[offset + 1] = active ? strength * clampSignal(gain) * Math.min(1, age / .08) * Math.pow(1 - age / VALLEY_LIFETIME, 1.25 - strength * .35) : 0
    out[offset + 2] = .85 + strength * 2
    out[offset + 3] = 1.5 + strength * 3
  }
}
export const valleyOrigin = (index: number) => (-index * CHUNK_LENGTH * .08) % (Math.PI * 2)
