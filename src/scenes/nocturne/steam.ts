// NT21: vent steam. Pure settings and helpers (testable without three.js). Three slow, soft
// plumes rise from existing wall vents, each beside a different fixture, and are lit by the
// nearby lights (sceneLights.ts), so they brighten with the music only because the lights do.
// With reduced motion they freeze as still wisps (owner's choice).
import type { GraphicsQuality } from '../../engine/quality.ts'

// The existing louvered vents (ArchitectureDetails.tsx): at 1.6 m on the walls, z = bay + 3.1,
// with bays at z = -2 - 10 n on the left and -4 - 10 n on the right.
export const VENT = { y: 1.6, faceX: 2.645 }
export function ventZ(side: -1 | 1, bay: number) {
  return (side === 1 ? -4 : -2) - bay * 10 + 3.1
}
export type SteamPlume = { side: -1 | 1, bay: number, seed: number }
export const STEAM = {
  plumes: [
    { side: -1, bay: 1, seed: 0.13 }, // z -8.9, beside the left cyan panel (z -7.3)
    { side: 1, bay: 2, seed: 0.57 }, // z -20.9, by the right magenta fixture at z -18
    { side: -1, bay: 3, seed: 0.91 }, // z -28.9, by the left magenta fixture at z -29
  ] as readonly SteamPlume[],
  size: { width: 1.1, height: 2.6 },
  out: 0.45, // metres the plume's centre sits out from the wall
  rise: 0.12, // noise scroll per second, in plume heights: slow
  period: 64, // the noise repeats every 64 lattice cells, so the scroll wraps without a seam
  octaves: { standard: 4, low: 2 } as Record<GraphicsQuality, number>,
  lightGain: 0.02,
  base: 0.012,
  frozenTime: 5.5, // the still frame shown with reduced motion
  fade: { start: 30, end: 50 },
  layer: 5, // main camera only (out of the wet-floor reflection); the glow pass hides it by name
  maxLights: 8,
  gate: { position: [0, 2.2, -50] as const, intensity: 60, distance: 16 },
} as const

export function plumeBase(plume: SteamPlume) {
  return { x: plume.side * (VENT.faceX - STEAM.out), y: VENT.y + STEAM.size.height / 2 - 0.15, z: ventZ(plume.side, plume.bay) }
}

// The time the shader sees: the clock, or a fixed still frame with reduced motion.
export function steamTime(clock: number, reducedMotion: boolean) {
  return reducedMotion || !Number.isFinite(clock) ? STEAM.frozenTime : clock
}
// Upward scroll of the noise, wrapped to the noise's period so long sessions stay precise
// (the shader's noise lattice repeats with the same period, so the wrap is seamless).
export function steamScroll(time: number) {
  const s = (time * STEAM.rise * 2.5) % STEAM.period
  return s < 0 ? s + STEAM.period : s
}

// The plume's outline (mirrors the shader): u across (-0.5 to 0.5), v up (0 at the vent, 1 at
// the top). Narrow at the vent and bent toward the wall there, widening and thinning as it rises,
// zero at the bottom, top and sides.
export function plumeShape(u: number, v: number, wallSide = 1) {
  if (!(v > 0 && v < 1) || Math.abs(u) >= 0.5) return 0
  const center = wallSide * 0.28 * (1 - v) * (1 - v)
  const width = 0.07 + 0.22 * v
  const across = Math.exp(-2 * ((u - center) / width) ** 2)
  const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
  const edges = 1 - smooth(0.4, 0.5, Math.abs(u))
  return across * smooth(0, 0.08, v) * (1 - smooth(0.5, 1, v)) * edges
}
