import test from 'node:test'
import assert from 'node:assert/strict'
import { silentSignal } from '../src/audio/signal.ts'
import { createLayerMotion, updateLayerMotion, ridgeHeight, TERRAIN_PERIOD } from '../src/scenes/lavender-peaks/motion.ts'
import { ridges } from '../src/scenes/lavender-peaks/terrain.ts'

function advance(signal, depth, seconds, hz = 60) {
  const motion = createLayerMotion()
  for (let i = 0; i < seconds * hz; i++) updateLayerMotion(motion, signal, depth, 1, false, 1 / hz)
  return motion
}

test('isolated energy moves only its assigned depth, within the chosen speed limit', () => {
  for (const [band, depth, limit] of [['subBass', 0, 0.15], ['bass', 1, 0.25], ['lowMids', 2, 0.45], ['highMids', 3, 0.65], ['presence', 4, 0.9], ['air', 5, 1.2]]) {
    const signal = silentSignal()
    signal.sixBands[band] = 1
    for (let group = 0; group < 6; group++) {
      const motion = advance(signal, group, 2)
      if (group === depth) {
        assert.ok(motion.offset > 0.4 * limit)
        assert.ok(motion.speed <= limit && motion.speed > limit * 0.99)
      } else assert.equal(motion.offset, 0)
    }
    signal.sixBands[band] = 0.25
    assert.ok(advance(signal, depth, 2).offset < advance({ ...signal, sixBands: { ...signal.sixBands, [band]: 1 } }, depth, 2).offset)
  }
})

test('travel is consistent at 30, 60 and 120 Hz and wraps seamlessly over long playback', () => {
  const signal = silentSignal()
  signal.sixBands.air = 1
  const baseline = advance(signal, 5, 150, 60)
  for (const hz of [30, 120]) {
    const motion = advance(signal, 5, 150, hz)
    assert.ok(Math.abs(motion.offset - baseline.offset) < 1e-8)
  }
  assert.ok(baseline.offset >= 0 && baseline.offset < TERRAIN_PERIOD)
})

test('silence settles without returning; zero reactivity and reduced motion freeze immediately', () => {
  const signal = silentSignal()
  signal.sixBands.subBass = 1
  const motion = advance(signal, 0, 2)
  const before = motion.offset
  signal.sixBands.subBass = 0
  for (let i = 0; i < 300; i++) updateLayerMotion(motion, signal, 0, 1, false, 1 / 60)
  assert.equal(motion.speed, 0)
  assert.ok(motion.offset > before)
  const settled = motion.offset
  updateLayerMotion(motion, signal, 0, 1, false, 1 / 60)
  assert.equal(motion.offset, settled)
  signal.sixBands.subBass = 1
  for (const [gain, reduced] of [[0, false], [1, true]]) {
    motion.speed = 0.25
    updateLayerMotion(motion, signal, 0, gain, reduced, 1 / 60)
    assert.equal(motion.offset, settled)
    assert.equal(motion.speed, 0)
  }
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


test('equal band energy makes every foreground ridge travel faster than the ridge behind it', () => {
  const signal = silentSignal()
  for (const band of Object.keys(signal.sixBands)) signal.sixBands[band] = 0.6
  let previous = 0
  for (let depth = 0; depth < 6; depth++) {
    const motion = advance(signal, depth, 2)
    assert.ok(motion.offset > previous)
    previous = motion.offset
  }
})
