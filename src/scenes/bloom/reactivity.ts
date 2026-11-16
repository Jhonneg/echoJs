import { BAND_NAMES, clampSignal, type AudioSignal, type BandName } from '../../audio/signal.ts'

export type AccentMode = 'combined' | 'energy' | 'flux'
export interface BloomDebug {
  band: 'all' | BandName
  accent: AccentMode
  ambient: boolean
  synthetic: boolean
  pulseAt: number | null
}
export const defaultBloomDebug: BloomDebug = { band: 'all', accent: 'combined', ambient: true, synthetic: false, pulseAt: null }

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
export function updateBloomResponse(response: BloomResponse, signal: AudioSignal, amount: number,
  debug = defaultBloomDebug, now = 0) {
  const strength = clampSignal(amount)
  for (const band of BAND_NAMES) {
    const accent = debug.accent === 'energy' ? signal.transient[band]
      : debug.accent === 'flux' ? signal.flux[band] : Math.max(signal.transient[band], signal.flux[band])
    const weight = band === 'bass' ? 0.2 : band === 'midrange' ? 0.25 : 0.1
    const value = debug.synthetic
      ? debug.pulseAt === null || now < debug.pulseAt ? 0 : Math.exp(-(now - debug.pulseAt) / 120)
      : weight * signal.fast[band] + (1 - weight) * accent
    response[band] = debug.band === 'all' || debug.band === band ? clampSignal(value) * strength : 0
  }
  response.glow = debug.ambient && !debug.synthetic ? clampSignal(signal.atmosphere) * strength : 0
}

export interface FragmentResponse { x: number; y: number; rotation: number; highlight: number }
export function updateFragmentResponse(target: FragmentResponse, angle: number, index: number, mid: number, treble: number) {
  const sign = index % 2 === 0 ? 1 : -1
  const drift = clampSignal(mid) * 0.12 * (0.6 + (index % 3) * 0.2) * sign
  target.x = -Math.sin(angle) * drift
  target.y = Math.cos(angle) * drift
  target.rotation = clampSignal(mid) * 0.045 * sign
  // A few authored accents, rather than uniform brightening of the entire halo.
  target.highlight = index % 3 === 0 ? clampSignal(treble) * 0.65 : 0
}
