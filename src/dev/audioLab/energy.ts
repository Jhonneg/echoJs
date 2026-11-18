import { BAND_NAMES, SIX_BAND_NAMES, binRange, emptyBands, emptySixBands, type BandValues, type SixBandValues } from '../../audio/signal.ts'
import { SIX_BAND_SETTINGS } from '../../audio/sixBands.ts'

// Web Audio's periodic Blackman window: .42 - .5 cos(2πn/N) + .08 cos(4πn/N).
// With its 1/N DFT, double positive-frequency power and divide by mean window².
// A stationary-signal RMS estimate, not exact unwindowed transient RMS or LUFS.
export const BLACKMAN_MEAN_SQUARE = 0.42 ** 2 + (0.5 ** 2 + 0.08 ** 2) / 2
export const ENERGY_REFERENCE_RMS = 0.5
export const ENERGY_TARGETS = { calibrationDb: 1, loudContrast: 0.15, noise: 0.005 } as const
export const createEnergy = () => ({ rms: emptyBands(), linear: emptyBands(), softKnee: emptyBands(),
  six: { rms: emptySixBands(), linear: emptySixBands(), softKnee: emptySixBands() } })
export type EnergyMeasurement = ReturnType<typeof createEnergy>
export const linearEnergy = (rms: number) => Number.isFinite(rms) && rms > 0 ? Math.min(1, rms / ENERGY_REFERENCE_RMS) : 0
export const softKneeEnergy = (rms: number) => Number.isFinite(rms) && rms > 0 ? rms / (ENERGY_REFERENCE_RMS + rms) : 0

export function spectralRms(bins: Float32Array, start: number, end: number) {
  let power = 0
  for (let k = Math.max(0, start); k < Math.min(end, bins.length); k++) {
    const db = bins[k]
    if (!Number.isFinite(db)) continue
    const binPower = 10 ** (db / 10)
    if (Number.isFinite(binPower)) power += binPower * (k === 0 ? 1 : 2)
  }
  const estimate = Math.sqrt(power / BLACKMAN_MEAN_SQUARE)
  return Number.isFinite(estimate) ? estimate : 0
}
export function resetEnergy(energy: EnergyMeasurement) {
  for (const key of ['rms', 'linear', 'softKnee'] as const) {
    for (const band of BAND_NAMES) energy[key][band] = 0
    for (const band of SIX_BAND_NAMES) energy.six[key][band] = 0
  }
}
export function createEnergyMeter(sampleRate: number, fftSize: number) {
  const broad = [[20, 250], [250, 4000], [4000, 20000]].map(([low, high]) => binRange(low, high, sampleRate, fftSize))
  const six = SIX_BAND_NAMES.map(b => binRange(SIX_BAND_SETTINGS[b].low, SIX_BAND_SETTINGS[b].high, sampleRate, fftSize))
  function updateBands<T extends string>(bins: Float32Array, names: readonly T[], ranges: [number, number][],
    output: { rms: Record<T, number>, linear: Record<T, number>, softKnee: Record<T, number> }) {
    for (let i = 0; i < names.length; i++) {
      const band = names[i], value = spectralRms(bins, ...ranges[i])
      output.rms[band] = value
      output.linear[band] = linearEnergy(value)
      output.softKnee[band] = softKneeEnergy(value)
    }
  }
  return { sampleRate, fftSize, update(bins: Float32Array, output: EnergyMeasurement) {
    updateBands(bins, BAND_NAMES, broad, output as { rms: BandValues, linear: BandValues, softKnee: BandValues })
    updateBands(bins, SIX_BAND_NAMES, six, output.six as { rms: SixBandValues, linear: SixBandValues, softKnee: SixBandValues })
  } }
}
