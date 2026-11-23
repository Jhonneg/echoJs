import { ridges } from './terrain.ts'
import { ridgeHeight, TERRAIN_PERIOD } from './motion.ts'

export const PROFILE_WIDTH = TERRAIN_PERIOD * 8 + 1
// Same 1/8-unit samples as the unchanged ShapeGeometry, including its repeat endpoint.
export function createTerrainProfiles() {
  const data = new Float32Array(PROFILE_WIDTH * ridges.length)
  for (let row = 0; row < ridges.length; row++) {
    const ridge = ridges[row]
    for (let x = 0; x < PROFILE_WIDTH; x++)
      data[row * PROFILE_WIDTH + x] = ridgeHeight(x / 8 - TERRAIN_PERIOD / 2, ridge.peaks, ridge.base, ridge.detail, row)
  }
  return data
}
