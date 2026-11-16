export const BAND_NAMES = ['bass', 'midrange', 'treble'] as const
export type BandName = typeof BAND_NAMES[number]
export type BandValues = Record<BandName, number>
export const SIX_BAND_NAMES = ['subBass', 'bass', 'lowMids', 'highMids', 'presence', 'air'] as const
export type SixBandName = typeof SIX_BAND_NAMES[number]
export type SixBandValues = Record<SixBandName, number>
export const emptySixBands = (): SixBandValues => ({ subBass: 0, bass: 0, lowMids: 0, highMids: 0, presence: 0, air: 0 })

export interface AudioSignal {
  // Compatibility values: fast bands and slow overall intensity.
  bass: number
  midrange: number
  treble: number
  intensity: number
  isPlaying: boolean
  levels: BandValues
  fast: BandValues
  slow: BandValues
  transient: BandValues
  flux: BandValues
  sixBands: SixBandValues // independently normalized fast energy, low to high
  atmosphere: number
  updatedAt: number
  updateHz: number
}
export interface SignalTiming { renderAgeMs: number | null }
export const emptyBands = (): BandValues => ({ bass: 0, midrange: 0, treble: 0 })
export function silentSignal(): AudioSignal {
  return {
    bass: 0, midrange: 0, treble: 0, intensity: 0, isPlaying: false,
    levels: emptyBands(), fast: emptyBands(), slow: emptyBands(), transient: emptyBands(), flux: emptyBands(),
    sixBands: emptySixBands(), atmosphere: 0, updatedAt: 0, updateHz: 0,
  }
}
export function resetSignal(signal: AudioSignal) {
  for (const band of BAND_NAMES) {
    signal[band] = signal.levels[band] = signal.fast[band] = signal.slow[band] = signal.transient[band] = 0
    signal.flux[band] = 0
  }
  for (const band of SIX_BAND_NAMES) signal.sixBands[band] = 0
  signal.intensity = signal.atmosphere = signal.updatedAt = signal.updateHz = 0
  signal.isPlaying = false
}
export const clampSignal = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0

// FFT index k represents k * sampleRate / fftSize Hz. Upper bound is exclusive.
export function binRange(low: number, high: number, sampleRate: number, fftSize: number): [number, number] {
  if (sampleRate <= 0 || fftSize <= 0 || high <= low) return [0, 0]
  const count = Math.floor(fftSize / 2)
  const start = Math.max(0, Math.min(count, Math.ceil(low * fftSize / sampleRate)))
  return [start, Math.max(start, Math.min(count, Math.ceil(high * fftSize / sampleRate)))]
}

// L2 spectral magnitude integrates bin power. This is not calibrated acoustic RMS.
// Keep this unclamped until feature extraction, preserving stronger input changes.
export function bandMagnitude(bins: Float32Array, start: number, end: number): number {
  let power = 0
  for (let i = Math.max(0, start); i < Math.min(end, bins.length); i++) {
    const db = bins[i]
    if (Number.isFinite(db) && db > -80) power += 10 ** (Math.min(db, 0) / 10)
  }
  return Math.sqrt(power)
}
// Display spectrum uses a bounded reference; feature extraction uses raw magnitude.
export function bandLevel(bins: Float32Array, start: number, end: number): number {
  return clampSignal(bandMagnitude(bins, start, end) / 0.1)
}
export function smooth(current: number, target: number, delta: number, attack = 0.1, release = 0.3) {
  const seconds = target > current ? attack : release
  return clampSignal(current + (target - current) * (1 - Math.exp(-Math.max(0, delta) / seconds)))
}
