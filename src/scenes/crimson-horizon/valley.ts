import { clampSignal } from '../../audio/signal.ts'
import { musicFeaturesFresh, type MusicFeatureReader } from '../../audio/musicFeatures.ts'
import { CHUNK_LENGTH } from './terrain.ts'

export const VALLEY_POOL_SIZE = 4
export function createValley() {
  return { session: -1, sequence: 0, candidate: false, glow: 0, launched: 0,
    waves: Array.from({ length: VALLEY_POOL_SIZE }, () => ({ start: -Infinity, origin: 0, strength: 0 })) }
}
export type Valley = ReturnType<typeof createValley>
// Forward distance is logical world space. Camera travel/rebasing never moves an existing wave.
export function updateValley(state: Valley, reader: MusicFeatureReader, candidate: boolean,
  distance: number, now: number, delta: number, reactivity: number, reduced: boolean) {
  const view = reader.read(), gain = clampSignal(reactivity)
  const reset = state.session !== view.session || candidate !== state.candidate
  const enabled = candidate && musicFeaturesFresh(view, now) && gain > 0 && !reduced
  if (reset || !enabled) for (const wave of state.waves) wave.start = -Infinity
  if (reset) { state.sequence = view.sequence; state.session = view.session; state.candidate = candidate; state.glow = 0 }
  for (const event of view.events) {
    if (event.sequence <= state.sequence) continue
    state.sequence = event.sequence
    const age = now - event.emittedAtSeconds
    if (!reset && enabled && event.session === view.session && event.band === 'low' && age >= 0 && age <= .25) {
      let slot = state.waves[0]
      for (const wave of state.waves) if (wave.start < slot.start) slot = wave
      slot.start = event.emittedAtSeconds; slot.origin = distance + 48; slot.strength = clampSignal(event.strength)
      state.launched++
    }
  }
  state.sequence = Math.max(state.sequence, view.sequence)
  for (const wave of state.waves) if (now - wave.start >= 3.5) wave.start = -Infinity
  const target = enabled ? clampSignal(view.energy.six.bass) * gain : 0
  state.glow = !enabled ? 0 : state.glow + (target - state.glow) * (1 - Math.exp(-Math.min(.05, Math.max(0, delta)) / .45))
}
// Four vec4s, reused by each chunk: local head Z, amplitude, head width, trail length.
export function writeValleyUniforms(state: Valley, index: number, now: number, gain: number, out: Float32Array) {
  for (let i = 0; i < VALLEY_POOL_SIZE; i++) {
    const wave = state.waves[i], age = now - wave.start, strength = wave.strength, offset = i * 4
    const active = age >= 0 && age < 3.5
    out[offset] = active ? index * CHUNK_LENGTH - wave.origin + age * 26 : 0
    out[offset + 1] = active ? strength * clampSignal(gain) * Math.min(1, age / .08) * Math.pow(1 - age / 3.5, 1.8 - strength * .8) : 0
    out[offset + 2] = .65 + strength * 1.4
    out[offset + 3] = 2 + strength * 4
  }
}
export const valleyOrigin = (index: number) => (-index * CHUNK_LENGTH * .08) % (Math.PI * 2)
