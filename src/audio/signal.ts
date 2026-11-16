export interface AudioSignal {
  bass: number
  midrange: number
  treble: number
  intensity: number
  isPlaying: boolean
}

export function silentSignal(): AudioSignal {
  return { bass: 0, midrange: 0, treble: 0, intensity: 0, isPlaying: false }
}

const clamp = (value: number) => Math.max(0, Math.min(1, value))

// FFT index k represents k * sampleRate / fftSize Hz. Upper bound is exclusive.
export function binRange(low: number, high: number, sampleRate: number, fftSize: number): [number, number] {
  if (sampleRate <= 0 || fftSize <= 0 || high <= low) return [0, 0]
  const count = Math.floor(fftSize / 2)
  const start = Math.max(0, Math.min(count, Math.ceil(low * fftSize / sampleRate)))
  return [start, Math.max(start, Math.min(count, Math.ceil(high * fftSize / sampleRate)))]
}

// Peak linear amplitude in a band preserves narrow test tones regardless of band width.
// -80 dB floor, 0.1 amplitude reference (-20 dB) -> 1; this is visual tuning, not loudness.
export function bandLevel(bins: Float32Array, start: number, end: number): number {
  let peak = 0
  for (let i = Math.max(0, start); i < Math.min(end, bins.length); i++) {
    const db = bins[i]
    if (Number.isFinite(db) && db > -80) peak = Math.max(peak, 10 ** (db / 20))
  }
  return clamp(peak / 0.1)
}

export function smooth(current: number, target: number, delta: number, attack = 0.1, release = 0.3) {
  const seconds = target > current ? attack : release
  return clamp(current + (target - current) * (1 - Math.exp(-Math.max(0, delta) / seconds)))
}
