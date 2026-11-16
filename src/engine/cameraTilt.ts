import { clampSignal, type AudioSignal } from '../audio/signal.ts'
import { resetBassMotion, updateBassMotion, type BassMotion } from './bassMotion.ts'

export const CAMERA_TILT_LIMIT = Math.PI / 180

// Matches Bloom's original 20% fast energy / 80% combined accent mapping.
export function updateCameraTilt(motion: BassMotion, signal: AudioSignal, reactivity: number,
  reducedMotion: boolean, delta: number, enabled = true) {
  if (!enabled || reducedMotion || clampSignal(reactivity) === 0) {
    resetBassMotion(motion)
    return 0
  }
  const bass = clampSignal(0.2 * signal.fast.bass + 0.8 * Math.max(signal.transient.bass, signal.flux.bass)) * clampSignal(reactivity)
  return -updateBassMotion(motion, bass, delta) * CAMERA_TILT_LIMIT
}
