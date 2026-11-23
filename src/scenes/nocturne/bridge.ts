import { clampSignal } from '../../audio/signal.ts'
import { musicFeaturesFresh, type MusicFeaturesV1 } from '../../audio/musicFeatures.ts'

export const BRIDGE_SEGMENTS = 6
export const BRIDGE_STEP_SECONDS = .12
export const BRIDGE_TAIL_SECONDS = .32
export const BRIDGE_DURATION = (BRIDGE_SEGMENTS - 1) * BRIDGE_STEP_SECONDS + BRIDGE_TAIL_SECONDS
const COOLDOWN_SECONDS = BRIDGE_DURATION + .12
export function createBridgeResponse() {
  return { session: -1, sequence: 0, startedAt: -Infinity, nextAt: -Infinity, peak: 0,
    levels: new Float64Array(BRIDGE_SEGMENTS), level: 0 }
}
export type BridgeResponse = ReturnType<typeof createBridgeResponse>
// One finite head and short trailing fade per section; no free-running phase.
export function bridgeSectionEnvelope(age: number) {
  if (!Number.isFinite(age) || age <= 0 || age >= BRIDGE_TAIL_SECONDS) return 0
  if (age < .035) { const t = age / .035; return t * t * (3 - 2 * t) }
  if (age <= .065) return 1
  const t = (age - .065) / (BRIDGE_TAIL_SECONDS - .065)
  return (1 - t) * (1 - t)
}
export function updateBridgeResponse(state: BridgeResponse, view: MusicFeaturesV1,
  nowSeconds: number, reactivity: number, reducedMotion: boolean, manual: boolean) {
  const reset = state.session !== view.session
  if (reset) {
    state.session = view.session; state.sequence = view.sequence
    state.startedAt = state.nextAt = -Infinity; state.peak = 0
  }
  const gain = clampSignal(reactivity)
  const enabled = musicFeaturesFresh(view, nowSeconds) && gain > 0 && !manual && !reducedMotion
  if (!enabled) { state.startedAt = state.nextAt = -Infinity; state.peak = 0 }
  for (const event of view.events) {
    if (event.session !== view.session || event.sequence <= state.sequence) continue
    state.sequence = event.sequence
    const age = nowSeconds - event.emittedAtSeconds
    if (reset || !enabled || event.band !== 'high' || !Number.isFinite(event.strength) || event.strength < .04 || !Number.isFinite(age) || age < 0 || age > .25 || nowSeconds < state.nextAt) continue
    // One active sequence, no queue/restart/overlap. Skipped events are consumed.
    state.startedAt = nowSeconds
    state.nextAt = nowSeconds + COOLDOWN_SECONDS
    state.peak = .48 * clampSignal(event.strength / .35)
  }
  state.sequence = Math.max(state.sequence, view.sequence)
  state.level = 0
  for (let i = 0; i < BRIDGE_SEGMENTS; i++) {
    state.levels[i] = state.peak * gain * bridgeSectionEnvelope(nowSeconds - state.startedAt - i * BRIDGE_STEP_SECONDS)
    state.level += state.levels[i] / BRIDGE_SEGMENTS
  }
  if (nowSeconds - state.startedAt >= BRIDGE_DURATION) state.peak = 0
}
