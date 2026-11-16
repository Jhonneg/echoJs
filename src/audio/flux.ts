import { BAND_NAMES, emptyBands, smooth, type BandValues } from './signal.ts'

type Ranges = Record<keyof BandValues, readonly [number, number]>
export const FLUX_SETTINGS = {
  bass: { reference: 0.035, attack: 0.003, release: 0.08 },
  midrange: { reference: 0.03, attack: 0.003, release: 0.07 },
  treble: { reference: 0.018, attack: 0.002, release: 0.05 },
}
const magnitude = (db: number) => Number.isFinite(db) && db > -80 ? 10 ** (Math.min(db, 0) / 20) : 0

// Frame-to-frame positive changes precede aggregation. No media is retained:
// one previous magnitude spectrum is overwritten each update and cleared on reset.
export function createSpectralFlux(count: number, ranges: Ranges) {
  const previous = new Float32Array(count)
  const changes = new Float32Array(count)
  const reservoir = emptyBands()
  const l1 = emptyBands(), l2 = emptyBands()
  let primed = false
  function reset() {
    previous.fill(0)
    changes.fill(0)
    for (const band of BAND_NAMES) reservoir[band] = l1[band] = l2[band] = 0
    primed = false
  }
  function update(bins: Float32Array, delta: number, active: boolean, output: BandValues) {
    const discontinuity = !Number.isFinite(delta) || delta <= 0 || delta > 0.25
    if (!active || discontinuity) reset()
    for (let i = 0; i < count; i++) {
      const value = active ? magnitude(bins[i]) : 0
      changes[i] = primed ? Math.max(0, value - previous[i]) : 0
      previous[i] = value
    }
    primed = active
    const dt = Number.isFinite(delta) ? Math.max(0, delta) : 0
    for (const band of BAND_NAMES) {
      const [start, end] = ranges[band]
      let sum = 0, squares = 0
      for (let i = start; i < Math.min(end, count); i++) {
        const difference = changes[i]
        sum += difference
        squares += difference * difference
      }
      l1[band] = sum
      l2[band] = Math.sqrt(squares)
      const config = FLUX_SETTINGS[band]
      // Leaky accumulation of positive increments, rather than differences per
      // frame as a target: avoids gain proportional to the update frame rate.
      reservoir[band] = reservoir[band] * Math.exp(-dt / config.release) + l2[band]
      const level = reservoir[band] / config.reference
      const target = level / (1 + level)
      output[band] = smooth(output[band], target, dt, config.attack, config.release)
    }
  }
  return { update, reset, l1, l2 }
}
