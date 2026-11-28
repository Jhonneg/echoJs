import test from 'node:test'
import assert from 'node:assert/strict'
import { createBassMotion, resetBassMotion, updateBassMotion } from '../src/engine/bassMotion.ts'

function pulseAt(frameRate, damping = 16) {
  const motion = createBassMotion()
  let positive = 0
  let negative = 0
  for (let frame = 0; frame < frameRate; frame++) {
    const angle = updateBassMotion(motion, frame === 0 ? 0.8 : 0, 1 / frameRate, damping)
    positive = Math.max(positive, angle)
    negative = Math.min(negative, angle)
    assert.ok(Math.abs(angle) <= 1)
  }
  return { positive, negative, end: motion.angle }
}

test('a bass rise swings both ways, stays bounded, and settles', () => {
  const pulse = pulseAt(60)
  assert.ok(pulse.positive > 0.2)
  assert.ok(pulse.negative < -0.02)
  assert.ok(Math.abs(pulse.end) < 0.001)
})

test('pulse shape is similar at common render cadences', () => {
  const slow = pulseAt(30)
  const fast = pulseAt(120)
  assert.ok(Math.abs(slow.positive - fast.positive) < 0.08)
  assert.ok(Math.abs(slow.negative - fast.negative) < 0.08)
})

test('disabling motion clears its pose and history', () => {
  const motion = createBassMotion()
  updateBassMotion(motion, 1, 1 / 60)
  resetBassMotion(motion)
  assert.deepEqual(motion, createBassMotion())
})

test('halo damping retains a pronounced opposite swing and still settles', () => {
  for (const rate of [30, 60, 120]) {
    const pulse = pulseAt(rate, 8)
    assert.ok(pulse.positive > 0.8)
    assert.ok(pulse.negative < -0.4)
    assert.ok(Math.abs(pulse.end) < 0.001)
  }
})
