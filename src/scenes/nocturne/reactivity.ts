import { clampSignal, smooth, type AudioSignal } from '../../audio/signal.ts'
import type { NocturneLighting, NocturneLightingMode } from './lighting.ts'

export type NocturneResponse = Pick<NocturneLighting, 'magenta' | 'cyan' | 'violet'> & { atmosphere: number }
export const createNocturneResponse = (): NocturneResponse => ({ magenta: 0, cyan: 0, violet: 0, atmosphere: 0 })
const mappings = [
  ['magenta', 'bass', 0.025, 0.18],
  ['cyan', 'midrange', 0.035, 0.22],
  ['violet', 'treble', 0.02, 0.14],
] as const
const settle = (value: number, target: number) => target === 0 && value < 0.001 ? 0 : value

export function updateNocturneResponse(response: NocturneResponse, signal: AudioSignal, mode: NocturneLightingMode,
  manual: NocturneLighting, reactivity: number, reducedMotion: boolean, delta: number, now: number) {
  if (mode === 'manual') {
    response.magenta = clampSignal(manual.magenta)
    response.cyan = clampSignal(manual.cyan)
    response.violet = clampSignal(manual.violet)
    response.atmosphere = 0
    return
  }
  const gain = clampSignal(reactivity)
  if (gain === 0) {
    response.magenta = response.cyan = response.violet = response.atmosphere = 0
    return
  }
  const age = now - signal.updatedAt
  const active = signal.isPlaying && signal.updatedAt > 0 && Number.isFinite(age) && age >= 0 && age <= 250
  const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, 0.05)) : 0
  for (const [group, band, attack, release] of mappings) {
    const fast = clampSignal(signal.fast[band])
    const accent = Math.max(clampSignal(signal.transient[band]), clampSignal(signal.flux[band]))
    const level = Math.pow(clampSignal((fast - 0.035) / 0.965), 1.35)
    const target = active ? clampSignal(0.7 * level + (fast > 0.035 ? accent * 0.3 : 0)) * gain : 0
    response[group] = settle(smooth(response[group], target, dt, reducedMotion ? 0.8 : attack, reducedMotion ? 1.1 : release), target)
  }
  const atmosphereTarget = active ? clampSignal(signal.atmosphere) * gain : 0
  response.atmosphere = settle(smooth(response.atmosphere, atmosphereTarget,
    dt, reducedMotion ? 1.2 : 0.25, reducedMotion ? 1.5 : active ? 0.8 : 0.35), atmosphereTarget)
}
