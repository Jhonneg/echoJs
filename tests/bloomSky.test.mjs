import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MONOLITH, projectToScreen } from '../src/scenes/bloom/composition.ts'
import { CURTAINS, STILL_TIME, auroraGain, curtainPhases } from '../src/scenes/bloom/sky.ts'

const monolithEdges = () => {
  const left = projectToScreen(-MONOLITH.width / 2, MONOLITH.center[1], 0, 16 / 9).x
  return { left, right: 1 - left }
}

test('BR3: curtains sit left and right of the monolith, leaving the sky behind it darker', () => {
  const { left, right } = monolithEdges()
  for (const c of CURTAINS) {
    if (c.side === 'left') assert.ok(c.x1 <= left, `left curtain reaches ${c.x1} past the monolith edge ${left.toFixed(3)}`)
    else assert.ok(c.x0 >= right, `right curtain starts at ${c.x0}, inside the monolith edge ${right.toFixed(3)}`)
  }
})

test('BR3/BR7: green on the left, violet-pink on the right; one main curtain marked per side', () => {
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
  for (const c of CURTAINS) {
    const [r, g] = rgb(c.color)
    assert.ok(c.side === 'left' ? g > r : r > g, `${c.side} curtain colour ${c.color}`)
  }
  for (const side of ['left', 'right']) assert.equal(CURTAINS.filter(c => c.side === side && c.lowQuality).length, 1)
})

test('BR3: motion loops seamlessly and slowly (20–60 s per curtain)', () => {
  for (const c of CURTAINS) assert.ok(c.period >= 20 && c.period <= 60)
  for (let i = 0; i < CURTAINS.length; i++) {
    const p = CURTAINS[i].period
    for (const t of [0, 3.3, 17, 101.7]) {
      const a = curtainPhases(t, false)[i], b = curtainPhases(t + p, false)[i]
      assert.ok(Math.abs(Math.sin(a) - Math.sin(b)) < 1e-9 && Math.abs(Math.cos(a) - Math.cos(b)) < 1e-9)
      assert.ok(a >= 0 && a < Math.PI * 2)
    }
  }
})

test('BR3: reduced motion holds one still pose; breathing stays between 0.85 and 1', () => {
  const still = curtainPhases(STILL_TIME, false)
  for (const t of [0, 5, 999]) assert.deepEqual(curtainPhases(t, true), still)
  assert.deepEqual(curtainPhases(Number.NaN, false), still)
  for (let t = 0; t < 120; t += 0.37) {
    const g = auroraGain(curtainPhases(t, false))
    assert.ok(g >= 0.85 - 1e-9 && g <= 1 + 1e-9)
  }
})
