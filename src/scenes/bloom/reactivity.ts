import { clampSignal, type AudioSignal } from '../../audio/signal.ts'

export interface BloomResponse {
  bass: number
  midrange: number
  treble: number
  glow: number
}
export function createBloomResponse(): BloomResponse {
  return { bass: 0, midrange: 0, treble: 0, glow: 0 }
}
// Envelopes belong to the audio layer. Rendering maps them without another filter.
export function updateBloomResponse(response: BloomResponse, signal: AudioSignal, amount: number) {
  const strength = clampSignal(amount)
  response.bass = clampSignal(0.2 * signal.fast.bass + 0.8 * signal.transient.bass) * strength
  response.midrange = clampSignal(0.25 * signal.fast.midrange + 0.75 * signal.transient.midrange) * strength
  response.treble = clampSignal(0.1 * signal.fast.treble + 0.9 * signal.transient.treble) * strength
  response.glow = clampSignal(signal.atmosphere) * strength
}
