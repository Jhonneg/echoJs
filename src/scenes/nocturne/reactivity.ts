import { clampSignal, smooth } from '../../audio/signal.ts'
import { musicFeaturesFresh, type MusicFeaturesV1 } from '../../audio/musicFeatures.ts'
import type { NocturneLighting, NocturneLightingMode } from './lighting.ts'

export type NocturneResponse = Pick<NocturneLighting, 'magenta' | 'cyan' | 'violet'> & {
  atmosphere: number, session: number, sequence: number,
  accents: { magenta: number, cyan: number, violet: number },
  sustainTargets: { magenta: number, cyan: number, violet: number },
}
export const createNocturneResponse = (): NocturneResponse => ({
  magenta: 0, cyan: 0, violet: 0, atmosphere: 0, session: -1, sequence: 0,
  accents: { magenta: 0, cyan: 0, violet: 0 },
  sustainTargets: { magenta: 0, cyan: 0, violet: 0 },
})
const mappings = [
  ['magenta', 'low', 0.025, 0.18],
  ['cyan', 'mid', 0.035, 0.22],
  ['violet', 'high', 0.02, 0.14],
] as const
const settle = (value: number, target: number) => target === 0 && value < 0.001 ? 0 : value

// Migration baseline only. Later choreography phases split the existing material groups.
export function updateNocturneResponse(response: NocturneResponse, view: MusicFeaturesV1, mode: NocturneLightingMode,
  manual: NocturneLighting, reactivity: number, reducedMotion: boolean, delta: number, nowSeconds: number) {
  const reset = response.session !== view.session
  if (reset) {
    Object.assign(response, createNocturneResponse())
    response.session = view.session
    response.sequence = view.sequence // Skip retained events on mount/reconnect.
  }
  const gain = clampSignal(reactivity)
  const active = musicFeaturesFresh(view, nowSeconds)
  const enabled = active && mode === 'audio' && gain > 0
  const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, 0.05)) : 0
  for (const [group] of mappings) response.accents[group] = enabled && !reducedMotion
    ? response.accents[group] * Math.exp(-dt / .22) : 0
  for (const event of view.events) {
    if (event.session !== view.session || event.sequence <= response.sequence) continue
    response.sequence = event.sequence
    const age = nowSeconds - event.emittedAtSeconds
    if (reset || !enabled || reducedMotion || !Number.isFinite(age) || age < 0 || age > .25) continue
    for (const [group, band] of mappings) if (event.band === band)
      response.accents[group] = Math.max(response.accents[group], .3 * clampSignal(event.strength) * gain)
  }
  response.sequence = Math.max(response.sequence, view.sequence)
  for (const [group, band] of mappings) response.sustainTargets[group] = enabled
    ? .65 * clampSignal(view.energy[band] / .5) * gain : 0
  if (mode === 'manual') {
    for (const [group] of mappings) response[group] = clampSignal(manual[group])
    response.atmosphere = 0
    return
  }
  if (gain === 0) {
    response.magenta = response.cyan = response.violet = response.atmosphere = 0
    return
  }
  for (const [group, , attack, release] of mappings) {
    const target = clampSignal(response.sustainTargets[group] + response.accents[group])
    response[group] = settle(smooth(response[group], target, dt, reducedMotion ? .8 : attack, reducedMotion ? 1.1 : release), target)
    if (response.accents[group] < .001) response.accents[group] = 0
  }
  const target = enabled ? clampSignal(view.context.intensity) * gain : 0
  response.atmosphere = settle(smooth(response.atmosphere, target, dt,
    reducedMotion ? 1.2 : .25, reducedMotion ? 1.5 : active ? .8 : .35), target)
}
