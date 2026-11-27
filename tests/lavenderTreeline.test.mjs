import test from 'node:test'
import assert from 'node:assert/strict'
import { TREELINE, ridgeFringe } from '../src/scenes/lavender-peaks/treeline.ts'
import { TERRAIN_PERIOD } from '../src/scenes/lavender-peaks/motion.ts'
import { ridges } from '../src/scenes/lavender-peaks/terrain.ts'

test('treeline: the fringe repeats with the terrain tile, so repeated ridges stay seamless', () => {
  for (let index = 0; index < ridges.length; index++) for (let x = -12; x < 12; x += 0.0137) {
    assert.ok(Math.abs(ridgeFringe(x, index) - ridgeFringe(x + TERRAIN_PERIOD, index)) < 1e-9)
    assert.ok(Math.abs(ridgeFringe(x, index) - ridgeFringe(x - 2 * TERRAIN_PERIOD, index)) < 1e-9)
  }
  assert.ok(Number.isInteger(TERRAIN_PERIOD / TREELINE.tree), 'whole number of tree slots per tile')
})

test('treeline: bounded, never below the outline, finer on farther ridges, the same every time', () => {
  assert.equal(TREELINE.height.length, ridges.length)
  for (let i = 1; i < ridges.length; i++) assert.ok(TREELINE.height[i] > TREELINE.height[i - 1], 'nearer ridges have taller trees')
  for (let index = 0; index < ridges.length; index++) {
    let max = 0, empty = 0, slots = 0
    for (let slot = 0; slot < TERRAIN_PERIOD / TREELINE.tree; slot++) {
      const centre = -TERRAIN_PERIOD / 2 + (slot + 0.5) * TREELINE.tree
      let peak = 0
      for (let f = 0.05; f < 1; f += 0.05) {
        const h = ridgeFringe(-TERRAIN_PERIOD / 2 + (slot + f) * TREELINE.tree, index)
        assert.ok(h >= 0 && h <= TREELINE.height[index] + 1e-12)
        peak = Math.max(peak, h)
      }
      max = Math.max(max, peak); slots++; if (peak === 0) empty++
      assert.equal(ridgeFringe(centre, index), ridgeFringe(centre, index))
    }
    assert.ok(max > TREELINE.height[index] * 0.8, 'some trees reach near full height')
    assert.ok(empty / slots > 0.08 && empty / slots < 0.3, `small breaks: ${empty} of ${slots} slots empty`)
  }
  assert.equal(ridgeFringe(Number.NaN, 0), 0)
})

test('treeline: each tree is drawn with at least three outline segments, so tips stay pointed', () => {
  assert.ok(TREELINE.tree / TREELINE.sample >= 3 - 1e-9)
})
