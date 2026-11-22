import { clampSignal, smooth } from '../../audio/signal.ts'
import { musicFeaturesFresh, type MusicFeaturesV1 } from '../../audio/musicFeatures.ts'

export function createMagentaResponse() {
  return { session: -1, sequence: 0, mainTarget: 0, secondaryTarget: 0,
    mainBody: 0, secondaryBody: 0, mainAccent: 0, peak: 0, emittedAt: -Infinity, carry: 0, carriedAt: -Infinity }
}
export type MagentaResponse = ReturnType<typeof createMagentaResponse>
// A short full-strength window keeps the peak readable at30/60/120Hz; no repeating timer.
export function magentaAccentEnvelope(age: number) {
  if (!Number.isFinite(age) || age < 0 || age >= 1.2) return 0
  if (age < .02) { const t = age / .02; return t * t * (3 - 2 * t) }
  return Math.exp(-Math.max(0, age - .055) / .2)
}
function accentAt(state: MagentaResponse, nowSeconds: number) {
  const age = nowSeconds - state.carriedAt
  const carry = age >= 0 && age < 1.2 ? state.carry * Math.exp(-age / .2) : 0
  return Math.max(carry, state.peak * magentaAccentEnvelope(nowSeconds - state.emittedAt))
}
export function updateMagentaResponse(state: MagentaResponse, view: MusicFeaturesV1,
  deltaSeconds: number, nowSeconds: number, reactivity: number, reducedMotion: boolean, manual: boolean) {
  const reset = state.session !== view.session
  if (reset) {
    Object.assign(state, createMagentaResponse())
    state.session = view.session; state.sequence = view.sequence
  }
  const gain = clampSignal(reactivity), fresh = musicFeaturesFresh(view, nowSeconds)
  const enabled = fresh && gain > 0 && !manual
  const dt = Number.isFinite(deltaSeconds) ? Math.max(0, Math.min(.05, deltaSeconds)) : 0
  if (!enabled || reducedMotion) { state.peak = state.carry = 0; state.emittedAt = state.carriedAt = -Infinity }
  for (const event of view.events) {
    if (event.session !== view.session || event.sequence <= state.sequence) continue
    state.sequence = event.sequence
    const age = nowSeconds - event.emittedAtSeconds
    if (reset || !enabled || reducedMotion || event.band !== 'low' || !Number.isFinite(event.strength) || event.strength <= 0 || !Number.isFinite(age) || age < 0 || age > .25) continue
    // Preserve the old tail through the new attack's20ms rise, preventing a retrigger notch.
    state.carry = accentAt(state, nowSeconds)
    state.carriedAt = nowSeconds
    state.peak = .42 * clampSignal(clampSignal(event.strength) / .35)
    state.emittedAt = event.emittedAtSeconds
  }
  state.sequence = Math.max(state.sequence, view.sequence)
  const six = view.energy.six, bass = clampSignal(six.bass), sub = clampSignal(six.subBass)
  state.mainTarget = enabled ? .5 * clampSignal((.8 * bass + .2 * sub) / .35) * gain : 0
  state.secondaryTarget = enabled ? .24 * clampSignal((.6 * bass + .4 * sub) / .35) * gain : 0
  if (manual || gain === 0) {
    state.mainBody = state.secondaryBody = state.mainAccent = 0
    return
  }
  state.mainBody = smooth(state.mainBody, state.mainTarget, dt, reducedMotion ? .8 : .12, reducedMotion ? 1.1 : .45)
  state.secondaryBody = smooth(state.secondaryBody, state.secondaryTarget, dt, reducedMotion ? .8 : .3, reducedMotion ? 1.1 : .7)
  state.mainAccent = accentAt(state, nowSeconds) * gain
  if (state.mainTarget === 0 && state.mainBody < .001) state.mainBody = 0
  if (state.secondaryTarget === 0 && state.secondaryBody < .001) state.secondaryBody = 0
}
