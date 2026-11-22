import { clampSignal } from '../../audio/signal.ts'

// Fixed walking rate; reduced motion and terrain availability are handled by the journey.
export const CRIMSON_MAX_SPEED = 24
// Scene-only soft knee: modest validated attacks read clearly without a binary threshold.
// Preserve zero, one and strict ordering. Gain and temporal envelopes apply afterwards.
export function crimsonLowAccentDrive(strength: number) {
  const value = clampSignal(strength)
  return value * 1.2 / (value + .2)
}
