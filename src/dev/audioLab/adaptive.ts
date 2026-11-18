import { BAND_NAMES, SIX_BAND_NAMES, emptyBands, emptySixBands } from '../../audio/signal.ts'
import { linearEnergy, type EnergyMeasurement } from './energy.ts'

// One experimental shared gain, never connected to AudioSignal or audio playback.
export const RANGE_SETTINGS = { minGain: 1, maxGain: 2, holdSeconds: 2, riseSeconds: 5,
  reductionSeconds: 0.3, floorDbfs: -50, targetRms: 0.25, rmsAttackSeconds: 0.3, rmsReleaseSeconds: 5 } as const
export const RANGE_TARGETS = { noise: 0.005, loudGraceSeconds: 1 } as const
export function createAdaptiveView() {
  return { gain: 1, targetGain: 1, slowRms: 0, elapsed: 0, eligible: false, holding: true,
    broad: emptyBands(), six: emptySixBands() }
}
export type AdaptiveView = ReturnType<typeof createAdaptiveView>
export function resetAdaptiveView(view: AdaptiveView) {
  view.gain = view.targetGain = 1
  view.slowRms = view.elapsed = 0
  view.eligible = false; view.holding = true
  for (const b of BAND_NAMES) view.broad[b] = 0
  for (const b of SIX_BAND_NAMES) view.six[b] = 0
}
export function createAdaptiveScaling() {
  const state = { gain: 1, targetGain: 1, slowRms: 0, elapsed: 0, eligible: false, holding: true }
  function reset() {
    state.gain = state.targetGain = 1; state.slowRms = state.elapsed = 0
    state.eligible = false; state.holding = true
  }
  return {
    state, reset,
    update(inputRms: number, delta: number, active = true) {
      if (!active || !Number.isFinite(inputRms) || inputRms < 0 || !Number.isFinite(delta) || delta <= 0 || delta > 0.25) {
        reset(); return state
      }
      state.elapsed += delta
      const rmsTime = inputRms > state.slowRms ? RANGE_SETTINGS.rmsAttackSeconds : RANGE_SETTINGS.rmsReleaseSeconds
      state.slowRms += (inputRms - state.slowRms) * (1 - Math.exp(-delta / rmsTime))
      state.eligible = inputRms >= 10 ** (RANGE_SETTINGS.floorDbfs / 20)
      state.holding = state.elapsed <= RANGE_SETTINGS.holdSeconds
      state.targetGain = !state.eligible || state.holding ? 1 : Math.max(1, Math.min(2, RANGE_SETTINGS.targetRms / Math.max(state.slowRms, Number.EPSILON)))
      const dt = Math.min(delta, Math.max(0, state.elapsed - RANGE_SETTINGS.holdSeconds))
      const time = state.targetGain > state.gain ? RANGE_SETTINGS.riseSeconds : RANGE_SETTINGS.reductionSeconds
      state.gain += (state.targetGain - state.gain) * (1 - Math.exp(-dt / time))
      state.gain = Math.max(RANGE_SETTINGS.minGain, Math.min(RANGE_SETTINGS.maxGain, state.gain))
      return state
    },
  }
}
export function applyAdaptive(energy: EnergyMeasurement, state: ReturnType<typeof createAdaptiveScaling>['state'], view: AdaptiveView) {
  view.gain = state.gain; view.targetGain = state.targetGain; view.slowRms = state.slowRms
  view.elapsed = state.elapsed; view.eligible = state.eligible; view.holding = state.holding
  for (const b of BAND_NAMES) view.broad[b] = linearEnergy(energy.rms[b] * state.gain)
  for (const b of SIX_BAND_NAMES) view.six[b] = linearEnergy(energy.six.rms[b] * state.gain)
}
