// NT19: light rain. Pure settings and layout (testable without three.js). Thin streaks fall
// through the alley and take their colour from the lights near them (the fixture spill lights
// and the gate), so rain in the dark stays almost invisible. The rain follows the lights, not
// the music, and is hidden with reduced motion.
import type { GraphicsQuality } from '../../engine/quality.ts'

export const RAIN = {
  count: { standard: 1800, low: 700 } as Record<GraphicsQuality, number>,
  // Metres. The volume between the walls (x = ±3), from just behind the camera into the alley.
  volume: { halfWidth: 2.7, bottom: 0, top: 11, near: 3, far: -46 },
  speed: { min: 8, max: 11 }, // metres per second, varied per streak
  wind: 0.7, // sideways metres per second, so the streaks lean slightly
  length: { min: 0.5, max: 0.9 },
  width: 0.012, // metres, widened with distance to about a pixel so far streaks don't shimmer
  // Light: brightness = sum over lights of colour x intensity x falloff(distance) x gain.
  lightGain: 0.012,
  base: 0.005, // a trace of cool sky light so unlit rain isn't pure black-additive (invisible)
  fade: { start: 30, end: 52 }, // distance fade, roughly matching the fog
  layer: 4, // drawn by the main camera only: out of the wet-floor reflection and the glow pass
  // The gate is a light for the rain too: colour = the gate's glow x this intensity.
  gate: { position: [0, 2.2, -50] as const, intensity: 60, distance: 16 },
  maxLights: 8,
} as const

// The same falloff as the shader: inverse square, smoothly cut off at the light's range (as
// three.js does for point lights). Zero for an unlit or out-of-range light.
export function rainLightFalloff(distance: number, range: number) {
  if (!Number.isFinite(distance) || !(range > 0) || distance >= range) return 0
  const cut = Math.max(0, 1 - (distance / range) ** 4)
  return cut * cut / (1 + distance * distance)
}

// Same streaks every time: a small linear congruential generator.
export type RainDrop = { x: number, y: number, z: number, speed: number, length: number }
export function rainDrops(count: number, seed = 1913) {
  let s = seed >>> 0
  const random = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296 }
  const { halfWidth, bottom, top, near, far } = RAIN.volume
  const drops: RainDrop[] = []
  for (let i = 0; i < Math.max(0, Math.floor(count)); i++) {
    const speed = RAIN.speed.min + random() * (RAIN.speed.max - RAIN.speed.min)
    // Start far enough upwind that the sideways drift over a full fall stays between the walls.
    const drift = RAIN.wind * (top - bottom) / speed
    drops.push({
      x: -halfWidth + random() * (2 * halfWidth - drift),
      y: bottom + random() * (top - bottom),
      z: far + random() * (near - far),
      speed,
      length: RAIN.length.min + random() * (RAIN.length.max - RAIN.length.min),
    })
  }
  return drops
}

// Where a streak's head is at a given time (mirrors the vertex shader): it falls and wraps to the
// top, drifting downwind as it falls.
export function rainPosition(drop: RainDrop, time: number) {
  const { bottom, top } = RAIN.volume, height = top - bottom
  const fallen = ((drop.y - bottom - time * drop.speed) % height + height) % height
  const y = bottom + fallen
  return { x: drop.x + RAIN.wind * (top - y) / drop.speed, y, z: drop.z }
}

export function rainVisible(reducedMotion: boolean) {
  return !reducedMotion
}
