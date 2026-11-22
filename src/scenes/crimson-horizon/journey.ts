import { CRIMSON_MAX_SPEED } from './response.ts'
import type { MusicPilot } from './musicPilot.ts'
import { SIX_BAND_NAMES, clampSignal, smooth, type AudioSignal } from '../../audio/signal.ts'

export function createJourney() {
  return { distance: 0, speed: 0, sun: 0, sunPulse: 0, legacyPulse: 0, activeCount: 0, active: SIX_BAND_NAMES.map(() => false),
    quiet: SIX_BAND_NAMES.map(() => 0), blocked: false }
}
export type Journey = ReturnType<typeof createJourney>

export function updateJourney(state: Journey, signal: AudioSignal, reactivity: number, reducedMotion: boolean,
  delta: number, now: number, distanceLimit = Infinity, pilot?: MusicPilot) {
  const dt = Math.max(0, Math.min(Number.isFinite(delta) ? delta : 0, 0.05))
  const gain = clampSignal(reactivity)
  const playing = signal.isPlaying && signal.updatedAt > 0 && now - signal.updatedAt <= 250
  let count = 0
  for (let index = 0; index < SIX_BAND_NAMES.length; index++) {
    const level = playing ? clampSignal(signal.sixBands[SIX_BAND_NAMES[index]]) : 0
    if (!playing) {
      state.active[index] = false
      state.quiet[index] = 0
    } else if (level >= 0.12) {
      state.active[index] = true
      state.quiet[index] = 0
    } else if (level < 0.08) {
      state.quiet[index] += dt
      if (state.quiet[index] >= 0.15) state.active[index] = false
    } else state.quiet[index] = 0
    if (state.active[index]) count++
  }
  state.activeCount = count
  const weight = pilot?.weight ?? 0
  const targetSun = count / SIX_BAND_NAMES.length * gain * (1 - weight) + (pilot?.sun ?? 0) * weight
  const sunResponse = reducedMotion ? 1.5 : targetSun > state.sun ? 0.25 : 0.8
  state.sun += (targetSun - state.sun) * (1 - Math.exp(-dt / sunResponse))
  if (targetSun === 0 && state.sun < 0.0001) state.sun = 0
  // Strong bass onsets expand the sun briefly; sustained bass does not oscillate it.
  const strongBass = clampSignal((clampSignal(signal.fast.bass) - 0.5) / 0.5)
  const bassAccent = Math.max(clampSignal(signal.transient.bass), clampSignal(signal.flux.bass))
  const pulseTarget = playing ? strongBass * bassAccent * gain : 0
  state.legacyPulse = reducedMotion || gain === 0 ? 0 : smooth(state.legacyPulse, pulseTarget, dt, 0.04, 0.22)
  if (pulseTarget === 0 && state.legacyPulse < 0.0001) state.legacyPulse = 0
  state.sunPulse = state.legacyPulse * (1 - weight) + (pilot?.low ?? 0) * weight
  state.blocked = false
  // Forward travel is an ambient scene property, independent of audio and Reactivity.
  if (reducedMotion) {
    state.speed = 0
    return
  }
  state.speed = CRIMSON_MAX_SPEED
  const next = state.distance + state.speed * dt
  state.blocked = next > distanceLimit + 0.00001
  state.distance = Math.max(state.distance, Math.min(next, distanceLimit))
  if (state.blocked) state.speed = 0
}
