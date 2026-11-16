import { BAND_NAMES, clampSignal, smooth, type AudioSignal, type BandValues } from './signal.ts'

export interface BandEnvelopeSettings {
  reference: number
  sensitivity: number
  attack: number
  release: number
  transientAttack: number
  transientRelease: number
}
// Fixed references/sensitivities preserve quiet/loud differences; no rolling AGC.
export const FEATURE_SETTINGS: Record<keyof BandValues, BandEnvelopeSettings> = {
  bass: { reference: 0.1, sensitivity: 4, attack: 0.005, release: 0.08, transientAttack: 0.003, transientRelease: 0.08 },
  midrange: { reference: 0.1, sensitivity: 3, attack: 0.008, release: 0.1, transientAttack: 0.003, transientRelease: 0.07 },
  treble: { reference: 0.1, sensitivity: 3, attack: 0.003, release: 0.06, transientAttack: 0.002, transientRelease: 0.05 },
}
function normalize(magnitude: number, sensitivity: number, reference: number) {
  if (!Number.isFinite(magnitude) || magnitude <= 0 || sensitivity <= 0 || reference <= 0) return 0
  const level = magnitude * sensitivity / reference
  return level / (1 + level)
}
export function updateSignalFeatures(signal: AudioSignal, raw: BandValues, delta: number, now: number,
  settings = FEATURE_SETTINGS) {
  for (const band of BAND_NAMES) {
    const config = settings[band]
    const level = normalize(raw[band], config.sensitivity, config.reference)
    signal.levels[band] = level
    signal.fast[band] = smooth(signal.fast[band], level, delta, config.attack, config.release)
    signal.slow[band] = smooth(signal.slow[band], level, delta, 0.25, 0.8)
    const difference = Math.max(0, signal.fast[band] - signal.slow[band])
    // Positive energy change relative to its slow baseline, not a beat classifier.
    const accent = 2 * difference / (1 + difference)
    signal.transient[band] = smooth(signal.transient[band], accent, delta, config.transientAttack, config.transientRelease)
    signal[band] = signal.fast[band]
  }
  const overall = normalize(Math.hypot(raw.bass, raw.midrange, raw.treble), 3, 0.1)
  signal.atmosphere = smooth(signal.atmosphere, overall, delta, 1, 2)
  signal.intensity = signal.atmosphere
  signal.updatedAt = now
  // Guard output bounds independently of any downstream effect mapping.
  signal.atmosphere = clampSignal(signal.atmosphere)
}
