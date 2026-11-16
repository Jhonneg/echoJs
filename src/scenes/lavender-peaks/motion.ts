import { clampSignal, smooth, type AudioSignal, SIX_BAND_NAMES } from '../../audio/signal.ts'

// Repeat the authored mountain sequence without a long filler interval.
export const TERRAIN_PERIOD = 24
// Back to front: each nearer ridge has a higher travel-speed limit.
const maximumSpeeds = [0.15, 0.25, 0.45, 0.65, 0.9, 1.2]
export const createLayerMotion = () => ({ offset: 0, speed: 0 })

export function updateLayerMotion(motion: ReturnType<typeof createLayerMotion>, signal: AudioSignal,
  depth: number, reactivity: number, reducedMotion: boolean, delta: number) {
  const gain = clampSignal(reactivity)
  if (reducedMotion || gain === 0) {
    motion.speed = 0
    return
  }
  const dt = Math.max(0, Math.min(Number.isFinite(delta) ? delta : 0, 0.05))
  // One spectral balance drives every mountain: bass is slow, treble is fast.
  let power = 0, weightedPower = 0
  for (const [index, band] of SIX_BAND_NAMES.entries()) {
    const energy = clampSignal(signal.sixBands[band]) ** 2
    power += energy
    weightedPower += energy * index / (SIX_BAND_NAMES.length - 1)
  }
  const brightness = power > 0 ? weightedPower / power : 0
  const sharedEnergy = clampSignal(signal.intensity) * (0.25 + 0.75 * brightness)
  const target = sharedEnergy * maximumSpeeds[depth] * gain
  const response = target > motion.speed ? 0.12 : 0.3
  const decay = Math.exp(-dt / response)
  // Integrate the exponential speed response to keep travel consistent across frame rates.
  const distance = target * dt + (motion.speed - target) * response * (1 - decay)
  motion.speed = target + (motion.speed - target) * decay
  if (target === 0 && motion.speed < 0.00001) motion.speed = 0
  motion.offset = (motion.offset + distance) % TERRAIN_PERIOD
}

export type Peak = [center: number, height: number, width: number]
export function ridgeHeight(x: number, peaks: Peak[], base: number, detail: number, index: number) {
  const wrapped = ((x + TERRAIN_PERIOD / 2) % TERRAIN_PERIOD + TERRAIN_PERIOD) % TERRAIN_PERIOD - TERRAIN_PERIOD / 2
  let y = base
  for (const [center, height, width] of peaks) {
    // Include adjacent copies so both height and slope agree at the tile boundaries.
    for (let tile = -1; tile <= 1; tile++) {
      y += height * Math.exp(-Math.pow((wrapped - center + tile * TERRAIN_PERIOD) / width, 2))
    }
  }
  const phase = wrapped * Math.PI * 2 / TERRAIN_PERIOD
  y += (Math.sin(phase * 106 + index * 3.2) * 0.5 + Math.sin(phase * 217 + index * 4.8) * 0.3) * detail
  return y
}


export function updateSunPulse(current: number, signal: AudioSignal, reactivity: number, reducedMotion: boolean, delta: number) {
  const gain = clampSignal(reactivity)
  if (reducedMotion || gain === 0) return 0
  const bass = clampSignal(0.2 * signal.fast.bass + 0.8 * Math.max(signal.transient.bass, signal.flux.bass))
  const dt = Math.max(0, Math.min(Number.isFinite(delta) ? delta : 0, 0.05))
  return smooth(current, bass * gain, dt, 0.04, 0.22)
}
