// Repeat the authored mountain sequence without a long filler interval.
export const TERRAIN_PERIOD = 24
// Autonomous back-to-front parallax; music never changes travel speed.
export const DRIFT_SPEEDS = [0.03, 0.05, 0.09, 0.13, 0.18, 0.24] as const
export const createLayerMotion = () => ({ offset: 0, speed: 0 })

export function updateLayerMotion(motion: ReturnType<typeof createLayerMotion>,
  depth: number, reducedMotion: boolean, delta: number) {
  if (reducedMotion) {
    motion.speed = 0
    return
  }
  const dt = Math.max(0, Math.min(Number.isFinite(delta) ? delta : 0, 0.05))
  motion.speed = DRIFT_SPEEDS[depth] ?? 0
  motion.offset = (motion.offset + motion.speed * dt) % TERRAIN_PERIOD
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
