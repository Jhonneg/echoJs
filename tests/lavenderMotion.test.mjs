import test from 'node:test'
import assert from 'node:assert/strict'
import { createLayerMotion, updateLayerMotion, ridgeHeight, TERRAIN_PERIOD, DRIFT_SPEEDS } from '../src/scenes/lavender-peaks/motion.ts'
import { ridges } from '../src/scenes/lavender-peaks/terrain.ts'

function advance(depth, seconds, hz = 60) {
  const motion = createLayerMotion()
  for (let i = 0; i < seconds * hz; i++) updateLayerMotion(motion, depth, false, 1 / hz)
  return motion
}

test('autonomous rightward drift retains depth hierarchy without any audio input', () => {
  const motions = ridges.map((_, depth) => advance(depth, 10))
  for (let i = 0; i < 6; i++) {
    assert.equal(motions[i].speed, DRIFT_SPEEDS[i])
    assert.ok(Math.abs(motions[i].offset - DRIFT_SPEEDS[i] * 10) < 1e-10)
    if (i) assert.ok(motions[i].offset > motions[i-1].offset)
  }
})

test('travel is cadence independent through many complete wraps', () => {
  for (let depth = 0; depth < 6; depth++) {
    const baseline = advance(depth, 1000)
    assert.ok(Math.abs(baseline.offset) < 1e-8 || Math.abs(baseline.offset - TERRAIN_PERIOD) < 1e-8 ||
      Math.abs(baseline.offset - (DRIFT_SPEEDS[depth] * 1000) % TERRAIN_PERIOD) < 1e-8)
    for (const hz of [30, 120]) {
      const motion = advance(depth, 1000, hz)
      const difference = Math.abs(motion.offset - baseline.offset)
      assert.ok(difference < 1e-8 || Math.abs(difference - TERRAIN_PERIOD) < 1e-8)
    }
  }
})

test('reduced motion freezes in place; resume continues without resetting and invalid delta cannot jump', () => {
  const motion = advance(5, 3), before = motion.offset
  updateLayerMotion(motion, 5, true, 1)
  assert.equal(motion.offset, before); assert.equal(motion.speed, 0)
  for (const delta of [NaN, Infinity, -1]) updateLayerMotion(motion, 5, false, delta)
  assert.equal(motion.offset, before)
  updateLayerMotion(motion, 5, false, 100)
  assert.ok(Math.abs(motion.offset - before - .24 * .05) < 1e-10)
})

test('periodic ridges agree across repeated tiles and boundary slopes', () => {
  const peaks = [[-10, 1.4, 2.6], [1.6, 4.8, 2.2], [10.5, 2.2, 2]]
  const height = x => ridgeHeight(x, peaks, -1.4, 0.08, 0)
  for (const x of [-20, -19.99, 0, 19.99, 20]) assert.ok(Math.abs(height(x) - height(x + TERRAIN_PERIOD)) < 1e-10)
  const epsilon = 0.0001
  const edge = TERRAIN_PERIOD / 2
  const leftSlope = (height(edge) - height(edge - epsilon)) / epsilon
  const rightSlope = (height(-edge + epsilon) - height(-edge)) / epsilon
  assert.ok(Math.abs(leftSlope - rightSlope) < 0.02)
})


test('every authored mountain sequence returns identically through many full cycles', () => {
  for (const [index, ridge] of ridges.entries()) {
    const height = x => ridgeHeight(x, ridge.peaks, ridge.base, ridge.detail, index)
    for (let x = -TERRAIN_PERIOD / 2; x <= TERRAIN_PERIOD / 2; x += 0.125) {
      for (const cycle of [-12, -3, 1, 4, 20]) {
        assert.ok(Math.abs(height(x) - height(x + cycle * TERRAIN_PERIOD)) < 1e-9)
      }
    }
    // Every full repeat contains the original prominent peaks, not replacement hills.
    for (const [center, peakHeight] of ridge.peaks) {
      assert.ok(height(center + 7 * TERRAIN_PERIOD) > ridge.base + peakHeight - ridge.detail)
    }
  }
})

test('authored sequences keep broad variation and continuous seams over their whole loop', () => {
  for (const [index, ridge] of ridges.entries()) {
    const height = x => ridgeHeight(x, ridge.peaks, ridge.base, 0, index)
    for (let start = -12; start < 12; start += 0.5) {
      const heights = Array.from({ length: 41 }, (_, i) => height(start + i / 8))
      assert.ok(Math.max(...heights) - Math.min(...heights) > 0.3)
    }
    const edge = TERRAIN_PERIOD / 2, epsilon = 0.0001
    assert.ok(Math.abs(height(edge - epsilon) - height(-edge + epsilon)) < 0.002)
    const before = (height(edge) - height(edge - epsilon)) / epsilon
    const after = (height(-edge + epsilon) - height(-edge)) / epsilon
    assert.ok(Math.abs(before - after) < 0.002)
  }
})
