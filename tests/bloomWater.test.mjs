import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MONOLITH } from '../src/scenes/bloom/composition.ts'
import { REFLECTION_SCALE, RING_CENTER, WATER_PERIODS, WATER_STILL_TIME, reflectionSize, waterPhases } from '../src/scenes/bloom/water.ts'

test('BR5: rings spread from directly under the monolith', () => {
  assert.equal(RING_CENTER[0], MONOLITH.center[0])
  assert.equal(RING_CENTER[1], MONOLITH.center[2])
})

test('BR5: water motion loops seamlessly and slowly; reduced motion holds still', () => {
  for (const p of WATER_PERIODS) assert.ok(p >= 6 && p <= 40)
  for (let i = 0; i < WATER_PERIODS.length; i++) for (const t of [0, 2.2, 77]) {
    const a = waterPhases(t, false)[i], b = waterPhases(t + WATER_PERIODS[i], false)[i]
    assert.ok(Math.abs(Math.sin(a) - Math.sin(b)) < 1e-9 && Math.abs(Math.cos(a) - Math.cos(b)) < 1e-9)
  }
  const still = waterPhases(WATER_STILL_TIME, false)
  for (const t of [0, 9, 1e5]) assert.deepEqual(waterPhases(t, true), still)
  assert.deepEqual(waterPhases(Number.NaN, false), still)
})

test('BR5: reflection resolution is half the buffer on Standard and about a third on Low', () => {
  assert.deepEqual(reflectionSize(1440, 900, 'standard'), { width: 720, height: 450 })
  const low = reflectionSize(1440, 900, 'low')
  assert.ok(low.width < 720 && low.width >= 1440 * 0.3)
  assert.ok(REFLECTION_SCALE.low < REFLECTION_SCALE.standard)
  assert.deepEqual(reflectionSize(10, 10, 'low'), { width: 64, height: 64 })
})
