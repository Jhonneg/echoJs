// Ridge-edge pass: a fine, irregular tree-line fringe along every ridge crest, as in the reference,
// on top of the authored outline (motion.ts ridgeHeight, unchanged). Pure and periodic with the
// 24-unit terrain tile, so the repeated ridges stay seamless and each ridge keeps its own fringe.
import { TERRAIN_PERIOD } from './motion.ts'

export const TREELINE = {
  tree: 1 / 20, // world units per tree slot (about 3.75 px at the 1440x900 framing)
  sample: 1 / 60, // outline sampling step: three segments per tree, so each tip stays pointed
  // Tallest tree by ridge, far to near: farther ranges get finer fringe (world units).
  height: [0.06, 0.072, 0.09, 0.11, 0.13, 0.155],
  gap: 0.18, // share of empty slots, so the fringe has small breaks
} as const
const SLOTS = Math.round(TERRAIN_PERIOD / TREELINE.tree)

function hash(a: number, b: number) {
  let h = Math.imul(a + 0x9e37, 0x85ebca6b) ^ Math.imul(b + 0x51ed, 0xc2b2ae35)
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296
}

// Height added at x on ridge `index`: a narrow triangular tree per slot, of varied height,
// slightly offset within its slot, with occasional empty slots.
export function ridgeFringe(x: number, index: number) {
  if (!Number.isFinite(x)) return 0
  const tall = TREELINE.height[index] ?? 0
  const at = ((x + TERRAIN_PERIOD / 2) % TERRAIN_PERIOD + TERRAIN_PERIOD) % TERRAIN_PERIOD / TREELINE.tree
  const slot = Math.floor(at) % SLOTS
  const r = hash(slot, index)
  if (r < TREELINE.gap) return 0
  const h = tall * (0.35 + 0.65 * hash(slot, index + 17))
  const tip = 0.35 + 0.3 * hash(slot, index + 31) // where in the slot the tip sits
  const f = at - Math.floor(at)
  const shape = f < tip ? f / tip : (1 - f) / (1 - tip)
  return h * shape
}
