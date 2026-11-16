import { SIX_BAND_NAMES, bandMagnitude, binRange, smooth, type SixBandName, type SixBandValues } from './signal.ts'

// Fixed visual calibration per range. These are energy bands, not instrument separation.
export const SIX_BAND_SETTINGS: Record<SixBandName, {
  low: number, high: number, sensitivity: number, attack: number, release: number,
}> = {
  subBass: { low: 20, high: 80, sensitivity: 4, attack: 0.005, release: 0.08 },
  bass: { low: 80, high: 250, sensitivity: 4, attack: 0.005, release: 0.08 },
  lowMids: { low: 250, high: 800, sensitivity: 3, attack: 0.008, release: 0.1 },
  highMids: { low: 800, high: 2500, sensitivity: 3, attack: 0.008, release: 0.1 },
  presence: { low: 2500, high: 6000, sensitivity: 4, attack: 0.003, release: 0.06 },
  air: { low: 6000, high: 20000, sensitivity: 5, attack: 0.003, release: 0.06 },
}

export function createSixBandAnalysis(sampleRate: number, fftSize: number) {
  const ranges = SIX_BAND_NAMES.map(band => {
    const config = SIX_BAND_SETTINGS[band]
    return binRange(config.low, config.high, sampleRate, fftSize)
  })
  return {
    update(bins: Float32Array, delta: number, output: SixBandValues) {
      const dt = Number.isFinite(delta) ? Math.max(0, delta) : 0
      for (let index = 0; index < SIX_BAND_NAMES.length; index++) {
        const band = SIX_BAND_NAMES[index]
        const config = SIX_BAND_SETTINGS[band]
        const magnitude = bandMagnitude(bins, ...ranges[index])
        const energy = magnitude * config.sensitivity / 0.1
        const target = energy / (1 + energy)
        output[band] = smooth(output[band], target, dt, config.attack, config.release)
      }
    },
  }
}
