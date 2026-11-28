import test from 'node:test'
import assert from 'node:assert/strict'
import { silentSignal } from '../src/audio/signal.ts'
import { createBassMotion, updateBassMotion } from '../src/engine/bassMotion.ts'
import { CAMERA_TILT_LIMIT, updateCameraTilt } from '../src/engine/cameraTilt.ts'

test('shared camera roll follows the 20% sustained / 80% accent bass mix across frame cadences', () => {
  for (const hz of [30, 60, 120]) {
    const shared = createBassMotion(), previous = createBassMotion(), signal = silentSignal()
    for (let i = 0; i < hz * 3; i++) {
      signal.fast.bass = i < hz ? 0.6 : 0
      signal.transient.bass = i % 15 === 0 ? 0.8 : 0
      signal.flux.bass = i % 20 === 0 ? 0.9 : 0
      const bass = Math.min(1, 0.2 * signal.fast.bass + 0.8 * Math.max(signal.transient.bass, signal.flux.bass)) * 0.75
      const expected = -updateBassMotion(previous, bass, 1 / hz) * CAMERA_TILT_LIMIT
      const actual = updateCameraTilt(shared, signal, 0.75, false, 1 / hz)
      assert.equal(actual, expected)
      assert.ok(Math.abs(actual) <= CAMERA_TILT_LIMIT)
    }
  }
})

test('camera tilt rebounds and settles after a bass pulse', () => {
  const signal = silentSignal(), motion = createBassMotion()
  let left = 0, right = 0
  for (let i = 0; i < 120; i++) {
    signal.transient.bass = i === 0 ? 1 : 0
    const tilt = updateCameraTilt(motion, signal, 1, false, 1 / 60)
    left = Math.min(left, tilt)
    right = Math.max(right, tilt)
  }
  assert.ok(left < -0.001 && right > 0.0001)
  assert.ok(Math.abs(motion.angle) < 0.00001)
})

test('reduced motion, zero Reactivity and disabled variants reset camera motion', () => {
  for (const [gain, reduced, enabled] of [[0, false, true], [1, true, true], [1, false, false]] as const) {
    const motion = createBassMotion(), signal = silentSignal()
    signal.fast.bass = 1
    assert.notEqual(updateCameraTilt(motion, signal, 1, false, 1 / 60), 0)
    assert.equal(updateCameraTilt(motion, signal, gain, reduced, 1 / 60, enabled), 0)
    assert.deepEqual(motion, createBassMotion())
  }
})
