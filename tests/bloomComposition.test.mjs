import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CAMERA_HEIGHT, CAMERA_Z, CRYSTALS, HORIZON_FRACTION, MONOLITH, RANGES, projectToScreen, rangeOutline, rangeTop } from '../src/scenes/bloom/composition.ts'

const aspects = { desktop: 1440 / 900, wide: 1920 / 810, portrait: 390 / 844 }
const corners = () => {
  const [cx, cy] = MONOLITH.center, hw = MONOLITH.width / 2, hh = MONOLITH.height / 2, hd = MONOLITH.depth / 2
  const out = []
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) out.push([cx + sx * hw, cy + sy * hh, MONOLITH.center[2] + sz * hd])
  return out
}

test('BR1: monolith is fully visible and horizontally centred at desktop, wide and portrait', () => {
  for (const [name, aspect] of Object.entries(aspects)) {
    const points = corners().map(([x, y, z]) => projectToScreen(x, y, z, aspect))
    for (const p of points) {
      assert.ok(p.x > 0 && p.x < 1, `${name}: monolith x ${p.x} out of frame`)
      assert.ok(p.y > 0 && p.y < 1, `${name}: monolith y ${p.y} out of frame`)
    }
    const xs = points.map(p => p.x)
    assert.ok(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - 0.5) < 1e-9, `${name}: not centred`)
  }
})

test('BR1: monolith matches the reference framing in a 16:9 frame', () => {
  const front = 0
  const top = projectToScreen(0, MONOLITH.center[1] + MONOLITH.height / 2, front, 16 / 9)
  const bottom = projectToScreen(0, MONOLITH.bottom, front, 16 / 9)
  const right = projectToScreen(MONOLITH.width / 2, MONOLITH.center[1], front, 16 / 9)
  assert.ok(Math.abs(top.y - 0.064) < 0.02, `top ${top.y}`)
  assert.ok(Math.abs(bottom.y - 0.627) < 0.02, `bottom ${bottom.y}`)
  assert.ok(Math.abs((right.x - 0.5) * 2 - 0.09) < 0.015, `width ${(right.x - 0.5) * 2}`)
  assert.ok(MONOLITH.bottom > 0.2, 'monolith must hover above the water')
})

test('BR1: horizon sits at the reference height and the base stays above it', () => {
  const far = projectToScreen(0, 0, CAMERA_Z - 1e6, 16 / 9)
  assert.ok(Math.abs(far.y - HORIZON_FRACTION) < 1e-3, `horizon ${far.y}`)
  assert.ok(projectToScreen(0, MONOLITH.bottom, 0, 16 / 9).y < far.y)
  assert.ok(CAMERA_HEIGHT < MONOLITH.bottom)
})

test('BR1: ranges are ordered far to near, rise toward the edges and keep a central valley', () => {
  for (let i = 1; i < RANGES.length; i++) assert.ok(RANGES[i].distance < RANGES[i - 1].distance)
  for (const layer of RANGES) {
    assert.ok(rangeTop(layer, 0) > rangeTop(layer, 0.85), 'edge should be higher (smaller fraction) than the valley')
    assert.ok(rangeTop(layer, 0) <= HORIZON_FRACTION)
    for (const [x, y] of rangeOutline(layer)) assert.ok(Number.isFinite(x) && Number.isFinite(y) && y >= 0)
  }
  // The big snowy left peak of the reference reaches high into the sky.
  assert.ok(Math.min(...[-0.7, -0.64, -0.6].map(u => rangeTop(RANGES[1], u))) < 0.2)
})

test('BR1: crystals sit left-high and right-low of the monolith, inside portrait framing', () => {
  const [left, right] = CRYSTALS.map(c => projectToScreen(...c.position, 16 / 9))
  assert.ok(left.x < 0.5 && right.x > 0.5)
  assert.ok(left.y < right.y)
  for (const c of CRYSTALS) {
    const p = projectToScreen(...c.position, aspects.portrait)
    assert.ok(p.x > 0 && p.x < 1, `crystal outside portrait: ${p.x}`)
  }
})
