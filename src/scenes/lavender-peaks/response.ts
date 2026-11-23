import { clampSignal, smooth, type SixBandName } from '../../audio/signal.ts'
import { musicFeaturesFresh, type MusicFeatureReader } from '../../audio/musicFeatures.ts'
import { RIDGE_SHADING } from './shading.ts'

// Far to near. These are energy roles, not instrument or beat detection.
export const RIDGE_BANDS = ['air', 'presence', 'highMids', 'lowMids', 'bass', 'subBass'] as const
const HISTORY = 64
const onsetBands = ['high', 'high', 'mid', 'mid', 'low', 'low'] as const
export const lavenderDrive = (energy: number) => {
  const value = clampSignal(energy)
  return value / (value + .25)
}

export function createLavenderResponse() {
  return {
    session: -1, sequence: 0, frame: -1, sampleTime: -1, cursor: 0, count: 0,
    fresh: false,
    context: { intensity: 0, brightness: 0, brightnessValid: false, activity: 0 },
    ridges: RIDGE_BANDS.map(band => ({ band: band as SixBandName, target: 0, sustained: 0, accent: 0,
      onsetSequence: 0, onsetTimeSeconds: 0, onsetStrength: 0 })),
    times: new Float64Array(HISTORY),
    energies: new Float64Array(HISTORY * 6), rises: new Float64Array(HISTORY * 6),
  }
}
export type LavenderResponse = ReturnType<typeof createLavenderResponse>

// Read the borrowed publication once; only scalar history is retained between frames.
export function updateLavenderResponse(state: LavenderResponse, reader: MusicFeatureReader,
  delta: number, nowSeconds: number, reactivity: number, reducedMotion: boolean) {
  const view = reader.read(), gain = clampSignal(reactivity)
  const dt = Number.isFinite(delta) ? Math.max(0, Math.min(.05, delta)) : 0
  const reset = state.session !== view.session
  if (reset) {
    state.session = view.session; state.sequence = view.sequence
    state.frame = -1; state.sampleTime = -1; state.count = state.cursor = 0
    for (const ridge of state.ridges) {
      ridge.sustained = ridge.target = ridge.accent = 0
      ridge.onsetSequence = ridge.onsetTimeSeconds = ridge.onsetStrength = 0
    }
  }
  state.fresh = musicFeaturesFresh(view, nowSeconds)
  const enabled = state.fresh && gain > 0
  state.context.intensity = enabled ? clampSignal(view.context.intensity) : 0
  state.context.activity = enabled ? clampSignal(view.context.activity) : 0
  state.context.brightnessValid = enabled && view.context.brightnessValid
  state.context.brightness = state.context.brightnessValid ? clampSignal(view.context.brightness) : 0
  if (!enabled || reducedMotion) {
    state.count = state.cursor = 0; state.frame = -1; state.sampleTime = -1
    for (const ridge of state.ridges) ridge.accent = 0
  }
  if (enabled && !reducedMotion && view.frame !== state.frame) {
    // A non-monotonic publication must not turn retained events into new accents.
    if (view.frame < state.frame || view.updatedAtSeconds <= state.sampleTime) {
      state.count = state.cursor = 0; state.sequence = view.sequence
      for (const ridge of state.ridges) ridge.accent = 0
    }
    const at = state.cursor
    for (let band = 0; band < 6; band++) {
      const energy = clampSignal(view.energy.six[RIDGE_BANDS[band]])
      let earlier = state.count ? state.energies[((at - 1 + HISTORY) % HISTORY) * 6 + band] : energy
      for (let i = 0; i < state.count; i++) {
        const index = (at - 1 - i + HISTORY) % HISTORY
        if (view.updatedAtSeconds - state.times[index] >= .06) {
          earlier = state.energies[index * 6 + band]; break
        }
      }
      state.energies[at * 6 + band] = energy
      state.rises[at * 6 + band] = Math.max(0, energy - earlier)
    }
    state.times[at] = view.updatedAtSeconds
    state.cursor = (at + 1) % HISTORY; state.count = Math.min(HISTORY, state.count + 1)
    state.frame = view.frame; state.sampleTime = view.updatedAtSeconds
  }
  for (let index = 0; index < state.ridges.length; index++) {
    const ridge = state.ridges[index], dynamics = RIDGE_SHADING[index]
    ridge.target = enabled ? lavenderDrive(view.energy.six[ridge.band]) * gain : 0
    ridge.sustained = gain === 0 ? 0 : smooth(ridge.sustained, ridge.target, dt,
      reducedMotion ? Math.max(.8, dynamics.attack) : dynamics.attack,
      reducedMotion ? Math.max(1.5, dynamics.release) : dynamics.release)
    if (ridge.target === 0 && ridge.sustained < .0001) ridge.sustained = 0
    ridge.accent *= Math.exp(-dt / .22)
    if (ridge.accent < .0001) ridge.accent = 0
  }
  for (const event of view.events) {
    if (event.session !== view.session || event.sequence <= state.sequence) continue
    state.sequence = event.sequence
    const age = nowSeconds - event.emittedAtSeconds, peakAge = nowSeconds - event.timeSeconds
    if (reset || !enabled || reducedMotion || !Number.isFinite(age) || age < 0 || age > .25 ||
      !Number.isFinite(peakAge) || peakAge < age || peakAge > .5) continue
    for (let band = 0; band < 6; band++) {
      if (onsetBands[band] !== event.band) continue
      let rise = 0
      for (let i = 0; i < state.count; i++) {
        const index = (state.cursor - 1 - i + HISTORY) % HISTORY
        if (Math.abs(state.times[index] - event.timeSeconds) <= .09)
          rise = Math.max(rise, state.rises[index * 6 + band])
      }
      if (rise >= .02) {
        const ridge = state.ridges[band], strength = clampSignal(event.strength) * clampSignal(rise / .2) * gain
        ridge.accent = Math.max(ridge.accent, strength)
        // Retain only this qualified scalar notice, never the borrowed publication.
        ridge.onsetSequence = event.sequence; ridge.onsetTimeSeconds = event.emittedAtSeconds
        ridge.onsetStrength = strength
      }
    }
  }
  state.sequence = Math.max(state.sequence, view.sequence)
  return state
}
