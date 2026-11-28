import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CRYSTALS, MONOLITH, SEAM, projectToScreen } from '../src/scenes/bloom/composition.ts'
import { HOVER, crystalPose, monolithHover } from '../src/scenes/bloom/monolith.ts'

test('BR4: hover stays within 1% of the height and never nears the water', () => {
  let low = Infinity
  for (let t = 0; t < 60; t += 0.05) {
    const h = monolithHover(t, false)
    assert.ok(Math.abs(h.y) <= MONOLITH.height * 0.01 + 1e-9)
    assert.ok(Math.abs(h.yaw) <= HOVER.sway + 1e-12)
    low = Math.min(low, MONOLITH.bottom + h.y)
  }
  assert.ok(low > 0.3, `lowest base ${low}`)
  assert.ok(monolithHover(1.5, false).y !== 0, 'hover should move')
})

test('BR4: reduced motion (or a bad clock) returns the exact approved rest pose', () => {
  for (const t of [0, 3.7, 1e6]) assert.deepEqual(monolithHover(t, true), { y: 0, yaw: 0 })
  assert.deepEqual(monolithHover(Number.NaN, false), { y: 0, yaw: 0 })
  for (const i of [0, 1]) {
    const rest = crystalPose(i, 0, true)
    assert.equal(rest.y, 0)
    for (const t of [2, 99]) assert.deepEqual(crystalPose(i, t, true), rest)
  }
})

test('BR4: crystals bob gently around their layout positions', () => {
  for (const i of [0, 1]) for (let t = 0; t < 40; t += 0.1) {
    const p = crystalPose(i, t, false)
    assert.ok(Math.abs(p.y) <= 0.05 + 1e-9 && p.spin >= 0 && p.spin < Math.PI * 2 + 3)
  }
  assert.equal(CRYSTALS.length, 2)
})

test('BR4: seam sits a little left of centre on the front face, faded short of the ends', () => {
  assert.ok(SEAM.u > 0.35 && SEAM.u < 0.5)
  assert.ok(SEAM.top > 0 && SEAM.bottom < 1 && SEAM.halfWidth * 2 < MONOLITH.width * 0.05)
})

test('BR4: the turn shows the right side face at about a fifth of the visible width', () => {
  const [cx, cy, cz] = MONOLITH.center, c = Math.cos(MONOLITH.yaw), s = Math.sin(MONOLITH.yaw)
  const at = (x, z) => projectToScreen(cx + x * c + z * s, cy, cz - x * s + z * c, 16 / 9).x
  const hw = MONOLITH.width / 2, hd = MONOLITH.depth / 2
  const frontLeft = at(-hw, hd), frontRight = at(hw, hd), backRight = at(hw, -hd)
  const share = (backRight - frontRight) / (backRight - frontLeft)
  assert.ok(share > 0.15 && share < 0.3, `side face share ${share.toFixed(3)}`)
})
