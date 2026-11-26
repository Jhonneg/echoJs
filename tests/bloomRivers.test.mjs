import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MONOLITH, RANGES, projectToScreen, rangeTop } from '../src/scenes/bloom/composition.ts'
import { MEANDER, RIVERS, RIVER_POINTS, RIVER_STILL_TIME, riverPath, riverPhases } from '../src/scenes/bloom/rivers.ts'

const monolithEdge = projectToScreen(-MONOLITH.width / 2, MONOLITH.center[1], 0, 16 / 9).x

test('BR6: every river point lands on mountain, not sky, and clear of the monolith', () => {
  for (const river of RIVERS) for (const [x, y] of riverPath(river)) {
    const u = x * 2 - 1, highest = Math.min(...RANGES.map(layer => rangeTop(layer, u)))
    assert.ok(y > highest, `point (${x.toFixed(3)}, ${y.toFixed(3)}) is above every range`)
    assert.ok(x < monolithEdge - 0.02 || x > 1 - monolithEdge + 0.02, `point x ${x.toFixed(3)} overlaps the monolith`)
  }
})

test('BR6: rivers flow down the screen from source to mouth', () => {
  for (const river of RIVERS) {
    const path = riverPath(river)
    assert.ok(path.at(-1)[1] > path[0][1] + 0.05)
    assert.equal(path.length, RIVER_POINTS)
  }
})

test('BR6: the meander stays small and vanishes at the ends', () => {
  for (const river of RIVERS) {
    const path = riverPath(river)
    assert.deepEqual(path[0].map(v => +v.toFixed(9)), river.path[0].map(v => +v.toFixed(9)))
    assert.deepEqual(path.at(-1).map(v => +v.toFixed(9)), river.path.at(-1).map(v => +v.toFixed(9)))
    const plain = riverPath({ ...river, period: 0 }), straight = riverPath(river)
    for (let i = 0; i < path.length; i++) {
      assert.ok(Math.abs(straight[i][1] - plain[i][1]) <= MEANDER.amplitude * 2 + 1e-9)
    }
  }
})

test('BR6: pink on the left, teal and violet on the right; Low keeps the two main rivers', () => {
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
  const [pink, teal, violet] = RIVERS
  assert.ok(pink.path[0][0] < 0.5 && rgb(pink.color)[0] > rgb(pink.color)[1])
  assert.ok(teal.path[0][0] > 0.5 && rgb(teal.color)[1] > rgb(teal.color)[0])
  assert.ok(violet.path[0][0] > 0.5 && rgb(violet.color)[2] > rgb(violet.color)[1])
  assert.deepEqual(RIVERS.map(r => r.lowQuality), [true, true, false])
})

test('BR6: flow pulses loop seamlessly; reduced motion holds a steady glow', () => {
  for (let i = 0; i < RIVERS.length; i++) for (const t of [0, 4.4, 60]) {
    const a = riverPhases(t, false)[i], b = riverPhases(t + RIVERS[i].period, false)[i]
    assert.ok(Math.abs(Math.sin(a) - Math.sin(b)) < 1e-9 && Math.abs(Math.cos(a) - Math.cos(b)) < 1e-9)
  }
  const still = riverPhases(RIVER_STILL_TIME, false)
  for (const t of [0, 7, 1e5]) assert.deepEqual(riverPhases(t, true), still)
})

import { RIVER_BOX_MARGIN, riverBox } from '../src/scenes/bloom/rivers.ts'

test('BR7: each river box holds its whole path plus a margin wider than the visible glow', () => {
  // Outer halo width is at most 0.0048 * 3.2 ≈ 0.015 (screen height); exp(-(margin/halo)^2) is negligible.
  assert.ok(Math.exp(-((RIVER_BOX_MARGIN / 0.0154) ** 2)) < 0.01)
  for (const river of RIVERS) {
    const [x0, y0, x1, y1] = riverBox(river)
    for (const [x, y] of riverPath(river)) assert.ok(x > x0 && x < x1 && y > y0 && y < y1)
  }
})
