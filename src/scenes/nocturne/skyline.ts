// NT17: distant towers above the gate, with sparse lit windows and a faint sky glow. Pure
// layout (testable without three.js). The towers stand beyond the back wall and the fog's far
// end, so they are drawn without fog in authored dim colours, and they are static: the same
// at idle and with music. Only the narrow strip of sky above the bridge shows them.

// Metres. x across the alley, z down it (the back wall is at z = -52), height from the ground.
export type SkylineTower = { x: number, z: number, width: number, depth: number, height: number }
// The sky shows only in a narrow strip above the bridge (about x -6 to 5 at this distance), so
// the towers are staggered there with gaps for the glow; the outer two mostly frame the edges.
export const SKYLINE_TOWERS: readonly SkylineTower[] = [
  { x: -12, z: -66, width: 7, depth: 6, height: 34 },
  { x: -4.5, z: -68, width: 4, depth: 4, height: 30 },
  { x: -1.5, z: -88, width: 3.2, depth: 3, height: 46 },
  { x: 0.5, z: -80, width: 3.5, depth: 3.5, height: 38 },
  { x: 4.5, z: -72, width: 4.5, depth: 4.5, height: 27 },
  { x: 11, z: -70, width: 7, depth: 6, height: 40 },
]
export const SKYLINE = {
  towerColor: '#05070b',
  // A window is a floor-to-floor cell; only the lit ones are drawn.
  window: { width: 0.5, height: 0.8, column: 0.9, floor: 1.4, firstFloor: 4, roofGap: 1.2 },
  litShare: 0.18,
  // Dim tints for lit windows: cool white, warm sodium, and a little of the scene's cyan.
  tints: ['#4a5866', '#5a4430', '#2b5866'],
  // A faint glow behind the towers, brightest just above the skyline and fading upward.
  glow: { z: -91, width: 90, height: 70, centerY: 40, brightestY: 30, color: '#1c1530', strength: 1.6 },
} as const

// Same windows every time: a small integer hash of tower, column and floor.
function hash(a: number, b: number, c: number) {
  let h = Math.imul(a + 1, 73856093) ^ Math.imul(b + 1, 19349663) ^ Math.imul(c + 1, 83492791)
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995)
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296
}
export type SkylineWindow = { x: number, y: number, z: number, tint: number }
export function skylineWindowCells(tower: SkylineTower) {
  const w = SKYLINE.window
  return {
    columns: Math.max(0, Math.floor((tower.width - 0.6) / w.column)),
    floors: Math.max(0, Math.floor((tower.height - w.roofGap - w.firstFloor) / w.floor)),
  }
}
export function skylineWindows(towers: readonly SkylineTower[] = SKYLINE_TOWERS) {
  const w = SKYLINE.window, lit: SkylineWindow[] = []
  let cells = 0
  towers.forEach((tower, t) => {
    const { columns, floors } = skylineWindowCells(tower)
    const left = tower.x - (columns - 1) * w.column / 2
    for (let c = 0; c < columns; c++) for (let f = 0; f < floors; f++) {
      cells++
      const r = hash(t, c, f)
      if (r >= SKYLINE.litShare) continue
      // Just in front of the tower's face, so the window never fights its depth.
      lit.push({ x: left + c * w.column, y: w.firstFloor + f * w.floor + w.height / 2, z: tower.z + tower.depth / 2 + 0.03,
        tint: Math.floor(r / SKYLINE.litShare * SKYLINE.tints.length) })
    }
  })
  return { lit, cells }
}
