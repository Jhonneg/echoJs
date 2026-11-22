import { clampSignal } from '../../audio/signal.ts'
export function createAtmosphere() { return { density: 0, warmth: 0 } }
export function updateAtmosphere(state: ReturnType<typeof createAtmosphere>, intensity: number, activity: number,
  brightness: number, brightnessValid: boolean, enabled: boolean, delta: number, gain: number, reduced: boolean) {
  const dt = Math.max(0, Math.min(.05, Number.isFinite(delta) ? delta : 0))
  const level = enabled ? clampSignal(intensity) : 0
  const density = enabled ? (.65 * level + .35 * clampSignal(activity)) * clampSignal(gain) : 0
  const warmth = enabled && brightnessValid ? level * clampSignal(brightness) * clampSignal(gain) : 0
  state.density = approach(state.density, density, dt, reduced)
  state.warmth = approach(state.warmth, warmth, dt, reduced)
}
function approach(value: number, target: number, dt: number, reduced: boolean) {
  const tau = reduced ? target > value ? 4 : 6 : target > value ? 2 : 4
  const next = value + (target - value) * (1 - Math.exp(-dt / tau))
  return target === 0 && next < .0001 ? 0 : next
}
