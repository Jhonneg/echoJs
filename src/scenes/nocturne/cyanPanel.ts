import { clampSignal, smooth } from '../../audio/signal.ts'
import { musicFeaturesFresh, type MusicFeaturesV1 } from '../../audio/musicFeatures.ts'

// Keep only scalar feature samples until the broad-mid onset detector emits its event.
// No PCM or spectrum enters this scene controller.
const HISTORY = 64
export function createCyanPanelResponse() {
  return { level: 0, sustained: 0, sustainTarget: 0, accent: 0, session: -1, sequence: 0, frame: -1,
    cursor: 0, count: 0,
    times: new Float64Array(HISTORY), energies: new Float32Array(HISTORY), rises: new Float32Array(HISTORY) }
}
export type CyanPanelResponse = ReturnType<typeof createCyanPanelResponse>
export function updateCyanPanelResponse(state: CyanPanelResponse, view: MusicFeaturesV1,
  delta: number, nowSeconds: number, reactivity: number, reducedMotion: boolean) {
  const gain = clampSignal(reactivity)
  if (state.session !== view.session) {
    state.session = view.session; state.sequence = view.sequence
    state.count = state.cursor = 0; state.frame = -1
    state.level = state.sustained = state.sustainTarget = state.accent = 0
  }
  if (gain === 0) {
    state.sequence = view.sequence
    state.level = state.sustained = state.sustainTarget = state.accent = 0
    state.count = 0; state.frame = -1
    return state
  }
  const fresh = musicFeaturesFresh(view, nowSeconds)
  const dt = Number.isFinite(delta) ? Math.max(0, Math.min(.05, delta)) : 0
  const highMid = fresh ? clampSignal(view.energy.six.highMids) : 0
  if (fresh && view.frame > 0 && view.frame !== state.frame) {
    let earlier = state.count ? state.energies[(state.cursor - 1 + HISTORY) % HISTORY] : highMid
    for (let i = 0; i < state.count; i++) {
      const index = (state.cursor - 1 - i + HISTORY) % HISTORY
      if (view.updatedAtSeconds - state.times[index] >= .06) { earlier = state.energies[index]; break }
    }
    state.frame = view.frame
    const index = state.cursor
    state.times[index] = view.updatedAtSeconds
    state.energies[index] = highMid
    state.rises[index] = Math.max(0, highMid - earlier)
    state.cursor = (index + 1) % HISTORY
    state.count = Math.min(HISTORY, state.count + 1)
  } else if (!fresh) {
    state.count = 0; state.frame = -1
  }
  const target = fresh ? .65 * clampSignal(highMid / .5) * gain : 0
  state.sustainTarget = target
  state.sustained = smooth(state.sustained, target, dt,
    reducedMotion ? .8 : .06, reducedMotion ? 1.1 : .18)
  state.accent *= Math.exp(-dt / (reducedMotion ? .8 : .22))
  if (!fresh) state.accent = 0
  for (const event of view.events) {
    if (event.session !== view.session || event.sequence <= state.sequence) continue
    state.sequence = event.sequence
    if (!fresh || reducedMotion || event.band !== 'mid' || !Number.isFinite(event.emittedAtSeconds) || nowSeconds < event.emittedAtSeconds || nowSeconds - event.emittedAtSeconds > .25) continue
    let highMidRise = 0
    for (let i = 0; i < state.count; i++) {
      const index = (state.cursor - 1 - i + HISTORY) % HISTORY
      if (Math.abs(state.times[index] - event.timeSeconds) <= .09)
        highMidRise = Math.max(highMidRise, state.rises[index])
    }
    if (highMidRise >= .02) state.accent = Math.max(state.accent,
      .35 * clampSignal(event.strength) * clampSignal(highMidRise / .2) * gain)
  }
  state.sequence = Math.max(state.sequence, view.sequence)
  state.level = clampSignal(state.sustained + state.accent)
  if (target === 0 && state.sustained < .001) state.sustained = 0
  if (state.accent < .001) state.accent = 0
  return state
}
