import { clampSignal, smooth } from '../../audio/signal.ts'
import { musicFeaturesFresh, type MusicFeaturesV1 } from '../../audio/musicFeatures.ts'

export function createAtmosphereResponse() {
  return { session: -1, level: 0, density: 0, tint: 0, levelTarget: 0, densityTarget: 0, tintTarget: 0 }
}
export type AtmosphereResponse = ReturnType<typeof createAtmosphereResponse>
export function updateAtmosphereResponse(state: AtmosphereResponse, view: MusicFeaturesV1,
  deltaSeconds: number, nowSeconds: number, reactivity: number, reducedMotion: boolean, manual: boolean) {
  if (state.session !== view.session) {
    Object.assign(state, createAtmosphereResponse())
    state.session = view.session
  }
  const gain = clampSignal(reactivity), enabled = musicFeaturesFresh(view, nowSeconds) && gain > 0 && !manual
  const context = view.context, intensity = enabled ? clampSignal(context.intensity) : 0
  state.levelTarget = .65 * intensity * gain
  // Activity is an existing strength-weighted onset rate, not BPM or a section label.
  state.densityTarget = enabled ? clampSignal(context.activity) * intensity * gain : 0
  state.tintTarget = enabled && context.brightnessValid && Number.isFinite(context.brightness)
    ? (2 * clampSignal(context.brightness) - 1) * intensity * gain : 0
  if (manual || gain === 0) { state.level = state.density = state.tint = 0; return }
  const dt = Number.isFinite(deltaSeconds) ? Math.max(0, Math.min(.05, deltaSeconds)) : 0
  state.level = smooth(state.level, state.levelTarget, dt, reducedMotion ? 4 : 2, reducedMotion ? 6 : 4)
  state.density = smooth(state.density, state.densityTarget, dt, reducedMotion ? 4 : 3, reducedMotion ? 6 : 5)
  // Signed color balance uses one time constant in either direction (no sign-dependent release).
  state.tint += (state.tintTarget - state.tint) * -Math.expm1(-dt / (reducedMotion ? 6 : 4))
  if (state.levelTarget === 0 && state.level < .001) state.level = 0
  if (state.densityTarget === 0 && state.density < .001) state.density = 0
  if (state.tintTarget === 0 && Math.abs(state.tint) < .001) state.tint = 0
}
