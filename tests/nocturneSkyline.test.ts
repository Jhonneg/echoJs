import test from 'node:test'
import assert from 'node:assert/strict'
import { SKYLINE, SKYLINE_TOWERS, skylineWindowCells, skylineWindows } from '../src/scenes/nocturne/skyline.ts'

// Camera (NocturneScene): at z = 5 with far = 100. The back wall's front face is at z = -51.5
// and the alleys' walls run to x = ±3.
const CAMERA_Z = 5, FAR = 100, BACK_WALL = -51.5

test('NT17: the skyline is the same every time and only a sparse share of windows is lit', () => {
  const a = skylineWindows(), b = skylineWindows()
  assert.deepEqual(a, b)
  const share = a.lit.length / a.cells
  assert.ok(share > 0.1 && share < 0.26, `lit share ${share}`)
  assert.ok(a.lit.length > 20, `${a.lit.length} lit windows`)
  for (const window of a.lit) assert.ok(Number.isInteger(window.tint) && window.tint >= 0 && window.tint < SKYLINE.tints.length)
})

test('NT17: towers stand beyond the back wall and inside the camera range, never in the alley', () => {
  for (const tower of SKYLINE_TOWERS) {
    assert.ok(tower.z + tower.depth / 2 < BACK_WALL - 5, `tower at z ${tower.z} is too close to the back wall`)
    assert.ok(CAMERA_Z - (tower.z - tower.depth / 2) < FAR - 2, `tower at z ${tower.z} is past the far plane`)
    assert.ok(tower.height > 20 && tower.width > 0 && tower.depth > 0)
  }
  assert.ok(CAMERA_Z - SKYLINE.glow.z < FAR, 'the sky glow is inside the far plane')
  assert.ok(SKYLINE.glow.z < Math.min(...SKYLINE_TOWERS.map(t => t.z - t.depth / 2)), 'the sky glow is behind every tower')
})

test('NT17: lit windows sit on their tower faces, below the roof', () => {
  const { lit } = skylineWindows()
  for (const window of lit) {
    const tower = SKYLINE_TOWERS.find(t => Math.abs(window.z - (t.z + t.depth / 2) - 0.03) < 1e-9 && Math.abs(window.x - t.x) <= t.width / 2)
    assert.ok(tower, `window at ${window.x}, ${window.y}, ${window.z} is not on a tower face`)
    assert.ok(Math.abs(window.x - tower.x) + SKYLINE.window.width / 2 <= tower.width / 2)
    assert.ok(window.y + SKYLINE.window.height / 2 <= tower.height && window.y > 0)
  }
  // A tower too small for a window gets none rather than a negative count.
  assert.deepEqual(skylineWindowCells({ x: 0, z: -70, width: 0.5, depth: 1, height: 3 }), { columns: 0, floors: 0 })
})
