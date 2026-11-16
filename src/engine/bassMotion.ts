import { clampSignal } from '../audio/signal.ts'

export interface BassMotion {
  angle: number
  velocity: number
  previousBass: number
}

export function createBassMotion(): BassMotion {
  return { angle: 0, velocity: 0, previousBass: 0 }
}

export function resetBassMotion(motion: BassMotion) {
  motion.angle = 0
  motion.velocity = 0
  motion.previousBass = 0
}

// A rising bass envelope pushes a damped oscillator; both angle and velocity
// remain continuous between frames. The returned angle is normalized to [-1, 1].
export function updateBassMotion(motion: BassMotion, bass: number, dt: number, damping = 16): number {
  const level = clampSignal(bass)
  const rise = Math.max(0, level - motion.previousBass)
  motion.previousBass = level
  motion.velocity = Math.min(65, motion.velocity + rise * 65)

  const elapsed = Math.max(0, Math.min(dt, 0.05))
  const frequency = 38
  const oscillation = Math.sqrt(frequency * frequency - damping * damping)
  const decay = Math.exp(-damping * elapsed)
  const sine = Math.sin(oscillation * elapsed)
  const cosine = Math.cos(oscillation * elapsed)
  const angle = motion.angle
  const velocity = motion.velocity
  motion.angle = decay * (angle * cosine + (velocity + damping * angle) * sine / oscillation)
  motion.velocity = decay * (velocity * cosine - (damping * velocity + frequency * frequency * angle) * sine / oscillation)

  if (motion.angle > 1) {
    motion.angle = 1
    motion.velocity = Math.min(0, motion.velocity)
  } else if (motion.angle < -1) {
    motion.angle = -1
    motion.velocity = Math.max(0, motion.velocity)
  }
  return motion.angle
}
