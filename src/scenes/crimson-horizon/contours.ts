import { clampSignal } from '../../audio/signal.ts'
import { CHUNK_LENGTH } from './terrain.ts'

export function createContourLighting() {
  return { light: 0, streak: 0, progress: 0, session: -1, frame: -1, previousTime: 0,
    slowHigh: 0, armed: true, pending: false, baseline: 0, peak: 0, deadline: 0,
    lastLaunch: -Infinity, strength: 0 }
}
export type ContourLighting = ReturnType<typeof createContourLighting>
// Local lighting response to existing fixed six-band controls, not a new audio/onset feature.
export function updateContourLighting(state: ContourLighting, lowMids: number, highMids: number,
  session: number, frame: number, featureTime: number, now: number, delta: number,
  gain: number, active: boolean, reduced: boolean, reset = false) {
  const dt = Math.max(0, Math.min(.05, Number.isFinite(delta) ? delta : 0)), amount = clampSignal(gain)
  const high = clampSignal(highMids)
  const prime = reset || state.session !== session || !active || amount === 0 || reduced
  if (prime) {
    state.session = session; state.frame = frame; state.previousTime = featureTime
    state.slowHigh = high; state.armed = true; state.pending = false
    state.strength = state.streak = state.progress = 0; state.lastLaunch = -Infinity
  }
  const target = active ? Math.sqrt(clampSignal(lowMids)) * amount : 0
  const tau = reduced ? 1.5 : target > state.light ? .32 : .75
  state.light += (target - state.light) * (1 - Math.exp(-dt / tau))
  if (amount === 0 || (target === 0 && state.light < .0001)) state.light = 0
  if (prime) return
  if (frame !== state.frame) {
    const step = Math.max(0, Math.min(.1, featureTime - state.previousTime)), baseline = state.slowHigh
    state.previousTime = featureTime; state.frame = frame
    state.slowHigh += (high - state.slowHigh) * (1 - Math.exp(-step / .12))
    const rise = high - baseline
    if (!state.armed && rise < .008 && now - state.lastLaunch > .16) state.armed = true
    if (state.armed && !state.pending && rise > .025 && high > .03) {
      state.pending = true; state.baseline = baseline; state.peak = high; state.deadline = featureTime + .045
    }
    if (state.pending) state.peak = Math.max(state.peak, high)
  }
  if (state.pending && now >= state.deadline) {
    state.pending = false; state.armed = false; state.lastLaunch = state.deadline
    state.strength = Math.pow(clampSignal(state.peak - state.baseline), .7)
  }
  const age = now - state.lastLaunch
  state.progress = Math.max(0, Math.min(1, age / .55))
  const attack = Math.max(0, Math.min(1, age / .025)), release = Math.max(0, Math.min(1, (age - .05) / .5))
  state.streak = age >= 0 && age < .55 ? state.strength * amount * attack * attack * (3 - 2 * attack) * (1 - release * release * (3 - 2 * release)) : 0
}
// Bounded logical-coordinate phase: no restart at chunk edges or rendering rebases.
export const contourOrigin = (index: number) => ((-index * CHUNK_LENGTH * .045) % 1 + 1) % 1
