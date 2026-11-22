import { createContourLighting, updateContourLighting } from './contours.ts'
import { clampSignal } from '../../audio/signal.ts'
import { musicFeaturesFresh, type MusicFeatureReader, type OnsetEvent } from '../../audio/musicFeatures.ts'
export type CrimsonProfile = 'legacy' | 'candidate'
export function createMusicPilot() {
  return { profile: 'legacy' as CrimsonProfile, session: -1, sequence: 0, weight: 0, from: 0, transition: .5,
    pulses: [] as OnsetEvent[], tailLow: 0, tailMid: 0, tailHigh: 0, low: 0, mid: 0, high: 0, sun: 0, speed: 0, enabled: false,
    haze: 0, contours: createContourLighting() }
}
export type MusicPilot = ReturnType<typeof createMusicPilot>
// A short eased attack and one-frame-wide peak make strength independent of render cadence.
export function onsetEnvelope(age: number) {
  if (age < 0 || age > 2) return 0
  if (age < .025) { const t = age / .025; return t * t * (3 - 2 * t) }
  return Math.exp(-Math.max(0, age - .059) / .22)
}
export function updateMusicPilot(state: MusicPilot, reader: MusicFeatureReader, profile: CrimsonProfile,
  delta: number, now: number, reactivity: number, reduced: boolean) {
  const dt = Math.max(0, Math.min(.05, Number.isFinite(delta) ? delta : 0)), view = reader.read(), gain = clampSignal(reactivity)
  const reset = state.session !== view.session || state.profile !== profile
  if (reset) {
    state.tailLow = state.session === view.session ? state.low : 0
    state.tailMid = state.session === view.session ? state.mid : 0
    state.tailHigh = state.session === view.session ? state.high : 0
    state.pulses.length = 0; state.sequence = view.sequence; state.session = view.session
    state.from = state.weight; state.transition = 0; state.profile = profile
  }
  state.transition = Math.min(.5, state.transition + dt)
  const t = state.transition / .5, eased = t * t * (3 - 2 * t)
  state.weight = state.from + ((profile === 'candidate' ? 1 : 0) - state.from) * eased
  const fresh = musicFeaturesFresh(view, now)
  state.enabled = fresh && gain > 0 && !reduced
  for (const event of view.events) {
    if (event.sequence <= state.sequence) continue
    state.sequence = event.sequence
    if (!reset && fresh && profile === 'candidate' && gain > 0 && !reduced && now - event.emittedAtSeconds <= .25) {
      if (state.pulses.length === 256) state.pulses.shift()
      state.pulses.push(event)
    }
  }
  state.sequence = Math.max(state.sequence, view.sequence)
  if (!fresh || gain === 0 || reduced) {
    state.pulses.length = 0; state.tailLow = state.tailMid = state.tailHigh = 0
  }
  const release = Math.exp(-dt / .22)
  state.tailLow *= release; state.tailMid *= release; state.tailHigh *= release
  state.low = state.tailLow; state.mid = state.tailMid; state.high = state.tailHigh
  for (let i = state.pulses.length - 1; i >= 0; i--) {
    const event = state.pulses[i], age = now - event.emittedAtSeconds
    if (age > 2) { state.pulses.splice(i, 1); continue }
    const value = clampSignal(event.strength) * onsetEnvelope(age) * gain
    state[event.band] = Math.max(state[event.band], value)
  }
  const energy = view.energy
  updateContourLighting(state.contours, energy.six.lowMids, energy.six.highMids, view.session, view.frame,
    view.updatedAtSeconds, now, delta, gain, fresh && profile === 'candidate', reduced, reset)
  state.sun = fresh ? clampSignal(.75 * energy.low + .25 * energy.overall) * gain : 0
  const speed = fresh ? 16 * gain * Math.pow(clampSignal(energy.overall), 1.2) : 0
  state.speed = speed < .005 ? 0 : speed
  const tau = reduced ? 1.5 : .25
  const blend = 1 - Math.exp(-dt / tau)
  state.haze += ((fresh ? clampSignal(view.context.intensity) * gain : 0) - state.haze) * blend
}
