import test from 'node:test'
import assert from 'node:assert/strict'
import { silentSignal, SIX_BAND_NAMES } from '../src/audio/signal.ts'
import { createLayerMotion, updateLayerMotion, updateSunPulse, ridgeHeight, TERRAIN_PERIOD } from '../src/scenes/lavender-peaks/motion.ts'
import { ridges } from '../src/scenes/lavender-peaks/terrain.ts'

function advance(signal, depth, seconds, hz = 60) {
  const motion = createLayerMotion()
  for (let i = 0; i < seconds * hz; i++) updateLayerMotion(motion, signal, depth, 1, false, 1 / hz)
  return motion
}

test('shared music energy moves all ridges together while preserving depth speed ratios', () => {
  const limits = [0.15, 0.25, 0.45, 0.65, 0.9, 1.2]
  const signal = silentSignal()
  signal.intensity = 0.6
  // Conflicting spectral content must no longer select individual mountains.
  signal.sixBands.air = 1
  const motions = limits.map((_, depth) => advance(signal, depth, 2))
  for (const [depth, limit] of limits.entries()) {
    assert.ok(motions[depth].speed > 0.59 * limit && motions[depth].speed <= 0.6 * limit)
    assert.ok(Math.abs(motions[depth].offset / limit - motions[0].offset / limits[0]) < 1e-10)
    if (depth > 0) assert.ok(motions[depth].speed > motions[depth - 1].speed)
  }
  signal.intensity = 0.2
  assert.ok(advance(signal, 5, 2).offset < motions[5].offset)
  signal.intensity = 0
  for (let depth = 0; depth < 6; depth++) assert.equal(advance(signal, depth, 2).offset, 0)
})

test('higher frequency balance moves all mountains faster at equal intensity', () => {
  const limits = [0.15, 0.25, 0.45, 0.65, 0.9, 1.2]
  let previous = 0
  for (const band of SIX_BAND_NAMES) {
    const signal = silentSignal()
    signal.intensity = 0.6
    signal.sixBands[band] = 1
    const motions = limits.map((_, depth) => advance(signal, depth, 2))
    assert.ok(motions[5].speed > previous)
    previous = motions[5].speed
    for (let depth = 0; depth < 6; depth++) {
      assert.ok(motions[depth].speed > 0 && motions[depth].speed <= limits[depth])
      assert.ok(Math.abs(motions[depth].speed / limits[depth] - motions[0].speed / limits[0]) < 1e-10)
    }
    // Changing tone loudness alone must not change the normalized frequency balance.
    signal.sixBands[band] = 0.2
    assert.ok(Math.abs(advance(signal, 5, 2).speed - motions[5].speed) < 1e-10)
  }
})

test('travel is consistent at 30, 60 and 120 Hz and wraps seamlessly over long playback', () => {
  const signal = silentSignal()
  signal.intensity = 1
  const baseline = advance(signal, 5, 150, 60)
  for (const hz of [30, 120]) {
    const motion = advance(signal, 5, 150, hz)
    assert.ok(Math.abs(motion.offset - baseline.offset) < 1e-8)
  }
  assert.ok(baseline.offset >= 0 && baseline.offset < TERRAIN_PERIOD)
})

test('silence settles without returning; zero reactivity and reduced motion freeze immediately', () => {
  const signal = silentSignal()
  signal.intensity = 1
  const motion = advance(signal, 0, 2)
  const before = motion.offset
  signal.intensity = 0
  for (let i = 0; i < 300; i++) updateLayerMotion(motion, signal, 0, 1, false, 1 / 60)
  assert.equal(motion.speed, 0)
  assert.ok(motion.offset > before)
  const settled = motion.offset
  updateLayerMotion(motion, signal, 0, 1, false, 1 / 60)
  assert.equal(motion.offset, settled)
  signal.intensity = 1
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


test('shared energy makes every foreground ridge travel faster than the ridge behind it', () => {
  const signal = silentSignal()
  signal.intensity = 0.6
  let previous = 0
  for (let depth = 0; depth < 6; depth++) {
    const motion = advance(signal, depth, 2)
    assert.ok(motion.offset > previous)
    previous = motion.offset
  }
})


test('sun pulses on bass, remains bounded and decays, and respects disable settings', () => {
  const signal = silentSignal()
  signal.fast.midrange = signal.fast.treble = 1
  signal.transient.midrange = signal.transient.treble = 1
  assert.equal(updateSunPulse(0, signal, 1, false, 1 / 60), 0)
  signal.fast.bass = signal.transient.bass = 1
  let pulse = 0
  for (let i = 0; i < 30; i++) pulse = updateSunPulse(pulse, signal, 1, false, 1 / 60)
  assert.ok(pulse > 0.99 && pulse <= 1)
  assert.ok(updateSunPulse(0, signal, 0.5, false, 1 / 60) < updateSunPulse(0, signal, 1, false, 1 / 60))
  assert.equal(updateSunPulse(pulse, signal, 0, false, 1 / 60), 0)
  assert.equal(updateSunPulse(pulse, signal, 1, true, 1 / 60), 0)
  signal.fast.bass = signal.transient.bass = 0
  signal.flux.bass = 1
  assert.ok(updateSunPulse(0, signal, 1, false, 1 / 60) > 0)
  signal.flux.bass = 0
  for (let i = 0; i < 120; i++) pulse = updateSunPulse(pulse, signal, 1, false, 1 / 60)
  assert.ok(pulse < 0.0002)
})
