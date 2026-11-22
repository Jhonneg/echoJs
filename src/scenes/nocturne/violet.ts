import { clampSignal, smooth } from '../../audio/signal.ts'
import { musicFeaturesFresh, type MusicFeaturesV1 } from '../../audio/musicFeatures.ts'

export function createVioletResponse() {
  return { session: -1, sequence: 0, target: 0, body: 0, peak: 0, startedAt: -Infinity,
    nextAt: -Infinity, bank: 0, nextBank: 0, accents: new Float64Array(2), levels: new Float64Array(2) }
}
export type VioletResponse = ReturnType<typeof createVioletResponse>
export function violetAccentEnvelope(age: number) {
  if (!Number.isFinite(age) || age <= 0 || age >= .24) return 0
  if (age < .015) { const t = age / .015; return t * t * (3 - 2 * t) }
  if (age <= .04) return 1
  const t = (age - .04) / .2
  return (1 - t) * (1 - t)
}
export function updateVioletResponse(state: VioletResponse, view: MusicFeaturesV1,
  deltaSeconds: number, nowSeconds: number, reactivity: number, reducedMotion: boolean, manual: boolean) {
  const reset = state.session !== view.session
  if (reset) {
    state.session = view.session; state.sequence = view.sequence
    state.body = 0; state.nextBank = 0
    state.startedAt = state.nextAt = -Infinity; state.peak = 0
  }
  const gain = clampSignal(reactivity), fresh = musicFeaturesFresh(view, nowSeconds)
  const enabled = fresh && gain > 0 && !manual
  const dt = Number.isFinite(deltaSeconds) ? Math.max(0, Math.min(.05, deltaSeconds)) : 0
  if (!enabled || reducedMotion) { state.startedAt = state.nextAt = -Infinity; state.peak = 0 }
  for (const event of view.events) {
    if (event.session !== view.session || event.sequence <= state.sequence) continue
    state.sequence = event.sequence
    const age = nowSeconds - event.emittedAtSeconds
    if (reset || !enabled || reducedMotion || event.band !== 'high' || !Number.isFinite(event.strength) || event.strength < .04 || !Number.isFinite(age) || age < 0 || age > .25 || nowSeconds < state.nextAt) continue
    // Only accepted events alternate sides; skipped events cannot restart or queue a flash.
    state.bank = state.nextBank; state.nextBank = 1 - state.nextBank
    state.startedAt = nowSeconds; state.nextAt = nowSeconds + .4
    state.peak = .32 * clampSignal(event.strength / .35)
  }
  state.sequence = Math.max(state.sequence, view.sequence)
  const six = view.energy.six
  state.target = enabled ? .16 * clampSignal((.7 * clampSignal(six.presence) + .3 * clampSignal(six.air)) / .35) * gain : 0
  state.body = manual || gain === 0 ? 0 : smooth(state.body, state.target, dt, reducedMotion ? .8 : .04, reducedMotion ? 1.1 : .16)
  if (state.target === 0 && state.body < .001) state.body = 0
  const pulse = state.peak * gain * violetAccentEnvelope(nowSeconds - state.startedAt)
  for (let i = 0; i < 2; i++) {
    state.accents[i] = i === state.bank ? pulse : 0
    state.levels[i] = state.body + state.accents[i]
  }
  if (nowSeconds - state.startedAt >= .24) state.peak = 0
}
