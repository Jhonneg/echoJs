import test from 'node:test'
import assert from 'node:assert/strict'
import { RAIN, rainDrops, rainLightFalloff, rainPosition, rainVisible } from '../src/scenes/nocturne/rain.ts'

test('NT19: the rain layout is the same every time, with fewer streaks on Low', () => {
  assert.deepEqual(rainDrops(RAIN.count.standard), rainDrops(RAIN.count.standard))
  assert.equal(rainDrops(RAIN.count.standard).length, RAIN.count.standard)
  assert.equal(rainDrops(RAIN.count.low).length, RAIN.count.low)
  assert.ok(RAIN.count.low < RAIN.count.standard)
  assert.deepEqual(rainDrops(0), [])
  assert.deepEqual(rainDrops(-3), [])
})

test('NT19: streaks stay between the alley walls and inside the volume as they fall and drift', () => {
  const { halfWidth, bottom, top, near, far } = RAIN.volume
  assert.ok(halfWidth < 3, 'inside the walls at x = ±3')
  for (const drop of rainDrops(RAIN.count.standard)) {
    assert.ok(drop.speed >= RAIN.speed.min && drop.speed <= RAIN.speed.max)
    assert.ok(drop.length >= RAIN.length.min && drop.length <= RAIN.length.max)
    for (const time of [0, 0.37, 1.9, 60, 3600.25]) {
      const p = rainPosition(drop, time)
      assert.ok(p.x >= -halfWidth - 1e-9 && p.x <= halfWidth + 1e-9, `x ${p.x}`)
      assert.ok(p.y >= bottom && p.y < top, `y ${p.y}`)
      assert.ok(p.z <= near && p.z >= far)
    }
  }
})

test('NT19: a streak falls at its speed and wraps back to the top', () => {
  const drop = { x: 0, y: 5, z: -10, speed: 10, length: 0.5 }
  assert.ok(Math.abs(rainPosition(drop, 0.2).y - 3) < 1e-9)
  // After 0.6 s it has fallen 6 m from 5 m: wrapped to 11 - 1 = 10 m.
  assert.ok(Math.abs(rainPosition(drop, 0.6).y - 10) < 1e-9)
  // It drifts downwind as it falls.
  assert.ok(rainPosition(drop, 0.2).x > rainPosition(drop, 0).x)
})

test('NT19: rain is lit only near a light, and is hidden with reduced motion', () => {
  assert.ok(rainLightFalloff(0, 13) === 1)
  let previous = Infinity
  for (const d of [0, 0.5, 1, 2, 4, 8, 12]) {
    const f = rainLightFalloff(d, 13)
    assert.ok(f >= 0 && f < previous, `falloff at ${d}`)
    previous = f
  }
  assert.equal(rainLightFalloff(13, 13), 0)
  assert.equal(rainLightFalloff(20, 13), 0)
  assert.equal(rainLightFalloff(1, 0), 0)
  assert.equal(rainLightFalloff(Number.NaN, 13), 0)
  assert.equal(rainVisible(true), false)
  assert.equal(rainVisible(false), true)
})
