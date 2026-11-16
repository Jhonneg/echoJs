import { SIX_BAND_NAMES, clampSignal, smooth, type AudioSignal } from '../../audio/signal.ts'

export function createJourney() {
  return { distance: 0, speed: 0, sun: 0, sunPulse: 0, activeCount: 0, active: SIX_BAND_NAMES.map(() => false),
    quiet: SIX_BAND_NAMES.map(() => 0), blocked: false }
}
export type Journey = ReturnType<typeof createJourney>

export function updateJourney(state: Journey, signal: AudioSignal, reactivity: number, reducedMotion: boolean,
  delta: number, now: number, distanceLimit = Infinity) {
  const dt = Math.max(0, Math.min(Number.isFinite(delta) ? delta : 0, 0.05))
  const gain = clampSignal(reactivity)
  const playing = signal.isPlaying && signal.updatedAt > 0 && now - signal.updatedAt <= 250
  let squares = 0, count = 0
  for (let index = 0; index < SIX_BAND_NAMES.length; index++) {
    const level = playing ? clampSignal(signal.sixBands[SIX_BAND_NAMES[index]]) : 0
    squares += level * level
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
  const targetSun = count / SIX_BAND_NAMES.length * gain
  const sunResponse = reducedMotion ? 1.5 : targetSun > state.sun ? 0.25 : 0.8
  state.sun += (targetSun - state.sun) * (1 - Math.exp(-dt / sunResponse))
  if (targetSun === 0 && state.sun < 0.0001) state.sun = 0
  // Strong bass onsets expand the sun briefly; sustained bass does not oscillate it.
  const strongBass = clampSignal((clampSignal(signal.fast.bass) - 0.5) / 0.5)
  const bassAccent = Math.max(clampSignal(signal.transient.bass), clampSignal(signal.flux.bass))
  const pulseTarget = playing ? strongBass * bassAccent * gain : 0
  state.sunPulse = reducedMotion || gain === 0 ? 0 : smooth(state.sunPulse, pulseTarget, dt, 0.04, 0.22)
  if (pulseTarget === 0 && state.sunPulse < 0.0001) state.sunPulse = 0
  state.blocked = false
  if (!playing || gain === 0 || reducedMotion) {
    state.speed = 0
    return
  }
  const energy = Math.sqrt(squares / SIX_BAND_NAMES.length)
  const targetSpeed = count > 0 ? gain * (0.4 + 15.6 * Math.pow(energy, 1.7)) : 0
  const response = targetSpeed > state.speed ? 0.35 : 0.2
  const decay = Math.exp(-dt / response)
  const travel = targetSpeed * dt + (state.speed - targetSpeed) * response * (1 - decay)
  state.speed = targetSpeed + (state.speed - targetSpeed) * decay
  if (targetSpeed === 0 && state.speed < 0.005) state.speed = 0
  const next = state.distance + (state.speed === 0 ? 0 : travel)
  state.blocked = next > distanceLimit + 0.00001
  state.distance = Math.max(state.distance, Math.min(next, distanceLimit))
  if (state.blocked) state.speed = 0
}
