import { clampSignal, smooth } from '../../audio/signal.ts'
import { musicFeaturesFresh, type MusicFeaturesV1 } from '../../audio/musicFeatures.ts'

const HISTORY = 64
export function createMidrangeResponse() {
  return { session: -1, sequence: 0, frame: -1, count: 0, cursor: 0,
    windowTarget: 0, detailTarget: 0, windowBody: 0, detailBody: 0, detailAccent: 0,
    times: new Float64Array(HISTORY), energies: new Float32Array(HISTORY), rises: new Float32Array(HISTORY) }
}
export type MidrangeResponse = ReturnType<typeof createMidrangeResponse>
export function updateMidrangeResponse(state: MidrangeResponse, view: MusicFeaturesV1, deltaSeconds: number,
  nowSeconds: number, reactivity: number, reducedMotion: boolean, manual: boolean) {
  if (state.session !== view.session) {
    state.session = view.session; state.sequence = view.sequence
    state.frame = -1; state.count = state.cursor = 0
    state.windowBody = state.detailBody = state.detailAccent = 0
  }
  const gain = clampSignal(reactivity), fresh = musicFeaturesFresh(view, nowSeconds)
  const enabled = fresh && gain > 0 && !manual
  const dt = Number.isFinite(deltaSeconds) ? Math.max(0, Math.min(.05, deltaSeconds)) : 0
  const low = clampSignal(view.energy.six.lowMids), high = clampSignal(view.energy.six.highMids)
  state.windowTarget = enabled ? .18 * clampSignal((.7 * low + .3 * high) / .35) * gain : 0
  state.detailTarget = enabled ? .28 * clampSignal(low / .35) * gain : 0
  if (manual || gain === 0) {
    state.windowBody = state.detailBody = state.detailAccent = 0
    state.sequence = view.sequence; state.frame = -1; state.count = 0
    return
  }
  if (fresh && view.frame > 0 && view.frame !== state.frame) {
    let earlier = state.count ? state.energies[(state.cursor - 1 + HISTORY) % HISTORY] : low
    for (let i = 0; i < state.count; i++) {
      const index = (state.cursor - 1 - i + HISTORY) % HISTORY
      if (view.updatedAtSeconds - state.times[index] >= .06) { earlier = state.energies[index]; break }
    }
    state.times[state.cursor] = view.updatedAtSeconds
    state.energies[state.cursor] = low
    state.rises[state.cursor] = Math.max(0, low - earlier)
    state.cursor = (state.cursor + 1) % HISTORY; state.count = Math.min(HISTORY, state.count + 1)
    state.frame = view.frame
  } else if (!fresh) {
    state.count = 0; state.frame = -1
  }
  state.detailAccent = enabled && !reducedMotion ? state.detailAccent * Math.exp(-dt / .2) : 0
  for (const event of view.events) {
    if (event.session !== view.session || event.sequence <= state.sequence) continue
    state.sequence = event.sequence
    const age = nowSeconds - event.emittedAtSeconds
    if (!enabled || reducedMotion || event.band !== 'mid' || !Number.isFinite(age) || age < 0 || age > .25) continue
    let rise = 0
    for (let i = 0; i < state.count; i++) {
      const index = (state.cursor - 1 - i + HISTORY) % HISTORY
      if (Math.abs(state.times[index] - event.timeSeconds) <= .09) rise = Math.max(rise, state.rises[index])
    }
    if (rise >= .02) state.detailAccent = Math.max(state.detailAccent,
      .12 * clampSignal(clampSignal(event.strength) / .35) * clampSignal(rise / .15) * gain)
  }
  state.sequence = Math.max(state.sequence, view.sequence)
  state.windowBody = smooth(state.windowBody, state.windowTarget, dt, reducedMotion ? .8 : .35, reducedMotion ? 1.1 : .9)
  state.detailBody = smooth(state.detailBody, state.detailTarget, dt, reducedMotion ? .8 : .1, reducedMotion ? 1.1 : .35)
  if (state.detailAccent < .001) state.detailAccent = 0
  if (state.windowTarget === 0 && state.windowBody < .001) state.windowBody = 0
  if (state.detailTarget === 0 && state.detailBody < .001) state.detailBody = 0
}
