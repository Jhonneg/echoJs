import { clampSignal } from '../../audio/signal.ts'

export const CRIMSON_MAX_SPEED = 24
export const crimsonTravelDrive = (energy: number) => clampSignal(clampSignal(energy) / .25)
// Scene-only soft knee: modest validated attacks read clearly without a binary threshold.
// Preserve zero, one and strict ordering. Gain and temporal envelopes apply afterwards.
export function crimsonLowAccentDrive(strength: number) {
  const value = clampSignal(strength)
  return value * 1.2 / (value + .2)
}
